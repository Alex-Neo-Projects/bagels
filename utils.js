#!/usr/bin/env node
import path from 'path'
import { fileURLToPath } from 'url'

export function getFilepath(args = []) {
  return path.join(args.join('/'))
}

export function getFilename() {
  return fileURLToPath(import.meta.url)
}

export function getPathDirname() {
  return path.dirname(getFilename())
}

// ChatGPT generated code 😎
export function getSolcVersionFromContract(contractCode) {
  const match = contractCode.match(/pragma solidity (.*);/);

  if (match) {
    const version = match[1];
    return version;
  } else {
    throw new Error("No solc version found. \n\n Does your contract contain a 'pragma solidity' declaration?")
  }
}