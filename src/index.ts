import os from 'os'
import path from 'path'
import EventEmitter from 'events'
import fs from 'fs-extra'

import { DeployOptions, BuildOptions, BuildItem } from './types'
import { retry, archive, unzip, exec, link } from './util'

class Deploy extends EventEmitter {
  id: string
  type: DeployOptions['type']
  data: DeployOptions['data']
  engine: string
  path_with_namespace: string

  archiveDir: string
  sourceDir: string
  targetDir: string
  logDir: string

  tgz: string
  containerName: string

  constructor(options: DeployOptions) {
    super()

    const data = this.data = options.data

    this.id = options.id
    this.type = options.type
    this.path_with_namespace = data.project.path_with_namespace
    this.archiveDir = options.archiveDir || os.tmpdir()
    this.targetDir = options.targetDir || ''
    this.logDir = options.logDir || ''
    this.engine = options.engine || ''

    this.containerName = this.getContainerName()
    this.sourceDir = path.join(
      this.archiveDir,
      this.path_with_namespace,
      data.checkout_sha + '-' + this.id
    )
    this.tgz = this.sourceDir + '.tgz'
  }

  public async start(): Promise<void> {
    try {
      await this.download()
      await this.build()
      await this.sync()
      await this.clean()
    } catch (error) {
      await this.clean(true)
      throw error
    }
  }

  private async download(): Promise<void> {
    const { data, sourceDir, tgz } = this

    await retry(() => archive(data, tgz), 5, 5 * 1000)
    await archive(data, tgz)
    await unzip(tgz, sourceDir)
  }

  private async build(): Promise<void> {
    const { type, sourceDir, containerName } = this
    const pkg = require(path.join(sourceDir, 'package.json'))

    const buildOptions: BuildOptions = pkg.build || pkg.cloudBuild
    if (!buildOptions) {
      return
    }

    const build: BuildItem = type && buildOptions[type] ? Object.assign(
      {},
      buildOptions[type],
      buildOptions
    ): buildOptions

    if (!build.script) {
      return
    }

    const engine = build.engine || this.engine || '8'
    const registry = build.registry || 'https://registry.dingxiang-inc.net'
    const yarn = fs.existsSync(path.join(sourceDir, 'yarn.lock')) || build.yarn
    const install = [
      yarn ? 'yarn' : 'npm i',
      `--registry=${registry}`
    ].join(' ')
    const timezone = [
      'ln -snf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime',
      'echo Asia/Shanghai > /etc/timezone'
    ].join(' && ')
    const cmd = `
      docker run \
      --rm \
      --name ${containerName} \
      --env NODE_ENV=development \
      -v ${sourceDir}:/var/www \
      -w /var/www \
      node:${engine} \
      sh -c '${timezone} && ${install} && ${build.script}'
    `

    await this.exec(cmd)
  }

  private async sync(): Promise<void> {
    const buildDir = this.getBuildDir()
    if (!buildDir) {
      throw new Error('no build dir')
    }

    const { sourceDir, targetDir, data } = this
    const emitData = {
      target: path.join(targetDir, this.path_with_namespace),
      actual: path.join(
        targetDir,
        '_data',
        this.path_with_namespace,
        data.checkout_sha
      )
    }

    // 可以在外部进行修改目标目录和实际目录，适配不同场景
    this.emit('sync', emitData)

    const { target, actual } = emitData
    let linkPath = ''

    try {
      linkPath = fs.readlinkSync(target)
    } catch (err) {}

    if (fs.existsSync(actual)) {
      fs.removeSync(actual)
    }

    const cwd = path.dirname(target)
    fs.ensureDirSync(cwd)
    fs.ensureDirSync(actual)
    fs.copySync(path.join(sourceDir, buildDir), actual)

    // 相对ln
    await link(
      path.relative(cwd, actual),
      target.split(path.sep).pop() as string,
      {
        cwd
      }
    )

    // 交由外部去处理删除之类的逻辑，比如下面这段删除旧代码
    this.emit('sync.after', {
      beforePath: linkPath ? path.resolve(cwd, linkPath) : '',
      afterPath: actual
    })

    // 删除旧代码
    // if (linkPath && linkPath.indexOf(data.after) === -1) {
    //   fs.remove(linkPath)
    // }
  }

  public async clean(error?: boolean): Promise<void> {
    const { containerName, sourceDir, tgz } = this

    fs.removeSync(sourceDir)
    fs.removeSync(tgz)

    // rm docker container if fail
    try {
      const docker = await exec(`docker ps | grep ${containerName}`).promise
      if (docker) {
        await exec(`docker rm ${containerName}`).promise
      }
    } catch(error) {}

    // keep log file if has error
    if (!error) {
      this.cleanLogFile()
    }

    this.emit('clean')
  }

  /**
   * exec with log
   */
  private async exec(cmd: string): Promise<void> {
    const { child, promise } = exec(cmd)
    const file = this.getLogFile()

    if (child) {
      if (child.stdout) {
        child.stdout.pipe(fs.createWriteStream(file, { flags: 'a' }))
      }
      if (child.stderr) {
        child.stderr.pipe(fs.createWriteStream(file, { flags: 'a' }))
      }
    }

    await promise
  }

  /**
   * get docker container name
   */
  protected getContainerName(): string {
    const { data, id } = this

    return [
      data.project.namespace,
      data.project.name,
      data.checkout_sha,
      id
    ].join('-')
  }

  /**
   * get build dir, could be overwrite
   */
  protected getBuildDir(): string {
    return 'build'
  }

  private getLogFile(): string {
    const { id, logDir } = this
    return path.join(logDir, `deploy-${id}.log`)
  }

  private cleanLogFile(): void {
    const file = this.getLogFile()

    if (fs.existsSync(file)) {
      fs.removeSync(file)
    }
  }
}

export default Deploy
