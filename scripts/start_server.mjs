#!/usr/bin/env zx

import { getVersion, getNamespace, exitWithError } from "./lib/utils.mjs";
import { whichContainerEngine } from "./lib/container.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

const ce = await whichContainerEngine();

const project = "oci_oke_websocket";
const namespace = await getNamespace();
const containerName = "server0";

const serverImageName = `${project}/server`;
await cd("server");
const serverVersion = await getVersion();
await cd("..");
const serverRemoteImage = `fra.ocir.io/${namespace}/${serverImageName}:${serverVersion}`;

try {
  const { stdout, stderr, exitCode } =
    await $`${ce} run -d --rm --name ${containerName} -p3000:3000 ${serverRemoteImage}`;
  if (exitCode == 0) {
    console.log(chalk.green(stdout.trim()));
  } else {
    exitWithError(stderr);
  }
} catch (error) {
  exitWithError(error.stderr);
}
