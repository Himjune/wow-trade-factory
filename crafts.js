
const CRAFTS_COL = "crafts";
const CRAFT_TRACKER_COL = "craftTracker";

const BASIC_CRAFTS = [
    {
        _id: 25129,
        "spellId": 25129,
        "itemId": 20749,
        "defaultAmount": 60,
        "itemName": "Блестящее волшебное масло",
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
    },
    {
        _id: 25130,
        "spellId": 25130,
        "itemId": 20748,
        "defaultAmount": 60,
        "itemName": "Блестящее масло маны",
        "reagents": [
            {
                "itemId": 14344,
                "itemName": "Большой сверкающий осколок",
                "source": "auction",
                "price": 0,
                "amount": 2
            },
            {
                "itemId": 8831,
                "itemName": "Лиловый лотос",
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
    },
    {
        _id: 31432,
        "spellId": 31432,
        "itemId": 24274,
        "defaultAmount": 10,
        "itemName": "Руническая чародейская нить",
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
        _id: 31433,
        "spellId": 31433,
        "itemId": 24276,
        "defaultAmount": 10,
        "itemName": "Золотая чародейская нить",
        "reagents": [
            {
                "itemId": 21886,
                "itemName": "Изначальная жизнь",
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
    }
]

let dbo = null;
require('./database.js').get_dbo.then((resolve) => {
    dbo = resolve;

    BASIC_CRAFTS.forEach(craft => {
        dbo.collection(CRAFTS_COL).updateOne({_id: craft._id}, {$set: craft}, { upsert: true } );
    });
});

const {trackerAsyncParseSyncCB, parseTracker} = require('./tracker');

exports.getCrafts = () => {
    return new Promise((resolve, reject) => {
        dbo.collection(CRAFTS_COL).find({}).sort( { "itemName": 1 } )
        .toArray(function (err, result) {
            if (err) throw err;
            resolve(result);
        });
    });
}

exports.parseCraftTracks = async (wtfacCraftTrack) => {
    const trackResult = await trackerAsyncParseSyncCB(wtfacCraftTrack.crafts, CRAFT_TRACKER_COL,
        async (craftTrackingObj, idx, arr) => {
            console.log("tracked craft", craftTrackingObj.spellId);
            await dbo.collection(CRAFTS_COL).findOne({ _id: craftTrackingObj.spellId }, function(err, result) {
                if (result) {
                    let proto = {

                    }
                }
            });
        }
    );
    console.log("parseCraftTracks (C/D/A)", trackResult.created, trackResult.duplicate, trackResult.all);
}