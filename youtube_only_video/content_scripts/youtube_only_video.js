chrome.extension.onMessage.addListener(function (msg) {

    if (msg.action == 'void') {

        //
        // Visual modifications
        //

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

        //
        // Add color palette popup
        //         

        setTimeout(function () {

            // Create jBox modal
            new jBox('Modal', {
              attach: '#modal-drag-anywhere',
              width: 444,
              title: 'jBox',
              overlay: false,
              createOnInit: true,
              content: 'Drag me around by clicking anywhere',
              draggable: true,
              repositionOnOpen: false,
              repositionOnContent: false
            });
      
            // Show modal
            $("#jBox1").show();
            $("#jBox1").css({ opacity: 1 });
    
            // Remove sample content and add input
            $("#jBox1 .jBox-title").remove();
            $("#jBox1 .jBox-content").html([
                `<div id='container' style="width: 404px; height: 280px;">`,
                    `<input style="display:none" id="color-picker">`,
                    `<pre style="display: none;" id="sp-options">` + `<\/pre>`,
                `<\/div>`
            ].join(""));
    
            // Generate spectrum
            $('#color-picker').spectrum();
            $('#color-picker').click();

            setTimeout(() => {
                // Remove position related CSS properties from the spectrum and add it to the modal
                debugger;
                $(".sp-container")[0].id='most_beatiful_color_palette';
                $("#most_beatiful_color_palette").detach().appendTo('#jBox1');
                $("#most_beatiful_color_palette").removeAttr("style");
            }, 0);
      
        }, 0);

    }

});