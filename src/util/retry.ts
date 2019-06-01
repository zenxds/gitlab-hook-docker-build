import { sleep } from './sleep'

export async function retry(
  fn: () => Promise<any>,
  times: number = 3,
  delay: number = 200
): Promise<any> {
  for (let i = 0; i < times; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === times - 1) {
        throw err
      } else {
        await sleep(delay)
      }
    }
  }
}
