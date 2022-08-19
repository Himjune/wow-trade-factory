
var MongoClient = require('mongodb').MongoClient;

let dbo = null;
require('./database.js').get_dbo.then((resolve) => {
    dbo = resolve;
});

const RESOURCES_COL = "resources";

exports.addResource = (itemId, itemName, buyout, amount, realm, source) => {
    return new Promise((resolve, reject) => {
        let price = buyout / amount;
        let searchObj = { itemId: itemId, price: price, realm: realm };

        dbo.collection(RESOURCES_COL).findOne(searchObj, function (err, found) {
            if (err) throw err;
            if (found) {
                dbo.collection(RESOURCES_COL).updateOne({ _id: found._id }, { $set: { amount: found.amount + amount } }, function (err, res) {
                    if (err) console.log("Resource update ERR", err, found._id, itemName);
                    resolve(false);
                });
            } else {
                dbo.collection(RESOURCES_COL).insertOne({ itemId: itemId, itemName: itemName, price: price, amount: amount, realm: realm, source: source }, function (err, res) {
                    if (err) console.log("Resource creation ERR", err, itemName);
                    resolve(true);
                });
            }
        });
    })
}

exports.addCraftedResource = async (itemId, itemName, realm, reagents) => {
    return new Promise(async (resolve, reject) => {
        const proto = {
            itemId: itemId,
            itemName: itemName,
            realm: realm,
            price: 0,
            amount: 1,
            isCorrect: true,
            sources: []
        };

        const source = [];
        for (let index = 0; index < reagents.length; index++) {
            const reagent = reagents[index];
            let target = reagent.amount;
            const availableResources = await dbo.collection(RESOURCES_COL).find({itemName: reagent.itemName, realm: realm}).sort({ "price": -1 }).toArray();
            let resIdx = 0;
            while (target > 0 && resIdx < availableResources.length) {
                const resource = availableResources[resIdx];

                const taken = Math.min(target, resource.amount);
                target -= taken;
                if (taken >= resource.amount) {
                    await dbo.collection(RESOURCES_COL).deleteOne({_id: resource._id});
                } else {
                    await dbo.collection(RESOURCES_COL).updateOne({_id: resource._id}, {$set: {amount: resource.amount - taken}});
                }

                resource.amount = taken;
                proto.price += resource.price * taken;
                source.push(resource);
                
                resIdx++;
            }
            if (target > 0) proto.isCorrect = false;
        }
        proto.sources = [source];

        dbo.collection(RESOURCES_COL).findOne({itemId: itemId, price: proto.price, realm: realm}, function (err, found) {
            if (err) throw err;
            if (found) {
                dbo.collection(RESOURCES_COL).updateOne({ _id: found._id }, { $set: { amount: found.amount + 1, sources: (found.sources.push(proto.sources[0])) } }, function (err, res) {
                    if (err) console.log("Resource update ERR", err, found._id, itemName);
                    resolve(false);
                });
            } else {
                dbo.collection(RESOURCES_COL).insertOne(proto, function (err, res) {
                    if (err) console.log("Resource creation ERR", err, itemName);
                    resolve(true);
                });
            }
        });
    })
}