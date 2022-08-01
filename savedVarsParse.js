const { Console } = require('console');
const fs = require('fs');
const readline = require('readline');
const { isStringObject } = require('util/types');

function parseFormKey(str) {
  return str.replace(/"/g, "");
}

function parseFormVal(str) {
  if (str && str[0] == '"') return str.replace(/"/g, "");
  
  let parse = parseFloat(str);
  if (!isNaN(parse)) {
    return parse;
  }
  else return str;  
}

async function parseLuaFileLine(it) {
  let lineObj = await it.next();
  while (lineObj.value === "" && !lineObj.done) lineObj = await it.next(); 
  if (lineObj.done || lineObj.value.indexOf('}')>=0) return false;

  let luaObject = {};  

  let line = lineObj.value
            .replace(/[\t\[\]\,]/g, "")
            .trim();
  let сsplit = line.split(" -- ");

  if (сsplit[1]) {
    luaObject = { key: сsplit[1], val: parseFormVal(сsplit[0]) };
  } else {
    let kvsplit = сsplit[0].split(" = ");
    luaObject = { key: parseFormKey(kvsplit[0]), val: parseFormVal(kvsplit[1]) };
  }

  return luaObject;
}

async function parseObjectContents(it) {
  let contents = {}
  let varObj = await parseLuaFileLine(it);

  while (varObj) {
    if (varObj.val === '{') varObj.val = await parseObjectContents(it);
    contents[varObj.key] = varObj.val;

    varObj = await parseLuaFileLine(it);
  }

  return contents;
}

async function parseSavedVarFromFile(it) {
  let varObj = await parseLuaFileLine(it);
  if (!varObj) return false;
  
  let resObj = {name: varObj.key};
  if (varObj.val === '{') resObj.value = await parseObjectContents(it);
  else resObj.value = varObj.val;

  return resObj;
}

exports.parseSavedVarsFile = async (path) => {
  console.log("parseSavedVarsFile", path)
  const fileStream = fs.createReadStream(path);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const parsedVars = {};

  const it = rl[Symbol.asyncIterator]();
  let parsedVar = {};
  do {
    parsedVar = await parseSavedVarFromFile(it);
    if (!parsedVar) break;
    parsedVars[parsedVar.name] = parsedVar.value;
  } while (parsedVar);

  return parsedVars;
}