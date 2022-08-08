function getParentByClassName(element, className) {
    let threshold = 10;
    while (!element.classList.contains(className) && threshold > 0) {
        element = element.parentNode;
        threshold--;
    }
    return element;
} 

var crafts = [];
var aucDump = [];

const AUC_FEE_PERCENT = (5) / 100;

const craftPlateTEmplate = `
    <div id="craftPlate-{craft-id}-{craft-variant}" class="craft-plate">
        <h2>{craft-name}</h2>

        <div class="craft-plate-inputs">
            gold <input class="craft-plate-input craft-plate-gold-input" type="number" placeholder="gold" value="1" step="0.01"/>
            amount <input class="craft-plate-input craft-plate-amount-input" type="number" placeholder="amount" value="1"/>
            sell <input class="craft-plate-input craft-plate-sell-input" type="number" placeholder="sell" value="0" step="0.01"/>
        </div>

        <div class="craft-plate-price">
            <div class="craft-plate-price-line craft-plate-price-line-min-craft">
                <div class="craft-plate-price-title">Мин.Крафт</div>
                <div class="craft-place-price-val craft-place-price-val-n neutral-value">0</div>
                <div class="craft-place-price-val craft-place-price-val-h horde-value">0</div>
                <div class="craft-place-price-val craft-place-price-val-a aliance-value">0</div>
            </div>
            <div class="craft-plate-price-line craft-plate-price-line-max-craft">
                <div class="craft-plate-price-title">Макс.Крафт</div>
                <div class="craft-place-price-val craft-place-price-val-n neutral-value">0</div>
                <div class="craft-place-price-val craft-place-price-val-h horde-value">0</div>
                <div class="craft-place-price-val craft-place-price-val-a aliance-value">0</div>
            </div>
            <div class="craft-plate-price-line craft-plate-price-line-min-sell">
                <div class="craft-plate-price-title">Мин.Продажи</div>
                <div class="craft-place-price-val craft-place-price-val-n neutral-value">0</div>
                <div class="craft-place-price-val craft-place-price-val-h horde-value">0</div>
                <div class="craft-place-price-val craft-place-price-val-a aliance-value">0</div>
            </div>
            <div class="craft-plate-price-line craft-plate-price-line-5cent-sell">
                <div class="craft-plate-price-title">5%Прибыли</div>
                <div class="craft-place-price-val craft-place-price-val-n neutral-value">0</div>
                <div class="craft-place-price-val craft-place-price-val-h horde-value">0</div>
                <div class="craft-place-price-val craft-place-price-val-a aliance-value">0</div>
            </div>
            <div class="craft-plate-price-line craft-plate-price-line-market-sell">
                <div class="craft-plate-price-title">Рын.Продажа</div>
                <div class="craft-place-price-val craft-place-price-val-n neutral-value">0</div>
                <div class="craft-place-price-val craft-place-price-val-h horde-value">0</div>
                <div class="craft-place-price-val craft-place-price-val-a aliance-value">0</div>
            </div>
            <div class="craft-plate-price-line craft-plate-price-line-market-cent">
                <div class="craft-plate-price-title">Рын.Процент</div>
                <div class="craft-place-price-val craft-place-price-val-n neutral-value">0</div>
                <div class="craft-place-price-val craft-place-price-val-h horde-value">0</div>
                <div class="craft-place-price-val craft-place-price-val-a aliance-value">0</div>
            </div>
        </div>
        <div class="reagents-block">
            <h4>Реагенты</h4>
        </div>
        <div class="craft-plate-lore">Таким образом из вложенных <span class="craft-plate-lore-gold">0</span>g получится
        <span class="craft-plate-lore-amount">0</span>шт. с чистой прибылью <span class="craft-plate-lore-profit">0g(0%)</span>
        или <span class="craft-plate-lore-5cent">0g(5%)</span>
        </div>
    </div>
`
function createCraftPlate(craft, variantIdx) {
    const craftsPanel = document.getElementById("craftsPanel");
    craftsPanel.insertAdjacentHTML("beforeend",
        craftPlateTEmplate.replace(/{craft-id}/g, craft._id)
                            .replace(/{craft-variant}/g, variantIdx)
                            .replace(/{craft-name}/g, craft.itemName+'['+craft.variants[variantIdx].title+']')
    );

    const plate = document.getElementById("craftPlate-"+craft._id+'-'+variantIdx);

    plate.querySelector('.craft-plate-amount-input').addEventListener('change', (e) => {
        const parentPlate = getParentByClassName(e.target, 'craft-plate');
        evaluteByAmount(parentPlate.id.split('-')[1], parentPlate.id.split('-')[2], parseInt(e.target.value));
    })
    plate.querySelector('.craft-plate-gold-input').addEventListener('change', (e) => {
        const parentPlate = getParentByClassName(e.target, 'craft-plate');
        evaluteByGold(parentPlate.id.split('-')[1], parentPlate.id.split('-')[2], parseFloat(e.target.value));
    })
    plate.querySelector('.craft-plate-sell-input').addEventListener('change', (e) => {
        const parentPlate = getParentByClassName(e.target, 'craft-plate');
        evaluteBySell(parentPlate.id.split('-')[1], parentPlate.id.split('-')[2], parseFloat(e.target.value));
    })
}


