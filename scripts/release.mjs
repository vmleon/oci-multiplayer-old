#!/usr/bin/env zx
import { getVersion, getNamespace, exitWithError } from "./lib/utils.mjs";
import { build_image, tagImage, pushImage } from "./lib/container.mjs";
import {
  buildJarGradle,
  cleanGradle,
  getVersionGradle,
} from "./lib/gradle.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

const { a, _ } = argv;
const [action] = _;

const project = "oci_multiplayer";
const namespace = await getNamespace();

if (action === "web") {
  await release("web");
  process.exit(0);
}

if (action === "server") {
  await release("server");
  process.exit(0);
}

if (action === "score") {
  await releaseGradle("score");
  process.exit(0);
}

if (a || action === "all") {
  await releaseNpm("web");
  await releaseNpm("server");
  await releaseGradle("score");
  process.exit(0);
}

console.log("Usage:");
console.log("\tnpx zx scripts/release.mjs all");
console.log("\tnpx zx scripts/release.mjs -a");
console.log("\tnpx zx scripts/release.mjs web");
console.log("\tnpx zx scripts/release.mjs server");
console.log("\tnpx zx scripts/release.mjs score");

async function releaseNpm(service) {
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
async function releaseGradle(service) {
  await cd(service);
  await cleanGradle();
  await buildJarGradle();
  const currentVersion = await getVersionGradle();
  const image_name = `${project}/${service}`;
  await build_image(`localhost/${image_name}`, currentVersion);
  const local_image = `localhost/${image_name}:${currentVersion}`;
  const remote_image = `fra.ocir.io/${namespace}/${image_name}:${currentVersion}`;
  await tagImage(local_image, remote_image);
  await pushImage(remote_image);
  console.log(`Released: ${chalk.yellow(remote_image)}`);
  await cd("..");
}
