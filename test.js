const {join} = require('path')

const {client} = require('websocket')
const log = console.log.bind(console)
const config = {
  dslite: '/opt/ti/uniflash/deskdb/content/TICloudAgent/linux/ccs_base/DebugServer/bin/DSLite',
  port: 57777
}

const opts = {onNewEndpoint}

require('.')(log, config, opts, err=>{
  if (err) {
    console.error(err.message)
    process.exit(1)
  }
  const c = new client()
  c.on('connectFailed', err => {
    log('test.js: connect to server failed:', err.message)
  })

  c.on('connect', (conn) => {
    log("test.js: Connected to server")
    conn.on('message', msg => {
      if (msg.type === 'utf8') {
        const j = JSON.parse(msg.utf8Data)
        if (!j.event) {
          log("test.js: message from server", j)
        }
        if (j.response == 3) {
          const core = j.data.cores[0]
          conn.sendUTF(JSON.stringify({
            "command":"createSubModule",
            "id":4,
            "data":[core]
          }))
        }
      } else if (msg.type === 'binary') {
        log('test.js: binary message from server', {binaryLength: msg.binaryData.length})
      } else log('test.js: unknown message type from dslite', msg.type)
    })
    console.log('test.js: sending data')
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
    conn.sendUTF(JSON.stringify({
      "command":"configure",
      "id":3,
      "data":[join(__dirname, "ccxml/CC2640R2F.ccxml")]
    }))
  })

  const serverUrl = 'ws://localhost:57777/'
  log("test.js: connecting to server: ", serverUrl)
  c.connect(serverUrl, null);

})


function onNewEndpoint(name, port, subProtocol) {
  const c = new client()
  c.on('connectFailed', err => {
    log('test.js: connect to server failed:', err.message)
  })

  c.on('connect', (conn) => {
    log("test.js: Connected to server")
    conn.on('message', msg => {
      if (msg.type === 'utf8') {
        const j = JSON.parse(msg.utf8Data)
        if (!j.event) {
          log("test.js: message from server", j)
        }
      }
    })
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
  const serverUrl = `ws://localhost:${port}/`
  log("test.js: connecting to server: ", name, serverUrl)
  c.connect(serverUrl, null);
}
