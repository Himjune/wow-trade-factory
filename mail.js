const MAIL_TRACKER_COL = "mailTracker";
var MongoClient = require('mongodb').MongoClient;

let dbo = null;
require('./database.js').get_dbo.then((resolve) => {
    dbo = resolve;
});
const {trackerAsyncParseSyncCB, parseTracker} = require('./tracker');

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
    const trackResult = await trackerAsyncParseSyncCB(wtfacMailTrack.mails, MAIL_TRACKER_COL,
        async (mailObj, idx, arr) => {
            console.log("tracked mail", mailObj.subject);
            if (mailObj.invoiceType && (hordeAuctions.includes(mailObj.sender) || alianceAuctions.includes(mailObj.sender))) {
                await handleAuctionLetter(mailObj);
            }
        }
    );
    console.log("Mail parsed (C/D/A)", trackResult.created, trackResult.duplicate, trackResult.all);
}