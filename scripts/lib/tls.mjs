#!/usr/bin/env zx

export async function createSelfSignedCert(outputPath = ".") {
  console.log(`Creating folder ${chalk.yellow(outputPath)}`);
  await $`mkdir -p ${outputPath}`;
  const keyPath = path.normalize(path.join(outputPath, "tls.key"));
  const certPath = path.normalize(path.join(outputPath, "tls.crt"));
  try {
    await $`openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -subj "/CN=nginxsvc/O=nginxsvc"`;
    console.log(`Key written to: ${chalk.yellow(keyPath)}`);
    console.log(`Cert written to: ${chalk.yellow(certPath)}`);
  } catch (error) {
    console.error(chalk.red(error.stderr));
    process.exit(1);
  }
}
