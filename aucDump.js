var MongoClient = require('mongodb').MongoClient;

var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
    dbo = resolve;
});

const AUC_STATS_COL = "aucStats";
const AUC_PRICES_COL = "aucPrices";

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

async function addAucPrices (itemObj) {
    return new Promise((resolve, reject) => {
        const aucPricesFilter = {itemId: itemObj.itemId, realm: itemObj.realm};

        dbo.collection(AUC_PRICES_COL).findOne(aucPricesFilter, function (err, found) {
            if (err) throw err;
            if (!found) {
                itemObj.priceCounters = Object.values(itemObj.priceCounters).sort((a,b) => { return (a.price != b.price) ? (a.price - b.price) : (b.faction - a.faction)});
                let res = dbo.collection(AUC_PRICES_COL).insertOne(itemObj);

                console.log("addAucPrices INS", itemObj.itemName, itemObj.faction);
                resolve(res);
            } else {
                let newPricesArray = found.priceCounters
                                        .filter((priceObj) => { return priceObj.faction != itemObj.faction})
                                        .concat(Object.values(itemObj.priceCounters))
                                        .sort((a,b) => { return (a.price != b.price) ? (a.price - b.price) : (b.faction - a.faction)});

                let res = dbo.collection(AUC_PRICES_COL).updateOne(aucPricesFilter,
                                            { $set: { ts : itemObj.ts, stats: itemObj.stats, player: itemObj.player, faction: itemObj.faction, priceCounters: newPricesArray } } );
                         
                console.log("addAucPrices UPD", itemObj.itemName, itemObj.faction);
                resolve(res);
            }
        });
    });
}

exports.parseAucDump = (wtfacAucDump) => {
    let itemIds = Object.keys(wtfacAucDump);

    let idx = 0;
    while (idx < itemIds.length) {
        const itemId = itemIds[idx];
        const itemObj = wtfacAucDump[itemId];

        addAucStat(itemObj.stats);
        addAucPrices(itemObj);

        idx++;
    }

    console.log("parseAucDump", idx)
}

exports.getAucDump = () => {
    return new Promise((resolve, reject) => {
        dbo.collection(AUC_PRICES_COL).find({}).toArray(function (err, result) {
            if (err) throw err;
            resolve(result);
        });
    });
}