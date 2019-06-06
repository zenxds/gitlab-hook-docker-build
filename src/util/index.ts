import fs from 'fs'

export function randomStr(length: number): string {
  let str = ''

  while (str.length < length) {
    str += Math.random()
      .toString(36)
      .slice(2)
  }

  return str.substr(0, length)
}

export function isEmptyDir(dest: string): boolean {
  return (
    !fs.existsSync(dest) ||
    (fs.statSync(dest).isDirectory() && !fs.readdirSync(dest).length)
  )
}

export * from './retry'
export * from './shell'
export * from './unzip'
