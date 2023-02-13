#!/usr/bin/env zx
import { getVersion, getNamespace, exitWithError } from "./lib/utils.mjs";
import { build_image, tagImage, pushImage } from "./lib/container.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

const project = "oci_multiplayer";
const namespace = await getNamespace();

const releaseChoices = ["web", "server"];
console.log(`Release ${releaseChoices.map((c) => chalk.yellow(c).join(", "))}`);
let serviceAnswer = await question("What service you want to release: ", {
  choices: ["web", "server"],
});

switch (serviceAnswer) {
  case "web":
    await release("web");
    break;
  case "server":
    await release("server");
    break;
  default:
    exitWithError("Invalid service. Options: web, service");
}

async function release(service) {
  await cd(service);
  const currentVersion = await getVersion();
  const image_name = `${project}/${service}`;
  await build_image(`localhost/${image_name}`, currentVersion);
  const local_image = `localhost/${image_name}:${currentVersion}`;
  const remote_image = `fra.ocir.io/${namespace}/${image_name}:${currentVersion}`;
  await tagImage(local_image, remote_image);
  await pushImage(remote_image);
  console.log(`Released: ${chalk.yellow(remote_image)}`);
  await cd("..");
}
