#!/usr/bin/env zx

import { exitWithError, generateRandomString } from "./lib/utils.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

// TODO check kubectl is configured with a kubernetes cluster
await checkKubectlConfigured();

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

async function createConfigFiles() {
  console.log("Create config files...");
  const redis_password = await generateRandomString();
  await createRedisConfig(redis_password);
  console.log();
}

async function createRedisConfig(password) {
  console.log(password);
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
