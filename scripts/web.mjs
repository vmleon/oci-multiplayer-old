export async function build() {
  console.log(`npm install and npm start build`);
  try {
    await $`npm install`;
    const output = (await $`npm run build`).stdout.trim();
    console.log(output);
  } catch (error) {
    console.error(chalk.red(error.stderr));
    process.exit(1);
  }
}
