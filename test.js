
const {client} = require('websocket')
const log = console.log.bind(console)
const config = {
  dslite: '/opt/ti/uniflash/deskdb/content/TICloudAgent/linux/ccs_base/DebugServer/bin/DSLite',
  port: 57777
}


require('.')(log, config, err=>{
  if (err) {
    console.error(err.message)
    process.exit(1)
  }
  const c = new client()
  c.on('connectFailed', err => {
    log('connect to server failed:', err.message)
  })

  c.on('connect', (conn) => {
    log("Connected to server")
    conn.on('message', msg => {
      if (msg.type === 'utf8') {
        log("message from server", JSON.parse(msg.utf8Data))
      } else if (msg.type === 'binary') {
        log('binary message from server', {binaryLength: msg.binaryData.length})
      } else log('unknown message type from dslite', msg.type)
    })
    console.log('sending data')
    conn.sendUTF(JSON.stringify({
      "command":"listCommands",
      "id":1,
      "data":[]
    }))
    conn.sendUTF(JSON.stringify({
      "command":"getVersion",
      "id":2,
      "data":[]
    }))
  })

  const serverUrl = 'ws://localhost:57777/'
  log("connecting to server: ", serverUrl)
  c.connect(serverUrl, null);

})
