#!/usr/bin/env zx

export async function getVersion() {
  const { version } = await fs.readJson("./package.json");
  return version;
}

export async function getNamespace() {
  const output = (await $`oci os ns get`).stdout.trim();
  const { data } = JSON.parse(output);
  return data;
}

export async function getRegionByKey(code = "fra") {
  const output = (await $`oci iam region list`).stdout.trim();
  const { data } = JSON.parse(output);
  return data.find((r) => code.toUpperCase() === r.key);
}

export async function exportVariable(key, value) {
  key = key.toUpperCase();
  while (!value || !value.length) {
    value = await question(`Value for ${key}: `);
  }
  await $`export ${key}=${value}`;
}
