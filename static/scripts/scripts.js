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
    <div id="craftPlate-{craft-id}" class="craft-plate">
        <h2>{craft-name}</h2>

        <div class="craft-plate-inputs">
            gold <input class="craft-plate-input craft-plate-gold-input" type="number" placeholder="gold" value="1"/>
            amount <input class="craft-plate-input craft-plate-amount-input" type="number" placeholder="amount" value="1"/>
            sell <input class="craft-plate-input craft-plate-sell-input" type="number" placeholder="sell" value="0"/>
        </div>

        <div class="craft-plate-price">
            <div class="craft-plate-price-line craft-plate-price-line-min-craft">
                <div class="craft-plate-price-title">Мин.Крафт</div>
                <div class="craft-place-price-val craft-place-price-val-n">0</div>
                <div class="craft-place-price-val craft-place-price-val-h">0</div>
                <div class="craft-place-price-val craft-place-price-val-a">0</div>
            </div>
            <div class="craft-plate-price-line craft-plate-price-line-max-craft">
                <div class="craft-plate-price-title">Макс.Крафт</div>
                <div class="craft-place-price-val craft-place-price-val-n">0</div>
                <div class="craft-place-price-val craft-place-price-val-h">0</div>
                <div class="craft-place-price-val craft-place-price-val-a">0</div>
            </div>
            <div class="craft-plate-price-line craft-plate-price-line-min-sell">
                <div class="craft-plate-price-title">Мин.Продажи</div>
                <div class="craft-place-price-val craft-place-price-val-n">0</div>
                <div class="craft-place-price-val craft-place-price-val-h">0</div>
                <div class="craft-place-price-val craft-place-price-val-a">0</div>
            </div>
            <div class="craft-plate-price-line craft-plate-price-line-5cent-sell">
                <div class="craft-plate-price-title">5%Прибыли</div>
                <div class="craft-place-price-val craft-place-price-val-n">0</div>
                <div class="craft-place-price-val craft-place-price-val-h">0</div>
                <div class="craft-place-price-val craft-place-price-val-a">0</div>
            </div>
            <div class="craft-plate-price-line craft-plate-price-line-market-sell">
                <div class="craft-plate-price-title">Рын.Продажа</div>
                <div class="craft-place-price-val craft-place-price-val-n">0</div>
                <div class="craft-place-price-val craft-place-price-val-h">0</div>
                <div class="craft-place-price-val craft-place-price-val-a">0</div>
            </div>
            <div class="craft-plate-price-line craft-plate-price-line-market-cent">
                <div class="craft-plate-price-title">Рын.Процент</div>
                <div class="craft-place-price-val craft-place-price-val-n">0</div>
                <div class="craft-place-price-val craft-place-price-val-h">0</div>
                <div class="craft-place-price-val craft-place-price-val-a">0</div>
            </div>
        </div>
        <div class="craft-plate-lore">Таким образом из вложенных <span class="craft-plate-lore-gold">0</span>g получится
        <span class="craft-plate-lore-amount">0</span>шт. с чистой прибылью <span class="craft-plate-lore-profit">0g(0%)</span>
        или <span class="craft-plate-lore-5cent">0g(5%)</span>
        </div>
    </div>
