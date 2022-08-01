
var MongoClient = require('mongodb').MongoClient;

var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
    dbo = resolve;
});

exports.addResource = (itemName, buyout, amount, realm, source) => {
    let price = buyout / amount;
    let searchObj = { itemName: itemName, price: price, realm: realm };
    console.log("RSearch", searchObj)
    dbo.collection("resourses").findOne(searchObj, function (err, found) {
        if (err) throw err;
        console.log(searchObj, "found: ", found);
        if (found) {
            console.log(searchObj, "found and gonna updatte: ", found);
            dbo.collection("resourses").updateOne({_id: found._id}, { $set: {amount: found.amount + amount}}, function (err, res) {
                if (err) console.log("Resource update ERR", err, found._id, itemName);
                console.log("Resource updated", found._id, itemName, res);
            });
        } else {
            dbo.collection("resourses").insertOne({ itemName: itemName, price: price, amount: amount, realm: realm, source: source }, function(err, res) {
              if (err) console.log("Resource creation ERR", err, itemName);
              console.log("Resource created", itemName, amount, res);
            });
        }
    });
}