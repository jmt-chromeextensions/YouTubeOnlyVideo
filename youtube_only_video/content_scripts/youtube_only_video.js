// Constants

const EPILEPSY_WARNING_MESSAGE =
    `The effects of pressing the buttons represented by a BOLT (⚡) and the one that has an icon with THREE WAVY DASHES (〰️), located to the right of the first one, can provoke the screen to change its color abruptly. 

If you're a person who suffers from photosensitive epilepsy, using these options can be harmful for you. 

Do you want to activate this mode?`

const REMEMBER_MY_DECISION_MESSAGE =
    `Do you want this message to not be shown again?`

const HIDE_BUTTONS_MESSAGE =
    `Do you want the two mentioned buttons (represented by the bolt and the wavy dashes icons) to be removed and not appear again?`

const DO_NOT_SHOW_WARNING_SETTING_KEY = 'notShowEpilepsyWarningAgain'
const HIDE_BUTTONS_SETTING_KEY = 'notShowDynamicColorChangeButtons';

const FLASH_MODE = 1
const SOFT_MODE = 2

const INTERVAL_MILLISECONDS = 50;
const BGCOLOR_ANIMATION_MILLISECONDS = 100; // Not too fast, not too slow

// Convert RGB value to HEX
const rgbToHex = (r, g, b) => [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
}).join('')

const colorThief = new ColorThief();

// Global variables

var settings = new Map();
settings.set(DO_NOT_SHOW_WARNING_SETTING_KEY, false);
settings.set(HIDE_BUTTONS_SETTING_KEY, false);

var canvas;

var it_changeColorToPredominantColorInVideo = false;
var interval_changeColorToPredominantColorInVideo;
var active_mode;

chrome.extension.onMessage.addListener(function (msg) {

    // Extension's icon clicked, message sent from background script to initiate the process
    if (msg.action == 'void') {

        // Get settings 
        chrome.storage.sync.get([DO_NOT_SHOW_WARNING_SETTING_KEY, HIDE_BUTTONS_SETTING_KEY], function (result) {
            if (result[DO_NOT_SHOW_WARNING_SETTING_KEY]) settings.set(DO_NOT_SHOW_WARNING_SETTING_KEY, true);
            if (result[HIDE_BUTTONS_SETTING_KEY]) settings.set(HIDE_BUTTONS_SETTING_KEY, true);

            debugger;

            //
            // Visual modifications
            //

            // Black backgrounds
            $('body > ytd-app').css({ backgroundColor: 'black' });
            $('#page-manager > ytd-watch-flexy').css({ backgroundColor: 'black' });

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
            // Add color palette pop-up
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
                $("#jBox1").offset({ top: 75, left: 1250 })

                // Remove sample content and add input
                $("#jBox1 .jBox-title").remove();
                $("#jBox1 .jBox-content").html([
                    `<div id='container' style="width: 404px; height: 280px;">`,
                    `<input style="display:none" id="color-picker">`,
                    `<pre style="display: none;" id="sp-options">` + `<\/pre>`,
                    `<button id="btn_fullscreen" type="button" class="btn_view_opts btn_border_animation ${(settings.get(HIDE_BUTTONS_SETTING_KEY) ? 'unique_btn' : 'first_btn')}" ><span>` + FULLS_SVG + `<\/span><\/button>`,
                    ((!settings.get(HIDE_BUTTONS_SETTING_KEY) ? `<button id="btn_changeColorToPredominant" type="button" class="btn_view_opts btn_border_animation" data-mode=1 data-state=0><span>` + BOLT_SVG + `<\/span><\/button>`: '')),
                    ((!settings.get(HIDE_BUTTONS_SETTING_KEY) ? `<button id="btn_changeColorToPredominant_soft" type="button" class="btn_view_opts btn_border_animation" data-mode=2 data-state=0><span>` + FAT_WIND_SVG + `<\/span><\/button>`: '')),
                    `<\/div>`
                ].join(""));

                // Assign buttons' functions
                $("#btn_fullscreen").click(fullscreenSwitch);
                $("#btn_changeColorToPredominant, #btn_changeColorToPredominant_soft").click(function (e) {

                    debugger;
                    // Show epilepsy warning message if proceed and change mode

                    // Deactivated mode / the user has stated they want the warning to not be shown
                    if (parseInt(e.currentTarget.dataset.state) == 1 || settings.get(DO_NOT_SHOW_WARNING_SETTING_KEY)) {
                        changeMode(e);
                        return;
                    }

                    // Serious time, pause the video
                    player.pause();

                    if (confirm(EPILEPSY_WARNING_MESSAGE)) {

                        // Activate mode and ask if the user doesn't want to see the warning message again
                        if (confirm(REMEMBER_MY_DECISION_MESSAGE)) {
                            debugger;
                            chrome.storage.sync.set({[DO_NOT_SHOW_WARNING_SETTING_KEY]: true }, function () { });
                            settings.set(DO_NOT_SHOW_WARNING_SETTING_KEY, true);
                        }

                        changeMode(e);

                    } else {

                        // Not active the mode and ask the user if they want these buttons to be hidden forever... 😔
                        if (confirm(HIDE_BUTTONS_MESSAGE)) {
                            chrome.storage.sync.set({[HIDE_BUTTONS_SETTING_KEY]: true }, function () { });
                            settings.set(HIDE_BUTTONS_SETTING_KEY, true);
                            $("#btn_changeColorToPredominant, #btn_changeColorToPredominant_soft").hide();
                            $("#btn_fullscreen").removeClass("first_btn").addClass("unique_btn");
                        }

                    }

                    // Confirm deactivates fullscreen mode; resume video
                    setTimeout(function () {
                        $("#btn_fullscreen").click();
                        setTimeout(function () {
                            player.play();
                        }, 200);
                    }, 500);

                });

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
                    $(".sp-container").css({ backgroundColor: 'transparent' });
                    $(".jBox-container").css({ backgroundColor: 'transparent' });

                    // Show modal
                    $("#jBox1").show();
                    $("#jBox1").css({ opacity: 1 });
                    $(".sp-container").css({ opacity: 1 });

                }, 0);

            }, 0);

            //
            // Generate canvas from video to use it for dynamic color change modes
            // 

            player = $(".video-stream")[0];
            canvas = document.createElement("canvas");
            canvas.width = player.videoWidth;
            canvas.height = player.videoHeight;


        });

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
            $('body').css({ overflow: 'hidden' });
            $("#page-manager").css({ overflow: 'hidden' });
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

