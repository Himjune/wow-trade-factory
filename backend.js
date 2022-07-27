const { once } = require('events');
const express = require('express')
const app = express()
const port = 3000

const saved_vars_parse = require('./savedVarsParse');

const wow_path = "C:\\Program Files (x86)\\World of Warcraft\\_classic_";
const horde_acc = "101624645#1";

app.get('/', (req, res) => {
  (async () => {
    let parsedVars = await saved_vars_parse.parseSavedVarsFile(wow_path + "\\WTF\\Account\\" + horde_acc + "\\SavedVariables\\WowTradeFactory.lua");
    res.send(JSON.stringify(parsedVars));
  })();
})


app.get('/api/post', (req, res) => {
  (async () => {
    let parsedVars = await saved_vars_parse.parseSavedVarsFile(wow_path + "\\WTF\\Account\\" + horde_acc + "\\SavedVariables\\WowTradeFactory.lua");
    res.send(JSON.stringify(parsedVars));
  })();
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})