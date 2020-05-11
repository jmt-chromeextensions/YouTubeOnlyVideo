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
                    `<button type="button" id="btn_changeColorToPredominant" style="margin-top:250px">Click Me!` + `<\/button>`,
                `<\/div>`
            ].join(""));

            $("#btn_changeColorToPredominant").click(changeColorToPredominantColorInVideo);

            // Make modal appear when the mouse is on it and make it dissapear when it is somewhere else
            $("#jBox1").mouseover(function(){
                $(this).stop(true).fadeTo(100,1);
            }).mouseout(function(){
                $(this).stop(true).fadeTo(500,0);
            });

            // Generate spectrum
            $('#color-picker').spectrum();
            $(".sp-colorize-container.sp-add-on").hide();
            $('#color-picker').click();

            setTimeout(() => {
                // Remove position related CSS properties from the spectrum and add it to the modal
                $(".sp-container")[0].id='most_beatiful_color_palette';
                $(".sp-container")[0].id='most_beatiful_color_palette';
                $("#most_beatiful_color_palette").detach().appendTo('#jBox1');
                $("#most_beatiful_color_palette").removeAttr("style");
            }, 0);

        }, 0);

    }

});

function changeColorToPredominantColorInVideo () {

    setInterval(() => {

        getVideoMainColor();
        debugger;

    }, 20);

}

// Take 'screenshot' of the video playing and get its main color
function getVideoMainColor() {
    var player = $(".video-stream")[0];

    var canvas = document.createElement("canvas");
    canvas.width = player.videoWidth;
    canvas.height = player.videoHeight;
    canvas.getContext('2d').drawImage(player, 0, 0, canvas.width, canvas.height);

    var myImage = canvas.toDataURL("image/png");

    const colorThief = new ColorThief();
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = myImage;

    img.addEventListener('load', function () {
        var color = colorThief.getColor(img);
        var hexColor = rgbToHex(color[0], color[1], color[2]);
        changeElementsBgColor('#' + hexColor);
    });
}

// Convert RGB value to HEX
const rgbToHex = (r, g, b) => [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
}).join('')


function changeElementsBgColor (mainColor) {

    // Page background
    $('body > ytd-app').css('cssText', "background-color:" + mainColor + "!important");
    $('#page-manager > ytd-watch-flexy').css('cssText', "background-color:" + mainColor + "!important");

    // Spectrum and jBox background
    $(".sp-container").css('background-color', mainColor);
    $(".jBox-container").css('background-color', mainColor);

    // Video's progress bar
    $("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-chapters-container > div > div.ytp-play-progress.ytp-swatch-background-color").css("background-color", mainColor);
    $("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-chapters-container > div > div.ytp-progress-list > div.ytp-play-progress.ytp-swatch-background-color").css("background-color", mainColor);
    $("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-scrubber-container > div").css("background-color", mainColor);

}

$( document ).ready(function() {
    $(window).click(function(e) {
        // e.preventDefault();
        // alert(e.target.id); // gives the element's ID 
    });
});