// Fancy jQuery to switch between two visualizing modes 🤣 (and maybe more in the future)
function changeMode(clicked_btn) {

    $('#jBox1 .jBox-content').find("path").css({ fill: 'white', stroke: 'white' });

    // Deactivate mode
    if (parseInt(clicked_btn.currentTarget.dataset.state) == 1) {

        it_changeColorToPredominantColorInVideo = false;
        $("#jBox1").find('*[data-mode]').attr('data-state', 0);

    // Activate mode
    } else {

        it_changeColorToPredominantColorInVideo = true;
        active_mode = parseInt(clicked_btn.currentTarget.dataset.mode);

        $("#jBox1").find('*[data-mode]:not(' + `#${clicked_btn.currentTarget.id}`).attr('data-state', 0);
        $(`#${clicked_btn.currentTarget.id}`).attr('data-state', 1);

    }

    // Start new color change interval
    if (it_changeColorToPredominantColorInVideo) {
        clearInterval(interval_changeColorToPredominantColorInVideo);
        interval_changeColorToPredominantColorInVideo = setInterval(() => {
            getVideoMainColor();
        }, INTERVAL_MILLISECONDS);
    } else {
        clearInterval(interval_changeColorToPredominantColorInVideo);
    }

}

// Take 'screenshot' of the video that is being played and get its main color
function getVideoMainColor() {
    canvas.getContext('2d').drawImage(player, 0, 0, canvas.width, canvas.height);

    var myImage = canvas.toDataURL("image/png");

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

    if (it_changeColorToPredominantColorInVideo) {

        // Page background and selected mode's button
        switch (active_mode) {

            case FLASH_MODE:

                $('body > ytd-app').css({ backgroundColor: mainColor });
                $('#page-manager > ytd-watch-flexy').css({ backgroundColor: mainColor });

                $('#btn_changeColorToPredominant').find("path").css('cssText', `fill: ${mainColor}`);

                break;

            case SOFT_MODE:

                $('body > ytd-app').stop().animate({ backgroundColor: mainColor }, BGCOLOR_ANIMATION_MILLISECONDS);
                $('#page-manager > ytd-watch-flexy').stop().animate({ backgroundColor: mainColor }, BGCOLOR_ANIMATION_MILLISECONDS);

                $('#btn_changeColorToPredominant_soft').find("path").eq(0).stop().css({ 'fill': mainColor, 'transition': 'fill 0.1s' });
                $('#btn_changeColorToPredominant_soft').find("path").eq(1).stop().css({ 'fill': mainColor, 'transition': 'fill 0.2s' });
                $('#btn_changeColorToPredominant_soft').find("path").eq(2).stop().css({ 'fill': mainColor, 'transition': 'fill 0.3s' });

                break;

        }
    }

    else { // Color selected directly from the palette
        $('body > ytd-app').css({ backgroundColor: mainColor });
        $('#page-manager > ytd-watch-flexy').css({ backgroundColor: mainColor });
    }

    // Video's progress bar
    $("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-chapters-container > div > div.ytp-play-progress.ytp-swatch-background-color").css({ backgroundColor: mainColor });
    $("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-chapters-container > div > div.ytp-progress-list > div.ytp-play-progress.ytp-swatch-background-color").css({ backgroundColor: mainColor });
    $("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-scrubber-container > div").css({ backgroundColor: mainColor });

}