`
function createCraftPlate(craft) {
    const craftsPanel = document.getElementById("craftsPanel");
    craftsPanel.insertAdjacentHTML("beforeend",
        craftPlateTEmplate.replace(/{craft-id}/g, craft._id)
                            .replace(/{craft-name}/g, craft.itemName)
    );

    const plate = document.getElementById("craftPlate-"+craft._id);

    plate.querySelector('.craft-plate-amount-input').addEventListener('change', (e) => {
        const parentPlate = getParentByClassName(e.target, 'craft-plate');
        evaluteByAmount(parentPlate.id.split('-')[1], parseInt(e.target.value));
    })
}
function insertValsInCraftLine(lineElement, neutralVal, hordeVal, alianceVal) {
    const valElements = lineElement.querySelectorAll('.craft-place-price-val');
    valElements[0].innerText = neutralVal.toFixed(2);
    valElements[1].innerText = hordeVal.toFixed(2);
    valElements[2].innerText = alianceVal.toFixed(2);
}

function insertCraftPlateVals(craftObj, neutral, horde, aliance) {
    const plateElement = document.getElementById("craftPlate-"+craftObj.spellId);
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

    const neutralMarketSell = aucDumpItem.priceCounters[0].price;
    const hordeMarketSell = aucDumpItem.priceCounters.find((priceCounter) => { return priceCounter.faction == "H" }).price;
    const alianceMarketSell = aucDumpItem.priceCounters.find((priceCounter) => { return priceCounter.faction == "A" }).price;

    const marketSellLine = plateElement.querySelector('.craft-plate-price-line-market-sell');
    insertValsInCraftLine(marketSellLine, neutralMarketSell, hordeMarketSell, alianceMarketSell);
    
    const marketCentLine = plateElement.querySelector('.craft-plate-price-line-market-cent');
    insertValsInCraftLine(marketCentLine, (neutralMarketSell - neutralMinSell) / neutralMinSell * 100,
        (hordeMarketSell - neutralMinSell) / neutralMinSell * 100,
        (alianceMarketSell - neutralMinSell) / neutralMinSell * 100
    );

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
    let res = {
        isComplete: true,
        aquired: 0,
        sum: 0
    }
    
    const aucDumpReagentObj = aucDump.find((obj) => { return obj.itemId == reagentId });
    let reagentPrices = [];

    if (!filter) reagentPrices = aucDumpReagentObj.priceCounters;
    else reagentPrices = aucDumpReagentObj.priceCounters.filter((priceCounter) => { return priceCounter.faction == filter; })
 
    let idx = 0;
    while (target > 0 && idx < reagentPrices.length) {
        let taken = Math.min(target, reagentPrices[idx].count);
        target -= taken;

        res.aquired += taken;
        res.sum += taken*reagentPrices[idx].price;

        console.log("tar", target, "tak", taken, reagentPrices[idx]);
        idx++;
    }
    if (target>0) { res.isComplete = false; }

    console.log("aquireReagent", reagentId, res);
    return res;
}

function aquireReagentsForCraft(reagentsArr, amount, filter) {
    let res = {
        isComplete: true,
        aquired: amount,
        sum: 0
    }

    reagentsArr.forEach(reagent => {
        if (reagent.source == 'trader') {
            if (res.isComplete) res.aquired = amount;
            res.sum += amount * reagent.price*reagent.amount; // Probably want ggsscc everywhere
        } else if (reagent.source == 'auction') {
            const aquiredReagent = aquireReagent(reagent.itemId, amount*reagent.amount, filter);

            res.sum += aquiredReagent.sum;
            if (!aquiredReagent.isComplete) {
                res.isComplete = false;
                res.aquired = Math.floor(aquiredReagent.aquired / reagent.amount);
            }
        }
    });

    console.log("aquireReagentsForCraft", reagentsArr, res);
    return res;
}

function getCraftEvalutionPercise(variant, amount, filter = false) {
    let res = {
        isComplete: true,
        done: amount,
        minPrice: 0,
        maxPrice: 0,
        sum: 0
    }

    const oneShot = aquireReagentsForCraft(variant.reagents, 1, filter);
    res.minPrice = oneShot.sum;
    res.maxPrice = oneShot.sum;
    res.sum = oneShot.sum;
    res.aquired = oneShot.aquired;
    if (!oneShot.isComplete) {
        res.isComplete = false;
        res.done = oneShot.aquired;
    }

    if (amount>1) {
        const befFullShot = aquireReagentsForCraft(variant.reagents, amount-1, filter);
        const fullShot = aquireReagentsForCraft(variant.reagents, amount, filter);
        res.maxPrice = fullShot.sum-befFullShot.sum;

        res.sum = fullShot.sum;
        if (!fullShot.isComplete) {
            res.isComplete = false; 
            res.done = fullShot.aquired; 
        }                
    }

    //console.log("getCraftEvalutionPercise", variant, res);
    return res;
}

function evaluteByAmount(craftId, amount) {
    const craft = crafts.find((c) => {return c.spellId == craftId});

    const neutral = getCraftEvalutionPercise(craft.variants[0], amount);
    const horde = getCraftEvalutionPercise(craft.variants[0], amount, "H");
    const aliance = getCraftEvalutionPercise(craft.variants[0], amount, "A");

    console.log("n", neutral, "h", horde, "a", aliance);
    insertCraftPlateVals(craft, neutral, horde, aliance);
}

function getCrafts() {
    fetch("/api/crafts").then((response) => {
        return response.json()
    }).then ((data) => {
        console.log(data);
        crafts = data;
        crafts.forEach(craft => {
            createCraftPlate(craft);
            evaluteByAmount(craft._id, 1);
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