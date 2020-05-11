// Spectrum Colorpicker v1.8.0
// https://github.com/seballot/spectrum
// Author: Brian Grinstead
// License: MIT

(function (factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) { // AMD
        define(['jquery'], factory);
    }
    else if (typeof exports == "object" && typeof module == "object") { // CommonJS
        module.exports = factory(require('jquery'));
    }
    else { // Browser
        factory(jQuery);
    }
})(function($, undefined) {
    "use strict";

    var defaultOpts = {

        // Callbacks
        beforeShow: noop,
        move: noop,
        change: noop,
        show: noop,
        hide: noop,

        // Options
        color: false,
        flat: false, // Deprecated - use type instead
        type: '', // text, color, component or flat
        showInput: false,
        allowEmpty: true,
        showButtons: true,
        clickoutFiresChange: true,
        showInitial: false,
        showPalette: true,
        showPaletteOnly: false,
        hideAfterPaletteSelect: false,
        togglePaletteOnly: false,
        showSelectionPalette: true,
        localStorageKey: false,
        appendTo: "body",
        maxSelectionSize: 8,
        locale: "en",
        cancelText: "cancel",
        chooseText: "choose",
        togglePaletteMoreText: "more",
        togglePaletteLessText: "less",
        clearText: "Clear Color Selection",
        noColorSelectedText: "No Color Selected",
        preferredFormat: "name",
        className: "", // Deprecated - use containerClassName and replacerClassName instead.
        containerClassName: "",
        replacerClassName: "",
        showAlpha: true,
        theme: "sp-light",
        palette: [
            ["#000000","#444444","#5b5b5b","#999999","#bcbcbc","#eeeeee","#f3f6f4","#ffffff"],
            ["#f44336","#744700","#ce7e00","#8fce00","#2986cc","#16537e","#6a329f","#c90076"],
            ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
            ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
            ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
            ["#cc0000","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
            ["#990000","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
            ["#660000","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
        ],
        selectionPalette: [],
        disabled: false,
        offset: null
    },
    spectrums = [],
    IE = !!/msie/i.exec( window.navigator.userAgent ),
    rgbaSupport = (function() {
        function contains( str, substr ) {
            return !!~('' + str).indexOf(substr);
        }

        var elem = document.createElement('div');
        var style = elem.style;
        style.cssText = 'background-color:rgba(0,0,0,.5)';
        return contains(style.backgroundColor, 'rgba') || contains(style.backgroundColor, 'hsla');
    })(),
    replaceInput = [
        "<div class='sp-replacer'>",
            "<div class='sp-preview'><div class='sp-preview-inner'></div></div>",
            "<div class='sp-dd'>&#9660;</div>",
        "</div>"
    ].join(''),
    markup = (function () {

        // IE does not support gradients with multiple stops, so we need to simulate
        //  that for the rainbow slider with 8 divs that each have a single gradient
        var gradientFix = "";
        if (IE) {
            for (var i = 1; i <= 6; i++) {
                gradientFix += "<div class='sp-" + i + "'></div>";
            }
        }

        return [
            "<div class='sp-container sp-hidden'>",
                "<div class='sp-palette-container'>",
                    "<div class='sp-palette sp-thumb sp-cf'></div>",
                    "<div class='sp-palette-button-container sp-cf'>",
                        "<button type='button' class='sp-palette-toggle'></button>",
                    "</div>",
                "</div>",
                "<div class='sp-picker-container'>",
                    "<div class='sp-top sp-cf'>",
                        "<div class='sp-fill'></div>",
                        "<div class='sp-top-inner'>",
                            "<div class='sp-color'>",
                                "<div class='sp-sat'>",
                                    "<div class='sp-val'>",
                                        "<div class='sp-dragger'></div>",
                                    "</div>",
                                "</div>",
                            "</div>",
                            "<div class='sp-clear sp-clear-display'>",
                            "</div>",
                            "<div class='sp-hue'>",
                                "<div class='sp-slider'></div>",
                                gradientFix,
                            "</div>",
                        "</div>",
                        "<div class='sp-alpha'><div class='sp-alpha-inner'><div class='sp-alpha-handle'></div></div></div>",
                    "</div>",
                    "<div class='sp-input-container sp-cf'>",
                        "<input class='sp-input' type='text' spellcheck='false'  />",
                    "</div>",
                    "<div class='sp-initial sp-thumb sp-cf'></div>",
                "</div>",
            "</div>"
        ].join("");
    })();

    function paletteTemplate (p, color, className, opts) {
        var html = [];
        for (var i = 0; i < p.length; i++) {
            var current = p[i];
            if(current) {
                var tiny = tinycolor(current);
                var c = tiny.toHsl().l < 0.5 ? "sp-thumb-el sp-thumb-dark" : "sp-thumb-el sp-thumb-light";
                c += (tinycolor.equals(color, current)) ? " sp-thumb-active" : "";
                var formattedString = tiny.toString(opts.preferredFormat || "rgb");
                var swatchStyle = rgbaSupport ? ("background-color:" + tiny.toRgbString()) : "filter:" + tiny.toFilter();
                html.push('<span title="' + formattedString + '" data-color="' + tiny.toRgbString() + '" class="' + c + '"><span class="sp-thumb-inner" style="' + swatchStyle + ';" /></span>');
            } else {
                html.push('<span class="sp-thumb-el sp-clear-display" ><span class="sp-clear-palette-only" style="background-color: transparent;" /></span>');
            }
        }
        return "<div class='sp-cf " + className + "'>" + html.join('') + "</div>";
    }

    function hideAll() {
        for (var i = 0; i < spectrums.length; i++) {
            if (spectrums[i]) {
                spectrums[i].hide();
            }
        }
    }

    function instanceOptions(o, callbackContext) {
        o.locale = o.locale || window.navigator.language;
        if (o.locale) o.locale = o.locale.split('-')[0].toLowerCase(); // handle locale like "fr-FR"
        if (o.locale != 'en' && $.spectrum.localization[o.locale]) {
            o = $.extend({}, $.spectrum.localization[o.locale], o);
        }
        var opts = $.extend({}, defaultOpts, o);

        opts.callbacks = {
            'move': bind(opts.move, callbackContext),
            'change': bind(opts.change, callbackContext),
            'show': bind(opts.show, callbackContext),
            'hide': bind(opts.hide, callbackContext),
            'beforeShow': bind(opts.beforeShow, callbackContext)
        };

        return opts;
    }

    function spectrum(element, o) {

        var opts = instanceOptions(o, element),
            type = opts.type,
            flat = (type == 'flat'),
            showSelectionPalette = opts.showSelectionPalette,
            localStorageKey = opts.localStorageKey,
            theme = opts.theme,
            callbacks = opts.callbacks,
            resize = throttle(reflow, 10),
            visible = false,
            isDragging = false,
            dragWidth = 0,
            dragHeight = 0,
            dragHelperHeight = 0,
            slideHeight = 0,
            slideWidth = 0,
            alphaWidth = 0,
            alphaSlideHelperWidth = 0,
            slideHelperHeight = 0,
            currentHue = 0,
            currentSaturation = 0,
            currentValue = 0,
            currentAlpha = 1,
            palette = [],
            paletteArray = [],
            paletteLookup = {},
            selectionPalette = opts.selectionPalette.slice(0),
            maxSelectionSize = opts.maxSelectionSize,
            draggingClass = "sp-dragging",
            abortNextInputChange = false,
            shiftMovementDirection = null;

        var doc = element.ownerDocument,
            body = doc.body,
            boundElement = $(element),
            disabled = false,
            container = $(markup, doc).addClass(theme),
            pickerContainer = container.find(".sp-picker-container"),
            dragger = container.find(".sp-color"),
            dragHelper = container.find(".sp-dragger"),
            slider = container.find(".sp-hue"),
            slideHelper = container.find(".sp-slider"),
            alphaSliderInner = container.find(".sp-alpha-inner"),
            alphaSlider = container.find(".sp-alpha"),
            alphaSlideHelper = container.find(".sp-alpha-handle"),
            textInput = container.find(".sp-input"),
            paletteContainer = container.find(".sp-palette"),
            initialColorContainer = container.find(".sp-initial"),
            cancelButton = container.find(".sp-cancel"),
            clearButton = container.find(".sp-clear"),
            chooseButton = container.find(".sp-choose"),
            toggleButton = container.find(".sp-palette-toggle"),
            isInput = boundElement.is("input"),
            isInputTypeColor = isInput && boundElement.attr("type") === "color" && inputTypeColorSupport(),
            shouldReplace = isInput && type == 'color',
            replacer = (shouldReplace) ? $(replaceInput).addClass(theme).addClass(opts.className).addClass(opts.replacerClassName) : $([]),
            offsetElement = (shouldReplace) ? replacer : boundElement,
            previewElement = replacer.find(".sp-preview-inner"),
            initialColor = opts.color || (isInput && boundElement.val()),
            colorOnShow = false,
            currentPreferredFormat = opts.preferredFormat,
            clickoutFiresChange = !opts.showButtons || opts.clickoutFiresChange,
            isEmpty = !initialColor,
            allowEmpty = opts.allowEmpty;

        // Element to be updated with the input color. Populated in initialize method
        var originalInputContainer = null,
            colorizeElement = null,
            colorizeElementInitialColor = null,
            colorizeElementInitialBackground = null;

        //If there is a label for this element, when clicked on, show the colour picker
        var thisId = boundElement.attr('id');
        if(thisId !== undefined && thisId.length > 0) {
            var label = $('label[for="'+thisId+'"]');
            if(label.length) {
                label.on('click', function(e){
                    e.preventDefault();
                    boundElement.spectrum('show');
                    return false;
                });
            }
        }
        
        function applyOptions() {

            if (opts.showPaletteOnly) {
                opts.showPalette = true;
            }

            toggleButton.text(opts.showPaletteOnly ? opts.togglePaletteMoreText : opts.togglePaletteLessText);

            if (opts.palette) {
                palette = opts.palette.slice(0);
                paletteArray = $.isArray(palette[0]) ? palette : [palette];
                paletteLookup = {};
                for (var i = 0; i < paletteArray.length; i++) {
                    for (var j = 0; j < paletteArray[i].length; j++) {
                        var rgb = tinycolor(paletteArray[i][j]).toRgbString();
                        paletteLookup[rgb] = true;
                    }
                }

                // if showPaletteOnly and didn't set initialcolor
                // set initialcolor to first palette
                if (opts.showPaletteOnly && !opts.color) {
                    initialColor = (palette[0][0] === '') ? palette[0][0] : Object.keys(paletteLookup)[0];
                }
            }

            container.toggleClass("sp-flat", flat);
            container.toggleClass("sp-input-disabled", !opts.showInput);
            container.toggleClass("sp-alpha-enabled", opts.showAlpha);
            container.toggleClass("sp-clear-enabled", allowEmpty);
            container.toggleClass("sp-buttons-disabled", !opts.showButtons);
            container.toggleClass("sp-palette-buttons-disabled", !opts.togglePaletteOnly);
            container.toggleClass("sp-palette-disabled", !opts.showPalette);
            container.toggleClass("sp-palette-only", opts.showPaletteOnly);
            container.toggleClass("sp-initial-disabled", !opts.showInitial);
            container.addClass(opts.className).addClass(opts.containerClassName);

            reflow();
        }

        function initialize() {

            if (IE) {
                container.find("*:not(input)").attr("unselectable", "on");
            }

            applyOptions();

            originalInputContainer = $('<span class="sp-original-input-container"></span>');
            ['margin'].forEach(function(cssProp) {
                originalInputContainer.css(cssProp, boundElement.css(cssProp));
            });
            // inline-flex by default, switching to flex if needed
            if (boundElement.css('display') == 'block') originalInputContainer.css('display', 'flex');

            if (shouldReplace) {
                boundElement.after(replacer).hide();
            } else if (type == 'text') {
                originalInputContainer.addClass('sp-colorize-container');
                boundElement.addClass('spectrum sp-colorize').wrap(originalInputContainer);
            } else if (type == 'component') {
                boundElement.addClass('spectrum').wrap(originalInputContainer);
                var addOn = $(["<div class='sp-colorize-container sp-add-on'>",
                    "<div class='sp-colorize'></div> ",
                "</div>"].join(''));
                addOn.width(boundElement.outerHeight() + 'px')
                     .css('border-radius', boundElement.css('border-radius'))
                     .css('border', boundElement.css('border'));
                boundElement.addClass('with-add-on').before(addOn);
            }

            colorizeElement = boundElement.parent().find('.sp-colorize');
            colorizeElementInitialColor = colorizeElement.css('color');
            colorizeElementInitialBackground = colorizeElement.css('background-color');

            if (!allowEmpty) {
                clearButton.hide();
            }

            if (flat) {
                boundElement.after(container).hide();
            }
            else {

                var appendTo = opts.appendTo === "parent" ? boundElement.parent() : $(opts.appendTo);
                if (appendTo.length !== 1) {
                    appendTo = $("body");
                }

                appendTo.append(container);
            }

            updateSelectionPaletteFromStorage();

            offsetElement.on("click.spectrum touchstart.spectrum", function (e) {
                if (!disabled) {
                    toggle();
                }

                e.stopPropagation();

                if (!$(e.target).is("input")) {
                    e.preventDefault();
                }
            });

            if(boundElement.is(":disabled") || (opts.disabled === true)) {
                disable();
            }

            // Prevent clicks from bubbling up to document.  This would cause it to be hidden.
            container.click(stopPropagation);

            // Handle user typed input
            [textInput, boundElement].forEach(function(input) {
                input.change(function() { setFromTextInput(input.val()); });
                input.on("paste", function () {
                    setTimeout(function() { setFromTextInput(input.val()); }, 1);
                });
                input.keydown(function (e) { if (e.keyCode == 13) {
                    setFromTextInput($(input).val());
                    if (input == boundElement) hide();
                } });
            });

            cancelButton.text(opts.cancelText);
            cancelButton.on("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();
                revert();
                hide();
            });

            clearButton.attr("title", opts.clearText);
            clearButton.on("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();
                isEmpty = true;
                move();

                if(flat) {
                    //for the flat style, this is a change event
                    updateOriginalInput(true);
                }
            });

            chooseButton.text(opts.chooseText);
            chooseButton.on("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();

                if (IE && textInput.is(":focus")) {
                    textInput.trigger('change');
                }

                if (isValid()) {
                    updateOriginalInput(true);
                    hide();
                }
            });

            toggleButton.text(opts.showPaletteOnly ? opts.togglePaletteMoreText : opts.togglePaletteLessText);
            toggleButton.on("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();

                opts.showPaletteOnly = !opts.showPaletteOnly;

                // To make sure the Picker area is drawn on the right, next to the
                // Palette area (and not below the palette), first move the Palette
                // to the left to make space for the picker, plus 5px extra.
                // The 'applyOptions' function puts the whole container back into place
                // and takes care of the button-text and the sp-palette-only CSS class.
                if (!opts.showPaletteOnly && !flat) {
                    container.css('left', '-=' + (pickerContainer.outerWidth(true) + 5));
                }
                applyOptions();
            });

            draggable(alphaSlider, function (dragX, dragY, e) {
                currentAlpha = (dragX / alphaWidth);
                isEmpty = false;
                if (e.shiftKey) {
                    currentAlpha = Math.round(currentAlpha * 10) / 10;
                }

                move();
            }, dragStart, dragStop);

            draggable(slider, function (dragX, dragY) {
                currentHue = parseFloat(dragY / slideHeight);
                isEmpty = false;
                if (!opts.showAlpha) {
                    currentAlpha = 1;
                }
                move();
            }, dragStart, dragStop);

            draggable(dragger, function (dragX, dragY, e) {

                // shift+drag should snap the movement to either the x or y axis.
                if (!e.shiftKey) {
                    shiftMovementDirection = null;
                }
                else if (!shiftMovementDirection) {
                    var oldDragX = currentSaturation * dragWidth;
                    var oldDragY = dragHeight - (currentValue * dragHeight);
                    var furtherFromX = Math.abs(dragX - oldDragX) > Math.abs(dragY - oldDragY);

                    shiftMovementDirection = furtherFromX ? "x" : "y";
                }

                var setSaturation = !shiftMovementDirection || shiftMovementDirection === "x";
                var setValue = !shiftMovementDirection || shiftMovementDirection === "y";

                if (setSaturation) {
                    currentSaturation = parseFloat(dragX / dragWidth);
                }
                if (setValue) {
                    currentValue = parseFloat((dragHeight - dragY) / dragHeight);
                }

                isEmpty = false;
                if (!opts.showAlpha) {
                    currentAlpha = 1;
                }

                move();

            }, dragStart, dragStop);

            if (!!initialColor) {
                set(initialColor);

                // In case color was black - update the preview UI and set the format
                // since the set function will not run (default color is black).
                updateUI();
                currentPreferredFormat = tinycolor(initialColor).format || opts.preferredFormat;
                addColorToSelectionPalette(initialColor);
            } else if (initialColor === '') {
                set(initialColor);
                updateUI();
            } else {
                updateUI();
            }

            if (flat) {
                show();
            }

            function paletteElementClick(e) {
                if (e.data && e.data.ignore) {
                    set($(e.target).closest(".sp-thumb-el").data("color"));
                    move();
                }
                else {
                    set($(e.target).closest(".sp-thumb-el").data("color"));
                    move();

                    // If the picker is going to close immediately, a palette selection
                    // is a change.  Otherwise, it's a move only.
                    if (opts.hideAfterPaletteSelect) {
                        updateOriginalInput(true);
                        hide();
                    } else {
                        updateOriginalInput();
                    }
                }

                return false;
            }

            var paletteEvent = IE ? "mousedown.spectrum" : "click.spectrum touchstart.spectrum";
            paletteContainer.on(paletteEvent, ".sp-thumb-el", paletteElementClick);
            initialColorContainer.on(paletteEvent, ".sp-thumb-el:nth-child(1)", { ignore: true }, paletteElementClick);
        }

        function updateSelectionPaletteFromStorage() {

            if (localStorageKey) {
                // Migrate old palettes over to new format.  May want to remove this eventually.
                try {
                    var localStorage = window.localStorage;
                    var oldPalette = localStorage[localStorageKey].split(",#");
                    if (oldPalette.length > 1) {
                        delete localStorage[localStorageKey];
                        $.each(oldPalette, function(i, c) {
                             addColorToSelectionPalette(c);
                        });
                    }
                }
                catch(e) { }

                try {
                    selectionPalette = window.localStorage[localStorageKey].split(";");
                }
                catch (e) { }
            }
        }

        function addColorToSelectionPalette(color) {
            if (showSelectionPalette) {
                var rgb = tinycolor(color).toRgbString();
                if (!paletteLookup[rgb] && $.inArray(rgb, selectionPalette) === -1) {
                    selectionPalette.push(rgb);
                    while(selectionPalette.length > maxSelectionSize) {
                        selectionPalette.shift();
                    }
                }

                if (localStorageKey) {
                    try {
                        window.localStorage[localStorageKey] = selectionPalette.join(";");
                    }
                    catch(e) { }
                }
            }
        }

        function getUniqueSelectionPalette() {
            var unique = [];
            if (opts.showPalette) {
                for (var i = 0; i < selectionPalette.length; i++) {
                    var rgb = tinycolor(selectionPalette[i]).toRgbString();

                    if (!paletteLookup[rgb]) {
                        unique.push(selectionPalette[i]);
                    }
                }
            }

            return unique.reverse().slice(0, opts.maxSelectionSize);
        }

        function drawPalette() {

            var currentColor = get();

            var html = $.map(paletteArray, function (palette, i) {
                return paletteTemplate(palette, currentColor, "sp-palette-row sp-palette-row-" + i, opts);
            });

            updateSelectionPaletteFromStorage();

            if (selectionPalette) {
                html.push(paletteTemplate(getUniqueSelectionPalette(), currentColor, "sp-palette-row sp-palette-row-selection", opts));
            }

            paletteContainer.html(html.join(""));
        }

        function drawInitial() {
            if (opts.showInitial) {
                var initial = colorOnShow;
                var current = get();
                initialColorContainer.html(paletteTemplate([initial, current], current, "sp-palette-row-initial", opts));
            }
        }

        function dragStart() {
            if (dragHeight <= 0 || dragWidth <= 0 || slideHeight <= 0) {
                reflow();
            }
            isDragging = true;
            container.addClass(draggingClass);
            shiftMovementDirection = null;
            boundElement.trigger('dragstart.spectrum', [ get() ]);
        }

        function dragStop() {
            isDragging = false;
            container.removeClass(draggingClass);
            boundElement.trigger('dragstop.spectrum', [ get() ]);
        }

        function setFromTextInput(value) {
            if (abortNextInputChange) { abortNextInputChange = false; return; }
            if ((value === null || value === "") && allowEmpty) {
                set(null);
                move();
                updateOriginalInput();
            }
            else {
                var tiny = tinycolor(value);
                if (tiny.isValid()) {
                    set(tiny);
                    move();
                    updateOriginalInput();
                }
                else {
                    textInput.addClass("sp-validation-error");
                }
            }
        }

        function toggle() {
            if (visible) {
                hide();
            }
            else {
                show();
            }
        }

        function show() {
            // debugger;
            var event = $.Event('beforeShow.spectrum');

            if (visible) {
                reflow();
                return;
            }

            boundElement.trigger(event, [ get() ]);

            if (callbacks.beforeShow(get()) === false || event.isDefaultPrevented()) {
                return;
            }

            hideAll();
            visible = true;

            $(doc).on("keydown.spectrum", onkeydown);
            $(doc).on("click.spectrum", clickout);
            $(window).on("resize.spectrum", resize);
            replacer.addClass("sp-active");
            container.removeClass("sp-hidden");

            reflow();
            updateUI();

            colorOnShow = get();

            drawInitial();
            callbacks.show(colorOnShow);
            boundElement.trigger('show.spectrum', [ colorOnShow ]);
        }

        function onkeydown(e) {
            // Close on ESC
            if (e.keyCode === 27) {
                //hide(); !!!
            }
        }

        function clickout(e) {
            // Return on right click.
            if (e.button == 2) { return; }

            // If a drag event was happening during the mouseup, don't hide
            // on click.
            if (isDragging) { return; }

            if (clickoutFiresChange) {
                updateOriginalInput(true);
            }
            else {
                revert();
            }
            // hide(); !!!
        }

        function hide() {
            // Return if hiding is unnecessary
            if (!visible || flat) { return; }
            visible = false;

            $(doc).off("keydown.spectrum", onkeydown);
            $(doc).off("click.spectrum", clickout);
            $(window).off("resize.spectrum", resize);

            replacer.removeClass("sp-active");
            container.addClass("sp-hidden");

            callbacks.hide(get());
            boundElement.trigger('hide.spectrum', [ get() ]);
        }

        function revert() {
            set(colorOnShow, true);
            updateOriginalInput(true);
        }

        function set(color, ignoreFormatChange) {
            if (tinycolor.equals(color, get())) {
                // Update UI just in case a validation error needs
                // to be cleared.
                updateUI();
                return;
            }

            var newColor, newHsv;
            if ((!color || color === undefined) && allowEmpty) {
                isEmpty = true;
            } else {
                isEmpty = false;
                newColor = tinycolor(color);
                newHsv = newColor.toHsv();

                currentHue = (newHsv.h % 360) / 360;
                currentSaturation = newHsv.s;
                currentValue = newHsv.v;
                currentAlpha = newHsv.a;
            }
            updateUI();

            if (newColor && newColor.isValid() && !ignoreFormatChange) {
                currentPreferredFormat = opts.preferredFormat || newColor.getFormat();
            }
        }

        function get(opts) {
            opts = opts || { };

            if (allowEmpty && isEmpty) {
                return null;
            }

            return tinycolor.fromRatio({
                h: currentHue,
                s: currentSaturation,
                v: currentValue,
                a: Math.round(currentAlpha * 1000) / 1000
            }, { format: opts.format || currentPreferredFormat });
        }

        function isValid() {
            return !textInput.hasClass("sp-validation-error");
        }

        function move() {
            updateUI();

            callbacks.move(get());
            boundElement.trigger('move.spectrum', [ get() ]);
        }

        function updateUI() {

            textInput.removeClass("sp-validation-error");

            updateHelperLocations();

            // Update dragger background color (gradients take care of saturation and value).
            var flatColor = tinycolor.fromRatio({ h: currentHue, s: 1, v: 1 });
            dragger.css("background-color", flatColor.toHexString());

            // Get a format that alpha will be included in (hex and names ignore alpha)
            var format = currentPreferredFormat;
            if (currentAlpha < 1 && !(currentAlpha === 0 && format === "name")) {
                if (format === "hex" || format === "hex3" || format === "hex6" || format === "name") {
                    format = "rgb";
                }
            }

            var realColor = get({ format: format }),
                displayColor = '';

             //reset background info for preview element
            previewElement.removeClass("sp-clear-display");
            previewElement.css('background-color', 'transparent');

            if (!realColor && allowEmpty) {
                // Update the replaced elements background with icon indicating no color selection
                previewElement.addClass("sp-clear-display");
            }
            else {
                var realHex = realColor.toHexString(),
                    realRgb = realColor.toRgbString();

                // Update the replaced elements background color (with actual selected color)
                if (rgbaSupport || realColor.alpha === 1) {
                    previewElement.css("background-color", realRgb);
                }
                else {
                    previewElement.css("background-color", "transparent");
                    previewElement.css("filter", realColor.toFilter());
                }

                if (opts.showAlpha) {
                    var rgb = realColor.toRgb();
                    rgb.a = 0;
                    var realAlpha = tinycolor(rgb).toRgbString();
                    var gradient = "linear-gradient(left, " + realAlpha + ", " + realHex + ")";

                    if (IE) {
                        alphaSliderInner.css("filter", tinycolor(realAlpha).toFilter({ gradientType: 1 }, realHex));
                    }
                    else {
                        alphaSliderInner.css("background", "-webkit-" + gradient);
                        alphaSliderInner.css("background", "-moz-" + gradient);
                        alphaSliderInner.css("background", "-ms-" + gradient);
                        // Use current syntax gradient on unprefixed property.
                        alphaSliderInner.css("background",
                            "linear-gradient(to right, " + realAlpha + ", " + realHex + ")");
                    }
                }

                displayColor = realColor.toString(format);
            }

            // Update the text entry input as it changes happen
            if (opts.showInput) {
                textInput.val(displayColor);
            }
            boundElement.val(displayColor);

            // !!!
            if (displayColor) {

                changeElementsBgColor(displayColor);

                // $('body').css("background-color", displayColor)
                // $('#container').css("background-color", displayColor)

            }


            if (opts.type == "text" || opts.type == "component") {
                var color = realColor;
                if (color && colorizeElement) {
                    var textColor = (color.isLight() || color.getAlpha() < 0.4) ? 'black' : 'white';
                    colorizeElement.css('background-color', color.toRgbString()).css('color', textColor);
                } else {
                    colorizeElement.css('background-color', colorizeElementInitialBackground)
                                   .css('color', colorizeElementInitialColor);
                }
            }

            if (opts.showPalette) {
                drawPalette();
            }

            drawInitial();
        }

        function updateHelperLocations() {
            var s = currentSaturation;
            var v = currentValue;

            if(allowEmpty && isEmpty) {
                //if selected color is empty, hide the helpers
                alphaSlideHelper.hide();
                slideHelper.hide();
                dragHelper.hide();
            }
            else {
                //make sure helpers are visible
                alphaSlideHelper.show();
                slideHelper.show();
                dragHelper.show();

                // Where to show the little circle in that displays your current selected color
                var dragX = s * dragWidth;
                var dragY = dragHeight - (v * dragHeight);
                dragX = Math.max(
                    -dragHelperHeight,
                    Math.min(dragWidth - dragHelperHeight, dragX - dragHelperHeight)
                );
                dragY = Math.max(
                    -dragHelperHeight,
                    Math.min(dragHeight - dragHelperHeight, dragY - dragHelperHeight)
                );
                dragHelper.css({
                    "top": dragY + "px",
                    "left": dragX + "px"
                });

                var alphaX = currentAlpha * alphaWidth;
                alphaSlideHelper.css({
                    "left": (alphaX - (alphaSlideHelperWidth / 2)) + "px"
                });

                // Where to show the bar that displays your current selected hue
                var slideY = (currentHue) * slideHeight;
                slideHelper.css({
                    "top": (slideY - slideHelperHeight) + "px"
                });
            }
        }

        function updateOriginalInput(fireCallback) {
            var color = get(),
                displayColor = '',
                hasChanged = !tinycolor.equals(color, colorOnShow);

            if (color) {
                displayColor = color.toString(currentPreferredFormat);
                // Update the selection palette with the current color
                addColorToSelectionPalette(color);
            }

            if (fireCallback && hasChanged) {
                callbacks.change(color);
                // we trigger the change event or input, but the input change event is also binded
                // to some spectrum processing, that we do no need
                abortNextInputChange = true;
                boundElement.trigger('change', [ color ]);
            }
        }

        function reflow() {
            if (!visible) {
                return; // Calculations would be useless and wouldn't be reliable anyways
            }
            dragWidth = dragger.width();
            dragHeight = dragger.height();
            dragHelperHeight = dragHelper.height();
            slideWidth = slider.width();
            slideHeight = slider.height();
            slideHelperHeight = slideHelper.height();
            alphaWidth = alphaSlider.width();
            alphaSlideHelperWidth = alphaSlideHelper.width();

            // !!!
            // if (!flat) {
            //     container.css("position", "absolute");
            //     if (opts.offset) {
            //         container.offset(opts.offset);
            //     } else {
            //         container.offset(getOffset(container, offsetElement));
            //     }
            // }

            updateHelperLocations();

            if (opts.showPalette) {
                drawPalette();
            }

            boundElement.trigger('reflow.spectrum');
        }

        function destroy() {
            boundElement.show().removeClass('spectrum with-add-on sp-colorize');
            offsetElement.off("click.spectrum touchstart.spectrum");
            container.remove();
            replacer.remove();
            if (colorizeElement) {
                colorizeElement.css('background-color', colorizeElementInitialBackground)
                               .css('color', colorizeElementInitialColor);
            }
            var originalInputContainer = boundElement.closest('.sp-original-input-container');
            if (originalInputContainer.length > 0) {
                originalInputContainer.after(boundElement).remove();
            }
            spectrums[spect.id] = null;
        }

        function option(optionName, optionValue) {
            if (optionName === undefined) {
                return $.extend({}, opts);
            }
            if (optionValue === undefined) {
                return opts[optionName];
            }

            opts[optionName] = optionValue;

            if (optionName === "preferredFormat") {
                currentPreferredFormat = opts.preferredFormat;
            }
            applyOptions();
        }

        function enable() {
            disabled = false;
            boundElement.attr("disabled", false);
            offsetElement.removeClass("sp-disabled");
        }

        function disable() {
            hide();
            disabled = true;
            boundElement.attr("disabled", true);
            offsetElement.addClass("sp-disabled");
        }

        function setOffset(coord) {
            opts.offset = coord;
            reflow();
        }

        initialize();

        var spect = {
            show: show,
            hide: hide,
            toggle: toggle,
            reflow: reflow,
            option: option,
            enable: enable,
            disable: disable,
            offset: setOffset,
            set: function (c) {
                set(c);
                updateOriginalInput();
            },
            get: get,
            destroy: destroy,
            container: container
        };

        spect.id = spectrums.push(spect) - 1;

        return spect;
    }

    /**
    * checkOffset - get the offset below/above and left/right element depending on screen position
    * Thanks https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.datepicker.js
    */
    function getOffset(picker, input) {
        var extraY = 0;
        var dpWidth = picker.outerWidth();
        var dpHeight = picker.outerHeight();
        var inputHeight = input.outerHeight();
        var doc = picker[0].ownerDocument;
        var docElem = doc.documentElement;
        var viewWidth = docElem.clientWidth + $(doc).scrollLeft();
        var viewHeight = docElem.clientHeight + $(doc).scrollTop();
        var offset = input.offset();
        var offsetLeft = offset.left;
        var offsetTop = offset.top;

        offsetTop += inputHeight;

        offsetLeft -=
            Math.min(offsetLeft, (offsetLeft + dpWidth > viewWidth && viewWidth > dpWidth) ?
            Math.abs(offsetLeft + dpWidth - viewWidth) : 0);

        offsetTop -=
            Math.min(offsetTop, ((offsetTop + dpHeight > viewHeight && viewHeight > dpHeight) ?
            Math.abs(dpHeight + inputHeight - extraY) : extraY));

        return {
            top: offsetTop,
            bottom: offset.bottom,
            left: offsetLeft,
            right: offset.right,
            width: offset.width,
            height: offset.height
        };
    }

    /**
    * noop - do nothing
    */
    function noop() {

    }

    /**
    * stopPropagation - makes the code only doing this a little easier to read in line
    */
    function stopPropagation(e) {
        e.stopPropagation();
    }

    /**
    * Create a function bound to a given object
    * Thanks to underscore.js
    */
    function bind(func, obj) {
        var slice = Array.prototype.slice;
        var args = slice.call(arguments, 2);
        return function () {
            return func.apply(obj, args.concat(slice.call(arguments)));
        };
    }

    /**
    * Lightweight drag helper.  Handles containment within the element, so that
    * when dragging, the x is within [0,element.width] and y is within [0,element.height]
    */
    function draggable(element, onmove, onstart, onstop) {
        onmove = onmove || function () { };
        onstart = onstart || function () { };
        onstop = onstop || function () { };
        var doc = document;
        var dragging = false;
        var offset = {};
        var maxHeight = 0;
        var maxWidth = 0;
        var hasTouch = ('ontouchstart' in window);

        var duringDragEvents = {};
        duringDragEvents["selectstart"] = prevent;
        duringDragEvents["dragstart"] = prevent;
        duringDragEvents["touchmove mousemove"] = move;
        duringDragEvents["touchend mouseup"] = stop;

        function prevent(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.returnValue = false;
        }

        function move(e) {
            if (dragging) {
                // Mouseup happened outside of window
                if (IE && doc.documentMode < 9 && !e.button) {
                    return stop();
                }

                var t0 = e.originalEvent && e.originalEvent.touches && e.originalEvent.touches[0];
                var pageX = t0 && t0.pageX || e.pageX;
                var pageY = t0 && t0.pageY || e.pageY;

                var dragX = Math.max(0, Math.min(pageX - offset.left, maxWidth));
                var dragY = Math.max(0, Math.min(pageY - offset.top, maxHeight));

                if (hasTouch) {
                    // Stop scrolling in iOS
                    prevent(e);
                }

                onmove.apply(element, [dragX, dragY, e]);
            }
        }

        function start(e) {
            var rightclick = (e.which) ? (e.which == 3) : (e.button == 2);

            if (!rightclick && !dragging) {
                if (onstart.apply(element, arguments) !== false) {
                    dragging = true;
                    maxHeight = $(element).height();
                    maxWidth = $(element).width();
                    offset = $(element).offset();

                    $(doc).on(duringDragEvents);
                    $(doc.body).addClass("sp-dragging");

                    move(e);

                    prevent(e);
                }
            }
        }

        function stop() {
            if (dragging) {
                $(doc).off(duringDragEvents);
                $(doc.body).removeClass("sp-dragging");

                // Wait a tick before notifying observers to allow the click event
                // to fire in Chrome.
                setTimeout(function() {
                    onstop.apply(element, arguments);
                }, 0);
            }
            dragging = false;
        }

        $(element).on("touchstart mousedown", start);
    }

    function throttle(func, wait, debounce) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var throttler = function () {
                timeout = null;
                func.apply(context, args);
            };
            if (debounce) clearTimeout(timeout);
            if (debounce || !timeout) timeout = setTimeout(throttler, wait);
        };
    }

    function inputTypeColorSupport() {
        return $.fn.spectrum.inputTypeColorSupport();
    }

    /**
    * Define a jQuery plugin
    */
    var dataID = "spectrum.id";
    $.fn.spectrum = function (opts, extra) {

        if (typeof opts == "string") {

            var returnValue = this;
            var args = Array.prototype.slice.call( arguments, 1 );

            this.each(function () {
                var spect = spectrums[$(this).data(dataID)];
                if (spect) {
                    var method = spect[opts];
                    if (!method) {
                        throw new Error( "Spectrum: no such method: '" + opts + "'" );
                    }

                    if (opts == "get") {
                        returnValue = spect.get();
                    }
                    else if (opts == "container") {
                        returnValue = spect.container;
                    }
                    else if (opts == "option") {
                        returnValue = spect.option.apply(spect, args);
                    }
                    else if (opts == "destroy") {
                        spect.destroy();
                        $(this).removeData(dataID);
                    }
                    else {
                        method.apply(spect, args);
                    }
                }
            });

            return returnValue;
        }

        // Initializing a new instance of spectrum
        return this.spectrum("destroy").each(function () {
            var options = $.extend({}, $(this).data(), opts);
            // Infer default type from input params and deprecated options
            if (!$(this).is('input')) options.type = 'noInput';
            else if (options.flat || options.type == "flat") options.type = 'flat';
            else if ($(this).attr('type') == 'color') options.type = 'color';
            else options.type = options.type || 'component';

            var spect = spectrum(this, options);
            $(this).data(dataID, spect.id);
        });
    };

    $.fn.spectrum.load = true;
    $.fn.spectrum.loadOpts = {};
    $.fn.spectrum.draggable = draggable;
    $.fn.spectrum.defaults = defaultOpts;
    $.fn.spectrum.inputTypeColorSupport = function inputTypeColorSupport() {
        if (typeof inputTypeColorSupport._cachedResult === "undefined") {
            var colorInput = $("<input type='color'/>")[0]; // if color element is supported, value will default to not null
            inputTypeColorSupport._cachedResult = colorInput.type === "color" && colorInput.value !== "";
        }
        return inputTypeColorSupport._cachedResult;
    };

    $.spectrum = { };
    $.spectrum.localization = { };
    $.spectrum.palettes = { };

    $.fn.spectrum.processNativeColorInputs = function () {
        var colorInputs = $("input[type=color]");
        if (colorInputs.length && !inputTypeColorSupport()) {
            colorInputs.spectrum({
                preferredFormat: "hex6"
            });
        }
    };

    // TinyColor v1.1.2
    // https://github.com/bgrins/TinyColor
    // Brian Grinstead, MIT License

    (function() {

    var trimLeft = /^[\s,#]+/,
        trimRight = /\s+$/,
        tinyCounter = 0,
        math = Math,
        mathRound = math.round,
        mathMin = math.min,
        mathMax = math.max,
        mathRandom = math.random;

    var tinycolor = function(color, opts) {

        color = (color) ? color : '';
        opts = opts || { };

        // If input is already a tinycolor, return itself
        if (color instanceof tinycolor) {
           return color;
        }
        // If we are called as a function, call using new instead
        if (!(this instanceof tinycolor)) {
            return new tinycolor(color, opts);
        }

        var rgb = inputToRGB(color);
        this._originalInput = color;
        this._r = rgb.r;
        this._g = rgb.g;
        this._b = rgb.b;
        this._a = rgb.a;
        this._roundA = mathRound(1000 * this._a) / 1000;
        this._format = opts.format || rgb.format;
        this._gradientType = opts.gradientType;

        // Don't let the range of [0,255] come back in [0,1].
        // Potentially lose a little bit of precision here, but will fix issues where
        // .5 gets interpreted as half of the total, instead of half of 1
        // If it was supposed to be 128, this was already taken care of by `inputToRgb`
        if (this._r < 1) { this._r = mathRound(this._r); }
        if (this._g < 1) { this._g = mathRound(this._g); }
        if (this._b < 1) { this._b = mathRound(this._b); }

        this._ok = rgb.ok;
        this._tc_id = tinyCounter++;
    };

    tinycolor.prototype = {
        isDark: function() {
            return this.getBrightness() < 128;
        },
        isLight: function() {
            return !this.isDark();
        },
        isValid: function() {
            return this._ok;
        },
        getOriginalInput: function() {
          return this._originalInput;
        },
        getFormat: function() {
            return this._format;
        },
        getAlpha: function() {
            return this._a;
        },
        getBrightness: function() {
            var rgb = this.toRgb();
            return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        },
        setAlpha: function(value) {
            this._a = boundAlpha(value);
            this._roundA = mathRound(1000 * this._a) / 1000;
            return this;
        },
        toHsv: function() {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
        },
        toHsvString: function() {
            var hsv = rgbToHsv(this._r, this._g, this._b);
            var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
            return (this._a == 1) ?
              "hsv("  + h + ", " + s + "%, " + v + "%)" :
              "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
        },
        toHsl: function() {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
        },
        toHslString: function() {
            var hsl = rgbToHsl(this._r, this._g, this._b);
            var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
            return (this._a == 1) ?
              "hsl("  + h + ", " + s + "%, " + l + "%)" :
              "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
        },
        toHex: function(allow3Char) {
            return rgbToHex(this._r, this._g, this._b, allow3Char);
        },
        toHexString: function(allow3Char) {
            return '#' + this.toHex(allow3Char);
        },
        toHex8: function() {
            return rgbaToHex(this._r, this._g, this._b, this._a);
        },
        toHex8String: function() {
            return '#' + this.toHex8();
        },
        toRgb: function() {
            return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
        },
        toRgbString: function() {
            return (this._a == 1) ?
              "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
              "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
        },
        toPercentageRgb: function() {
            return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
        },
        toPercentageRgbString: function() {
            return (this._a == 1) ?
              "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
              "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
        },
        toName: function() {
            if (this._a === 0) {
                return "transparent";
            }

            if (this._a < 1) {
                return false;
            }

            return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
        },
        toFilter: function(secondColor) {
            var hex8String = '#' + rgbaToHex(this._r, this._g, this._b, this._a);
            var secondHex8String = hex8String;
            var gradientType = this._gradientType ? "GradientType = 1, " : "";

            if (secondColor) {
                var s = tinycolor(secondColor);
                secondHex8String = s.toHex8String();
            }

            return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
        },
        toString: function(format) {
            var formatSet = !!format;
            format = format || this._format;

            var formattedString = false;
            var hasAlpha = this._a < 1 && this._a >= 0;
            var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "name");

            if (needsAlphaFormat) {
                // Special case for "transparent", all other non-alpha formats
                // will return rgba when there is transparency.
                if (format === "name" && this._a === 0) {
                    return this.toName();
                }
                return this.toRgbString();
            }
            if (format === "rgb") {
                formattedString = this.toRgbString();
            }
            if (format === "prgb") {
                formattedString = this.toPercentageRgbString();
            }
            if (format === "hex" || format === "hex6") {
                formattedString = this.toHexString();
            }
            if (format === "hex3") {
                formattedString = this.toHexString(true);
            }
            if (format === "hex8") {
                formattedString = this.toHex8String();
            }
            if (format === "name") {
                formattedString = this.toName();
            }
            if (format === "hsl") {
                formattedString = this.toHslString();
            }
            if (format === "hsv") {
                formattedString = this.toHsvString();
            }

            return formattedString || this.toHexString();
        },

        _applyModification: function(fn, args) {
            var color = fn.apply(null, [this].concat([].slice.call(args)));
            this._r = color._r;
            this._g = color._g;
            this._b = color._b;
            this.setAlpha(color._a);
            return this;
        },
        lighten: function() {
            return this._applyModification(lighten, arguments);
        },
        brighten: function() {
            return this._applyModification(brighten, arguments);
        },
        darken: function() {
            return this._applyModification(darken, arguments);
        },
        desaturate: function() {
            return this._applyModification(desaturate, arguments);
        },
        saturate: function() {
            return this._applyModification(saturate, arguments);
        },
        greyscale: function() {
            return this._applyModification(greyscale, arguments);
        },
        spin: function() {
            return this._applyModification(spin, arguments);
        },

        _applyCombination: function(fn, args) {
            return fn.apply(null, [this].concat([].slice.call(args)));
        },
        analogous: function() {
            return this._applyCombination(analogous, arguments);
        },
        complement: function() {
            return this._applyCombination(complement, arguments);
        },
        monochromatic: function() {
            return this._applyCombination(monochromatic, arguments);
        },
        splitcomplement: function() {
            return this._applyCombination(splitcomplement, arguments);
        },
        triad: function() {
            return this._applyCombination(triad, arguments);
        },
        tetrad: function() {
            return this._applyCombination(tetrad, arguments);
        }
    };

    // If input is an object, force 1 into "1.0" to handle ratios properly
    // String input requires "1.0" as input, so 1 will be treated as 1
    tinycolor.fromRatio = function(color, opts) {
        if (typeof color == "object") {
            var newColor = {};
            for (var i in color) {
                if (color.hasOwnProperty(i)) {
                    if (i === "a") {
                        newColor[i] = color[i];
                    }
                    else {
                        newColor[i] = convertToPercentage(color[i]);
                    }
                }
            }
            color = newColor;
        }

        return tinycolor(color, opts);
    };

    // Given a string or object, convert that input to RGB
    // Possible string inputs:
    //
    //     "red"
    //     "#f00" or "f00"
    //     "#ff0000" or "ff0000"
    //     "#ff000000" or "ff000000"
    //     "rgb 255 0 0" or "rgb (255, 0, 0)"
    //     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
    //     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
    //     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
    //     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
    //     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
    //     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
    //
    function inputToRGB(color) {

        var rgb = { r: 0, g: 0, b: 0 };
        var a = 1;
        var ok = false;
        var format = false;

        if (typeof color == "string") {
            color = stringInputToObject(color);
        }

        if (typeof color == "object") {
            if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
                rgb = rgbToRgb(color.r, color.g, color.b);
                ok = true;
                format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
            }
            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v")) {
                color.s = convertToPercentage(color.s);
                color.v = convertToPercentage(color.v);
                rgb = hsvToRgb(color.h, color.s, color.v);
                ok = true;
                format = "hsv";
            }
            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("l")) {
                color.s = convertToPercentage(color.s);
                color.l = convertToPercentage(color.l);
                rgb = hslToRgb(color.h, color.s, color.l);
                ok = true;
                format = "hsl";
            }

            if (color.hasOwnProperty("a")) {
                a = color.a;
            }
        }

        a = boundAlpha(a);

        return {
            ok: ok,
            format: color.format || format,
            r: mathMin(255, mathMax(rgb.r, 0)),
            g: mathMin(255, mathMax(rgb.g, 0)),
            b: mathMin(255, mathMax(rgb.b, 0)),
            a: a
        };
    }


    // Conversion Functions
    // --------------------

    // `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
    // <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

    // `rgbToRgb`
    // Handle bounds / percentage checking to conform to CSS color spec
    // <http://www.w3.org/TR/css3-color/>
    // *Assumes:* r, g, b in [0, 255] or [0, 1]
    // *Returns:* { r, g, b } in [0, 255]
    function rgbToRgb(r, g, b){
        return {
            r: bound01(r, 255) * 255,
            g: bound01(g, 255) * 255,
            b: bound01(b, 255) * 255
        };
    }

    // `rgbToHsl`
    // Converts an RGB color value to HSL.
    // *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
    // *Returns:* { h, s, l } in [0,1]
    function rgbToHsl(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min) {
            h = s = 0; // achromatic
        }
        else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h: h, s: s, l: l };
    }

    // `hslToRgb`
    // Converts an HSL color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
    function hslToRgb(h, s, l) {
        var r, g, b;

        h = bound01(h, 360);
        s = bound01(s, 100);
        l = bound01(l, 100);

        function hue2rgb(p, q, t) {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        if(s === 0) {
            r = g = b = l; // achromatic
        }
        else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHsv`
    // Converts an RGB color value to HSV
    // *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
    // *Returns:* { h, s, v } in [0,1]
    function rgbToHsv(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max === 0 ? 0 : d / max;

        if(max == min) {
            h = 0; // achromatic
        }
        else {
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h, s: s, v: v };
    }

    // `hsvToRgb`
    // Converts an HSV color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
     function hsvToRgb(h, s, v) {

        h = bound01(h, 360) * 6;
        s = bound01(s, 100);
        v = bound01(v, 100);

        var i = math.floor(h),
            f = h - i,
            p = v * (1 - s),
            q = v * (1 - f * s),
            t = v * (1 - (1 - f) * s),
            mod = i % 6,
            r = [v, q, p, p, t, v][mod],
            g = [t, v, v, q, p, p][mod],
            b = [p, p, t, v, v, q][mod];

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHex`
    // Converts an RGB color to hex
    // Assumes r, g, and b are contained in the set [0, 255]
    // Returns a 3 or 6 character hex
    function rgbToHex(r, g, b, allow3Char) {

        var hex = [
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16))
        ];

        // Return a 3 character hex if possible
        if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
        }

        return hex.join("");
    }
        // `rgbaToHex`
        // Converts an RGBA color plus alpha transparency to hex
        // Assumes r, g, b and a are contained in the set [0, 255]
        // Returns an 8 character hex
        function rgbaToHex(r, g, b, a) {

            var hex = [
                pad2(convertDecimalToHex(a)),
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16))
        ];

        return hex.join("");
    }

    // `equals`
    // Can be called with any tinycolor input
    tinycolor.equals = function (color1, color2) {
        if (!color1 || !color2) { return false; }
        return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
    };
    tinycolor.random = function() {
        return tinycolor.fromRatio({
            r: mathRandom(),
            g: mathRandom(),
            b: mathRandom()
        });
    };


    // Modification Functions
    // ----------------------
    // Thanks to less.js for some of the basics here
    // <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

    function desaturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s -= amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function saturate(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s += amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    }

    function greyscale(color) {
        return tinycolor(color).desaturate(100);
    }

    function lighten (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l += amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    function brighten(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var rgb = tinycolor(color).toRgb();
        rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
        rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
        rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
        return tinycolor(rgb);
    }

    function darken (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l -= amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    }

    // Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
    // Values outside of this range will be wrapped into this range.
    function spin(color, amount) {
        var hsl = tinycolor(color).toHsl();
        var hue = (mathRound(hsl.h) + amount) % 360;
        hsl.h = hue < 0 ? 360 + hue : hue;
        return tinycolor(hsl);
    }

    // Combination Functions
    // ---------------------
    // Thanks to jQuery xColor for some of the ideas behind these
    // <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

    function complement(color) {
        var hsl = tinycolor(color).toHsl();
        hsl.h = (hsl.h + 180) % 360;
        return tinycolor(hsl);
    }

    function triad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
        ];
    }

    function tetrad(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
        ];
    }

    function splitcomplement(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
            tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
        ];
    }

    function analogous(color, results, slices) {
        results = results || 6;
        slices = slices || 30;

        var hsl = tinycolor(color).toHsl();
        var part = 360 / slices;
        var ret = [tinycolor(color)];

        for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
            hsl.h = (hsl.h + part) % 360;
            ret.push(tinycolor(hsl));
        }
        return ret;
    }

    function monochromatic(color, results) {
        results = results || 6;
        var hsv = tinycolor(color).toHsv();
        var h = hsv.h, s = hsv.s, v = hsv.v;
        var ret = [];
        var modification = 1 / results;

        while (results--) {
            ret.push(tinycolor({ h: h, s: s, v: v}));
            v = (v + modification) % 1;
        }

        return ret;
    }

    // Utility Functions
    // ---------------------

    tinycolor.mix = function(color1, color2, amount) {
        amount = (amount === 0) ? 0 : (amount || 50);

        var rgb1 = tinycolor(color1).toRgb();
        var rgb2 = tinycolor(color2).toRgb();

        var p = amount / 100;
        var w = p * 2 - 1;
        var a = rgb2.a - rgb1.a;

        var w1;

        if (w * a == -1) {
            w1 = w;
        } else {
            w1 = (w + a) / (1 + w * a);
        }

        w1 = (w1 + 1) / 2;

        var w2 = 1 - w1;

        var rgba = {
            r: rgb2.r * w1 + rgb1.r * w2,
            g: rgb2.g * w1 + rgb1.g * w2,
            b: rgb2.b * w1 + rgb1.b * w2,
            a: rgb2.a * p  + rgb1.a * (1 - p)
        };

        return tinycolor(rgba);
    };


    // Readability Functions
    // ---------------------
    // <http://www.w3.org/TR/AERT#color-contrast>

    // `readability`
    // Analyze the 2 colors and returns an object with the following properties:
    //    `brightness`: difference in brightness between the two colors
    //    `color`: difference in color/hue between the two colors
    tinycolor.readability = function(color1, color2) {
        var c1 = tinycolor(color1);
        var c2 = tinycolor(color2);
        var rgb1 = c1.toRgb();
        var rgb2 = c2.toRgb();
        var brightnessA = c1.getBrightness();
        var brightnessB = c2.getBrightness();
        var colorDiff = (
            Math.max(rgb1.r, rgb2.r) - Math.min(rgb1.r, rgb2.r) +
            Math.max(rgb1.g, rgb2.g) - Math.min(rgb1.g, rgb2.g) +
            Math.max(rgb1.b, rgb2.b) - Math.min(rgb1.b, rgb2.b)
        );

        return {
            brightness: Math.abs(brightnessA - brightnessB),
            color: colorDiff
        };
    };

    // `readable`
    // http://www.w3.org/TR/AERT#color-contrast
    // Ensure that foreground and background color combinations provide sufficient contrast.
    // *Example*
    //    tinycolor.isReadable("#000", "#111") => false
    tinycolor.isReadable = function(color1, color2) {
        var readability = tinycolor.readability(color1, color2);
        return readability.brightness > 125 && readability.color > 500;
    };

    // `mostReadable`
    // Given a base color and a list of possible foreground or background
    // colors for that base, returns the most readable color.
    // *Example*
    //    tinycolor.mostReadable("#123", ["#fff", "#000"]) => "#000"
    tinycolor.mostReadable = function(baseColor, colorList) {
        var bestColor = null;
        var bestScore = 0;
        var bestIsReadable = false;
        for (var i=0; i < colorList.length; i++) {

            // We normalize both around the "acceptable" breaking point,
            // but rank brightness constrast higher than hue.

            var readability = tinycolor.readability(baseColor, colorList[i]);
            var readable = readability.brightness > 125 && readability.color > 500;
            var score = 3 * (readability.brightness / 125) + (readability.color / 500);

            if ((readable && ! bestIsReadable) ||
                (readable && bestIsReadable && score > bestScore) ||
                ((! readable) && (! bestIsReadable) && score > bestScore)) {
                bestIsReadable = readable;
                bestScore = score;
                bestColor = tinycolor(colorList[i]);
            }
        }
        return bestColor;
    };


    // Big List of Colors
    // ------------------
    // <http://www.w3.org/TR/css3-color/#svg-color>
    var names = tinycolor.names = {
        aliceblue: "f0f8ff",
        antiquewhite: "faebd7",
        aqua: "0ff",
        aquamarine: "7fffd4",
        azure: "f0ffff",
        beige: "f5f5dc",
        bisque: "ffe4c4",
        black: "000",
        blanchedalmond: "ffebcd",
        blue: "00f",
        blueviolet: "8a2be2",
        brown: "a52a2a",
        burlywood: "deb887",
        burntsienna: "ea7e5d",
        cadetblue: "5f9ea0",
        chartreuse: "7fff00",
        chocolate: "d2691e",
        coral: "ff7f50",
        cornflowerblue: "6495ed",
        cornsilk: "fff8dc",
        crimson: "dc143c",
        cyan: "0ff",
        darkblue: "00008b",
        darkcyan: "008b8b",
        darkgoldenrod: "b8860b",
        darkgray: "a9a9a9",
        darkgreen: "006400",
        darkgrey: "a9a9a9",
        darkkhaki: "bdb76b",
        darkmagenta: "8b008b",
        darkolivegreen: "556b2f",
        darkorange: "ff8c00",
        darkorchid: "9932cc",
        darkred: "8b0000",
        darksalmon: "e9967a",
        darkseagreen: "8fbc8f",
        darkslateblue: "483d8b",
        darkslategray: "2f4f4f",
        darkslategrey: "2f4f4f",
        darkturquoise: "00ced1",
        darkviolet: "9400d3",
        deeppink: "ff1493",
        deepskyblue: "00bfff",
        dimgray: "696969",
        dimgrey: "696969",
        dodgerblue: "1e90ff",
        firebrick: "b22222",
        floralwhite: "fffaf0",
        forestgreen: "228b22",
        fuchsia: "f0f",
        gainsboro: "dcdcdc",
        ghostwhite: "f8f8ff",
        gold: "ffd700",
        goldenrod: "daa520",
        gray: "808080",
        green: "008000",
        greenyellow: "adff2f",
        grey: "808080",
        honeydew: "f0fff0",
        hotpink: "ff69b4",
        indianred: "cd5c5c",
        indigo: "4b0082",
        ivory: "fffff0",
        khaki: "f0e68c",
        lavender: "e6e6fa",
        lavenderblush: "fff0f5",
        lawngreen: "7cfc00",
        lemonchiffon: "fffacd",
        lightblue: "add8e6",
        lightcoral: "f08080",
        lightcyan: "e0ffff",
        lightgoldenrodyellow: "fafad2",
        lightgray: "d3d3d3",
        lightgreen: "90ee90",
        lightgrey: "d3d3d3",
        lightpink: "ffb6c1",
        lightsalmon: "ffa07a",
        lightseagreen: "20b2aa",
        lightskyblue: "87cefa",
        lightslategray: "789",
        lightslategrey: "789",
        lightsteelblue: "b0c4de",
        lightyellow: "ffffe0",
        lime: "0f0",
        limegreen: "32cd32",
        linen: "faf0e6",
        magenta: "f0f",
        maroon: "800000",
        mediumaquamarine: "66cdaa",
        mediumblue: "0000cd",
        mediumorchid: "ba55d3",
        mediumpurple: "9370db",
        mediumseagreen: "3cb371",
        mediumslateblue: "7b68ee",
        mediumspringgreen: "00fa9a",
        mediumturquoise: "48d1cc",
        mediumvioletred: "c71585",
        midnightblue: "191970",
        mintcream: "f5fffa",
        mistyrose: "ffe4e1",
        moccasin: "ffe4b5",
        navajowhite: "ffdead",
        navy: "000080",
        oldlace: "fdf5e6",
        olive: "808000",
        olivedrab: "6b8e23",
        orange: "ffa500",
        orangered: "ff4500",
        orchid: "da70d6",
        palegoldenrod: "eee8aa",
        palegreen: "98fb98",
        paleturquoise: "afeeee",
        palevioletred: "db7093",
        papayawhip: "ffefd5",
        peachpuff: "ffdab9",
        peru: "cd853f",
        pink: "ffc0cb",
        plum: "dda0dd",
        powderblue: "b0e0e6",
        purple: "800080",
        rebeccapurple: "663399",
        red: "f00",
        rosybrown: "bc8f8f",
        royalblue: "4169e1",
        saddlebrown: "8b4513",
        salmon: "fa8072",
        sandybrown: "f4a460",
        seagreen: "2e8b57",
        seashell: "fff5ee",
        sienna: "a0522d",
        silver: "c0c0c0",
        skyblue: "87ceeb",
        slateblue: "6a5acd",
        slategray: "708090",
        slategrey: "708090",
        snow: "fffafa",
        springgreen: "00ff7f",
        steelblue: "4682b4",
        tan: "d2b48c",
        teal: "008080",
        thistle: "d8bfd8",
        tomato: "ff6347",
        turquoise: "40e0d0",
        violet: "ee82ee",
        wheat: "f5deb3",
        white: "fff",
        whitesmoke: "f5f5f5",
        yellow: "ff0",
        yellowgreen: "9acd32"
    };

    // Make it easy to access colors via `hexNames[hex]`
    var hexNames = tinycolor.hexNames = flip(names);


    // Utilities
    // ---------

    // `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
    function flip(o) {
        var flipped = { };
        for (var i in o) {
            if (o.hasOwnProperty(i)) {
                flipped[o[i]] = i;
            }
        }
        return flipped;
    }

    // Return a valid alpha value [0,1] with all invalid values being set to 1
    function boundAlpha(a) {
        a = parseFloat(a);

        if (isNaN(a) || a < 0 || a > 1) {
            a = 1;
        }

        return a;
    }

    // Take input from [0, n] and return it as [0, 1]
    function bound01(n, max) {
        if (isOnePointZero(n)) { n = "100%"; }

        var processPercent = isPercentage(n);
        n = mathMin(max, mathMax(0, parseFloat(n)));

        // Automatically convert percentage into number
        if (processPercent) {
            n = parseInt(n * max, 10) / 100;
        }

        // Handle floating point rounding errors
        if ((math.abs(n - max) < 0.000001)) {
            return 1;
        }

        // Convert into [0, 1] range if it isn't already
        return (n % max) / parseFloat(max);
    }

    // Force a number between 0 and 1
    function clamp01(val) {
        return mathMin(1, mathMax(0, val));
    }

    // Parse a base-16 hex value into a base-10 integer
    function parseIntFromHex(val) {
        return parseInt(val, 16);
    }

    // Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
    // <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
    function isOnePointZero(n) {
        return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
    }

    // Check to see if string passed in is a percentage
    function isPercentage(n) {
        return typeof n === "string" && n.indexOf('%') != -1;
    }

    // Force a hex value to have 2 characters
    function pad2(c) {
        return c.length == 1 ? '0' + c : '' + c;
    }

    // Replace a decimal with it's percentage value
    function convertToPercentage(n) {
        if (n <= 1) {
            n = (n * 100) + "%";
        }

        return n;
    }

    // Converts a decimal to a hex value
    function convertDecimalToHex(d) {
        return Math.round(parseFloat(d) * 255).toString(16);
    }
    // Converts a hex value to a decimal
    function convertHexToDecimal(h) {
        return (parseIntFromHex(h) / 255);
    }

    var matchers = (function() {

        // <http://www.w3.org/TR/css3-values/#integers>
        var CSS_INTEGER = "[-\\+]?\\d+%?";

        // <http://www.w3.org/TR/css3-values/#number-value>
        var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

        // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
        var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

        // Actual matching.
        // Parentheses and commas are optional, but not required.
        // Whitespace can take the place of commas or opening paren
        var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
        var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

        return {
            rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
            rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
            hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
            hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
            hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
            hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
            hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
            hex8: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
        };
    })();

    // `stringInputToObject`
    // Permissive string parsing.  Take in a number of formats, and output an object
    // based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
    function stringInputToObject(color) {

        color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
        var named = false;
        if (names[color]) {
            color = names[color];
            named = true;
        }
        else if (color == 'transparent') {
            return { r: 0, g: 0, b: 0, a: 0, format: "name" };
        }

        // Try to match string input using regular expressions.
        // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
        // Just return an object and let the conversion functions handle that.
        // This way the result will be the same whether the tinycolor is initialized with string or object.
        var match;
        if ((match = matchers.rgb.exec(color))) {
            return { r: match[1], g: match[2], b: match[3] };
        }
        if ((match = matchers.rgba.exec(color))) {
            return { r: match[1], g: match[2], b: match[3], a: match[4] };
        }
        if ((match = matchers.hsl.exec(color))) {
            return { h: match[1], s: match[2], l: match[3] };
        }
        if ((match = matchers.hsla.exec(color))) {
            return { h: match[1], s: match[2], l: match[3], a: match[4] };
        }
        if ((match = matchers.hsv.exec(color))) {
            return { h: match[1], s: match[2], v: match[3] };
        }
        if ((match = matchers.hsva.exec(color))) {
            return { h: match[1], s: match[2], v: match[3], a: match[4] };
        }
        if ((match = matchers.hex8.exec(color))) {
            return {
                a: convertHexToDecimal(match[1]),
                r: parseIntFromHex(match[2]),
                g: parseIntFromHex(match[3]),
                b: parseIntFromHex(match[4]),
                format: named ? "name" : "hex8"
            };
        }
        if ((match = matchers.hex6.exec(color))) {
            return {
                r: parseIntFromHex(match[1]),
                g: parseIntFromHex(match[2]),
                b: parseIntFromHex(match[3]),
                format: named ? "name" : "hex"
            };
        }
        if ((match = matchers.hex3.exec(color))) {
            return {
                r: parseIntFromHex(match[1] + '' + match[1]),
                g: parseIntFromHex(match[2] + '' + match[2]),
                b: parseIntFromHex(match[3] + '' + match[3]),
                format: named ? "name" : "hex"
            };
        }

        return false;
    }

    window.tinycolor = tinycolor;
    })();

    $(function () {
        if ($.fn.spectrum.load) {
            $.fn.spectrum.processNativeColorInputs();
        }
    });

});

