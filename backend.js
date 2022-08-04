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

const addResource = require('./resource').addResource;

const getCrafts = require('./crafts').getCrafts;

setInterval(() => { files.updateInfoFromSavedVars(false); }, 1500);

app.get('/force_parse', (req, res) => {
  (async () => {
    files.updateInfoFromSavedVars(true);
    res.send("Forced");
  })();
})

app.get('/api/add_cards', (req, res) => {
  const cards = ["Двойка", "Тройка", "Четверка", "Пятерка", "Шестерка", "Семерка", "Восьмерка", "Туз"];
  const decks = ["Полководцев", "Порталов", "Зверей", "Ярости", "Благословения", "Элементалей"];
 // полк	порт	зверей	ярост	благо	элем
  const table = `1	2	11	0	0	0
3	6	3	0	0	0
4	2	4	0	0	0
3	3	3	0	3	0
1	2	3	2	0	0
2	5	7	0	0	0
0	6	7	1	0	1
0	0	0	0	0	13`;

  let lines = table.split('\n');
  for (let cindex = 0; cindex < lines.length; cindex++) {
    let cardLine = lines[cindex].split('\t');
    for (let dindex = 0; dindex < cardLine.length; dindex++) {
      const cardCnt = parseInt(cardLine[dindex]);
      if (isNaN(cardCnt)) cardCnt = 0;
      let price =  20000*cardCnt;
      if (isNaN(price)) price = 0;

      const iName = cards[cindex] + " из колоды " + decks[dindex];
      //if (cardCnt > 0) addResource(iName, price, cardCnt, "Пламегор", []);
    }
  }
  
  res.type('text/plain');
  res.send(JSON.stringify(lines));
})


app.get('/api/cards_report', (req, res) => {
  (async () => {
    const cards = ["Двойка", "Тройка", "Четверка", "Пятерка", "Шестерка", "Семерка", "Восьмерка", "Туз"];
    const decks = ["Безумия", "Благословений", "Вихрей", "Зверей", "Полководцев", "Порталов", "Элементалей", "Ярости"];
    const connector = " из колоды ";

    let totalR = "Количество";
    let sumR = "Сумма";
    let avgR = "Среднее";

    let iC = 0;
    while (iC < cards.length) {
      const card = cards[iC];
      totalR = totalR + '\n' + card + ';';
      sumR = sumR + '\n' + card + ';';
      avgR = avgR + '\n' + card + ';';

      let iD = 0;
      while (iD < decks.length) {
        const deck = decks[iD];
        const itemName = card + connector + deck;
        let dbres = await dbo.collection("resources").aggregate([
          {
            '$match': {
              'itemName': itemName
            }
          }, {
            '$addFields': {
              'calc': {
                '$multiply': [
                  '$amount', '$price'
                ]
              }
            }
          }, {
            '$group': {
              '_id': '$itemName',
              'total': {
                '$sum': '$amount'
              },
              'cSum': {
                '$sum': '$calc'
              }
            }
          }
        ]).toArray();
        console.log("dbres", dbres);
        if (dbres[0]) {
          totalR = totalR + dbres[0].total+';';
          sumR = sumR + dbres[0].cSum+';';
          avgR = avgR + (dbres[0].cSum/dbres[0].total)+';';
        } else {
          totalR = totalR + '0;';
          sumR = sumR + '0;';
          avgR = avgR + '0;';
        }
        iD++;
      };
      iC++;
    };

    res.type('text/plain');
    res.send(totalR+'\n;\n;'+sumR+'\n;\n;'+avgR);
  })();
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})