wtfacLastScan = 0;
wtfacAucDump = {}  -- default value until ADDON_LOADED
wtfacMailTrack = {}

CONST_QUERY_DELAY = 0.5;
                -- d*h*m*s      
CONST_MAIL_SAVE = 2*24*60*60;


local random = math.random
local function uuid()
    local template ='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    return string.gsub(template, '[xy]', function (c)
        local v = (c == 'x') and random(0, 0xf) or random(8, 0xb)
        return string.format('%x', v)
    end)
end


local wtfacTrackedItems = {
    'Блестящее масло маны',
    'Большой сверкающий осколок',
    'Огнецвет'
};

local scanItemIdx = 0; -- 0 indicates no search in progress
local scanItemPage = 0;

function scanPreActions()
    SortAuctionItems("list", "buyout");
    if IsAuctionSortReversed("list", "buyout") then
        SortAuctionItems("list", "buyout");
    end
end

function parseUpdatedPage() 
    batch,count = GetNumAuctionItems("list");
    print(batch,count);

    local isLastPage = (batch<50);
    local itemName = wtfacTrackedItems[scanItemIdx];

    if batch > 0 then
        for itemIndex=1,batch do
            local name, texture, count, quality, canUse, level, levelColHeader, minBid,
            minIncrement, buyoutPrice, bidAmount, highBidder, bidderFullName, owner,
            ownerFullName, saleStatus, itemId, hasAllInfo = GetAuctionItemInfo("list", itemIndex);
            -- print(name.."("..count..") for "..buyoutPrice);

            local singlePrice = math.floor(buyoutPrice/count);
            local meaningfulPrice = math.floor(singlePrice/100)/100;

            if buyoutPrice > 0 then
                
                if wtfacAucDump[itemName]["priceCounters"][meaningfulPrice] then
                    wtfacAucDump[itemName]["priceCounters"][meaningfulPrice] = wtfacAucDump[itemName]["priceCounters"][meaningfulPrice] + count;
                else
                    wtfacAucDump[itemName]["priceCounters"][meaningfulPrice] = count;
                end

                wtfacAucDump[itemName]["buyable"] = wtfacAucDump[itemName]["buyable"] + count;
    
                --wtfacAucDump[itemName]["lots"][itemIndex+50*(scanItemPage)] = {};
                --wtfacAucDump[itemName]["lots"][itemIndex+50*(scanItemPage)]["count"] = count;
                --wtfacAucDump[itemName]["lots"][itemIndex+50*(scanItemPage)]["buyoutPrice"] = buyoutPrice;
                --wtfacAucDump[itemName]["lots"][itemIndex+50*(scanItemPage)]["singlePrice"] = singlePrice;
                --wtfacAucDump[itemName]["lots"][itemIndex+50*(scanItemPage)]["meaningfulPrice"] = meaningfulPrice;
            else
                print("NonB"..name..buyoutPrice)
            end

            wtfacAucDump[itemName]["control"] = wtfacAucDump[itemName]["control"] + 1;
            wtfacAucDump[itemName]["all"] = wtfacAucDump[itemName]["all"] + count;
        end
    end

    if isLastPage then
        wtfacAucDump[itemName]["ts"] = time();
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
        local itemName = wtfacTrackedItems[scanItemIdx];

        if scanItemPage == 0 then
            wtfacAucDump[itemName] = {};
            wtfacAucDump[itemName]["priceCounters"] = {};
            wtfacAucDump[itemName]["lots"] = {};
            wtfacAucDump[itemName]["control"] = 0;
            wtfacAucDump[itemName]["buyable"] = 0;
            wtfacAucDump[itemName]["all"] = 0;
        end

        --print("Query "..wtfacTrackedItems[scanItemIdx].."("..scanItemPage..")");
        QueryAuctionItems(wtfacTrackedItems[scanItemIdx], nil, nil, scanItemPage, nil, 0, false, true);
    end
end

function scanAuctionForTrackedItems()
    scanPreActions();

    scanItemIdx = 1;
    scanItemPage = 0;
    wtfacAucDump ={};
    print("GonnaScan " .. wtfacTrackedItems[scanItemIdx])
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
    if not (wtfacMailTrack and wtfacMailTrack['startTs'] and ((time()-CONST_MAIL_SAVE) < wtfacMailTrack['startTs'])) then
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
    proto['player'] = UnitName("player");

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