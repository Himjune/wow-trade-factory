

const fs = require('fs');
const readline = require('readline');

async function parseLuaFileLine(it) {
  let lineObj = await it.next();
  while (lineObj.value === "" && !lineObj.done) lineObj = await it.next(); 
  if (lineObj.done) return false;

  let luaObject = {};  

  // ToDo: should handle ',' at the end of a line
  let line = lineObj.value
            .replace(/[\t,\"\[\]]+/gm, "")
            .trim();
  //console.log("|"+line+"|");
  
  let kv = line.split(" = ");
  let commentSplit = kv[0].split(" -- ");

  if (commentSplit.length > 1)
    luaObject = {key: commentSplit[1], val: tryParseNum(commentSplit[0])}
  else 
    luaObject = {key: kv[0], val: tryParseNum(kv[1])}

  return luaObject;
}

function tryParseNum(val) {
  let parse = parseFloat(val);
  if (!isNaN(parse)) return parse;
  else return val;
}

async function parseObjLine(it) {
  let varObj = await parseLuaFileLine(it);
  if (!varObj || varObj.key == '}') return false;

  varObj.isValObj = (varObj.val == "{");
  
  if (!varObj.isValObj) {
    varObj.val = tryParseNum(varObj.val);
  }

  return varObj;
}

async function parseObjectContents(it) {
  let contents = {}
  let varObj = await parseObjLine(it);
  while (varObj) {
    //console.log("parseSavedVarFromFile", varObj)
    if (varObj.isValObj) varObj.val = await parseObjectContents(it);
    contents[varObj.key] = varObj.val;

    varObj = await parseObjLine(it);
  }

  return contents;
}

async function parseSavedVarFromFile(it) {
  let varObj = await parseObjLine(it);
  //console.log("parseSavedVarFromFile",varObj)
  if (!varObj) return false;
  
  let resObj = {name: varObj.key};
  if (varObj.isValObj) resObj.value = await parseObjectContents(it);
  else resObj.value = resObj.val;

  return resObj;
}

exports.parseSavedVarsFile = async (path) => {
  const fileStream = fs.createReadStream(path);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const parsedVars = {};

  const it = rl[Symbol.asyncIterator]();
  //const line1 = await it.next();
  let parsedVar = {};
  do {
    parsedVar = await parseSavedVarFromFile(it);
    if (!parsedVar) break;
    parsedVars[parsedVar.name] = parsedVar.value;
  } while (parsedVar);

  console.log("R", parsedVars);
  return parsedVars;
}