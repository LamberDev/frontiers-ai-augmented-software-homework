// Installs the Lefthook git hooks from the root `prepare` script.
// Skips (without failing `pnpm install`) outside a git repository, e.g. archive checkouts or
// container builds, and when LEFTHOOK=0. Inside a repository, install errors still fail.
import { execSync } from 'node:child_process'

if (process.env.LEFTHOOK === '0') {
  console.log('LEFTHOOK=0: skipping git hooks installation.')
  process.exit(0)
}

try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' })
} catch {
  console.log('Not a git repository: skipping git hooks installation.')
  process.exit(0)
}

execSync('lefthook install', { stdio: 'inherit' })
