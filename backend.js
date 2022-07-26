const { once } = require('events');
const express = require('express')
const app = express()
const port = 3000

const fs = require('fs');
const readline = require('readline');


const wow_path = "C:\\Program Files (x86)\\World of Warcraft\\_classic_";
const horde_acc = "101624645#1";

const parseSavedVarsFile = async (path) => {
  const fileStream = fs.createReadStream(path);
  const arr = [];

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const it = rl[Symbol.asyncIterator]();
  const line1 = await it.next();
  
  arr.push(await (await it.next()).value);
  await it.next();
  await it.next();
  arr.push(await (await it.next()).value);
  arr.push(await (await it.next()).value);

  return arr;
}

app.get('/', (req, res) => {
  (async () => {
    let arr = await parseSavedVarsFile(wow_path + "\\WTF\\Account\\" + horde_acc + "\\SavedVariables\\WowTradeFactory.lua", res);
    res.send(JSON.stringify(arr));
  })();
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})