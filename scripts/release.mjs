#!/usr/bin/env zx
import { getVersion, getNamespace } from "./lib/utils.mjs";
import {
  build_image,
  tagImage,
  pushImage,
  dockerAliasWhenNoPodman,
} from "./lib/container.mjs";
import { bump, validateBumpLevel, build_web } from "./lib/npm.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

await dockerAliasWhenNoPodman();

const project = "oci_multiplayer";
const namespace = await getNamespace();

let serviceAnswer = await question(
  "What service you want to release [web, server]: "
);

switch (serviceAnswer) {
  case "web":
    await release("web");
    break;
  case "server":
    await release("server");
    break;
  default:
    console.log(chalk.red("Invalid service. Options: web, service"));
    process.exit(1);
}

async function release(service) {
  await cd(service);
  const currentVersion = await getVersion();
  let levelAnswer = await question(
    "Release level [major,minor,patch] (patch default): "
  );
  const level = await validateBumpLevel(levelAnswer || "patch");
  const newVersion = await bump(level);
  console.log(
    `${chalk.yellow(service)} bumped from ${currentVersion} to ${chalk.yellow(
      newVersion
    )}`
  );
  const image_name = `${project}/${service}`;
  await build_image(`localhost/${image_name}`, newVersion);
  const local_image = `localhost/${image_name}:${newVersion}`;
  const remote_image = `fra.ocir.io/${namespace}/${image_name}:${newVersion}`;
  await tagImage(local_image, remote_image);
  await pushImage(remote_image);
  console.log(`Released: ${chalk.yellow(remote_image)}`);
  await cd("..");
}