// Spectrum Colorpicker
// Arabic (ar) localization
// https://github.com/seballot/spectrum
(function ( $ ) {

  var localization = $.spectrum.localization["ar"] = {
      cancelText: "إلغاء",
      chooseText: "إختار",
      clearText: "إرجاع الألوان على ما كانت",
      noColorSelectedText: "لم تختار أي لون",
      togglePaletteMoreText: "أكثر",
      togglePaletteLessText: "أقل"
  };

})( jQuery );

// Spectrum Colorpicker
// Catalan (ca) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["ca"] = {
        cancelText: "Cancel·lar",
        chooseText: "Escollir",
        clearText: "Esborrar color seleccionat",
        noColorSelectedText: "Cap color seleccionat",
        togglePaletteMoreText: "Més",
        togglePaletteLessText: "Menys"
    };

})( jQuery );

// Spectrum Colorpicker
// Czech (cs) localization
// https://github.com/seballot/spectrum
// author localization cs Pavel Laupe Dvorak pavel@pavel-dvorak.cz

(function ( $ ) {

    var localization = $.spectrum.localization["cs"] = {
        cancelText: "zrušit",
        chooseText: "vybrat",
        clearText: "Resetovat výměr barev",
        noColorSelectedText: "Žádná barva nebyla vybrána",
        togglePaletteMoreText: "více",
        togglePaletteLessText: "méně"
    };

})( jQuery );
// Spectrum Colorpicker
// German (de) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["de"] = {
        cancelText: "Abbrechen",
        chooseText: "Wählen",
        clearText: "Farbauswahl zurücksetzen",
        noColorSelectedText: "Keine Farbe ausgewählt",
        togglePaletteMoreText: "Mehr",
        togglePaletteLessText: "Weniger"
    };

})( jQuery );

