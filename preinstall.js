#!/usr/bin/env node
import { execSync } from "child_process";
import { platform, arch } from "node:process";
import { homedir } from "os";
import { existsSync, mkdirSync } from "fs";

const FOUNDRYUP_REPO = "foundry-rs";
const FOUNDRYUP_TAG = "nightly-edf15abd648bb96e2bcee342c1d72ec7d1066cd1";
const FOUNDRYUP_VERSION = "nightly";
const PLATFORM = platform;
const ARCHITECTURE = arch === 'x64' ? "amd64" : "arm64";

const FOUNDRY_HOME_DIR = `${homedir}/.foundry`;

function installAnvilNonWindows() {
  let downloadLink = `https://github.com/${FOUNDRYUP_REPO}/foundry/releases/download/${FOUNDRYUP_TAG}/foundry_${FOUNDRYUP_VERSION}_${PLATFORM}_${ARCHITECTURE}.tar.gz`;
	
  try {
    execSync(`curl -L ${downloadLink} | tar -xzC ${FOUNDRY_HOME_DIR}`, {
      shell: true,
      stdio: "ignore",
    });
  } catch (e) {
		throw new Error(e.message)
  }
}

function installAnvilWindows() {
	try{
	}catch(e){
		throw new Error(e.message)
	}
}

function anvilDirExists() {
	if(existsSync(FOUNDRY_HOME_DIR)) {
		return true;
	}else{
		mkdirSync(FOUNDRY_HOME_DIR)
		return false;
	}
}

function installAnvil() {
	const isAnvilInstalled = anvilDirExists(); 

	if (isAnvilInstalled) { 
		console.log('Found existing anvil installation!');
		return;
	}

  switch (PLATFORM) {
    case "linux":
    case "darwin":
			try{
				installAnvilNonWindows()
			}catch(e){
				throw new Error(e.message)
			}
      break;
    case "win32":
			try{
				installAnvilWindows()
			}catch(e){
				throw new Error(e.message)
			}
      break;
    default:
      console.log("Unable to install Anvil");
  }
}

async function main() {
	try{
		installAnvil();
	}catch(e){
		console.error(e.message)
		process.exit(1);
	}
}

main();
