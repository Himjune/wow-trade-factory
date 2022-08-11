let dbo = null;
require('./database.js').get_dbo.then((resolve) => {
    dbo = resolve;
});

exports.parseTracker = (trackerArray, collection) => {
    return Promise.all(
        trackerArray.map((trackerObj) => {
            return new Promise(async (resolve, reject) => {
                try {
                    await dbo.collection(collection).insertOne(trackerObj);
                    resolve(trackerObj);
                } catch (error) {
                    resolve(null);
                }
            })
        })
    );
}

exports.trackerAsyncParseSyncCB = async (parsedObjects, collection, callback) => {
    return new Promise((resolve, reject) => {
        trackerArray = Object.values(parsedObjects);
        exports.parseTracker(trackerArray, collection).then(async (parsedArr) => {
            let idx = 0;
            const result = {
                created: 0,
                duplicate: 0,
                all: 0,
                parsedArr: parsedArr
            }
    
            while (idx < parsedArr.length) {
                const trackedObj = parsedArr[idx];
                if (trackedObj) {
                    await callback(trackedObj, idx, parsedArr);
                    result.created++;
                } else result.duplicate++;
                idx++;
            }
    
            result.all = idx;
            resolve(result);
        })
    })
}