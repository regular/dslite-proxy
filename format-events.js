const formatters = {
  "cio.output": ({data:{message, type}}) =>
    `cio ${type}: ${message}`,
  "gelOutput": ({data:{message}})=>
    `GEL output: "${message}"`,
  "progress.update": ({data})=>
    formatProgress(data),
  "statusMessage": ({data:{message, type}})=>
    `[${type}] ${message}`,
  "configChanged": ({data:{cores, nonDebugCores}})=>
    `Config has changed, dubuggable cores are:\n${bulletList(cores)}`,
  "refresh": ({data:{reason}})=>
    `Refresh (reason: "${reason}")`,
  "settings.propertyChanged": ({data:{propertyId}})=>
    `Property "${propertyId}" has changed.`,
  "symbols.changed": ({data:{symbolFiles}})=>
    `Symbol files in use: ${symbolFiles.length == 0 ? 'none' : `\n${bulletList(symbolFiles)}`}`,
  "targetState.changed": ({data:{description}})=>
    `Target state changed to "${description}"`
}

module.exports = function formatEvent(msg) {
  const {event} = msg
  if (formatters[event]) {
    return formatters[event](msg)
  }
  return 'no formatter for event: ' + JSON.stringify(msg, null, 2)
}

function bulletList(l) {
  if (!l.length) return '  [empty list]'
  return l.map(x=>`  - ${x}`).join('\n')
}

function formatProgress(data) {
  const {isComplete, name, percent, subActivity, task} = data
  return `(${isComplete?100:(percent||0)}%) ${subActivity} ${task?` / ${task}`:''} (${name})`
}
