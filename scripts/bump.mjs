#!/usr/bin/env zx
import { getVersion, getNamespace, exitWithError } from "./lib/utils.mjs";
import { build_image, tagImage, pushImage } from "./lib/container.mjs";
import { bump, validateBumpLevel, build_web } from "./lib/npm.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

const project = "oci_multiplayer";
const namespace = await getNamespace();

let serviceAnswer = await question("What service you want to release: ", {
  choices: ["web", "server"],
});

switch (serviceAnswer) {
  case "web":
    await bumpVersion("web");
    break;
  case "server":
    await bumpVersion("server");
    break;
  default:
    exitWithError("Invalid service. Options: web, service");
}

async function bumpVersion(service) {
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
  await cd("..");
}
