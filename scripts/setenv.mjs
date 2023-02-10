#!/usr/bin/env zx

import {
  checkRequiredProgramsExist,
  getVersion,
  getNamespace,
} from "./lib/utils.mjs";
import { createSelfSignedCert } from "./lib/tls.mjs";
import {
  containerLogin,
  whichContainerEngine,
  checkPodmanMachineRunning,
} from "./lib/container.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

const ce = await whichContainerEngine();
console.log(`Using ${chalk.yellow(ce)} as container engine.`);
console.log();

await checkDependencies();

await createCerts();

await loginContainerRegistry();

await printVersions();

async function checkDependencies() {
  console.log("Check dependencies...");
  const dependencies = ["git", "node", "openssl", "oci", "kubectl", ce];
  await checkRequiredProgramsExist(dependencies);
  ce === "podman" && (await checkPodmanMachineRunning());
  console.log();
}

async function createCerts() {
  console.log("Generate Self signed certs...");

  const shell = process.env.SHELL | "/bin/zsh";
  $.shell = shell;
  $.verbose = false;

  const certPath = "./deploy/k8s/base/ingress/.certs";
  const prevKeyExists = await fs.pathExists(path.join(certPath, "tls.key"));
  if (prevKeyExists) {
    console.log(
      `${chalk.yellow("Existing key pair ")} on ${certPath}. ${chalk.red(
        "Key pair not generated"
      )}.`
    );
  } else {
    await createSelfSignedCert(certPath);
  }
  console.log();
}

async function loginContainerRegistry() {
  console.log("Login to container registry login...");
  const namespace = await getNamespace();
  const userEnv = process.env.OCI_OCIR_USER;
  const user = userEnv
    ? userEnv
    : await question("OCI Username (usually an email): ");
  const tokenEnv = process.env.OCI_OCIR_TOKEN;
  const token = tokenEnv
    ? tokenEnv
    : await question("OCI Auth Token for OCIR: ");

  const regionAnswer = await question("What region are you using? (fra,lhr): ");
  const url = `${regionAnswer.toLowerCase()}.ocir.io`;

  await containerLogin(namespace, user, token, url);
  console.log();
}

async function printVersions() {
  await cd("./web");
  const webVersion = await getVersion();
  await cd("..");
  await cd("./server");
  const serverVersion = await getVersion();
  await cd("..");
  console.log(`${chalk.yellow(`web\tv${webVersion}`)}`);
  console.log(`${chalk.yellow(`server\tv${serverVersion}`)}`);
  console.log();
}
