wtfacLastScan = 0;
wtfacAucDump = {}  -- default value until ADDON_LOADED
wtfacMailTrack = {}

CONST_QUERY_DELAY = 0.5;
                -- d*h*m*s      
CONST_DATA_SAVE = 1*24*60*60;

CONST_NEUTRAL_AUC_FEE = 0.15;

local curRealm = "";
local curPlayer = "";
local curFaction = "H";

local random = math.random
local function uuid()
    local template ='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    return string.gsub(template, '[xy]', function (c)
        local v = (c == 'x') and random(0, 0xf) or random(8, 0xb)
        return string.format('%x', v)
    end)
end


local wtfacTrackedItems = {
    20749, -- Блестящее волшебное масло
    14344, -- Большой сверкающий осколок
    4625 -- Огнецвет
};

local scanItemIdx = 0; -- 0 indicates no search in progress
local scanItemPage = 0;

function scanPreActions()
    SortAuctionItems("list", "buyout");
    if IsAuctionSortReversed("list", "buyout") then
        SortAuctionItems("list", "buyout");
    end
end

local CONST_RIM_PERCENT = (20) /100+1;
function parseUpdatedPage()
    if scanItemIdx < 1 then return; end
    batch,count = GetNumAuctionItems("list");
    print(batch,count);

    local isLastPage = (batch<50);

    local itemId = wtfacTrackedItems[scanItemIdx];
    local itemName, _, _, _, _, _, _, _, _, _, itemSellPrice = GetItemInfo(itemId);
    print("parseUpdatedPage", itemId, itemName);

    if batch > 0 then
        for itemIndex=1,batch do
            local name, texture, count, quality, canUse, level, levelColHeader, minBid,
            minIncrement, buyoutPrice, bidAmount, highBidder, bidderFullName, owner,
            ownerFullName, saleStatus, itemId, hasAllInfo = GetAuctionItemInfo("list", itemIndex);
            -- print(name.."("..itemId..") for "..buyoutPrice);

            local singlePrice = math.floor(buyoutPrice/count); -- one item price in ggsscc format
            local meaningfulPrice = math.floor((singlePrice+900)/1000)/10; -- floor((+900)/1000) rounds it up by 01s to ggs(drops scc) and /10 makes it gg.s format

            if buyoutPrice > 0 then
                
                if wtfacAucDump[itemId]["priceCounters"][curFaction .. meaningfulPrice] then
                    wtfacAucDump[itemId]["priceCounters"][curFaction .. meaningfulPrice]['count'] = wtfacAucDump[itemId]["priceCounters"][curFaction .. meaningfulPrice]['count'] + count;
                else
                    wtfacAucDump[itemId]["priceCounters"][curFaction .. meaningfulPrice] = {};
                    wtfacAucDump[itemId]["priceCounters"][curFaction .. meaningfulPrice]['price'] = meaningfulPrice;
                    wtfacAucDump[itemId]["priceCounters"][curFaction .. meaningfulPrice]['count'] = count;
                    wtfacAucDump[itemId]["priceCounters"][curFaction .. meaningfulPrice]['faction'] = curFaction;
                end

                if (singlePrice < wtfacAucDump[itemId]["stats"]["absMin"]) then
                    wtfacAucDump[itemId]["stats"]["absMin"] = singlePrice;

                    wtfacAucDump[itemId]["stats"]["centRim"] = (wtfacAucDump[itemId]["stats"]["centRim"]*wtfacAucDump[itemId]["stats"]["centRimCnt"]+singlePrice*CONST_RIM_PERCENT)/(wtfacAucDump[itemId]["stats"]["centRimCnt"]+1);
                    wtfacAucDump[itemId]["stats"]["centRim"] = math.floor(wtfacAucDump[itemId]["stats"]["centRim"]);
                    wtfacAucDump[itemId]["stats"]["centRimCnt"] = wtfacAucDump[itemId]["stats"]["centRimCnt"]+1;
                end

                wtfacAucDump[itemId]["stats"]["absAvg"] = (wtfacAucDump[itemId]["stats"]["absAvg"]*wtfacAucDump[itemId]["stats"]["absCnt"]+buyoutPrice)/(wtfacAucDump[itemId]["stats"]["absCnt"] + count);
                wtfacAucDump[itemId]["stats"]["absAvg"] = math.floor(wtfacAucDump[itemId]["stats"]["absAvg"]);
                wtfacAucDump[itemId]["stats"]["absCnt"] = wtfacAucDump[itemId]["stats"]["absCnt"] + count;
            
                if (singlePrice <= wtfacAucDump[itemId]["stats"]["centRim"]) then
                    wtfacAucDump[itemId]["stats"]["centAvg"] = (wtfacAucDump[itemId]["stats"]["centAvg"]*wtfacAucDump[itemId]["stats"]["centCnt"]+buyoutPrice)/(wtfacAucDump[itemId]["stats"]["centCnt"] + count);
                    wtfacAucDump[itemId]["stats"]["centAvg"] = math.floor(wtfacAucDump[itemId]["stats"]["centAvg"])
                    wtfacAucDump[itemId]["stats"]["centCnt"] = wtfacAucDump[itemId]["stats"]["centCnt"] + count;
                end
    
                -- wtfacAucDump[itemId]["lots"][itemIndex+50*(scanItemPage)] = {};
                -- wtfacAucDump[itemId]["lots"][itemIndex+50*(scanItemPage)]["count"] = count;
                -- wtfacAucDump[itemId]["lots"][itemIndex+50*(scanItemPage)]["buyoutPrice"] = buyoutPrice;
                -- wtfacAucDump[itemId]["lots"][itemIndex+50*(scanItemPage)]["singlePrice"] = singlePrice;
                -- wtfacAucDump[itemId]["lots"][itemIndex+50*(scanItemPage)]["meaningfulPrice"] = meaningfulPrice;
                -- wtfacAucDump[itemId]["lots"][itemIndex+50*(scanItemPage)]["priceRUp"] = priceRUp;
                -- wtfacAucDump[itemId]["lots"][itemIndex+50*(scanItemPage)]["goldPrice"] = goldPrice;
            else
                print("NonB"..name..buyoutPrice)
            end
        end
    end

    if isLastPage then
        wtfacAucDump[itemId]["ts"] = time();

        wtfacAucDump[itemId]["stats"]['ts'] = wtfacAucDump[itemId]["ts"];
        wtfacAucDump[itemId]["stats"]['etf'] = math.floor(math.max(itemSellPrice, 500)*CONST_NEUTRAL_AUC_FEE); -- 5s as minimal transfer price       

        scanItemIdx = scanItemIdx + 1;

        if scanItemIdx > table.getn(wtfacTrackedItems) then
            scanItemIdx = 0;
            wtfacLastScan = time();
            print("ended");
        else
            scanItemPage = 0;
            C_Timer.After(CONST_QUERY_DELAY, queryItemScan);
        end
    else
        scanItemPage = scanItemPage + 1;
        C_Timer.After(CONST_QUERY_DELAY, queryItemScan);
    end

