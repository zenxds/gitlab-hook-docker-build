import { BaseHookData } from './gitlab'

export interface LooseObject {
  [key: string]: any
}

export interface GenericFunc<T> {
  (...args: any[]): T
}

export interface GenericMap<T> {
  [key: string]: T
}

export type CallbackFunction = GenericFunc<void>

export interface DeployOptions {
  // deploy id
  id: string
  type: 'test' | 'daily' | 'demo' | 'production'
  // hook data
  data: BaseHookData
  engine?: string
  // git archive dir
  archiveDir?: string
  targetDir?: string
  logDir?: string
}

export interface BuildItem {
  script: string
  yarn?: boolean
  registry?: string
  engine?: string
}

// 支持不同环境配置
export interface BuildOptions extends BuildItem {
  test?: Partial<BuildItem>
  daily?: Partial<BuildItem>
  demo?: Partial<BuildItem>
  production?: Partial<BuildItem>
}

export * from './gitlab'
