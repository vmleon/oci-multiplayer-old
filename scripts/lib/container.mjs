#!/usr/bin/env zx

export async function dockerAliasWhenNoPodman() {
  let podmanBinaryExists;
  try {
    const { exitCode } = await $`command -v podman`;
    podmanBinaryExists = exitCode === 0;
  } catch (error) {
    podmanBinaryExists = false;
  }
  if (!podmanBinaryExists) {
    $.prefix += `alias podman=docker; `;
  }
}

export async function containerLogin(namespace, user, token, url) {
  try {
    const { stdout, stderr, exitCode } =
      await $`podman login -u ${namespace}/${user} -p ${token} ${url}`;
    if (exitCode == 0) {
      console.log(chalk.green(stdout.trim()));
    } else {
      console.error(chalk.red(stderr.trim()));
    }
  } catch (error) {
    console.error(chalk.red(error.stderr.trim()));
    const yellowUserString = chalk.yellow(user);
    console.log(
      `Review the user ${yellowUserString} and token pair, and try again.`
    );
    process.exit(1);
  }
}

export async function tagImage(local, remote) {
  console.log(`podman tag ${local} ${remote}`);
  try {
    await $`podman tag ${local} ${remote}`;
  } catch (error) {
    console.error(chalk.red(error.stderr));
    process.exit(1);
  }
}

export async function pushImage(remote) {
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
