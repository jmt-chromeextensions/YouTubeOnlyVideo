$( document ).ready(function() {
    $('.sp-colorize-container.sp-add-on').css('border', '0px'); 
    $("#color-picker").click()

    $('#container').click(function()
    { 
        $("#color-picker").click()
    });

    function popitup(url,windowName) {
        newwindow=window.open(url,windowName,'height=200,width=300,titlebar=0');
        if (window.focus) {newwindow.focus()}
        return false;
      }

    popitup();

});