
var MongoClient = require('mongodb').MongoClient;

var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
  dbo = resolve;
});

const trackedAuctions = ["Аукционный дом Орды", "Аукционный дом Альянса"];

function handleAuctionLetter(mailObj) {
    
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
                if (mailObj.invoiceType && trackedAuctions.includes(mailObj.sender)) {
                    handleAuctionLetter(mailObj);
                }
            }
        });
    });

    console.log('Mail parsed (C/D/A):', crt, dup, crt+dup);
}