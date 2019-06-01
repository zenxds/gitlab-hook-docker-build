import * as path from 'path'
import * as fs from 'fs-extra'
import {
  randomStr,
  exec,
  retry,
  archive,
  unzip
} from  '../src/util'

import data from './data.json'

describe('util', () => {

  test('randomStr', () => {
    expect(randomStr(40).length).toEqual(40)
  })

  test('exec', async() => {
    expect(await exec('pwd').promise).toBeTruthy()
  })

  test('retry', async() => {
    let counter = 0
    let v = await retry(async () => {
      counter++

      if (counter < 3) {
        throw new Error('1')
      }

      return 0
    }, 3)

    expect(v).toBe(0)

    counter = 0
    try {
      await retry(async () => {
        counter++

        if (counter <= 3) {
          throw new Error('1')
        }

        return 0
      }, 3)
    } catch(err) {
      expect(err).toBeTruthy()
    }
  })

  test('archive', async() => {
    const tgz = path.join(__dirname, 'test-archive.tgz')

    await archive(data, tgz)

    expect(fs.existsSync(tgz)).toBeTruthy()
    fs.removeSync(tgz)
  })

  test('unzip', async() => {
    const tgz = path.join(__dirname, 'test-archive.tgz')
    const target = path.join(path.dirname(tgz), 'test-archive')

    await archive(data, tgz)
    await unzip(tgz, target)

    expect(fs.existsSync(target)).toBeTruthy()

    fs.removeSync(tgz)
    fs.removeSync(target)
  })
})
