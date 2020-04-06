chrome.extension.onMessage.addListener(function (msg) {

    if (msg.action == 'void') {

        // Black backgrounds
        $('body > ytd-app').css('cssText', "background-color: black !important");
        $('#page-manager > ytd-watch-flexy').css('cssText', "background-color: black !important");

        // Remove elements from view

        // Upper banner
        $('#masthead').remove();

        // Related videos
        $('#secondary').remove();

        // Remove info div: video title, channel, views
        $("#info.style-scope.ytd-watch-flexy").remove();

        // Description box
        $('#meta').remove();

        // Comment list
        $('#comments').remove();
		
		// Remove elements from video
		// Channel icon
		$('.annotation .branding-img').remove();
		
		// Info
		$('.ytp-button .ytp-cards-button-icon-default').remove();
		$('.ytp-chrome-top-buttons .ytp-cards-teaser-text').remove();

        // F11 - Fullscreen
        // https://stackoverflow.com/questions/7495373/how-to-make-browser-full-screen-using-f11-key-event-through-javascript
        var el = document.documentElement
            , rfs = // for newer Webkit and Firefox
                el.requestFullScreen
                || el.webkitRequestFullScreen
                || el.mozRequestFullScreen
                || el.msRequestFullScreen
            ;
        if (typeof rfs != "undefined" && rfs) {
            rfs.call(el);
        } else if (typeof window.ActiveXObject != "undefined") {
            // for Internet Explorer
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript != null) {
                wscript.SendKeys("{F11}");
            }
        }

		// Remove scrollbars
		setTimeout(function(){ 
            $('body').css('overflow', 'hidden');
            $("#page-manager").css('overflow', 'hidden');
        }, 100);

        

    }

});