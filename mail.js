
var MongoClient = require('mongodb').MongoClient;

var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
  dbo = resolve;
});

exports.parseMail = (wtfacMailTrack) => {
    let mailIds = Object.keys(wtfacMailTrack.mails);

    mailIds.forEach(mailId => {
        let mailObj = wtfacMailTrack.mails[mailId];
        dbo.collection("mails").insertOne(mailObj, function(err, res) {
            if (err) console.log('mail duplicate ' + mailId);
            else {
                console.log('mail saved ', mailId, mailObj);
            }
        });
    });
}