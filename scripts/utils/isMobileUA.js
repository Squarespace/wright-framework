/**
 * Figures out based on userAgent whether or not the current browser is a mobile
 * browser.
 */
const isMobileUA = () => {

  const UA = {
    Android: function() { return window.navigator.userAgent.match(/Android/i); },
    BlackBerry: function() { return window.navigator.userAgent.match(/BlackBerry/i); },
    iOS: function() { return window.navigator.userAgent.match(/iPhone|iPad|iPod/i); },
    Opera: function() { return window.navigator.userAgent.match(/Opera Mini/i); },
    Windows: function() { return window.navigator.userAgent.match(/IEMobile/i); }
  };

  return (UA.Android() || UA.BlackBerry() || UA.iOS() || UA.Opera() || UA.Windows());

};

export default isMobileUA;