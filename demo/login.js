
/* Utility functions for login */

// opens an URL on the center of the screen
function openWindow(url, width, height) {
   var w = window,
      left = (w.screenX || w.screenLeft) + (w.outerWidth - width) / 2,
      top = (w.screenY || w.screenTop) + 50,
      opts = "left=" +left+ ",top=" +top+ ",status=0,scrollbars=0,menubar=0";

   w.open(url, "moot_popup", opts + ",width=" +width+ ",height=" +height).focus();
}

// open authentication window
function openLogin(session) {
  var url = 'https://app.muut.com/account/auth/login/?path=/playground'

  url += '&sessionId=' + session.sessionId
  url += '&channelId=' + session.channelId

  openWindow(url, 800, 700)
}
