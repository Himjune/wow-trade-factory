
var MongoClient = require('mongodb').MongoClient;

var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
  dbo = resolve;
});

exports.parseMail = (wtfacMailTrack) => {
    let mailIds = Object.keys(wtfacMailTrack.mails);
    let dup, crt = 0;

    mailIds.forEach(mailId => {
        let mailObj = wtfacMailTrack.mails[mailId];
        dbo.collection("mails").insertOne(mailObj, function(err, res) {
            if (err) dup++;
            else {
                crt++;
            }
        });
    });

    console.log('Mail parsed (C/D):', crt, dup);
}