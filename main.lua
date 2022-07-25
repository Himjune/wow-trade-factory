wtfacAucDump = {}  -- default value until ADDON_LOADED

SLASH_WTFAC1 = "/wtfac"
SlashCmdList["WTFAC"] = function(msg)
    if msg == "scan" then
        local res = QueryAuctionItems("Большой сверкающий");

        print(res);
    end

    if msg == "rel" then
        ReloadUI();
    end
end

local frame = CreateFrame("FRAME", "FooAddonFrame");
frame:RegisterEvent("ADDON_LOADED");
frame:RegisterEvent("AUCTION_ITEM_LIST_UPDATE");


local function eventHandler(event, ...)
    local event, arg1, arg2, arg3, arg4 = select(1,...);
    print("WTFac event "..event);

    if event == "ADDON_LOADED" and arg1 == "WowTradeFactory" then
        print("WTFac loaded");
    end

    if event == "AUCTION_ITEM_LIST_UPDATE" then
        print("wtfac aiListUpdate")
    end
end
frame:SetScript("OnEvent", eventHandler);