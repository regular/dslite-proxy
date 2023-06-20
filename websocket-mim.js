const WSServer = require('websocket').server;
const WSClient = require('websocket').client;
const http = require('http');
const multicb = require('multicb')
const once = require('once')

module.exports = function startServer(log, listen_port, ds_port, cb) {
  const serverUrl = `ws://localhost:${ds_port}/`
  log('process args:', process.argv)
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
  wsClient.connect(serverUrl, null) // TODO: 2nd arg?

  done( (err, port, dsConn) => {
    if (err) return cb(err)
      
    log(`ws proxy accapts cloud connections on ${port}`)

    wsServer.on('connect', (cloudConn) => {
      log('CloudConn accepted.', cloudConn.remoteAddress)
      cloudConn.on('close', (reasonCode, description) => {
        log(' Peer ' + cloudConn.remoteAddress + ' disconnected.', reasonCode, description)
      })
      proxy(dsConn, cloudConn, 'ds->cloud')
      proxy(cloudConn, dsConn, 'cloud->ds')
    })

    cb(null)
  })

  function proxy(connIn, connOut, label) {
    connIn.on('message', msg => {
      if (msg.type === 'utf8') {
        log(label +" utf:", msg.utf8Data)
        connOut.sendUTF(msg.utf8Data)
      } else if (msg.type === 'binary') {
        log(label + 'binary:', {binaryLength: msg.binaryData.length})
        connOut.sendBytes(msg.binaryData)
      } else log('unknown message type', msg.type)
    })
  }
}
