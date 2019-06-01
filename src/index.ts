import * as os from 'os'
import * as path from 'path'
import * as EventEmitter from 'events'
import * as fs from 'fs-extra'

import { DeployOptions, BaseHookData } from './types'
import { randomStr, retry, archive, unzip } from './util'

class Deploy extends EventEmitter {
  id: string
  data: BaseHookData
  path_with_namespace: string
  archiveDir: string

  source: string
  tgz: string

  constructor(options: DeployOptions) {
    super()

    this.id = options.id
    this.data = options.data
    this.path_with_namespace = this.data.project.path_with_namespace
    this.archiveDir = options.archiveDir || os.tmpdir()

    this.source = path.join(
      this.archiveDir,
      this.path_with_namespace,
      this.data.checkout_sha + '-' + randomStr(10)
    )
    this.tgz = this.source + '.tgz'
  }

  public async start(): Promise<void> {
    try {
      await this.download()
      await this.build()
      await this.sync()
      this.clean()
    } catch (error) {
      this.clean()
      throw error
    }
  }

  private async download(): Promise<void> {
    const { data, source, tgz } = this

    await retry(() => archive(data, tgz), 5, 5 * 1000)
    await unzip(tgz, source)
  }

  private async build(): Promise<void> {}

  private async sync(): Promise<void> {}

  public clean(): void {
    fs.removeSync(this.source)
    fs.removeSync(this.tgz)
  }
}

export default Deploy
