var crafts = [];
var aucDump = [];

const craftPlateTEmplate = `
    <div id="craftPlate-{craft-id}" class="craft-plate">
        <h2>{craft-name}</h2>

        <div class="craft-plate-inputs">
            gold <input class="craft-plate-input craft-plate-gold-input" type="number" placeholder="gold" value="1"/>
            amount <input class="craft-plate-input craft-plate-amount-input" type="number" placeholder="amount" value="1"/>
            sell <input class="craft-plate-input craft-plate-sell-input" type="number" placeholder="sell" value="0"/>
        </div>

        <div class="craft-plate-price">
            <div class="craft-plate-price-line">
                <div class="craft-plate-price-title">Мин.Крафт</div>
                <div class="craft-place-price-val craft-place-price-val-n">0</div>
                <div class="craft-place-price-val craft-place-price-val-h">0</div>
                <div class="craft-place-price-val craft-place-price-val-a">0</div>
            </div>
            <div class="craft-plate-price-line">
                <div class="craft-plate-price-title">Макс.Крафт</div>
                <div class="craft-place-price-val craft-place-price-val-n">0</div>
                <div class="craft-place-price-val craft-place-price-val-h">0</div>
                <div class="craft-place-price-val craft-place-price-val-a">0</div>
            </div>
            <div class="craft-plate-price-line">
                <div class="craft-plate-price-title">Мин.Продажи</div>
                <div class="craft-place-price-val craft-place-price-val-n">0</div>
                <div class="craft-place-price-val craft-place-price-val-h">0</div>
                <div class="craft-place-price-val craft-place-price-val-a">0</div>
            </div>
            <div class="craft-plate-price-line">
                <div class="craft-plate-price-title">5%Прибыли</div>
                <div class="craft-place-price-val craft-place-price-val-n">0</div>
                <div class="craft-place-price-val craft-place-price-val-h">0</div>
                <div class="craft-place-price-val craft-place-price-val-a">0</div>
            </div>
            <div class="craft-plate-price-line">
                <div class="craft-plate-price-title">Рын.Продажа</div>
                <div class="craft-place-price-val craft-place-price-val-n">0</div>
                <div class="craft-place-price-val craft-place-price-val-h">0</div>
                <div class="craft-place-price-val craft-place-price-val-a">0</div>
            </div>
        </div>
        <div class="craft-plate-lore">Таким образом из вложенных <span class="craft-plate-lore-gold>0</span>g получится
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

    let plate = document.getElementById("craftPlate-"+craft._id);
    plate.querySelector('.eve');
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
        done: amount, // ToDo: Should handle return of max available in notComplited case
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

    console.log("getCraftEvalutionPercise", variant, res);
    return res;
}

function evaluteByAmount(craftId, amount) {
    const craft = crafts.find((c) => {return c.spellId == craftId});

    const neutral = getCraftEvalutionPercise(craft.variants[0], amount);
    console.log("evaluteByAmount", craftId, amount, neutral);

    //const horde = getCraftEvalutionPercise(craft.variants[0], amount, "H");
    //const aliance = getCraftEvalutionPercise(craft.variants[0], amount, "A");
}

function getCrafts() {
    fetch("/api/crafts").then((response) => {
        return response.json()
    }).then ((data) => {
        console.log(data);
        crafts = data;
        crafts.forEach(craft => {
            createCraftPlate(craft);
            evaluteByAmount(craft._id, 600);
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