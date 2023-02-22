#!/usr/bin/env node
import { execSync } from "child_process";

function installForge() {
  try {
    execSync("curl -L https://foundry.paradigm.xyz | bash", { shell: true });
    execSync("foundryup", { shell: true });

    return true;
  } catch (e) {
    console.error(e.message);
    return false;
  }
}

export function startPreinstall() {
  installForge();
  process.exit(1);
}

async function main() {
  startPreinstall();
}

main();
