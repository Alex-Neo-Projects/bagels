#!/usr/bin/env node
import { spawnSync, execSync } from 'child_process'
import ora from 'ora';

async function main() {
  try {
    execSync('which foundryup');
  } 
  // execSync throws an error when the which command fails. It fails when there's no directory found.
  catch (e) {
    console.log("\nNo forge installation found!\n")
    const spinner = ora('installing forge').start();
    
    spawnSync(
      'curl',
      [
        '-L',
        'https://foundry.paradigm.xyz',
        '|',
        'bash',
        '&&',
        'foundryup'
      ],
      {
        shell: true,
      },
    )
    console.log('\n\nSuccessfully installed forge.');
    spinner.stop();
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
