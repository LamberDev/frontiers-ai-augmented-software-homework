// Installs the Lefthook git hooks from the root `prepare` script.
// Skips (without failing `pnpm install`) when LEFTHOOK=0, when git is not installed, or outside a
// git repository, e.g. archive checkouts or container builds. Any other git error (such as a
// `safe.directory` refusal or a corrupted .git) and any install error still fail.
import { execSync, spawnSync } from 'node:child_process'

if (process.env.LEFTHOOK === '0') {
  console.log('LEFTHOOK=0: skipping git hooks installation.')
  process.exit(0)
}

const probe = spawnSync('git', ['rev-parse', '--git-dir'], { encoding: 'utf8' })

if (probe.error?.code === 'ENOENT') {
  console.log('git not found: skipping git hooks installation.')
  process.exit(0)
}

if (probe.status !== 0) {
  const stderr = probe.stderr ?? ''
  if (/not a git repository/i.test(stderr)) {
    console.log('Not a git repository: skipping git hooks installation.')
    process.exit(0)
  }
  console.error(`git rev-parse failed; git hooks were not installed:\n${stderr}`)
  process.exit(1)
}

execSync('lefthook install', { stdio: 'inherit' })