// Spectrum Colorpicker
// Danish (dk) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["dk"] = {
		cancelText: "annuller",
		chooseText: "Vælg"
    };

})( jQuery );

// Spectrum Colorpicker
// Spanish (es) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["es"] = {
        cancelText: "Cancelar",
        chooseText: "Elegir",
        clearText: "Borrar color seleccionado",
        noColorSelectedText: "Ningún color seleccionado",
        togglePaletteMoreText: "Más",
        togglePaletteLessText: "Menos"
    };

})( jQuery );

// Spectrum Colorpicker
// Estonian (et) localization
// https://github.com/bgrins/spectrum

 (function ( $ ) {

     var localization = $.spectrum.localization["et"] = {
        cancelText: "Katkesta",
        chooseText: "Vali",
        clearText: "Tühista värvivalik",
        noColorSelectedText: "Ühtki värvi pole valitud",
        togglePaletteMoreText: "Rohkem",
        togglePaletteLessText: "Vähem"
    };

 })( jQuery );

// Spectrum Colorpicker
// Persian (fa) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["fa"] = {
        cancelText: "لغو",
        chooseText: "انتخاب",
        clearText: "تنظیم مجدد رنگ",
        noColorSelectedText: "هیچ رنگی انتخاب نشده است!",
        togglePaletteMoreText: "بیشتر",
        togglePaletteLessText: "کمتر"
    };

})( jQuery );

