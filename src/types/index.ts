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
  // hook data
  data: BaseHookData
  // git archive dir
  archiveDir?: string
}

export * from './gitlab'