const reagentLineTemplate = `
    <div class="reagent-line">
        <h5 class="reagent-line-name">{reagent-name}</h5>
        <div class="reagent-line-val reagent-line-val-n neutral-value">{reagent-n-val}</div>
        <div class="reagent-line-val reagent-line-val-h horde-value">{reagent-h-val}</div>
        <div class="reagent-line-val reagent-line-val-a aliance-value">{reagent-a-val}</div>
    </div>
`
function countStacksLine (amount, stack=20) {
    let stacks = Math.floor(amount/stack);
    return "("+stacks+'s'+(amount-stacks*stack)+'p)'
}
function insertReagents(plateElement, reagentsArr) {
    const reagentsBlock = plateElement.querySelector(".reagents-block");
    reagentsBlock.innerHTML = "<h4>Реагенты</h4>";

    reagentsArr.forEach(reagent => {
        reagentsBlock.insertAdjacentHTML("beforeend", reagentLineTemplate.replace(/{reagent-name}/g, reagent.itemName)
            .replace(/{reagent-n-val}/g, reagent.aquired+countStacksLine(reagent.aquired)+'/'+reagent.sum.toFixed(2)+'g')
            .replace(/{reagent-h-val}/g, reagent.hordeAquired+countStacksLine(reagent.hordeAquired)+'/'+reagent.hordeSum.toFixed(2)+'g')
            .replace(/{reagent-a-val}/g, reagent.alianceAquired+countStacksLine(reagent.alianceAquired)+'/'+reagent.alianceSum.toFixed(2)+'g')                                                                       
        );
    });
}

function insertValsInCraftLine(lineElement, neutralVal, hordeVal, alianceVal) {
    const valElements = lineElement.querySelectorAll('.craft-place-price-val');
    valElements[0].innerText = neutralVal.toFixed(2);
    valElements[1].innerText = hordeVal.toFixed(2);
    valElements[2].innerText = alianceVal.toFixed(2);
}

function insertCraftPlateVals(craftObj, variantIdx, neutral, horde, aliance) {
    const plateElement = document.getElementById("craftPlate-"+craftObj.spellId+'-'+variantIdx);
    const aucDumpItem = aucDump.find((item) => { return item.itemId == craftObj.itemId })
    
    const minCraftLine = plateElement.querySelector('.craft-plate-price-line-min-craft');
    insertValsInCraftLine(minCraftLine, neutral.minPrice, horde.minPrice, aliance.minPrice);
    
    const maxCraftLine = plateElement.querySelector('.craft-plate-price-line-max-craft');
    insertValsInCraftLine(maxCraftLine, neutral.maxPrice, horde.maxPrice, aliance.maxPrice);

    const neutralMinSell = neutral.maxPrice*(1+AUC_FEE_PERCENT);
    const hordeMinSell = horde.maxPrice*(1+AUC_FEE_PERCENT);
    const alianceMinSell = aliance.maxPrice*(1+AUC_FEE_PERCENT);

    const minSellLine = plateElement.querySelector('.craft-plate-price-line-min-sell');
    insertValsInCraftLine(minSellLine, neutralMinSell, hordeMinSell, alianceMinSell);

    const neutral5centSell = neutral.maxPrice*(1+AUC_FEE_PERCENT+0.05);
    const horde5centSell = horde.maxPrice*(1+AUC_FEE_PERCENT+0.05);
    const aliance5centSell = aliance.maxPrice*(1+AUC_FEE_PERCENT+0.05);

    const centSellLine = plateElement.querySelector('.craft-plate-price-line-5cent-sell');
    insertValsInCraftLine(centSellLine, neutral5centSell, horde5centSell, aliance5centSell);

    const hordeMarketSell = aucDumpItem.priceCounters.find((priceCounter) => { return priceCounter.faction == "H" }).price;
    const alianceMarketSell = aucDumpItem.priceCounters.find((priceCounter) => { return priceCounter.faction == "A" }).price;
    const neutralMarketSell = Math.max(hordeMarketSell, alianceMarketSell);

    const marketSellLine = plateElement.querySelector('.craft-plate-price-line-market-sell');
    insertValsInCraftLine(marketSellLine, neutralMarketSell, hordeMarketSell, alianceMarketSell);
    
    const marketCentLine = plateElement.querySelector('.craft-plate-price-line-market-cent');
    insertValsInCraftLine(marketCentLine, (neutralMarketSell - neutralMinSell) / neutralMinSell * 100,
        (hordeMarketSell - neutralMinSell) / neutralMinSell * 100,
        (alianceMarketSell - neutralMinSell) / neutralMinSell * 100
    );

    insertReagents(plateElement, neutral.reagents);

    plateElement.querySelector('.craft-plate-gold-input').value = neutral.sum.toFixed(2);
    plateElement.querySelector('.craft-plate-amount-input').value = neutral.done;

    plateElement.querySelector('.craft-plate-lore-gold').innerText = neutral.sum.toFixed(2);
    plateElement.querySelector('.craft-plate-lore-amount').innerText = neutral.done;

    // <span class="craft-plate-lore-profit">0g(0%)</span>
    const sellSum = neutralMarketSell*neutral.done;
    plateElement.querySelector('.craft-plate-lore-profit').innerText = (sellSum-neutral.sum).toFixed(2)+"g"+
                                                                        "("+((sellSum-neutral.sum) / neutral.sum *100 -5 ).toFixed(2)+"%)";

    // <span class="craft-plate-lore-5cent">0g(5%)</span>
    const fCentSellSum = neutral5centSell*neutral.done;
    plateElement.querySelector('.craft-plate-lore-5cent').innerText = (fCentSellSum-neutral.sum).toFixed(2)+"g"+
                                                                        "("+((fCentSellSum-neutral.sum) / neutral.sum *100 -5 ).toFixed(2)+"%)";
}