end

function queryItemScan()
    if scanItemIdx>0 and scanItemIdx <= table.getn(wtfacTrackedItems) then
        local itemId = wtfacTrackedItems[scanItemIdx];
        local itemName = GetItemInfo(itemId);
        print("queryItemScan", itemId, itemName);

        if scanItemPage == 0 then
            wtfacAucDump[itemId] = {};
            
            wtfacAucDump[itemId]["itemName"] = itemName;
            wtfacAucDump[itemId]["realm"] = curRealm;
            wtfacAucDump[itemId]["player"] = curPlayer;
            wtfacAucDump[itemId]["priceCounters"] = {};
            
            wtfacAucDump[itemId]["stats"] = {};
            wtfacAucDump[itemId]["stats"]["absCnt"] = 0;
            wtfacAucDump[itemId]["stats"]["absAvg"] = 0;
            wtfacAucDump[itemId]["stats"]["absMin"] = 9999999;

            wtfacAucDump[itemId]["stats"]["centCnt"] = 0;
            wtfacAucDump[itemId]["stats"]["centAvg"] = 0;

            wtfacAucDump[itemId]["stats"]["centRim"] = 0;
            wtfacAucDump[itemId]["stats"]["centRimCnt"] = 0;

            -- wtfacAucDump[itemName]["lots"] = {};
            -- wtfacAucDump[itemName]["control"] = 0;
            -- wtfacAucDump[itemName]["buyable"] = 0;
            -- wtfacAucDump[itemName]["all"] = 0;
        end

        --print("Query "..wtfacTrackedItems[scanItemIdx].."("..scanItemPage..")");
        QueryAuctionItems(itemName, nil, nil, scanItemPage, nil, 0, false, true);
    end
