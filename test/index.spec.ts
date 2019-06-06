import path from 'path'
import Deploy from '../src'

import data from './data'

describe('deploy', () => {
  test('new', () => {
    const deploy = new Deploy({
      id: Math.random().toString().slice(2),
      type: 'test',
      data
    })

    expect(deploy.on).toBeTruthy()
    expect(deploy.emit).toBeTruthy()
    expect(deploy.path_with_namespace).toBeTruthy()

    expect(deploy.id).toBeTruthy()
    expect(deploy.data).toBeTruthy()
  })
})
