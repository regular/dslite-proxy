const WSServer = require('websocket').server;
const WSClient = require('websocket').client;
const http = require('http');
const multicb = require('multicb')
const once = require('once')
const formatEvent = require('./format-events')

module.exports = function startServer(log, listen_port, ds_port, opts, cb) {
  const serverUrl = `ws://localhost:${ds_port}/`
  const done = multicb({pluck:1, spread: true})

  const httpd = http.createServer((request, response) => {
    log('Received request for ' + request.url)
    response.writeHead(404)
    response.end()
  })

  const doneListening = done()
  httpd.listen( listen_port , function() {
    log('Server is listening on port ' + listen_port)
    doneListening(null, listen_port)
  })

  wsServer = new WSServer({
    httpServer: httpd,
    autoAcceptConnections: true
  })

  const doneDSConnect = once(done())
  const wsClient = new WSClient()
  wsClient.on('connectFailed', err => {
    log('connect to DS failed: ' + err.message)
    doneDSConnect(err)
  })

  wsClient.on('connect', dsConn => {
    log("Proxy connected to DS");
    doneDSConnect(null, dsConn)
  })

  log("connecting to DS: ", serverUrl)
  wsClient.connect(serverUrl, opts.subProtocol) 

  done( (err, port, dsConn) => {
    if (err) return cb(err)
      
    log(`ws proxy accapts cloud connections on ${port}`)

    wsServer.on('connect', (cloudConn) => {
      log('CloudConn accepted.', cloudConn.remoteAddress)
      cloudConn.on('close', (reasonCode, description) => {
        log(' Peer ' + cloudConn.remoteAddress + ' disconnected.', reasonCode, description)
      })
          
      /* Suubmodule support
      cloud->ds utf: {"command":"createSubModule","id":4,"data":["Texas Instruments XDS110 USB Debug Probe/Cortex_M3_0"]}
      ds->cloud utf: {"data":{"port":60431,"subProtocol":"2"},"response":4}
      */
      const {toFront, toBack} = makeMessageFilterPair(log)
      proxy(cloudConn, dsConn, toBack)
      proxy(dsConn, cloudConn, toFront)
    })

    cb(null)
  })

  function proxy(connIn, connOut, onMsg) {
    connIn.on('message', msg => {
      if (msg.type === 'utf8') {
        if (onMsg) {
          onMsg(JSON.parse(msg.utf8Data), (err, data)=>{
            if (!err) connOut.sendUTF(JSON.stringify(data))
            else {
              // TODO
              console.error(err.message, err.code)
            }
          })
        } else {
          connOut.sendUTF(msg.utf8Data)
        }
      } else if (msg.type === 'binary') {
        log(label + 'binary:', {binaryLength: msg.binaryData.length})
        connOut.sendBytes(msg.binaryData)
      } else log('unknown message type', msg.type)
    })
  }

  function makeMessageFilterPair(log) {
    const pending_submodules = {}

    // Messages headed towards DebugServer
    function toBack(j, cb) {
      log('IDE->', formatMessage(j))
      const {command, data, id} = j
      if (command == 'createSubModule') {
        const name = data[0].split('/').slice(-1)[0]
        pending_submodules[id] = name
      }
      cb(null, j)
    }

    // Message headed towards Cloud IDE/tirun
    function toFront(j, cb) {
      log('DS->', formatMessage(j))
      const {data, response} = j
      const name = pending_submodules[response]
      if (name == undefined) {
        return cb(null, j)
      }
      delete pending_submodules[response]
      const {port, subProtocol} = data
      opts.subProtocol = subProtocol
      startServer(makeSubLog(log, name), port+1, port, opts, err=>{
        if (err) {
          log('ERROR creating submodule prixy', err.message)
          return cb(err)
        }
        log('new Endpoint', name, ' on port', port+1)
        if (opts.onNewEndpoint) {
          const args = opts.onNewEndpoint.length
          if (args == 3) {
            opts.onNewEndpoint(name, port+1, subProtocol)
          } else if (args == 4) {
            return opts.onNewEndpoint(name, port+1, subProtocol, (err, j2)=>{
              if (err) return cb(err)
              cb(null, Object.assign({}, j, j2))
            })
          }
        }
        j.data.port++
        cb(null, j)
      })
    }

    return {toBack, toFront}
  }
}

// -- util

function formatMessage(j) {
  if (j.event) return formatEvent(j)
  return JSON.stringify(j, null, 2)
}

function makeSubLog(mainlog, name) {
  return function sublog() {
    const args = Array.from(arguments)
    args.unshift(`[${name}]`)
    mainlog.apply(null, args)
  }
}

