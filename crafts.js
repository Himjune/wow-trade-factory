
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
    },
    {
        _id: 31432,
        "spellId": 31432,
        "itemId": 24274,
        "itemName": "Руническая чародейская нить",
        "variants": [
            {
                "title": "маной",
                "reagents": [
                    {
                        "itemId": 22457,
                        "itemName": "Изначальная мана",
                        "source": "auction",
                        "price": 0,
                        "amount": 10
                    },
                    {
                        "itemId": 23572,
                        "itemName": "Изначальная пустота",
                        "source": "auction",
                        "price": 0,
                        "amount": 1
                    },
                    {
                        "itemId": 14341,
                        "itemName": "Руническая нить",
                        "source": "trader",
                        "price": 0.4250,
                        "amount": 1
                    }
                ]
            },
            {
                "title": "частицами",
                "reagents": [
                    {
                        "itemId": 22576,
                        "itemName": "Частица маны",
                        "source": "auction",
                        "price": 0,
                        "amount": 100
                    },
                    {
                        "itemId": 23572,
                        "itemName": "Изначальная пустота",
                        "source": "auction",
                        "price": 0,
                        "amount": 1
                    },
                    {
                        "itemId": 14341,
                        "itemName": "Руническая нить",
                        "source": "trader",
                        "price": 0.4250,
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