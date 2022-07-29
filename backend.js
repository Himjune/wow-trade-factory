const { once } = require('events');
const express = require('express')
const app = express()
const port = 3000

const files = require("./files");

var MongoClient = require('mongodb').MongoClient;

var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
  dbo = resolve;
});

setInterval(() => { files.updateInfoFromSavedVars(); }, 1500);

app.get('/', (req, res) => {
  (async () => {
    res.send(JSON.stringify(savedVars));
  })();
})


app.get('/api/post', (req, res) => {
  (async () => {
    //let parsedVars = await saved_vars_parse.parseSavedVarsFile(wow_path + "\\WTF\\Account\\" + horde_acc + "\\SavedVariables\\WowTradeFactory.lua");
    res.send(JSON.stringify(savedVars));
  })();
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})