// ToDo: probably we want to take maxe price of one last reagent and use it as base for whole last item
function aquireReagent(reagentId, target, filter) {
    const aucDumpReagentObj = aucDump.find((obj) => { return obj.itemId == reagentId });

    let res = {
        itemId: reagentId,
        itemName: aucDumpReagentObj.itemName,
        filter: filter,
        isComplete: true,
        aquired: 0,
        sum: 0,
        hordeAquired: 0,
        hordeSum: 0,
        alianceAquired: 0,
        alianceSum: 0
    }
    let reagentPrices = [];

    if (!filter) reagentPrices = aucDumpReagentObj.priceCounters;
    else reagentPrices = aucDumpReagentObj.priceCounters.filter((priceCounter) => { return priceCounter.faction == filter; })
 
    let idx = 0;
    while (target > 0 && idx < reagentPrices.length) {
        let taken = Math.min(target, reagentPrices[idx].count);
        target -= taken;

        res.aquired += taken;
        res.sum += taken*reagentPrices[idx].price;

        if (reagentPrices[idx].faction == "H") {
            res.hordeAquired += taken;
            res.hordeSum += taken*reagentPrices[idx].price;
        } else {
            res.alianceAquired += taken;
            res.alianceSum += taken*reagentPrices[idx].price;
        }

        idx++;
    }
    if (target>0) { res.isComplete = false; }

    //console.log("aquireReagent", reagentId, res);
    return res;
}

function aquireReagentsForCraft(reagentsArr, amount, filter) {
    let res = {
        isComplete: true,
        aquired: amount,
        sum: 0,
        reagents: []
    }

    reagentsArr.forEach(reagent => {
        if (reagent.source == 'trader') {
            if (res.isComplete) res.aquired = amount;
            res.sum += amount * reagent.price*reagent.amount; // Probably want ggsscc everywhere
            res.reagents.push({
                itemName: reagent.itemName,
                aquired: amount*reagent.amount,
                sum: amount*reagent.price*reagent.amount,
                hordeAquired: amount*reagent.amount,
                hordeSum: amount*reagent.price*reagent.amount,
                alianceAquired: amount*reagent.amount,
                alianceSum: amount*reagent.price*reagent.amount
            });
        } else if (reagent.source == 'auction') {
            const aquiredReagent = aquireReagent(reagent.itemId, amount*reagent.amount, filter);

            res.sum += aquiredReagent.sum;
            if (!aquiredReagent.isComplete) {
                res.isComplete = false;
                res.aquired = Math.floor(aquiredReagent.aquired / reagent.amount);
            }
            res.reagents.push(aquiredReagent);
        }
    });

    //console.log("aquireReagentsForCraft", reagentsArr, res);
    return res;
}

