var MongoClient = require('mongodb').MongoClient;

var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
    dbo = resolve;
});

const AUC_STATS_COL = "aucStats";

async function addAucStat(statsObj) {
    return new Promise((resolve, reject) => {
        dbo.collection(AUC_STATS_COL).findOne({ itemId: statsObj.itemId, ts: statsObj.ts, faction: statsObj.faction }, function (err, found) {
            if (err) throw err;
            if (!found) {
                let res = dbo.collection(AUC_STATS_COL).insertOne(statsObj);
                resolve(res);
            } else {
                resolve(false);
            }
        });
    });
}

exports.parseAucDump = (wtfacAucDump, isStartOfNewParse = false) => {
    let itemIds = Object.keys(wtfacAucDump);

    let idx = 0;
    while (idx < itemIds.length) {
        const itemId = itemIds[idx];
        const itemObj = wtfacAucDump[itemId];

        addAucStat(itemObj.stats);

        idx++;
    }
}