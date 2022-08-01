
var MongoClient = require('mongodb').MongoClient;

var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
  dbo = resolve;
});

const addResource = require('./resource').addResource;

const hordeAuctions = ["Аукционный дом Орды"];
const alianceAuctions = ["Аукционный дом Альянса"]

function handleAuctionLetter(mailObj) {
    let faction = "horde";
    if (alianceAuctions.includes(mailObj.sender)) faction = "aliance";
    
    if (mailObj.invoiceType == "buyer") {
        addResource(mailObj.itemName, mailObj.buyout, mailObj.amount, mailObj.crealm,
            [{ type: "auction", info: mailObj.sender }]);
    }
}

exports.parseMail = (wtfacMailTrack) => {
    let mailIds = Object.keys(wtfacMailTrack.mails);
    let dup = 0, crt = 0;

    mailIds.forEach(mailId => {
        let mailObj = wtfacMailTrack.mails[mailId];
        dbo.collection("mails").insertOne(mailObj, function(err, res) {
            if (err) dup++;
            else {
                crt++;
                if (mailObj.invoiceType && (hordeAuctions.includes(mailObj.sender) || alianceAuctions.includes(mailObj.sender))) {
                    handleAuctionLetter(mailObj);
                }
            }
        });
    });

    console.log('Mail parsed (C/D/A):', crt, dup, crt+dup);
}