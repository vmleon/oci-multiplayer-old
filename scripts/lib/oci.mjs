#!/usr/bin/env zx

export async function getRegions() {
  try {
    const output = (await $`oci iam region list`).stdout.trim();
    const { data } = JSON.parse(output);
    return data.map((e) => ({ key: e.key.toLowerCase(), name: e.name }));
  } catch (error) {
    exitWithError(`Error: get regions ${error.message}`);
  }
}

export async function getAvailableShapes(options = {}) {
  try {
    const output = (
      await $`oci compute shape list --compartment-id ${await getTenancyId()}`
    ).stdout.trim();
    const { data } = JSON.parse(output);
    const { type = "*", flex, includeOld = false } = options;
    return data
      .filter((shape) => {
        if (shape.shape.includes("Standard1.")) return false;
        return true;
      })
      .filter((shape) => {
        if (type === "*") return true;
        if (type === "bm") return shape.shape.startsWith("BM.");
        if (type === "vm") return shape.shape.startsWith("VM.");
      })
      .filter((shape) => {
        if (flex === undefined) return true;
        return flex
          ? shape.shape.endsWith(".Flex")
          : !shape.shape.endsWith(".Flex");
      })
      .sort((s1, s2) => {
        return s1.shape.localeCompare(s2.shape);
      });
  } catch (error) {
    exitWithError(`Error: get available shapes ${error.message}`);
  }
}

export async function getTenancyId() {
  const tenancyIdEnv = process.env.OCI_TENANCY;
  const tenancyId = tenancyIdEnv
    ? tenancyIdEnv
    : await question("OCI tenancy: ");
  return tenancyId;
}