// Spectrum Colorpicker
// Finnish (fi) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["fi"] = {
        cancelText: "Kumoa",
        chooseText: "Valitse"
    };

})( jQuery );

// Spectrum Colorpicker
// French (fr) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["fr"] = {
        cancelText: "Annuler",
        chooseText: "Valider",
        clearText: "Effacer couleur sélectionnée",
        noColorSelectedText: "Aucune couleur sélectionnée",
        togglePaletteMoreText: "Plus",
        togglePaletteLessText: "Moins"
    };

})( jQuery );

// Spectrum Colorpicker
// Greek (gr) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["gr"] = {
        cancelText: "Ακύρωση",
        chooseText: "Επιλογή",
        clearText: "Καθαρισμός επιλεγμένου χρώματος",
        noColorSelectedText: "Δεν έχει επιλεχθεί κάποιο χρώμα",
        togglePaletteMoreText: "Περισσότερα",
        togglePaletteLessText: "Λιγότερα"
    };

})( jQuery );

// Spectrum Colorpicker
// Hebrew (he) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["he"] = {
        cancelText: "בטל בחירה",
        chooseText: "בחר צבע",
        clearText: "אפס בחירה",
        noColorSelectedText: "לא נבחר צבע",
        togglePaletteMoreText: "עוד צבעים",
        togglePaletteLessText: "פחות צבעים"
    };

})( jQuery );

