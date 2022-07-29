const { once } = require('events');
const express = require('express')
const app = express()
const port = 3000

const fs = require('fs');
const saved_vars_parse = require('./savedVarsParse');

const dbUrl = "mongodb://localhost:27017/wtfacdb";
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(dbUrl, function(err, db) {
  if (err) throw err;  
  dbo = db.db("wtfacdb");
  console.log("wtfacdb Database created(connected)!");

  dbo.createCollection("stats", function(err, res) {
    if (err) console.log("stats Collection err! "+err);
    else console.log("stats Collection created!");
    
    /*dbo.collection("stats").insertOne({_id: "svLastModified", value: 0}, function(err, res) {
      if (err) console.log("svLastModified default err! "+err);
      else console.log("svLastModified default inserted");
    });*/

  });


  
});

const wow_path = "C:\\Program Files (x86)\\World of Warcraft\\_classic_";
const horde_acc = "101624645#1";


function checkFileModified(path) {
  return new Promise((resolve,reject)=> {
    let fstat = fs.statSync(path);
  
    dbo.collection("stats").findOne( {type: "svfLastModified", path: path}, function(err, result) {
      if (err) throw err;
      resolve(!result || (result.value < fstat.mtimeMs));
    });
  });
}
async function tryParseFile(path) {
  let isFileModified = await checkFileModified(path);

  if (isFileModified) {
    dbo.collection("stats").updateOne(
      { type: "svfLastModified", path: path },
      { $set: { value: fs.statSync(path).mtimeMs } },
      { upsert: true },
      function(err, result) {
        if (err) throw err;
        console.log('Upsert svfLastModified', result);
      }
    );
  }

  return saved_vars_parse.parseSavedVarsFile(path);
}

async function updateInfoFromSavedVars() {
  let varsFileModified = tryParseFile(wow_path + "\\WTF\\Account\\" + horde_acc + "\\SavedVariables\\WowTradeFactory.lua");

}
setInterval(() => { updateInfoFromSavedVars(); }, 1500);

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