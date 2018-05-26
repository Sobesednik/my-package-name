import spawn from 'spawncommand'

export const assertNotInGitPath = async () => {
  const { promise } = spawn('git', ['rev-parse', '--git-dir'])
  const gitRes = await promise
  if (/\.git/.test(gitRes.stdout)) {
    throw new Error('Current dir is in git path!')
  }
}
