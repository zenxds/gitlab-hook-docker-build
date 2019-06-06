import fs from 'fs-extra'
import tar from 'tar'

export async function unzip(src: string, dest: string): Promise<void> {
  fs.ensureDirSync(dest)

  await tar.extract({
    file: src,
    cwd: dest
  })
}
