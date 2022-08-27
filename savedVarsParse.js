const { Console } = require('console');
const fs = require('fs');
const readline = require('readline');
const { isStringObject } = require('util/types');

function parseFormKey(str) {
  return str.replace(/"/g, "");
}

// returns value string w/o quotes or tries to transfrom value into number
function parseFormVal(str) {
  if (str && str[0] == '"') return str.replace(/"/g, "");

  let parse = parseFloat(str);
  if (!isNaN(parse)) {
    return parse;
  }
  else return str;
}

/*
let luaObject = {
  done: false,
  key: null,
  value: null
};
*/
async function parseLuaFileLine(it) {
  let lineObj = await it.next();
  while (lineObj.value === "" && !lineObj.done) lineObj = await it.next();
  if (lineObj.done) return { done: true, key: null, value: null};


  let line = lineObj.value
    .replace(/[\t\[\]\,]/g, "")
    .trim();
  let сmntSplit = line.split(" -- ");


  if (сmntSplit[1]) {  

    if (сmntSplit[0] == '}') return { done: true, key: сmntSplit[1], value: null };   // end of an object with index in comment (ex.: }, -- [1])
    else return { done: true, key: сmntSplit[1], value: parseFormVal(сmntSplit[0]) }; // value is one-line in array (ex.: "value", -- [1])

  } else if (сmntSplit[0] === '{') { // if line is start of object-like in array (ex.: {<multiple-lines-object>}, -- [1])
    return { done: false, key: null, value: '{' }

  } else {  // if value is keyed one-line (ex.: ["key"] = "value",)
    let kvsplit = сmntSplit[0].split(" = ");
    return { done: true, key: parseFormKey(kvsplit[0]), value: parseFormVal(kvsplit[1]) };
  }

  return luaObject;
}

async function parseObjectContents(it) {
  let contents = {}
  let lineObj = await parseLuaFileLine(it);

  while (!lineObj.done) {
    if (varObj.val === '{') varObj.val = await parseObjectContents(it);
    contents[varObj.key] = varObj.val;

    varObj = await parseLuaFileLine(it);
  }

  return contents;
}
/*
ToDo: need to handle arrays some how. Maybe do actions depending on existance of key/value in line parse
Or 
Actially break actions in two funcs(parseObj and parseObjContents)
Maybe both
*/
async function parseLuaObject(it) {
  const luaObject = {
    done: true,
    key: null,
    value: null
  }

  let lineObj = {};
  do {
    lineObj = await parseLuaFileLine(it);

    if (lineObj.key) luaObject.key = lineObj.key;

    if (lineObj.value == '{') luaObject.value = parseLuaObject(it);
    else luaObject.value = lineObj.value;
    
  } while (!lineObj.done);

  return luaObject
}

async function parseSavedVarFromFile(it) {
  let varObj = await parseLuaFileLine(it);
  if (varObj.done) return false;

  let resObj = { name: varObj.key };
  if (varObj.value === '{') resObj.value = await parseLuaObject(it);
  else resObj.value = varObj.value;

  return resObj;
}

exports.parseSavedVarsFile = async (path) => {
  console.log("parseSavedVarsFile", path)
  try {
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

    fileStream.destroy();
    return parsedVars;
  } catch (error) {
    console.log("parseSavedVarsFile error", error);
    fileStream.destroy();
    return {};
  }
}