// Spectrum Colorpicker
// Croatian (hr) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["hr"] = {
        cancelText: "Odustani",
        chooseText: "Odaberi",
        clearText: "Poništi odabir",
        noColorSelectedText: "Niti jedna boja nije odabrana",
        togglePaletteMoreText: "Više",
        togglePaletteLessText: "Manje"
    };

})( jQuery );

// Spectrum Colorpicker
// Hungarian (hu) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

  var localization = $.spectrum.localization["hu"] = {
      cancelText: "Mégsem",
      chooseText: "Mentés",
      clearText: "A színválasztás visszaállítása",
      noColorSelectedText: "Nincs szín kijelölve",
      togglePaletteMoreText: "Több",
      togglePaletteLessText: "Kevesebb"
  };

})( jQuery );

// Spectrum Colorpicker
// Indonesia/Bahasa Indonesia (id) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["id"] = {
        cancelText: "Batal",
        chooseText: "Pilih",
        clearText: "Hapus Pilihan Warna",
        noColorSelectedText: "Warna Tidak Dipilih",
        togglePaletteMoreText: "tambah",
        togglePaletteLessText: "kurangi"
    };

})( jQuery );

// Spectrum Colorpicker
// Italian (it) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["it"] = {
		cancelText: "annulla",
		chooseText: "scegli",
		clearText: "Annulla selezione colore",
		noColorSelectedText: "Nessun colore selezionato"
	};

})( jQuery );

// Spectrum Colorpicker
// Japanese (ja) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["ja"] = {
        cancelText: "中止",
        chooseText: "選択"
    };

})( jQuery );

// Spectrum Colorpicker
// Korean (ko) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["ko"] = {
        cancelText: "취소",
        chooseText: "선택",
        clearText: "선택 초기화",
        noColorSelectedText: "선택된 색상 없음",
        togglePaletteMoreText: "더보기",
        togglePaletteLessText: "줄이기"
    };

})( jQuery );

// Spectrum Colorpicker
// Lithuanian (lt) localization
// https://github.com/liesislukas

(function ( $ ) {

    var localization = $.spectrum.localization["lt"] = {
        cancelText: "Atšaukti",
        chooseText: "Pasirinkti",
        clearText: "Išvalyti pasirinkimą",
        noColorSelectedText: "Spalva nepasirinkta",
        togglePaletteMoreText: "Daugiau",
        togglePaletteLessText: "Mažiau"
    };

})( jQuery );

// Spectrum Colorpicker
// Norwegian, Bokmål (nb-no) localization
// https://github.com/greendimka

(function ( $ ) {

    var localization = $.spectrum.localization["nb-no"] = {
        cancelText: "Avbryte",
        chooseText: "Velg",
        clearText: "Tilbakestill",
        noColorSelectedText: "Farge er ikke valgt",
        togglePaletteMoreText: "Mer",
        togglePaletteLessText: "Mindre"
    };

})( jQuery );

// Spectrum Colorpicker
// Dutch (nl-nl) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["nl-nl"] = {
        cancelText: "Annuleer",
        chooseText: "Kies",
        clearText: "Wis kleur selectie",
        togglePaletteMoreText: 'Meer',
        togglePaletteLessText: 'Minder'
    };

})( jQuery );

// Spectrum Colorpicker
// Polish (pl) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["pl"] = {
        cancelText: "Anuluj",
        chooseText: "Wybierz",
        clearText: "Usuń wybór koloru",
        noColorSelectedText: "Nie wybrano koloru",
        togglePaletteMoreText: "Więcej",
        togglePaletteLessText: "Mniej"
    };

})( jQuery );

// Spectrum Colorpicker
// Brazilian (pt-br) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["pt-br"] = {
        cancelText: "Cancelar",
        chooseText: "Escolher",
        clearText: "Limpar cor selecionada",
        noColorSelectedText: "Nenhuma cor selecionada",
        togglePaletteMoreText: "Mais",
        togglePaletteLessText: "Menos"
    };

})( jQuery );

// Spectrum Colorpicker
// Portuguese (pt-pt) localization
// https://github.com/bgrins/spectrum

 (function ( $ ) {

     var localization = $.spectrum.localization["pt-pt"] = {
        cancelText: "Cancelar",
        chooseText: "Escolher",
        clearText: "Limpar cor seleccionada",
        noColorSelectedText: "Nenhuma cor seleccionada",
        togglePaletteMoreText: "Mais",
        togglePaletteLessText: "Menos"
    };

 })( jQuery );

// Spectrum Colorpicker
// Russian (ru) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["ru"] = {
        cancelText: "Отмена",
        chooseText: "Выбрать",
        clearText: "Сбросить",
        noColorSelectedText: "Цвет не выбран",
        togglePaletteMoreText: "Ещё",
        togglePaletteLessText: "Скрыть"
    };

})( jQuery );

// Spectrum Colorpicker
// Swedish (sv) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["sv"] = {
        cancelText: "Avbryt",
        chooseText: "Välj"
    };

})( jQuery );

// Spectrum Colorpicker
// Turkish (tr) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["tr"] = {
		cancelText: "iptal",
		chooseText: "tamam"
	};

})( jQuery );