end

function scanAuctionForTrackedItems()
    scanItemIdx = 0;
    scanPreActions();

    scanItemIdx = 1;
    scanItemPage = 0;
    wtfacAucDump ={};
    print("GonnaScan ", wtfacTrackedItems[scanItemIdx]);
    queryItemScan();
end

SLASH_WTFAC1 = "/wtfac"
SlashCmdList["WTFAC"] = function(msg)
    if msg == "scan" then
        local canQuery,canQueryAll = CanSendAuctionQuery();
        if canQuery then
            scanItemIdx = 1;
            scanAuctionForTrackedItems();
        end
    end

    if msg == "stop" then
        scanItemIdx = 0;
    end

    if msg == "rel" then
        ReloadUI();
    end
end

function trackMail(mailIndex)
    if not (wtfacMailTrack and wtfacMailTrack['startTs'] and ((time()-CONST_DATA_SAVE) < wtfacMailTrack['startTs'])) then
        wtfacMailTrack = {};
        wtfacMailTrack['startTs'] = time();
        wtfacMailTrack['mails'] = {};
    end

    local packageIcon, stationeryIcon, sender, subject, money, CODAmount, daysLeft, hasItem, wasRead, wasReturned, textCreated, canReply, isGM = GetInboxHeaderInfo(mailIndex);
    local invoiceType, itemName, playerName, bid, buyout, deposit, consignment = GetInboxInvoiceInfo(mailIndex);
    local bodyText, stationaryMiddle, stationaryEdge, isTakeable, isInvoice = GetInboxText(mailIndex);

    local mailUuid = uuid();
    local proto = {}

    if wtfacMailTrack['mails'][mailUuid] then
        proto['uuidRewrite'] = true;
        print("MAIL UUID REUSE HAPPENED!");
    end

    proto['ts'] = time();
    proto['_id'] = mailUuid;
    proto['player'] = playerName;
    
    proto['cplayer'] = curPlayer;
    proto['crealm'] = curRealm;

    proto['sender'] = sender;
    proto['subject'] = subject;
    proto['bodyText'] = bodyText;
    proto['money'] = money;
    proto['hasItem'] = hasItem;

    -- probably mongodb better have same structure
    proto['invoiceType'] = invoiceType;

    if invoiceType then
        proto['itemName'] = itemName;

        --print("Match");
        --print(subject:match "%d+");
        proto['amount'] = tonumber(subject:match "%d+");
        if (proto['amount'] == nil) then proto['amount'] = 1; end

        proto['buyout'] = buyout;
        proto['deposit'] = deposit;
        proto['consignment'] = consignment;
    end

    wtfacMailTrack['mails'][mailUuid] = proto;
end

local frame = CreateFrame("FRAME", "FooAddonFrame");
frame:RegisterEvent("ADDON_LOADED");
frame:RegisterEvent("AUCTION_ITEM_LIST_UPDATE");

frame:RegisterEvent("CLOSE_INBOX_ITEM");


local function eventHandler(event, ...)
    local event, arg1, arg2, arg3, arg4 = select(1,...);
    local eventMsg = "e"..event;
    if (arg1) then eventMsg = eventMsg .. " " .. arg1; end
    --print(eventMsg);

    if event == "ADDON_LOADED" and arg1 == "WowTradeFactory" then
        print("WTFac loaded");
        curRealm = GetRealmName();
        curPlayer = UnitName("player");
        if curPlayer == "Элвенстин" then curFaction = "A" end;
    end

    if event == "AUCTION_ITEM_LIST_UPDATE" then
        -- print("wtfac aiListUpdate");
        if scanItemIdx>0 then
            parseUpdatedPage();
        end
    end

    if event == "CLOSE_INBOX_ITEM" then 
        trackMail(arg1);
    end
end
frame:SetScript("OnEvent", eventHandler);