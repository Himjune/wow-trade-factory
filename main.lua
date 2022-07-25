wtfacAucDump = {}  -- default value until ADDON_LOADED

SLASH_WTFAC1 = "/wtfac"
SlashCmdList["WTFAC"] = function(msg)
    ReloadUI();
end

local frame = CreateFrame("FRAME", "FooAddonFrame");
frame:RegisterEvent("ADDON_LOADED");
local function eventHandler(event, ...)
    local event, arg1, arg2, arg3, arg4 = select(1,...);
    print("WTFac event "..event.." - "..arg1);

    if event == "ADDON_LOADED" and arg1 == "WowTradeFactory" then
        print("WTFac loaded");
    end
end
frame:SetScript("OnEvent", eventHandler);