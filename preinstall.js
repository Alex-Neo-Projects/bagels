#!/usr/bin/env node
import { spawnSync, execSync } from 'child_process'

async function main() {
  try {
    execSync('which foundryup');
  } 
  // execSync throws an error when the which command fails. It fails when there's no directory found.
  catch (e) {
    console.log("\nNo forge installation found!\n")
    console.log("Installing forge...")
    
    const { stdout: installFoundry, stderr: installFoundryErr } = spawnSync(
      'curl',
      [
        '-L',
        'https://foundry.paradigm.xyz',
        '|',
        'bash',
      ],
      {
        shell: true,
      },
    )
  
    if (installFoundryErr) { 
      console.log(installFoundryErr.toString()); 
    } 

    if (installFoundry) { 
      console.log(installFoundry.toString()); 
    }

    execSync('exec $SHELL');

    console.log('installing foundryup... (be patient)')

    const { stdout: foundryup, foundryupErr } = execSync(
      'foundryup',
      {
        shell: true,
      },
    )

    if (foundryup) { 
      console.log(foundryup.toString()); 
    } 

    console.log('\n\nSuccessfully installed forge.');
  }
}

main().catch((err) => {
  console.log('\n\n\nError installing foundry! To use bagels, you\'ll need foundry. Download it here: https://github.com/foundry-rs/foundry')
  process.exit(1)
})
