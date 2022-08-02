
var MongoClient = require('mongodb').MongoClient;

var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
    dbo = resolve;
});

const addResource = require('./resource').addResource;

const hordeAuctions = ["Аукционный дом Орды"];
const alianceAuctions = ["Аукционный дом Альянса"]

async function handleAuctionLetter(mailObj) {
    let faction = "horde";
    if (alianceAuctions.includes(mailObj.sender)) faction = "aliance";

    let isNewResource = false;
    if (mailObj.invoiceType == "buyer") {
        isNewResource = await addResource(mailObj.itemName, mailObj.buyout, mailObj.amount, mailObj.crealm,
            [{ type: "auction", info: mailObj.sender }]);
    }

    return isNewResource;
}

exports.parseMail = async (wtfacMailTrack) => {
    let mailIds = Object.keys(wtfacMailTrack.mails);
    let dup = 0, crt = 0;

    let idx = 0;
    while (idx < mailIds.length) {
        const mailId = mailIds[idx];
        let mailObj = wtfacMailTrack.mails[mailId];
        let insRes = false;
        try {
            insRes = await dbo.collection("mails").insertOne(mailObj);
            crt++;
            if (mailObj.invoiceType && (hordeAuctions.includes(mailObj.sender) || alianceAuctions.includes(mailObj.sender))) {
                await handleAuctionLetter(mailObj);
            }
        } catch (error) {
            dup++;
        }

        idx++;
    };

    console.log('Mail parsed (C/D/A):', crt, dup, crt + dup);
}