const { once } = require('events');
const express = require('express')
const app = express()
const port = 3000

const fs = require('fs');
const readline = require('readline');


const wow_path = "C:\\Program Files (x86)\\World of Warcraft\\_classic_";
const horde_acc = "101624645#1";

function parseLuaFileLine(line) {
  line = line.replace(/[\t,\"\[\]]+/gm, "").trim();
  console.log("|"+line+"|");
  let kv = line.split(" = ");
  return {key: kv[0], val: kv[1]};
}

const parseSavedVarsFile = async (path) => {
  const fileStream = fs.createReadStream(path);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const parsedVars = {};

  const it = rl[Symbol.asyncIterator]();
  //const line1 = await it.next();
  let lineObj;
  do {
    lineObj = await it.next();
    if (lineObj.done) continue;

    let parsedLine = parseLuaFileLine(lineObj.value);
    parsedVars[parsedLine.key] = {};
    parsedVars[1.43] = "eve";
    parsedVars[4] = "ava";
  } while (lineObj.done == false);

  console.log("R", parsedVars);
  return parsedVars;
}

app.get('/', (req, res) => {
  (async () => {
    let parsedVars = await parseSavedVarsFile(wow_path + "\\WTF\\Account\\" + horde_acc + "\\SavedVariables\\WowTradeFactory.lua");
    res.send(JSON.stringify(parsedVars));
  })();
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})