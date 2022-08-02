
var MongoClient = require('mongodb').MongoClient;

var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
    dbo = resolve;
});

exports.addResource = (itemName, buyout, amount, realm, source) => {
    return new Promise((resolve, reject) => {
        let price = buyout / amount;
        let searchObj = { itemName: itemName, price: price, realm: realm };

        dbo.collection("resources").findOne(searchObj, function (err, found) {
            if (err) throw err;
            if (found) {
                dbo.collection("resources").updateOne({ _id: found._id }, { $set: { amount: found.amount + amount } }, function (err, res) {
                    if (err) console.log("Resource update ERR", err, found._id, itemName);
                    resolve(false);
                });
            } else {
                dbo.collection("resources").insertOne({ itemName: itemName, price: price, amount: amount, realm: realm, source: source }, function (err, res) {
                    if (err) console.log("Resource creation ERR", err, itemName);
                    resolve(true);
                });
            }
        });
    })
}