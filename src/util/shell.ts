import * as path from 'path'
import * as shell from 'shelljs'
import * as fs from 'fs-extra'
import { ChildProcess } from 'child_process'
import { BaseHookData } from '../types'

interface ExecReturn {
  child?: ChildProcess
  promise: Promise<any>
}

export function exec(cmd: string, options?: shell.ExecOptions): ExecReturn {
  const execOptions = Object.assign(
    {
      timeout: 30 * 60 * 1000,
      silent: true
    },
    options || {}
  )

  let child
  let promise = new Promise((resolve, reject) => {
    child = shell.exec(cmd, execOptions, function(code, stdout, stderr) {
      if (code !== 0) {
        throw new Error(`${code}: ${stderr}`)
      } else {
        resolve(stdout)
      }
    })
  })

  return {
    child,
    promise
  }
}

export async function archive(data: BaseHookData, dest: string): Promise<void> {
  const project = data.project
  const dirname = path.dirname(dest)
  const ext = path.extname(dest).replace('.', '')
  const cmd = `git archive --remote=${
    project.git_ssh_url
  } --format=${ext} --output=${dest} ${data.ref}`

  fs.ensureDirSync(dirname)

  try {
    await exec(cmd).promise
  } catch (err) {
    throw err
  }
}

/**
 * 链接
 * https://serverfault.com/questions/147787/how-to-update-a-symbolic-link-target-ln-f-s-not-working
 * readlink命令
 */
export async function link(target: string, linkName: string): Promise<void> {
  // 如果linkName是一个实际的目录（非链接目录），先删除掉，使用lstatSync可以区分普通目录和链接目录
  if (fs.existsSync(linkName) && fs.lstatSync(linkName).isDirectory()) {
    fs.removeSync(linkName)
  }

  await exec(`ln -sfT ${target} ${linkName}`).promise
}
