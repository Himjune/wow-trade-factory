
const CRAFTS_COL = "crafts";
const BASIC_CRAFTS = [
    {
        _id: 25129,
        "spellId": 25129,
        "itemId": 20749,
        "itemName": "Блестящее волшебное масло",
        "variants": [
            {
                "title": "full",
                "reagents": [
                    {
                        "itemId": 14344,
                        "itemName": "Большой сверкающий осколок",
                        "source": "auction",
                        "price": 0,
                        "amount": 2
                    },
                    {
                        "itemId": 4625,
                        "itemName": "Огнецвет",
                        "source": "auction",
                        "price": 0,
                        "amount": 3
                    },
                    {
                        "itemId": 18256,
                        "itemName": "Укрепленная колба",
                        "source": "trader",
                        "price": 0.32,
                        "amount": 1
                    }
                ]
            }
        ]
    }
]

var dbo = null;
require('./database.js').get_dbo.then((resolve) => {
    dbo = resolve;

    BASIC_CRAFTS.forEach(craft => {
        dbo.collection(CRAFTS_COL).updateOne({_id: craft._id}, {$set: craft}, { upsert: true } );
    });
});

exports.getCrafts = () => {
    return new Promise((resolve, reject) => {
        dbo.collection(CRAFTS_COL).find({}).toArray(function (err, result) {
            if (err) throw err;
            resolve(result);
        });
    });
}