const fs = require('fs');
const saved_vars_parse = require('./savedVarsParse');

const wow_path = "C:\\Program Files (x86)\\World of Warcraft\\_classic_";
const horde_acc = "101624645#1";

var MongoClient = require('mongodb').MongoClient;
var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
  dbo = resolve;
});

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

        let newParse = saved_vars_parse.parseSavedVarsFile(path);
        handleNewParse(newParse);
      } 
    );
  }

  return saved_vars_parse.parseSavedVarsFile(path);
}

function handleNewParse(newParse) {

}

exports.updateInfoFromSavedVars = async () => {
  tryParseFile(wow_path + "\\WTF\\Account\\" + horde_acc + "\\SavedVariables\\WowTradeFactory.lua");

}