chrome.browserAction.onClicked.addListener(function (tab) {

    var domain = new URL(tab.url).hostname;
    if (domain === 'www.youtube.com') {

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "void" }, function () { });
        });

    }

});
