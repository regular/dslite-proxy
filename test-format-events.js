const format = require('./format-events')

const events = [
  {
    "data": {
      "cores": [
        "Texas Instruments XDS110 USB Debug Probe/Cortex_M3_0"
      ],
      "nonDebugCores": [
        "Texas Instruments XDS110 USB Debug Probe/IcePick_C",
        "Texas Instruments XDS110 USB Debug Probe/CS_DAP_0"
      ]
    },
    "event": "configChanged"
  }, {
    "data": {
      "reason": "TargetConnected"
    },
    "event": "refresh"
  }, {
    "data": {
      "propertyId": "FlashFiles"
    },
    "event": "settings.propertyChanged"
  }, {
    "data": {
      "symbolFiles": []
    },
    "event": "symbols.changed"
  }, {
    "data": {
      "description": "Running"
    },
    "event": "targetState.changed"
  }
]

for(const e of events) {
  console.log(format(e))
}
