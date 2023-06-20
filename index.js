const {spawn} = require('child_process')
const {resolve, join, parse} = require('path')
const bl = require('bl')
const loner = require('loner')
const mim = require('./websocket-mim')

module.exports = function(log, config, opts, cb) {
  const binpath = config.dslite
  const {dir, base} = parse(binpath)
  const PORT = 57777

  const l = []
  const ds = spawn(binpath, process.argv.slice(2), {})

  ds.on('close', code=>{
    log('DSLite exited with code', code)
    if (code == 0) return cb(null)
    cb(new Error(`DSLite exit code ${code}`))
  })

  let passthrough = false
  ds.stderr.on('data', data=>{
    process.stderr.write(data)
    log('stderr', data)
  })
  ds.stdout.pipe(loner('\n')).on('data', data=>{
    if (passthrough) {
      log('stdout', data)
      return process.stdout.write(data)
    }
    if (data == '\n') {
      let j
      try { j = JSON.parse(bl(l).toString('utf8')) } catch(err) {
        return cb(err)
      }
      const {port} = j
      mim(log, config.port, port, opts, cb) 
      passthrough = true
    } else {
      l.push(data)
    }
  })
}
