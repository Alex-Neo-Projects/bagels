import { spawn } from 'child_process'

async function main() {
  // TODO: Check if the user already has forge & bun installed b4 reinstalling.
  try {
    console.log('installing forge & bun...')
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