function getCraftEvalutionPercise(variant, amount, filter = false) {
    let res = {
        isComplete: true,
        done: amount,
        minPrice: 0,
        maxPrice: 0,
        sum: 0,
        reagents: []
    }

    const oneShot = aquireReagentsForCraft(variant.reagents, 1, filter);
    res.minPrice = oneShot.sum;
    res.maxPrice = oneShot.sum;
    res.sum = oneShot.sum;
    res.aquired = oneShot.aquired;
    res.reagents = oneShot.reagents;
    if (!oneShot.isComplete) {
        res.isComplete = false;
        res.done = oneShot.aquired;
    }

    if (amount>1) {
        const befFullShot = aquireReagentsForCraft(variant.reagents, amount-1, filter);
        const fullShot = aquireReagentsForCraft(variant.reagents, amount, filter);
        res.maxPrice = fullShot.sum-befFullShot.sum;

        res.sum = fullShot.sum;
        res.reagents = fullShot.reagents;
        if (!fullShot.isComplete) {
            res.isComplete = false; 
            res.done = fullShot.aquired; 
        }                
    }

    //console.log("getCraftEvalutionPercise", variant, res);
    return res;
}

function evaluteByAmount(craftId, variantIdx, amount) {
    const craft = crafts.find((c) => {return c.spellId == craftId});

    const neutral = getCraftEvalutionPercise(craft.variants[variantIdx], amount);
    const horde = getCraftEvalutionPercise(craft.variants[variantIdx], amount, "H");
    const aliance = getCraftEvalutionPercise(craft.variants[variantIdx], amount, "A");

    console.log("n", neutral, "h", horde, "a", aliance);
    insertCraftPlateVals(craft, variantIdx, neutral, horde, aliance);
}

function evaluteByGold(craftId, variantIdx, gold) {
    console.log("evaluteByGold", craftId, gold);
    const craft = crafts.find((c) => {return c.spellId == craftId});

    let pred = getCraftEvalutionPercise(craft.variants[variantIdx], 1);

    let left = 1;
    let right = Math.floor(gold / pred.maxPrice);

    while (right-left > 1 && pred.isComplete) {
        let center = Math.floor((left+right)/2);
        pred = getCraftEvalutionPercise(craft.variants[variantIdx], center);
        if (pred.sum < gold) left = center;
        else right = center;
    }
    pred = getCraftEvalutionPercise(craft.variants[variantIdx], right);
    let amount = (pred.sum < gold) ? (right) : (right-1);

    const neutral = getCraftEvalutionPercise(craft.variants[variantIdx], amount);
    const horde = getCraftEvalutionPercise(craft.variants[variantIdx], amount, "H");
    const aliance = getCraftEvalutionPercise(craft.variants[variantIdx], amount, "A");

    console.log("n", neutral, "h", horde, "a", aliance);
    insertCraftPlateVals(craft, variantIdx, neutral, horde, aliance);
}

function evaluteBySell(craftId, variantIdx, sell) {
    console.log("evaluteByGold", craftId, sell);
    const craft = crafts.find((c) => {return c.spellId == craftId});
    const tarRatio = (1+ AUC_FEE_PERCENT+0.05);

    let right = 2;
    let pred = getCraftEvalutionPercise(craft.variants[variantIdx], right);
    while (pred.maxPrice*tarRatio < sell && pred.isComplete) {
        pred = getCraftEvalutionPercise(craft.variants[variantIdx], (right = right*2));
    }
    let left = right/2;

    while (right-left > 1 && pred.isComplete) {
        let center = Math.floor((left+right)/2);
        pred = getCraftEvalutionPercise(craft.variants[variantIdx], center);
        if (pred.maxPrice*tarRatio < sell) left = center;
        else right = center;
        console.log("whilePred", left, center, right, pred);
    }
    pred = getCraftEvalutionPercise(craft.variants[variantIdx], right);
    let amount = (pred.maxPrice*tarRatio < sell) ? (right) : (right-1);

    const neutral = getCraftEvalutionPercise(craft.variants[variantIdx], amount);
    const horde = getCraftEvalutionPercise(craft.variants[variantIdx], amount, "H");
    const aliance = getCraftEvalutionPercise(craft.variants[variantIdx], amount, "A");

    console.log("n", neutral, "h", horde, "a", aliance);
    insertCraftPlateVals(craft, variantIdx, neutral, horde, aliance);
}

function getCrafts() {
    fetch("/api/crafts").then((response) => {
        return response.json()
    }).then ((data) => {
        console.log(data);
        crafts = data;
        document.querySelector('#craftsPanel').innerHTML = '';
        crafts.forEach(craft => {
            for (let variantIdx = 0; variantIdx < craft.variants.length; variantIdx++) {
                createCraftPlate(craft, variantIdx);
                evaluteByAmount(craft._id, variantIdx, 1);
            }
        });
    })
}

function getAucDump() {
    return new Promise ((resolve, reject) => {        
        fetch("/api/auc_dump").then((response) => {
            return response.json()
        }).then ((data) => {
            aucDump = data;
            console.log("aucDump", aucDump);
            resolve(data)
        })
    })
}

window.onload = () => {
    getAucDump().then((data) => {
        getCrafts();
    })
}