const FLASH_MODE = 1
const SOFT_MODE = 2

const BGCOLOR_ANIMATION_MILLISECONDS = 70; // Not too fast, not too slow

// Convert RGB value to HEX
const rgbToHex = (r, g, b) => [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
}).join('')

var it_changeColorToPredominantColorInVideo = false;
var interval_changeColorToPredominantColorInVideo;
var soft_animation = false;
var active_mode;

chrome.extension.onMessage.addListener(function (msg) {

    if (msg.action == 'void') {

        //
        // Visual modifications
        //

        // Black backgrounds
        $('body > ytd-app').css('cssText', "background-color: black");
        $('#page-manager > ytd-watch-flexy').css('cssText', "background-color: black");

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
        $(".annotation.annotation-type-custom.iv-branding").hide()

        // Info
        $('.ytp-button .ytp-cards-button-icon-default').remove();
        $('.ytp-chrome-top-buttons .ytp-cards-teaser-text').remove();

        // F11 - Fullscreen
        fullscreenSwitch();

        //
        // Add color palette popup
        //         

        setTimeout(function () {

            // Create jBox modal
            new jBox('Modal', {
                attach: '#modal-drag-anywhere',
                height: 400,
                width: 444,
                title: 'jBox',
                overlay: false,
                createOnInit: true,
                content: 'Drag me around by clicking anywhere',
                draggable: true,
                repositionOnOpen: false,
                repositionOnContent: false
            });

            // Excuse me, let me change that height, that top, that left, etc.
            $("#jBox1").height("400px");
            $("#jBox1").offset({top: 450, left:1250 })

            // Show modal
            $("#jBox1").show();
            $("#jBox1").css({ opacity: 1 });

            // Remove sample content and add input
            $("#jBox1 .jBox-title").remove();
            $("#jBox1 .jBox-content").html([
                `<div id='container' style="width: 404px; height: 280px;">`,
                `<input style="display:none" id="color-picker">`,
                `<pre style="display: none;" id="sp-options">` + `<\/pre>`,
                `<button id="btn_fullscreen" type="button" class="btn_view_opts btn_border_animation first_btn" ><span>` + FULLS_SVG + `<\/span><\/button>`,
                `<button id="btn_changeColorToPredominant" type="button" class="btn_view_opts btn_border_animation" data-mode=1 data-state=0><span>` + BOLT_SVG + `<\/span><\/button>`,
                `<button id="btn_changeColorToPredominant_soft" type="button" class="btn_view_opts btn_border_animation" data-mode=2 data-state=0><span>` + FAT_WIND_SVG + `<\/span><\/button>`,
                `<\/div>`
            ].join(""));

            // Assign buttons' functions
            $("#btn_fullscreen").click(fullscreenSwitch);
            $("#btn_changeColorToPredominant").click({clicked_btn: this}, changeMode);
            $("#btn_changeColorToPredominant_soft").click({clicked_btn: this}, changeMode);

            // Make modal appear when the mouse is on it and make it dissapear when it is somewhere else
            $("#jBox1").mouseover(function () {
                $(this).stop(true).fadeTo(100, 1);
            }).mouseout(function () {
                $(this).stop(true).fadeTo(500, 0);
            });

            // Generate spectrum
            $('#color-picker').spectrum();
            $(".sp-colorize-container.sp-add-on").hide();
            $('#color-picker').click();

            setTimeout(() => {
                // Remove position related CSS properties from the spectrum and add it to the modal
                $(".sp-container")[0].id = 'most_beatiful_color_palette';
                $(".sp-container")[0].id = 'most_beatiful_color_palette';
                $("#most_beatiful_color_palette").detach().appendTo('#jBox1');
                $("#most_beatiful_color_palette").removeAttr("style");

                // Transparent blackground color
                $(".sp-container").css('background-color', 'transparent');
                $(".jBox-container").css('background-color', 'transparent');

            }, 0);

        }, 0);

    }

});

