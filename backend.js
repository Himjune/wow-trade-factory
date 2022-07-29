const { once } = require('events');
const express = require('express')
const app = express()
const port = 3000

const saved_vars_parse = require('./savedVarsParse');

var MongoClient = require('mongodb').MongoClient;
var dbo = false;
const dbUrl = "mongodb://localhost:27017/wtfacdb";
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(dbUrl, function(err, db) {
  if (err) throw err;  
  dbo = db.db("wtfacdb");
  console.log("wtfacdb Database created(connected)!");

  dbo.createCollection("stats", function(err, res) {
    if (err) console.log("stats Collection err! "+err);
    else console.log("stats Collection created!");
    
    dbo.collection("stats").insertOne({_id: "svLastModified", value: 0}, function(err, res) {
      if (err) console.log("svLastModified default err! "+err);
      else console.log("svLastModified default inserted");
    });

  });


  
});

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