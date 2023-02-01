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
    
    const { stdout, stderr } = spawnSync(
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
  
    if (stderr) { 
      console.log("STDERR: ", stderr.toString()); 
    } 

    if (stdout) { 
      console.log("STDOUT: ", stdout.toString()); 
    }

    console.log('\n\nSuccessfully installed forge.');
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
