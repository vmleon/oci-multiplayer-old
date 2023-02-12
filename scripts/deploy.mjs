#!/usr/bin/env zx

import {
  exitWithError,
  generateRandomString,
  getNamespace,
} from "./lib/utils.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

// TODO check kubectl is configured with a kubernetes cluster
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
    const ocirUser = process.env.OCI_OCIR_USER;
    const ocirToken = process.env.OCI_OCIR_TOKEN;
    const regionKey = process.env.OCI_REGION;
    const { exitCode } =
      await $`kubectl create secret docker-registry ocirsecret --docker-server=${regionKey}.ocir.io --docker-username=${namespace}/${ocirUser} --docker-password='${ocirToken}' --docker-email=${ocirUser}`;
    if (exitCode !== 0) {
      exitWithError("docker-registry secret not created");
    } else {
      console.log(`${chalk.green("[ok]")} docker-registry secret created`);
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
