const dbUrl = "mongodb://localhost:27017/wtfacdb";
var MongoClient = require('mongodb').MongoClient;
var dbo = null;

// ToDo: probably should handle connection race but gonna try avoid using dbo before connection
exports.get_dbo = new Promise((resolve, reject) => {
    MongoClient.connect(dbUrl, function(err, db) {
        if (err) reject(err);  
        dbo = db.db("wtfacdb");
        console.log("wtfacdb Database created(connected)!");
        
        dbo.createCollection("stats", function(err, res) {
            if (err) console.log("stats Collection err! "+err);
            else console.log("stats Collection created!");
        });

        dbo.createCollection("mails", function(err, res) {
            if (err) console.log("mails Collection err! "+err);
            else console.log("mails Collection created!");
        });

        resolve(dbo);
    });
}); 
