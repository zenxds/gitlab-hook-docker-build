import path from 'path'
import Deploy from '../src'
import data from './data'

const deploy = new Deploy({
  id: '4vibht2rwl',
  type: 'test',
  data,
  archiveDir: path.join(__dirname, '../tmp/archive'),
  logDir: path.join(__dirname, '../tmp/log'),
  targetDir: path.join(__dirname, '../tmp/target')
})

deploy.on('sync.after', data => {
  console.log(data)
})

deploy.start()
