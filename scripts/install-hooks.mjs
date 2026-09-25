// Installs the Lefthook git hooks from the root `prepare` script.
// Skips (without failing `pnpm install`) when LEFTHOOK=0, when git is not installed, or outside a
// git repository, e.g. archive checkouts or container builds. Any other git error (such as a
// `safe.directory` refusal or a corrupted .git) and any install error still fail.
import { execSync, spawnSync } from 'node:child_process'

if (process.env.LEFTHOOK === '0') {
  console.log('LEFTHOOK=0: skipping git hooks installation.')
  process.exit(0)
}

// Force English output so the "not a git repository" check works on any system locale.
const probe = spawnSync('git', ['rev-parse', '--git-dir'], {
  encoding: 'utf8',
  env: { ...process.env, LC_ALL: 'C', LANGUAGE: 'C' },
})

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
  const reason = [probe.error?.message, stderr.trim()].filter(Boolean).join('\n')
  console.error(`git rev-parse failed; git hooks were not installed:\n${reason}`)
  process.exit(1)
}

execSync('lefthook install', { stdio: 'inherit' })
