cat ~/.mozilla/native-messaging-hosts/com.ti.ticloudagent.json
tells you the path to TICloudAgentHost.sh, e.g:
  "path": "/opt/ti/uniflash/TICloudAgentHostApp/ticloudagent.sh",

You may have to
sudo chmod u+r /opt/ti/uniflash/TICloudAgentHostApp/src/spawnDS.js 
sudo chown regular:regular /opt/ti/uniflash/TICloudAgentHostApp/src/spawnDS.js 

in TICloudAgentHostApp/src/spawnDS.js

change the executable path to point to ds-proxy.
e.g:
const execFile = "/home/regular/dev/x/dslite-proxy/bin/ds-proxy"; // original: ".DSLite" 