// Spectrum Colorpicker
// Simplified Chinese (zh-cn) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["zh-cn"] = {
        cancelText: "取消",
        chooseText: "选择",
        clearText: "清除",
        togglePaletteMoreText: "更多选项",
        togglePaletteLessText: "隐藏",
        noColorSelectedText: "尚未选择任何颜色"
    };

})( jQuery );

// Spectrum Colorpicker
// Traditional Chinese (zh-tw) localization
// https://github.com/seballot/spectrum

(function ( $ ) {

    var localization = $.spectrum.localization["zh-tw"] = {
        cancelText: "取消",
        chooseText: "選擇",
        clearText: "清除",
        togglePaletteMoreText: "更多選項",
        togglePaletteLessText: "隱藏",
        noColorSelectedText: "尚未選擇任何顏色"
    };

})( jQuery );


// toc.js

!function($) {
    $.fn.toc = function(options) {
      var self = this;
      var opts = $.extend({}, jQuery.fn.toc.defaults, options);
    
      var container = $(opts.container);
      var headings = $(opts.selectors, container);
      var headingOffsets = [];
      var activeClassName = opts.prefix+'-active';
    
      var findScrollableElement = function(els) {
        for (var i = 0, argLength = arguments.length; i < argLength; i++) {
          var el = arguments[i],
              $scrollElement = $(el);
          if ($scrollElement.scrollTop() > 0) {
            return $scrollElement;
          } else {
            $scrollElement.scrollTop(1);
            var isScrollable = $scrollElement.scrollTop() > 0;
            $scrollElement.scrollTop(0);
            if (isScrollable) {
              return $scrollElement;
            }
          }
        }
        return [];
      };
      var scrollable = findScrollableElement(opts.container, 'body', 'html');
    
      var scrollTo = function(e) {
        if (opts.smoothScrolling) {
          e.preventDefault();
          var elScrollTo = $(e.target).attr('href');
          var $el = $(elScrollTo);
          
          scrollable.animate({ scrollTop: $el.offset().top }, 400, 'swing', function() {
            location.hash = elScrollTo;
          });
        }
        $('li', self).removeClass(activeClassName);
        $(e.target).parent().addClass(activeClassName);
      };
    
      //highlight on scroll
      var timeout;
      var highlightOnScroll = function(e) {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(function() {
          var top = $(window).scrollTop();
          for (var i = 0, c = headingOffsets.length; i < c; i++) {
            if (headingOffsets[i] >= top) {
              $('li', self).removeClass(activeClassName);
              $('li:eq('+(i-1)+')', self).addClass(activeClassName);
              break;
            }
          }
        }, 50);
      };
      if (opts.highlightOnScroll) {
        $(window).bind('scroll', highlightOnScroll);
        highlightOnScroll();
      }
    
      return this.each(function() {
        //build TOC
        var ul = $('<ul/>');
        headings.each(function(i, heading) {
          var $h = $(heading);
          headingOffsets.push($h.offset().top - opts.highlightOffset);
    
          //add anchor
          var anchorName = opts.anchorName(i, heading, opts.prefix);
          var anchor = $([]);
          if (!document.getElementById(anchorName)) {
            anchor = $('<span/>').attr('id', opts.anchorName(i, heading, opts.prefix)).insertBefore($h);
          }
          //build TOC item
          var a = $('<a/>')
          .text($h.text())
          .attr('href', '#' + anchorName)
          .bind('click', scrollTo);
    
          var li = $('<li/>')
          .addClass(opts.prefix+'-'+$h[0].tagName.toLowerCase())
          .append(a);
    
          ul.append(li);
        });
        var el = $(this);
        el.html(ul);
      });
    };
    
    
    jQuery.fn.toc.defaults = {
      container: 'body',
      selectors: 'h1,h2,h3',
      smoothScrolling: true,
      prefix: '',
      highlightOnScroll: true,
      highlightOffset: 100,
      anchorName: function(i, heading, prefix) {
        return prefix+i;
      } 
    };
    
    }(jQuery);

// docs.js

function updateBorders(color) {
    // do nothing
}

