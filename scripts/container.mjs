#!/usr/bin/env zx

export async function container_login(namespace, user, token, url) {
  console.log(`podman login -u ${namespace}/${user} -p ${token} ${url}`);
  try {
    await $`podman login -u ${namespace}/${user} -p ${token} ${url}`;
  } catch (error) {
    console.error(chalk.red(error.stderr));
    console.log("Review email and token, and try again.");
    process.exit(1);
  }
}

export async function tag_image(local, remote) {
  console.log(`podman tag ${local} ${remote}`);
  try {
    await $`podman tag ${local} ${remote}`;
  } catch (error) {
    console.error(chalk.red(error.stderr));
    process.exit(1);
  }
}

export async function push_image(remote) {
  console.log(`podman push ${remote}`);
  try {
    await $`podman push ${remote}`;
  } catch (error) {
    console.error(chalk.red(error.stderr));
    process.exit(1);
  }
}

export async function build_image(name, version) {
  console.log(`podman build . -t ${name}:${version}`);
  try {
    await $`podman build . -t ${name}:${version}`;
  } catch (error) {
    console.error(chalk.red(error.stderr));
    process.exit(1);
  }
}
