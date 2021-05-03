function executeScripts(tabId, scripts)
{
    function createCallback(i) {
        if (i < scripts.length -1)
            return chrome.tabs.executeScript(tabId, { file: scripts[i]} , function() { createCallback(i + 1) } );
        
        return chrome.tabs.executeScript(tabId, { file: scripts[i]}, null);
    }

    chrome.tabs.executeScript(tabId, { file: scripts[0]} , function() { createCallback(1) } );

}

function adaptFrom2_0_0_4To2_0_0_5() {
    const DO_NOT_SHOW_WARNING_SETTING_KEY = 'notShowEpilepsyWarningAgain'
    const HIDE_BUTTONS_SETTING_KEY = 'notShowDynamicColorChangeButtons';

    chrome.storage.sync.get([DO_NOT_SHOW_WARNING_SETTING_KEY, HIDE_BUTTONS_SETTING_KEY], function (result) {
        if (result[DO_NOT_SHOW_WARNING_SETTING_KEY])  
            chrome.storage.sync.set({"new_key_test": "abc123" }, function () { });
    });
}

chrome.runtime.onInstalled.addListener(function (details) {
    debugger;
    
    if (details.reason === "install") {
        console.log("First installation. Executing content script in every open tab.")
        chrome.tabs.query({ url: ["http://*/*", "https://*/*"] }, function (tabs) {
            console.log(tabs);
            for (var i = 0, length = tabs.length; i < length; i++) {
                chrome.tabs.insertCSS(tabs[i].id, {file: "tools/jbox/jBox.all.css"});
                chrome.tabs.insertCSS(tabs[i].id, {file: "tools/spectrum/spectrum.css"});

                executeScripts(tabs[i].id, ["jquery/jquery-3.4.1.min.js", "jquery/jquery-ui.min.js",
                                            "tools/jbox/jBox.all.min.js", "tools/color-thief/color-thief.min.js", "tools/spectrum/spectrum.js",
                                             "icons/buttons_icons.js", "content_scripts/youtube_only_video.js"]);
            }
        });
    } else if (details.reason === "update") {
        let currentVersion = chrome.runtime.getManifest().version;
        let previousVersion = details.previousVersion;

        if (currentVersion === "2.0.0.5" && previousVersion === "2.0.0.4")
            adaptFrom2_0_0_4To2_0_0_5();
    }

});