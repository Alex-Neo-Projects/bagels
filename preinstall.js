import { spawn } from 'child_process'

async function main() {
  try {
    spawn(
      'curl',
      [
        '-L',
        'https://foundry.paradigm.xyz',
        '|',
        'bash',
        '&&',
        'foundryup',
        '&&',
        'curl',
        '-fsSL',
        'https://bun.sh/install',
        '|',
        'bash'
      ],
      {
        shell: true,
      },
    )
  } catch (e) {
    console.error('Unable to download required dependencies: [foundry, bun]')
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