// https://stackoverflow.com/questions/36672561/how-to-exit-fullscreen-onclick-using-javascript
// https://stackoverflow.com/questions/7495373/how-to-make-browser-full-screen-using-f11-key-event-through-javascript
function fullscreenSwitch() {

    var isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null);

    if (!isInFullScreen) {

        var el = document.documentElement
            , rfs = // for newer Webkit and Firefox
                el.requestFullScreen
                || el.webkitRequestFullScreen
                || el.mozRequestFullScreen
                || el.msRequestFullScreen
            ;

        if (typeof rfs != "undefined" && rfs)
            rfs.call(el);

        // Remove scrollbars
        setTimeout(function () {
            $('body').css('overflow', 'hidden');
            $("#page-manager").css('overflow', 'hidden');
        }, 100);

    } else {

        var el = document
            , rfs = // for newer Webkit and Firefox
                el.exitFullscreen()
                || el.webkitExitFullscreen
                || el.mozCancelFullScreen
                || el.msExitFullscreen
            ;

        if (typeof rfs != "undefined" && rfs)
            rfs.call(el);

    }

}

function changeMode (clicked_btn) {

    $('#jBox1 .jBox-content').find("path").css('cssText', `fill: white; stroke:white`);

    if (parseInt(clicked_btn.currentTarget.dataset.state) == 1) {
        clearInterval(interval_changeColorToPredominantColorInVideo);
        it_changeColorToPredominantColorInVideo = false;
        $("#jBox1").find('*[data-mode]').attr('data-state', 0);
    } else {
        it_changeColorToPredominantColorInVideo = true;
        $("#jBox1").find('*[data-mode]:not(' + `#${clicked_btn.currentTarget.id}`).attr('data-state', 0);
        $("#jBox1").find('*[data-mode]:not(' + `#${clicked_btn.currentTarget.id}`).attr('data-state', 0);
        $(`#${clicked_btn.currentTarget.id}`).attr('data-state', 1);
        active_mode = parseInt(clicked_btn.currentTarget.dataset.mode);
    }
    
    if (it_changeColorToPredominantColorInVideo) {
        clearInterval(interval_changeColorToPredominantColorInVideo);
        interval_changeColorToPredominantColorInVideo = setInterval(() => {
            getVideoMainColor();
        }, 20);
    } else {
        clearInterval(interval_changeColorToPredominantColorInVideo);
    }

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

function changeElementsBgColor(mainColor) {

    if (it_changeColorToPredominantColorInVideo)
    {

        // Page background and selected mode's button
        switch (active_mode) {

            case FLASH_MODE: 
            
                $('body > ytd-app').css('cssText', "background-color:" + mainColor + "!important");
                $('#page-manager > ytd-watch-flexy').css('cssText', "background-color:" + mainColor + "!important");

                // $('#btn_changeColorToPredominant').css('cssText', "border-color:" + mainColor);
                $('#btn_changeColorToPredominant').find("path").css('cssText', `fill: ${mainColor}`);
                
                break;
                
            case SOFT_MODE:
                    
                $('body > ytd-app').stop().animate({ backgroundColor: mainColor }, BGCOLOR_ANIMATION_MILLISECONDS);
                $('#page-manager > ytd-watch-flexy').stop().animate({backgroundColor:mainColor}, BGCOLOR_ANIMATION_MILLISECONDS);

                $('#btn_changeColorToPredominant_soft').find("path").eq(0).stop().css({'fill': mainColor, 'transition': 'fill 0.1s' });
                $('#btn_changeColorToPredominant_soft').find("path").eq(1).stop().css({'fill': mainColor, 'transition': 'fill 0.2s' });
                $('#btn_changeColorToPredominant_soft').find("path").eq(2).stop().css({'fill': mainColor, 'transition': 'fill 0.3s' });

                break;
    
        }
    } 
    else { // Color selected directly from the palette
        $('body > ytd-app').css('cssText', "background-color:" + mainColor + "!important");
        $('#page-manager > ytd-watch-flexy').css('cssText', "background-color:" + mainColor + "!important");
    }

    // Video's progress bar
    $("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-chapters-container > div > div.ytp-play-progress.ytp-swatch-background-color").css("background-color", mainColor);
    $("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-chapters-container > div > div.ytp-progress-list > div.ytp-play-progress.ytp-swatch-background-color").css("background-color", mainColor);
    $("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-scrubber-container > div").css("background-color", mainColor);

}
