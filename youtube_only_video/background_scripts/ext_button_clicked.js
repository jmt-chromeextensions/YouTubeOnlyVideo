// Handle click on extension's icon

chrome.action.onClicked.addListener(function (tab) {

    if (tab.url.includes('watch')) {
        
        let domain = new URL(tab.url).hostname;
        if (domain === 'www.youtube.com') {
    
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "void" }, function () { });
            });
    
        }

    }


});