$(function() {

$('pre').each(function() { hljs.highlightBlock(this) });

$('#toc').toc({
    'selectors': 'h1,h2:not(.subtitle),h3', //elements to use as headings
    'container': '.main-container', //element to find all selectors in
    'smoothScrolling': true, //enable or disable smooth scrolling on click
    'prefix': 'toc', //prefix for anchor tags and class names
    'highlightOnScroll': true, //add class to heading that is currently in focus
    'highlightOffset': 100, //offset to trigger the next headline
    'anchorName': function(i, heading, prefix) { //custom function for anchor name
        return heading.id || prefix+i;
    }
});

// ----- CONFIGURATOR -----
$('.configurator-renderer input').spectrum();
var colorpickerInput = $("#color-picker");

initConfigurator();
updateColorPickerAndJavascriptCode();

$('.configurator-container').find('input[type=radio], input[type=checkbox]').click(function() {
    updateColorPickerAndJavascriptCode();
});

function initConfigurator() {
    $('.configurator-container input[type=checkbox]').each(function() {
        var value = colorpickerInput.spectrum('option', $(this).data("rule"));
        $(this).prop('checked', value);
    });
    var type = colorpickerInput.spectrum('option', 'type');
    $('.configurator-container input[name=type]').val([type]);
}

function updateColorPickerAndJavascriptCode() {
    colorpickerInput.off();
    colorpickerInput.change(function() {
        document.documentElement.style.setProperty('--primary-color',  $(this).val());
    });
    var options = {
        type: $('.configurator-container input[name=type]:checked').val()
    };
    $('.configurator-container input[type=checkbox]').each(function() {
        var optionName = $(this).data("rule");
        var value = $(this).is('[type=checkbox]') ? $(this).is(':checked') : $(this).val();
        options[optionName] = value;
    })

    var javascriptCode = "$('#color-picker').spectrum({";
    var optionsCount = 0;
    for(var i in options) {
        if (options[i] != $.fn.spectrum.defaults[i]) {
            optionsCount++;
            javascriptCode += "\n  " + i + ': "' + options[i] + '",';
        }
    }
    if (optionsCount > 0) {
        javascriptCode = javascriptCode.slice(0, -1); // remove last ",\n"
        javascriptCode += '\n';
    }
    javascriptCode += "});";
    $('pre#sp-options').html(javascriptCode);

    // setTimeout(() => {
        hljs.highlightBlock($('pre#sp-options')[0]);
        colorpickerInput.spectrum(options);
    // }, 2000);

}
// ----- END CONFIGURATOR -----

$("#hideButtons").spectrum({
    showButtons: false,
    change: updateBorders
});


var isDisabled = true;
$("#toggle-disabled").click(function() {
    if (isDisabled) {
        $("#disabled").spectrum("enable");
    }
    else {
        $("#disabled").spectrum("disable");
    }
    isDisabled = !isDisabled;
    return false;
});

$("input:disabled").spectrum({

});
$("#disabled").spectrum({
    disabled: true
});

$("#pick1").spectrum({
    flat: true,
    change: function(color) {
        var hsv = color.toHsv();
        var rgb = color.toRgbString();
        var hex = color.toHexString();
        //console.log("callback",color.toHslString(), color.toHsl().h, color.toHsl().s, color.toHsl().l)
        $("#docs-content").css({
            'background-color': color.toRgbString()
        }).toggleClass("dark", hsv.v < .5);
        $("#switch-current-rgb").text(rgb);
        $("#switch-current-hex").text(hex);
    },
    show: function() {

    },
    hide: function() {

    },
    showInput: true,
    showPalette: true,
    palette: ['white', '#306', '#c5c88d', '#ac5c5c', '#344660']
});

$("#collapsed").spectrum({
    color: "#dd3333",
    change: updateBorders,
    show: function() {

    },
    hide: function() {

    }
});

$("#flat").spectrum({
    flat: true,
    showInput: true,
    move: updateBorders
});

$("#flatClearable").spectrum({
    flat: true,
    move: updateBorders,
    change: updateBorders,
    allowEmpty:true,
    showInput: true
});

$("#showInput").spectrum({
    color: "#dd33dd",
    showInput: true,
    change: updateBorders,
    show: function() {

    },
    hide: function() {

    }
});

$("#showAlpha").spectrum({
    color: "rgba(255, 128, 0, .5)",
    showAlpha: true,
    change: updateBorders
});

$("#showAlphaWithInput").spectrum({
    color: "rgba(255, 128, 0, .5)",
    showAlpha: true,
    showInput: true,
    showPalette: true,
    palette: [
        ["rgba(255, 128, 0, .9)", "rgba(255, 128, 0, .5)"],
        ["red", "green", "blue"],
        ["hsla(25, 50, 75, .5)", "rgba(100, .5, .5, .8)"]
    ],
    change: updateBorders
});

$("#showAlphaWithInputAndEmpty").spectrum({
    color: "rgba(255, 128, 0, .5)",
    allowEmpty:true,
    showAlpha: true,
    showInput: true,
    showPalette: true,
    palette: [
        ["rgba(255, 128, 0, .9)", "rgba(255, 128, 0, .5)"],
        ["red", "green", "blue"],
        ["hsla(25, 50, 75, .5)", "rgba(100, .5, .5, .8)"]
    ],
    change: updateBorders
});

$("#showInputWithClear").spectrum({
    allowEmpty:true,
    color: "",
    showInput: true,
    change: updateBorders,
    show: function() {

    },
    hide: function() {

    }
});

$("#openWithLink").spectrum({
    color: "#dd3333",
    change: updateBorders,
    show: function() {

    },
    hide: function() {

    }
});

$("#className").spectrum({
    className: 'awesome'
});

$("#replacerClassName").spectrum({
    replacerClassName: 'awesome'
});

$("#containerClassName").spectrum({
    containerClassName: 'awesome'
});

$("#showPalette").spectrum({
    showPalette: true,
    palette: [
        ['black', 'white', 'blanchedalmond'],
        ['rgb(255, 128, 0);', 'hsv 100 70 50', 'lightyellow']
    ],
    hide: function(c) {
        var label = $("[data-label-for=" + this.id + "]");
        label.text("Hidden: " + c.toHexString());
    },
    change: function(c) {
        var label = $("[data-label-for=" + this.id + "]");
        label.text("Change called: " + c.toHexString());
    },
    move: function(c) {
        var label = $("[data-label-for=" + this.id + "]");
        label.text("Move called: " + c.toHexString());
    }
});

var textPalette = ["rgb(255, 255, 255)", "rgb(204, 204, 204)", "rgb(192, 192, 192)", "rgb(153, 153, 153)", "rgb(102, 102, 102)", "rgb(51, 51, 51)", "rgb(0, 0, 0)", "rgb(255, 204, 204)", "rgb(255, 102, 102)", "rgb(255, 0, 0)", "rgb(204, 0, 0)", "rgb(153, 0, 0)", "rgb(102, 0, 0)", "rgb(51, 0, 0)", "rgb(255, 204, 153)", "rgb(255, 153, 102)", "rgb(255, 153, 0)", "rgb(255, 102, 0)", "rgb(204, 102, 0)", "rgb(153, 51, 0)", "rgb(102, 51, 0)", "rgb(255, 255, 153)", "rgb(255, 255, 102)", "rgb(255, 204, 102)", "rgb(255, 204, 51)", "rgb(204, 153, 51)", "rgb(153, 102, 51)", "rgb(102, 51, 51)", "rgb(255, 255, 204)", "rgb(255, 255, 51)", "rgb(255, 255, 0)", "rgb(255, 204, 0)", "rgb(153, 153, 0)", "rgb(102, 102, 0)", "rgb(51, 51, 0)", "rgb(153, 255, 153)", "rgb(102, 255, 153)", "rgb(51, 255, 51)", "rgb(51, 204, 0)", "rgb(0, 153, 0)", "rgb(0, 102, 0)", "rgb(0, 51, 0)", "rgb(153, 255, 255)", "rgb(51, 255, 255)", "rgb(102, 204, 204)", "rgb(0, 204, 204)", "rgb(51, 153, 153)", "rgb(51, 102, 102)", "rgb(0, 51, 51)", "rgb(204, 255, 255)", "rgb(102, 255, 255)", "rgb(51, 204, 255)", "rgb(51, 102, 255)", "rgb(51, 51, 255)", "rgb(0, 0, 153)", "rgb(0, 0, 102)", "rgb(204, 204, 255)", "rgb(153, 153, 255)", "rgb(102, 102, 204)", "rgb(102, 51, 255)", "rgb(102, 0, 204)", "rgb(51, 51, 153)", "rgb(51, 0, 153)", "rgb(255, 204, 255)", "rgb(255, 153, 255)", "rgb(204, 102, 204)", "rgb(204, 51, 204)", "rgb(153, 51, 153)", "rgb(102, 51, 102)", "rgb(51, 0, 51)"];

$("#showPaletteOnly").spectrum({
    color: 'blanchedalmond',
    showPaletteOnly: true,
    showPalette:true,
    palette: [
        ['black', 'white', 'blanchedalmond',
        'rgb(255, 128, 0);', 'hsv 100 70 50'],
        ['red', 'yellow', 'green', 'blue', 'violet']
    ],
    change: function(c) {
        var label = $("[data-label-for=" + this.id + "]");
        label.text("Change called: " + c.toHexString());
    },
    move: function(c) {
        var label = $("[data-label-for=" + this.id + "]");
        label.text("Move called: " + c.toHexString());
    }
});

$("#hideAfterPaletteSelect").spectrum({
    showPaletteOnly: true,
    showPalette:true,
    hideAfterPaletteSelect:true,
    color: 'blanchedalmond',
    palette: [
        ['black', 'white', 'blanchedalmond',
        'rgb(255, 128, 0);', 'hsv 100 70 50'],
        ['red', 'yellow', 'green', 'blue', 'violet']
    ],
    change: function(c) {
        var label = $("[data-label-for=" + this.id + "]");
        label.text("Change called: " + c.toHexString());
    },
    move: function(c) {
        var label = $("[data-label-for=" + this.id + "]");
        label.text("Move called: " + c.toHexString());
    }
});

$("#togglePaletteOnly").spectrum({
    color: 'blanchedalmond',
    showPaletteOnly: true,
    togglePaletteOnly: true,
    showPalette:true,
    palette: [
        ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
        ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
        ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
        ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
        ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
        ["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
        ["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
        ["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
    ]
});

$("#clickoutFiresChange").spectrum({
    change: updateBorders
});

$("#clickoutDoesntFireChange").spectrum({
    change: updateBorders,
    clickoutFiresChange: false
});

$("#showInitial").spectrum({
    showInitial: true
});

$("#showInputAndInitial").spectrum({
    showInitial: true,
    showInput: true
});

$("#showInputInitialClear").spectrum({
    allowEmpty:true,
    showInitial: true,
    showInput: true
});

$("#changeOnMove").spectrum({
    move: function(c) {
        var label = $("[data-label-for=" + this.id + "]");
        label.text("Move called: " + c.toHexString());
    }
});
$("#changeOnMoveNo").spectrum({
    showInput: true,
    change: function(c) {
        var label = $("[data-label-for=" + this.id + "]");
        label.text("Change called: " + c.toHexString());
    }
});

function prettyTime() {
    var date = new Date();

    return date.toLocaleTimeString();
}

$("#eventshow").spectrum({
    show: function(c) {
        var label = $("#eventshowLabel");
        label.text("show called at " + prettyTime() + " (color is " + c.toHexString() + ")");
    }
});

$("#eventhide").spectrum({
    hide: function(c) {
        var label = $("#eventhideLabel");
        label.text("hide called at " + prettyTime() + " (color is " + c.toHexString() + ")");
    }
});

$("#eventdragstart").spectrum({
    showAlpha: true
}).on("dragstart.spectrum", function(e, c) {
    var label = $("#eventdragstartLabel");
    label.text("dragstart called at " + prettyTime() + " (color is " + c.toHexString() + ")");
});

$("#eventdragstop").spectrum({
    showAlpha: true
}).on("dragstop.spectrum", function(e, c) {
    var label = $("#eventdragstopLabel");
    label.text("dragstop called at " + prettyTime() + " (color is " + c.toHexString() + ")");
});


$(".basic").spectrum({ change: updateBorders });
$(".override").spectrum({
    color: "yellow",
    change: updateBorders
});

$(".startEmpty").spectrum({
    allowEmpty:true,
    change: updateBorders});

$("#beforeShow").spectrum({
    beforeShow: function() {
        return false;
    }
});


$("#custom").spectrum({
    color: "#f00"
});

$("#buttonText").spectrum({
    locale: 'fr',
    chooseText: "OK!"
});


$("#showSelectionPalette").spectrum({
    showPalette: true,
    showSelectionPalette: true, // true by default
    palette: [ ]
});
$("#showSelectionPaletteStorage").spectrum({
    showPalette: true,
    localStorageKey: "spectrum.homepage", // Any picker with the same string will share selection
    showSelectionPalette: true,
    palette: [ ]
});
$("#showSelectionPaletteStorage2").spectrum({
    showPalette: true,
    localStorageKey: "spectrum.homepage", // Any picker with the same string will share selection
    showSelectionPalette: true,
    palette: [ ]
});

$("#selectionPalette").spectrum({
    showPalette: true,
    palette: [ ],
    showSelectionPalette: true, // true by default
    selectionPalette: ["red", "green", "blue"]
});

$("#maxSelectionSize").spectrum({
    showPalette: true,
    palette: [ ],
    showSelectionPalette: true, // true by default
    selectionPalette: ["red", "green", "blue"],
    maxSelectionSize: 2
});

$("#preferredHex").spectrum({
    preferredFormat: "hex",
    showInput: true,
    showPalette: true,
    palette: [["red", "rgba(0, 255, 0, .5)", "rgb(0, 0, 255)"]]
});
$("#preferredHex3").spectrum({
    preferredFormat: "hex3",
    showInput: true,
    showPalette: true,
    palette: [["red", "rgba(0, 255, 0, .5)", "rgb(0, 0, 255)"]]
});
$("#preferredHsl").spectrum({
    preferredFormat: "hsl",
    showInput: true,
    showPalette: true,
    palette: [["red", "rgba(0, 255, 0, .5)", "rgb(0, 0, 255)"]]
});
$("#preferredRgb").spectrum({
    preferredFormat: "rgb",
    showInput: true,
    showPalette: true,
    palette: [["red", "rgba(0, 255, 0, .5)", "rgb(0, 0, 255)"]]
});
$("#preferredName").spectrum({
    preferredFormat: "name",
    showInput: true,
    showPalette: true,
    palette: [["red", "rgba(0, 255, 0, .5)", "rgb(0, 0, 255)"]]
});
$("#preferredNone").spectrum({
    showInput: true,
    showPalette: true,
    palette: [["red", "rgba(0, 255, 0, .5)", "rgb(0, 0, 255)"]]
});

$("#triggerSet").spectrum({
    change: updateBorders
});

// Show the original input to demonstrate the value changing when calling `set`
$("#triggerSet").show();

$("#btnEnterAColor").click(function() {
    $("#triggerSet").spectrum("set", $("#enterAColor").val());
});

$("#toggle").spectrum();
$("#btn-toggle").click(function() {
    $("#toggle").spectrum("toggle");
    return false;
});

});

// highlight.pack.js

/*! highlight.js v9.17.1 | BSD3 License | git.io/hljslicense */
!function(e){var n="object"==typeof window&&window||"object"==typeof self&&self;"undefined"==typeof exports||exports.nodeType?n&&(n.hljs=e({}),"function"==typeof define&&define.amd&&define([],function(){return n.hljs})):e(exports)}(function(a){var f=[],o=Object.keys,N={},g={},_=!0,n=/^(no-?highlight|plain|text)$/i,E=/\blang(?:uage)?-([\w-]+)\b/i,t=/((^(<[^>]+>|\t|)+|(?:\n)))/gm,r={case_insensitive:"cI",lexemes:"l",contains:"c",keywords:"k",subLanguage:"sL",className:"cN",begin:"b",beginKeywords:"bK",end:"e",endsWithParent:"eW",illegal:"i",excludeBegin:"eB",excludeEnd:"eE",returnBegin:"rB",returnEnd:"rE",variants:"v",IDENT_RE:"IR",UNDERSCORE_IDENT_RE:"UIR",NUMBER_RE:"NR",C_NUMBER_RE:"CNR",BINARY_NUMBER_RE:"BNR",RE_STARTERS_RE:"RSR",BACKSLASH_ESCAPE:"BE",APOS_STRING_MODE:"ASM",QUOTE_STRING_MODE:"QSM",PHRASAL_WORDS_MODE:"PWM",C_LINE_COMMENT_MODE:"CLCM",C_BLOCK_COMMENT_MODE:"CBCM",HASH_COMMENT_MODE:"HCM",NUMBER_MODE:"NM",C_NUMBER_MODE:"CNM",BINARY_NUMBER_MODE:"BNM",CSS_NUMBER_MODE:"CSSNM",REGEXP_MODE:"RM",TITLE_MODE:"TM",UNDERSCORE_TITLE_MODE:"UTM",COMMENT:"C",beginRe:"bR",endRe:"eR",illegalRe:"iR",lexemesRe:"lR",terminators:"t",terminator_end:"tE"},C="</span>",m="Could not find the language '{}', did you forget to load/include a language module?",O={classPrefix:"hljs-",tabReplace:null,useBR:!1,languages:void 0},c="of and for in not or if then".split(" ");function B(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function d(e){return e.nodeName.toLowerCase()}function R(e){return n.test(e)}function i(e){var n,t={},r=Array.prototype.slice.call(arguments,1);for(n in e)t[n]=e[n];return r.forEach(function(e){for(n in e)t[n]=e[n]}),t}function p(e){var a=[];return function e(n,t){for(var r=n.firstChild;r;r=r.nextSibling)3===r.nodeType?t+=r.nodeValue.length:1===r.nodeType&&(a.push({event:"start",offset:t,node:r}),t=e(r,t),d(r).match(/br|hr|img|input/)||a.push({event:"stop",offset:t,node:r}));return t}(e,0),a}function v(e,n,t){var r=0,a="",i=[];function o(){return e.length&&n.length?e[0].offset!==n[0].offset?e[0].offset<n[0].offset?e:n:"start"===n[0].event?e:n:e.length?e:n}function c(e){a+="<"+d(e)+f.map.call(e.attributes,function(e){return" "+e.nodeName+'="'+B(e.value).replace(/"/g,"&quot;")+'"'}).join("")+">"}function l(e){a+="</"+d(e)+">"}function u(e){("start"===e.event?c:l)(e.node)}for(;e.length||n.length;){var s=o();if(a+=B(t.substring(r,s[0].offset)),r=s[0].offset,s===e){for(i.reverse().forEach(l);u(s.splice(0,1)[0]),(s=o())===e&&s.length&&s[0].offset===r;);i.reverse().forEach(c)}else"start"===s[0].event?i.push(s[0].node):i.pop(),u(s.splice(0,1)[0])}return a+B(t.substr(r))}function l(n){return n.v&&!n.cached_variants&&(n.cached_variants=n.v.map(function(e){return i(n,{v:null},e)})),n.cached_variants?n.cached_variants:function e(n){return!!n&&(n.eW||e(n.starts))}(n)?[i(n,{starts:n.starts?i(n.starts):null})]:Object.isFrozen(n)?[i(n)]:[n]}function u(e){if(r&&!e.langApiRestored){for(var n in e.langApiRestored=!0,r)e[n]&&(e[r[n]]=e[n]);(e.c||[]).concat(e.v||[]).forEach(u)}}function M(n,t){var i={};return"string"==typeof n?r("keyword",n):o(n).forEach(function(e){r(e,n[e])}),i;function r(a,e){t&&(e=e.toLowerCase()),e.split(" ").forEach(function(e){var n,t,r=e.split("|");i[r[0]]=[a,(n=r[0],(t=r[1])?Number(t):function(e){return-1!=c.indexOf(e.toLowerCase())}(n)?0:1)]})}}function x(r){function s(e){return e&&e.source||e}function f(e,n){return new RegExp(s(e),"m"+(r.cI?"i":"")+(n?"g":""))}function a(a){var i,e,o={},c=[],l={},t=1;function n(e,n){o[t]=e,c.push([e,n]),t+=new RegExp(n.toString()+"|").exec("").length-1+1}for(var r=0;r<a.c.length;r++){n(e=a.c[r],e.bK?"\\.?(?:"+e.b+")\\.?":e.b)}a.tE&&n("end",a.tE),a.i&&n("illegal",a.i);var u=c.map(function(e){return e[1]});return i=f(function(e,n){for(var t=/\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./,r=0,a="",i=0;i<e.length;i++){var o=r+=1,c=s(e[i]);for(0<i&&(a+=n),a+="(";0<c.length;){var l=t.exec(c);if(null==l){a+=c;break}a+=c.substring(0,l.index),c=c.substring(l.index+l[0].length),"\\"==l[0][0]&&l[1]?a+="\\"+String(Number(l[1])+o):(a+=l[0],"("==l[0]&&r++)}a+=")"}return a}(u,"|"),!0),l.lastIndex=0,l.exec=function(e){var n;if(0===c.length)return null;i.lastIndex=l.lastIndex;var t=i.exec(e);if(!t)return null;for(var r=0;r<t.length;r++)if(null!=t[r]&&null!=o[""+r]){n=o[""+r];break}return"string"==typeof n?(t.type=n,t.extra=[a.i,a.tE]):(t.type="begin",t.rule=n),t},l}if(r.c&&-1!=r.c.indexOf("self")){if(!_)throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");r.c=r.c.filter(function(e){return"self"!=e})}!function n(t,e){t.compiled||(t.compiled=!0,t.k=t.k||t.bK,t.k&&(t.k=M(t.k,r.cI)),t.lR=f(t.l||/\w+/,!0),e&&(t.bK&&(t.b="\\b("+t.bK.split(" ").join("|")+")\\b"),t.b||(t.b=/\B|\b/),t.bR=f(t.b),t.endSameAsBegin&&(t.e=t.b),t.e||t.eW||(t.e=/\B|\b/),t.e&&(t.eR=f(t.e)),t.tE=s(t.e)||"",t.eW&&e.tE&&(t.tE+=(t.e?"|":"")+e.tE)),t.i&&(t.iR=f(t.i)),null==t.relevance&&(t.relevance=1),t.c||(t.c=[]),t.c=Array.prototype.concat.apply([],t.c.map(function(e){return l("self"===e?t:e)})),t.c.forEach(function(e){n(e,t)}),t.starts&&n(t.starts,e),t.t=a(t))}(r)}function S(n,i,a,e){function c(e,n,t,r){if(!t&&""===n)return"";if(!e)return n;var a='<span class="'+(r?"":O.classPrefix);return(a+=e+'">')+n+(t?"":C)}function o(){R+=null!=E.sL?function(){var e="string"==typeof E.sL;if(e&&!N[E.sL])return B(p);var n=e?S(E.sL,p,!0,d[E.sL]):T(p,E.sL.length?E.sL:void 0);return 0<E.relevance&&(v+=n.relevance),e&&(d[E.sL]=n.top),c(n.language,n.value,!1,!0)}():function(){var e,n,t,r,a,i,o;if(!E.k)return B(p);for(r="",n=0,E.lR.lastIndex=0,t=E.lR.exec(p);t;)r+=B(p.substring(n,t.index)),a=E,i=t,o=g.cI?i[0].toLowerCase():i[0],(e=a.k.hasOwnProperty(o)&&a.k[o])?(v+=e[1],r+=c(e[0],B(t[0]))):r+=B(t[0]),n=E.lR.lastIndex,t=E.lR.exec(p);return r+B(p.substr(n))}(),p=""}function l(e){R+=e.cN?c(e.cN,"",!0):"",E=Object.create(e,{parent:{value:E}})}function u(e){var n=e[0],t=e.rule;return t&&t.endSameAsBegin&&(t.eR=new RegExp(n.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&"),"m")),t.skip?p+=n:(t.eB&&(p+=n),o(),t.rB||t.eB||(p=n)),l(t),t.rB?0:n.length}function s(e){var n=e[0],t=i.substr(e.index),r=function e(n,t){if(r=n.eR,a=t,(i=r&&r.exec(a))&&0===i.index){for(;n.endsParent&&n.parent;)n=n.parent;return n}var r,a,i;if(n.eW)return e(n.parent,t)}(E,t);if(r){var a=E;for(a.skip?p+=n:(a.rE||a.eE||(p+=n),o(),a.eE&&(p=n));E.cN&&(R+=C),E.skip||E.sL||(v+=E.relevance),(E=E.parent)!==r.parent;);return r.starts&&(r.endSameAsBegin&&(r.starts.eR=r.eR),l(r.starts)),a.rE?0:n.length}}var f={};function t(e,n){var t=n&&n[0];if(p+=e,null==t)return o(),0;if("begin"==f.type&&"end"==n.type&&f.index==n.index&&""===t)return p+=i.slice(n.index,n.index+1),1;if("begin"===(f=n).type)return u(n);if("illegal"===n.type&&!a)throw new Error('Illegal lexeme "'+t+'" for mode "'+(E.cN||"<unnamed>")+'"');if("end"===n.type){var r=s(n);if(null!=r)return r}return p+=t,t.length}var g=D(n);if(!g)throw console.error(m.replace("{}",n)),new Error('Unknown language: "'+n+'"');x(g);var r,E=e||g,d={},R="";for(r=E;r!==g;r=r.parent)r.cN&&(R=c(r.cN,"",!0)+R);var p="",v=0;try{for(var M,b,h=0;E.t.lastIndex=h,M=E.t.exec(i);)b=t(i.substring(h,M.index),M),h=M.index+b;for(t(i.substr(h)),r=E;r.parent;r=r.parent)r.cN&&(R+=C);return{relevance:v,value:R,i:!1,language:n,top:E}}catch(e){if(e.message&&-1!==e.message.indexOf("Illegal"))return{i:!0,relevance:0,value:B(i)};if(_)return{relevance:0,value:B(i),language:n,top:E,errorRaised:e};throw e}}function T(t,e){e=e||O.languages||o(N);var r={relevance:0,value:B(t)},a=r;return e.filter(D).filter(L).forEach(function(e){var n=S(e,t,!1);n.language=e,n.relevance>a.relevance&&(a=n),n.relevance>r.relevance&&(a=r,r=n)}),a.language&&(r.second_best=a),r}function b(e){return O.tabReplace||O.useBR?e.replace(t,function(e,n){return O.useBR&&"\n"===e?"<br>":O.tabReplace?n.replace(/\t/g,O.tabReplace):""}):e}function s(e){var n,t,r,a,i,o,c,l,u,s,f=function(e){var n,t,r,a,i=e.className+" ";if(i+=e.parentNode?e.parentNode.className:"",t=E.exec(i)){var o=D(t[1]);return o||(console.warn(m.replace("{}",t[1])),console.warn("Falling back to no-highlight mode for this block.",e)),o?t[1]:"no-highlight"}for(n=0,r=(i=i.split(/\s+/)).length;n<r;n++)if(R(a=i[n])||D(a))return a}(e);R(f)||(O.useBR?(n=document.createElement("div")).innerHTML=e.innerHTML.replace(/\n/g,"").replace(/<br[ \/]*>/g,"\n"):n=e,i=n.textContent,r=f?S(f,i,!0):T(i),(t=p(n)).length&&((a=document.createElement("div")).innerHTML=r.value,r.value=v(t,p(a),i)),r.value=b(r.value),e.innerHTML=r.value,e.className=(o=e.className,c=f,l=r.language,u=c?g[c]:l,s=[o.trim()],o.match(/\bhljs\b/)||s.push("hljs"),-1===o.indexOf(u)&&s.push(u),s.join(" ").trim()),e.result={language:r.language,re:r.relevance},r.second_best&&(e.second_best={language:r.second_best.language,re:r.second_best.relevance}))}function h(){if(!h.called){h.called=!0;var e=document.querySelectorAll("pre code");f.forEach.call(e,s)}}var w={disableAutodetect:!0};function D(e){return e=(e||"").toLowerCase(),N[e]||N[g[e]]}function L(e){var n=D(e);return n&&!n.disableAutodetect}return a.highlight=S,a.highlightAuto=T,a.fixMarkup=b,a.highlightBlock=s,a.configure=function(e){O=i(O,e)},a.initHighlighting=h,a.initHighlightingOnLoad=function(){window.addEventListener("DOMContentLoaded",h,!1),window.addEventListener("load",h,!1)},a.registerLanguage=function(n,e){var t;try{t=e(a)}catch(e){if(console.error("Language definition for '{}' could not be registered.".replace("{}",n)),!_)throw e;console.error(e),t=w}u(N[n]=t),t.rawDefinition=e.bind(null,a),t.aliases&&t.aliases.forEach(function(e){g[e]=n})},a.listLanguages=function(){return o(N)},a.getLanguage=D,a.requireLanguage=function(e){var n=D(e);if(n)return n;throw new Error("The '{}' language is required, but not loaded.".replace("{}",e))},a.autoDetection=L,a.inherit=i,a.debugMode=function(){_=!1},a.IR=a.IDENT_RE="[a-zA-Z]\\w*",a.UIR=a.UNDERSCORE_IDENT_RE="[a-zA-Z_]\\w*",a.NR=a.NUMBER_RE="\\b\\d+(\\.\\d+)?",a.CNR=
a.C_NUMBER_RE="(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)",a.BNR=a.BINARY_NUMBER_RE="\\b(0b[01]+)",a.RSR=a.RE_STARTERS_RE="!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~",a.BE=a.BACKSLASH_ESCAPE={b:"\\\\[\\s\\S]",relevance:0},a.ASM=a.APOS_STRING_MODE={cN:"string",b:"'",e:"'",i:"\\n",c:[a.BE]},a.QSM=a.QUOTE_STRING_MODE={cN:"string",b:'"',e:'"',i:"\\n",c:[a.BE]},a.PWM=a.PHRASAL_WORDS_MODE={b:/\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/},a.C=a.COMMENT=function(e,n,t){var r=a.inherit({cN:"comment",b:e,e:n,c:[]},t||{});return r.c.push(a.PWM),r.c.push({cN:"doctag",b:"(?:TODO|FIXME|NOTE|BUG|XXX):",relevance:0}),r},a.CLCM=a.C_LINE_COMMENT_MODE=a.C("//","$"),a.CBCM=a.C_BLOCK_COMMENT_MODE=a.C("/\\*","\\*/"),a.HCM=a.HASH_COMMENT_MODE=a.C("#","$"),a.NM=a.NUMBER_MODE={cN:"number",b:a.NR,relevance:0},a.CNM=a.C_NUMBER_MODE={cN:"number",b:a.CNR,relevance:0},a.BNM=a.BINARY_NUMBER_MODE={cN:"number",b:a.BNR,relevance:0},a.CSSNM=a.CSS_NUMBER_MODE={cN:"number",b:a.NR+"(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",relevance:0},a.RM=a.REGEXP_MODE={cN:"regexp",b:/\//,e:/\/[gimuy]*/,i:/\n/,c:[a.BE,{b:/\[/,e:/\]/,relevance:0,c:[a.BE]}]},a.TM=a.TITLE_MODE={cN:"title",b:a.IR,relevance:0},a.UTM=a.UNDERSCORE_TITLE_MODE={cN:"title",b:a.UIR,relevance:0},a.METHOD_GUARD={b:"\\.\\s*"+a.UIR,relevance:0},[a.BE,a.ASM,a.QSM,a.PWM,a.C,a.CLCM,a.CBCM,a.HCM,a.NM,a.CNM,a.BNM,a.CSSNM,a.RM,a.TM,a.UTM,a.METHOD_GUARD].forEach(function(e){!function n(t){Object.freeze(t);var r="function"==typeof t;Object.getOwnPropertyNames(t).forEach(function(e){!t.hasOwnProperty(e)||null===t[e]||"object"!=typeof t[e]&&"function"!=typeof t[e]||r&&("caller"===e||"callee"===e||"arguments"===e)||Object.isFrozen(t[e])||n(t[e])});return t}(e)}),a});hljs.registerLanguage("xml",function(e){var c={cN:"symbol",b:"&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;"},s={b:"\\s",c:[{cN:"meta-keyword",b:"#?[a-z_][a-z1-9_-]+",i:"\\n"}]},a=e.inherit(s,{b:"\\(",e:"\\)"}),t=e.inherit(e.ASM,{cN:"meta-string"}),l=e.inherit(e.QSM,{cN:"meta-string"}),r={eW:!0,i:/</,relevance:0,c:[{cN:"attr",b:"[A-Za-z0-9\\._:-]+",relevance:0},{b:/=\s*/,relevance:0,c:[{cN:"string",endsParent:!0,v:[{b:/"/,e:/"/,c:[c]},{b:/'/,e:/'/,c:[c]},{b:/[^\s"'=<>`]+/}]}]}]};return{aliases:["html","xhtml","rss","atom","xjb","xsd","xsl","plist","wsf","svg"],cI:!0,c:[{cN:"meta",b:"<![a-z]",e:">",relevance:10,c:[s,l,t,a,{b:"\\[",e:"\\]",c:[{cN:"meta",b:"<![a-z]",e:">",c:[s,a,l,t]}]}]},e.C("\x3c!--","--\x3e",{relevance:10}),{b:"<\\!\\[CDATA\\[",e:"\\]\\]>",relevance:10},c,{cN:"meta",b:/<\?xml/,e:/\?>/,relevance:10},{b:/<\?(php)?/,e:/\?>/,sL:"php",c:[{b:"/\\*",e:"\\*/",skip:!0},{b:'b"',e:'"',skip:!0},{b:"b'",e:"'",skip:!0},e.inherit(e.ASM,{i:null,cN:null,c:null,skip:!0}),e.inherit(e.QSM,{i:null,cN:null,c:null,skip:!0})]},{cN:"tag",b:"<style(?=\\s|>)",e:">",k:{name:"style"},c:[r],starts:{e:"</style>",rE:!0,sL:["css","xml"]}},{cN:"tag",b:"<script(?=\\s|>)",e:">",k:{name:"script"},c:[r],starts:{e:"<\/script>",rE:!0,sL:["actionscript","javascript","handlebars","xml"]}},{cN:"tag",b:"</?",e:"/?>",c:[{cN:"name",b:/[^\/><\s]+/,relevance:0},r]}]}});hljs.registerLanguage("json",function(e){var i={literal:"true false null"},n=[e.CLCM,e.CBCM],c=[e.QSM,e.CNM],r={e:",",eW:!0,eE:!0,c:c,k:i},t={b:"{",e:"}",c:[{cN:"attr",b:/"/,e:/"/,c:[e.BE],i:"\\n"},e.inherit(r,{b:/:/})].concat(n),i:"\\S"},a={b:"\\[",e:"\\]",c:[e.inherit(r)],i:"\\S"};return c.push(t,a),n.forEach(function(e){c.push(e)}),{c:c,k:i,i:"\\S"}});hljs.registerLanguage("css",function(e){var c={b:/(?:[A-Z\_\.\-]+|--[a-zA-Z0-9_-]+)\s*:/,rB:!0,e:";",eW:!0,c:[{cN:"attribute",b:/\S/,e:":",eE:!0,starts:{eW:!0,eE:!0,c:[{b:/[\w-]+\(/,rB:!0,c:[{cN:"built_in",b:/[\w-]+/},{b:/\(/,e:/\)/,c:[e.ASM,e.QSM,e.CSSNM]}]},e.CSSNM,e.QSM,e.ASM,e.CBCM,{cN:"number",b:"#[0-9A-Fa-f]+"},{cN:"meta",b:"!important"}]}}]};return{cI:!0,i:/[=\/|'\$]/,c:[e.CBCM,{cN:"selector-id",b:/#[A-Za-z0-9_-]+/},{cN:"selector-class",b:/\.[A-Za-z0-9_-]+/},{cN:"selector-attr",b:/\[/,e:/\]/,i:"$",c:[e.ASM,e.QSM]},{cN:"selector-pseudo",b:/:(:)?[a-zA-Z0-9\_\-\+\(\)"'.]+/},{b:"@(page|font-face)",l:"@[a-z-]+",k:"@page @font-face"},{b:"@",e:"[{;]",i:/:/,rB:!0,c:[{cN:"keyword",b:/@\-?\w[\w]*(\-\w+)*/},{b:/\s/,eW:!0,eE:!0,relevance:0,k:"and or not only",c:[{b:/[a-z-]+:/,cN:"attribute"},e.ASM,e.QSM,e.CSSNM]}]},{cN:"selector-tag",b:"[a-zA-Z-][a-zA-Z0-9_-]*",relevance:0},{b:"{",e:"}",i:/\S/,c:[e.CBCM,c]}]}});hljs.registerLanguage("javascript",function(e){var r="[A-Za-z$_][0-9A-Za-z$_]*",a={keyword:"in of if for while finally var new function do return void else break catch instanceof with throw case default try this switch continue typeof delete let yield const export super debugger as async await static import from as",literal:"true false null undefined NaN Infinity",built_in:"eval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent encodeURI encodeURIComponent escape unescape Object Function Boolean Error EvalError InternalError RangeError ReferenceError StopIteration SyntaxError TypeError URIError Number Math Date String RegExp Array Float32Array Float64Array Int16Array Int32Array Int8Array Uint16Array Uint32Array Uint8Array Uint8ClampedArray ArrayBuffer DataView JSON Intl arguments require module console window document Symbol Set Map WeakSet WeakMap Proxy Reflect Promise"},t={cN:"number",v:[{b:"\\b(0[bB][01]+)n?"},{b:"\\b(0[oO][0-7]+)n?"},{b:e.CNR+"n?"}],relevance:0},c={cN:"subst",b:"\\$\\{",e:"\\}",k:a,c:[]},n={b:"html`",e:"",starts:{e:"`",rE:!1,c:[e.BE,c],sL:"xml"}},s={b:"css`",e:"",starts:{e:"`",rE:!1,c:[e.BE,c],sL:"css"}},o={cN:"string",b:"`",e:"`",c:[e.BE,c]};c.c=[e.ASM,e.QSM,n,s,o,t,e.RM];var i=c.c.concat([e.CBCM,e.CLCM]);return{aliases:["js","jsx","mjs","cjs"],k:a,c:[{cN:"meta",relevance:10,b:/^\s*['"]use (strict|asm)['"]/},{cN:"meta",b:/^#!/,e:/$/},e.ASM,e.QSM,n,s,o,e.CLCM,e.C("/\\*\\*","\\*/",{relevance:0,c:[{cN:"doctag",b:"@[A-Za-z]+",c:[{cN:"type",b:"\\{",e:"\\}",relevance:0},{cN:"variable",b:r+"(?=\\s*(-)|$)",endsParent:!0,relevance:0},{b:/(?=[^\n])\s/,relevance:0}]}]}),e.CBCM,t,{b:/[{,\n]\s*/,relevance:0,c:[{b:r+"\\s*:",rB:!0,relevance:0,c:[{cN:"attr",b:r,relevance:0}]}]},{b:"("+e.RSR+"|\\b(case|return|throw)\\b)\\s*",k:"return throw case",c:[e.CLCM,e.CBCM,e.RM,{cN:"function",b:"(\\(.*?\\)|"+r+")\\s*=>",rB:!0,e:"\\s*=>",c:[{cN:"params",v:[{b:r},{b:/\(\s*\)/},{b:/\(/,e:/\)/,eB:!0,eE:!0,k:a,c:i}]}]},{cN:"",b:/\s/,e:/\s*/,skip:!0},{b:/</,e:/(\/[A-Za-z0-9\\._:-]+|[A-Za-z0-9\\._:-]+\/)>/,sL:"xml",c:[{b:/<[A-Za-z0-9\\._:-]+\s*\/>/,skip:!0},{b:/<[A-Za-z0-9\\._:-]+/,e:/(\/[A-Za-z0-9\\._:-]+|[A-Za-z0-9\\._:-]+\/)>/,skip:!0,c:[{b:/<[A-Za-z0-9\\._:-]+\s*\/>/,skip:!0},"self"]}]}],relevance:0},{cN:"function",bK:"function",e:/\{/,eE:!0,c:[e.inherit(e.TM,{b:r}),{cN:"params",b:/\(/,e:/\)/,eB:!0,eE:!0,c:i}],i:/\[|%/},{b:/\$[(.]/},e.METHOD_GUARD,{cN:"class",bK:"class",e:/[{;=]/,eE:!0,i:/[:"\[\]]/,c:[{bK:"extends"},e.UTM]},{bK:"constructor get set",e:/\{/,eE:!0}],i:/#(?!!)/}});
