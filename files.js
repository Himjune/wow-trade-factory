const fs = require('fs');

var MongoClient = require('mongodb').MongoClient;
var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
  dbo = resolve;
});

const saved_vars_parse = require('./savedVarsParse');
const parseMail = require('./mail').parseMail;
const parseCrafts = require('./crafts').parseCraftTracks;
const parseAucDump = require('./aucDump').parseAucDump;


const wow_path = "C:\\Program Files (x86)\\World of Warcraft\\_classic_";
const horde_acc = "101624645#1";
const aliance_acc = "466411978#1";

function checkFileModified(path) {
  return new Promise((resolve,reject)=> {
    try {
      let fstat = fs.statSync(path);
    
      dbo.collection("stats").findOne( {type: "svfLastModified", path: path}, function(err, result) {
        if (err) throw err;
        resolve(!result || (result.value < fstat.mtimeMs));
      });
    } catch (error) {
      console.log("checkFileModified error:", error);
      resolve(false);
    }
  });
}

async function tryParseFile(path, isForce = false) {
  let isFileModified = await checkFileModified(path);
  //console.log('tryParseFile', isFileModified, isForce);

  if (isFileModified || isForce) {
    dbo.collection("stats").updateOne(
      { type: "svfLastModified", path: path },
      { $set: { value: fs.statSync(path).mtimeMs } },
      { upsert: true },
      async function(err, result) {
        if (err) throw err;
        console.log('Upsert svfLastModified', result);

        let newParse = await saved_vars_parse.parseSavedVarsFile(path);
        handleNewParse(newParse);
      } 
    );
  }

  return isFileModified || isForce;
}

function handleNewParse(newParse) {
  //console.log('handleNewParse', newParse);
  if (newParse && newParse.wtfacMailTrack) parseMail(newParse.wtfacMailTrack);
  if (newParse && newParse.wtfacCraftTrack) parseCrafts(newParse.wtfacCraftTrack);
  if (newParse && newParse.wtfacAucDump) parseAucDump(newParse.wtfacAucDump);
}

exports.updateInfoFromSavedVars = async (isForce) => {
  tryParseFile(wow_path + "\\WTF\\Account\\" + horde_acc + "\\SavedVariables\\WowTradeFactory.lua", isForce);
  tryParseFile(wow_path + "\\WTF\\Account\\" + aliance_acc + "\\SavedVariables\\WowTradeFactory.lua", isForce);
}