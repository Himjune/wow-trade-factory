wtfacAucDump = {}  -- default value until ADDON_LOADED
CONST_QUERY_DELAY = 0.5;

local wtfacTrackedItems = {
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
    if batch > 0 then
        for itemIndex=1,batch do
            local name, texture, count, quality, canUse, level, levelColHeader, minBid,
            minIncrement, buyoutPrice, bidAmount, highBidder, bidderFullName, owner,
            ownerFullName, saleStatus, itemId, hasAllInfo = GetAuctionItemInfo("list", itemIndex);
            print(name.."("..count..") for "..buyoutPrice);

            local singlePrice = math.floor(buyoutPrice/count);
            local meaningfulPrice = math.floor(singlePrice/100)/100;

            if buyoutPrice>0 then
                if wtfacAucDump[scanItemIdx]["priceCounters"][meaningfulPrice] then
                    wtfacAucDump[scanItemIdx]["priceCounters"][meaningfulPrice] = wtfacAucDump[scanItemIdx]["priceCounters"][meaningfulPrice] + count;
                else
                    wtfacAucDump[scanItemIdx]["priceCounters"][meaningfulPrice] = count;
                end

                wtfacAucDump[scanItemIdx]["buyable"] = wtfacAucDump[scanItemIdx]["buyable"] + count;
    
                --wtfacAucDump[scanItemIdx]["lots"][itemIndex+50*(scanItemPage)] = {};
                --wtfacAucDump[scanItemIdx]["lots"][itemIndex+50*(scanItemPage)]["count"] = count;
                --wtfacAucDump[scanItemIdx]["lots"][itemIndex+50*(scanItemPage)]["buyoutPrice"] = buyoutPrice;
                --wtfacAucDump[scanItemIdx]["lots"][itemIndex+50*(scanItemPage)]["singlePrice"] = singlePrice;
                --wtfacAucDump[scanItemIdx]["lots"][itemIndex+50*(scanItemPage)]["meaningfulPrice"] = meaningfulPrice;
            end

            wtfacAucDump[scanItemIdx]["control"] = wtfacAucDump[scanItemIdx]["control"] + 1;
            wtfacAucDump[scanItemIdx]["all"] = wtfacAucDump[scanItemIdx]["all"] + count;
        end
    end

    if isLastPage then
        scanItemIdx = scanItemIdx + 1;

        if scanItemIdx > table.getn(wtfacTrackedItems) then
            scanItemIdx = 0;
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
        if scanItemPage == 0 then
            wtfacAucDump[scanItemIdx] = {};
            wtfacAucDump[scanItemIdx]["name"] = wtfacTrackedItems[scanItemIdx];
            wtfacAucDump[scanItemIdx]["priceCounters"] = {};
            wtfacAucDump[scanItemIdx]["lots"] = {};
            wtfacAucDump[scanItemIdx]["control"] = 0;
            wtfacAucDump[scanItemIdx]["buyable"] = 0;
            wtfacAucDump[scanItemIdx]["all"] = 0;
        end

        print("Query "..wtfacTrackedItems[scanItemIdx].."("..scanItemPage..")");
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

    if msg == "rel" then
        ReloadUI();
    end
end

local frame = CreateFrame("FRAME", "FooAddonFrame");
frame:RegisterEvent("ADDON_LOADED");
frame:RegisterEvent("AUCTION_ITEM_LIST_UPDATE");
frame:RegisterEvent("AUCTION_BIDDER_LIST_UPDATE");


local function eventHandler(event, ...)
    local event, arg1, arg2, arg3, arg4 = select(1,...);
    print("WTFac event "..event);

    if event == "ADDON_LOADED" and arg1 == "WowTradeFactory" then
        print("WTFac loaded");
    end

    if event == "AUCTION_ITEM_LIST_UPDATE" then
        print("wtfac aiListUpdate");
        if scanItemIdx>0 then
            parseUpdatedPage();
        end
    end
end
frame:SetScript("OnEvent", eventHandler);