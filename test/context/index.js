import makepromise from 'makepromise'
import { stat, rmdir, mkdir, createReadStream, createWriteStream } from 'fs'
import { resolve, basename } from 'path'
import { readDir } from 'wrote'
import { tmpdir } from 'os'
import MNP_PACKAGE from '@mnpjs/package'
import { debuglog } from 'util'

const LOG = debuglog('mnp')

const TEMP = resolve(tmpdir(), 'mnp_test.context')
const FIXTURES = resolve(__dirname, '../fixtures')

async function findName(parent, initialName, n = 0) {
  const currentName = `${initialName}${n ? `-${n}` : ''}`
  const path = resolve(parent, currentName)
  try {
    await makepromise(stat, path)
    throw new Error('dir exists')
  } catch (err) {
    if (err.message == 'dir exists') {
      return findName(parent, initialName, n + 1)
    }
    return path
  }
}

const copy = async (from, to) => {
  await new Promise((r, j) => {
    const rs = createReadStream(from)
    const ws = createWriteStream(to)
    rs.on('error', j)
    ws.on('error', j)
    rs.pipe(ws)
    ws.on('close', r)
  })
}

const b = resolve(TEMP, '.babelrc')
const m = resolve(TEMP, '.mnprc')

export default class Context {
  get cwd() {
    return TEMP
  }
  async _init() {
    this.packagePath = await findName(TEMP, 'test-package')
    this.packageName = basename(this.packagePath)

    try {
      await makepromise(mkdir, TEMP)
    } catch (err) { /* */ }

    await copy(resolve(__dirname, '../../.mnprc'), m)

    LOG('Copied .mnprc')
    LOG('%s expected', this.packageName)
  }
  readDir(dir) {
    return readDir(dir, true)
  }
  readExpectedStructure() {
    return readDir(this.expectedStructurePath, true)
  }
  get expectedStructurePath() {
    return resolve(FIXTURES, 'expected-cloned')
  }
  get MNP_PACKAGE() {
    return MNP_PACKAGE
  }
  get SNAPSHOT_DIR() {
    return resolve(__dirname, '../snapshot')
  }
  async _destroy() {
    try {
      await makepromise(rmdir, this.packagePath)
    } catch (err) { /* can't remove recursively */ }
  }
}
