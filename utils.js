#!/usr/bin/env node
import path from 'path'
import { fileURLToPath } from 'url'

export function getDirname() {
  return path.resolve()
}

export function getFilepath(args = []) {
  return path.join(args.join('/'))
}

export function getFilename() {
  return fileURLToPath(import.meta.url)
}

export function getPathDirname() {
  return path.dirname(getFilename())
}
