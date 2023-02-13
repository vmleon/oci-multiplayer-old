#!/usr/bin/env zx

import {
  exitWithError,
  generateRandomString,
  getNamespace,
  setVariableFromEnvOrPrompt,
} from "./lib/utils.mjs";
import { getRegions } from "./lib/oci.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

await checkKubectlConfigured();

await createRegistrySecret();

await createConfigFiles();

console.log(
  `Ready to deploy. Run ${chalk.yellow(
    "kubectl apply -k deploy/k8s/overlays/prod"
  )}`
);

async function checkKubectlConfigured() {
  console.log("Check kubectl is configured...");
  try {
    const { exitCode } = await $`kubectl cluster-info`;
    if (exitCode !== 0) {
      exitWithError("kubectl not configured");
    } else {
      console.log(`${chalk.green("[ok]")} kubectl connects to cluster`);
    }
  } catch (error) {
    exitWithError(error.stderr);
  }
  console.log();
}
async function createRegistrySecret() {
  console.log("Create registry secret on Kubernetes cluster...");
  try {
    const namespace = await getNamespace();

    const user = await setVariableFromEnvOrPrompt(
      "OCI_OCIR_USER",
      "OCI Username (usually an email)"
    );

    const token = await setVariableFromEnvOrPrompt(
      "OCI_OCIR_TOKEN",
      "OCI Auth Token for OCI Registry"
    );

    const regions = await getRegions();
    const regionName = await setVariableFromEnvOrPrompt(
      "OCI_REGION",
      "OCI Region name",
      () => printRegionNames(regions)
    );
    const { key } = regions.find((r) => r.name === regionName);
    const url = `${key}.ocir.io`;
    await cleanRegisterSecret();
    const { exitCode, stdout } =
      await $`kubectl create secret docker-registry ocir-secret --docker-server="${url}" --docker-username="${namespace}/${user}" --docker-password="${token}" --docker-email="${user}"`;
    if (exitCode !== 0) {
      exitWithError("docker-registry secret not created");
    } else {
      console.log(`${chalk.green("[ok]")} ${stdout}`);
    }
  } catch (error) {
    exitWithError(error.stderr);
  }
  console.log();
}

async function createConfigFiles() {
  console.log("Create config files...");
  const redis_password = await generateRandomString();
  await createRedisConfig(redis_password);
  console.log();
}

async function createRedisConfig(password) {
  const pwdOutput = (await $`pwd`).stdout.trim();
  await cd("./deploy/k8s/base/app");
  try {
    let { exitCode: exitCodeConfig, stderr: stderrConfig } =
      await $`sed 's/MASTERPASSWORD/${quote(
        password
      )}/' redis.conf.template > redis.conf`;
    if (exitCodeConfig !== 0) {
      exitWithError(`Error creating redis.conf with password: ${stderrConfig}`);
    } else {
      console.log(`${chalk.green("redis.conf")} created.`);
    }
    let { exitCode: exitCodeEnv, stderr: stderrEnv } =
      await $`sed 's/MASTERPASSWORD/${quote(
        password
      )}/' env_server_template > .env_server`;
    if (exitCodeEnv !== 0) {
      exitWithError(`Error creating .env_server with password: ${stderrEnv}`);
    } else {
      console.log(`${chalk.green(".env_server")} created.`);
    }
  } catch (error) {
    exitWithError(error.stderr);
  } finally {
    await cd(pwdOutput);
  }
}

async function cleanRegisterSecret() {
  try {
    let { exitCode } = await $`kubectl get secret ocir-secret`;
    if (exitCode === 0) {
      await $`kubectl delete secret ocir-secret`;
    }
  } catch (error) {}
}

function printRegionNames(regions) {
  console.log("printRegionNames");
  const regionsByZone = regions.reduce((acc, cur) => {
    const zone = cur.name.split("-")[0];
    if (acc[zone]) {
      acc[zone].push(cur.name);
    } else {
      acc[zone] = [cur.name];
    }
    return acc;
  }, {});
  Object.keys(regionsByZone).forEach((zone) =>
    console.log(`\t${chalk.yellow(zone)}: ${regionsByZone[zone].join(", ")}`)
  );
}
