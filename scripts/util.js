/**
 * Given a function, run the function, debounced, after resize. Also unbinds the
 * function from resize automatically on mercury's unload event.
 *
 * @param  {Function} fn      Function to bind
 * @param  {Object}   thisArg Context
 */
export const resizeEnd = (fn, thisArg) => {
  thisArg = thisArg || window;

  const RESIZE_TIMEOUT = 100;
  let _resizeMeasureTimer;

  const resize = () => {
    clearTimeout(_resizeMeasureTimer);
    _resizeMeasureTimer = setTimeout(() => {
      fn.apply(thisArg);
    }, RESIZE_TIMEOUT);
  };

  window.addEventListener('resize', resize);

  window.addEventListener('mercury:unload', () => {
    window.removeEventListener('resize', resize);
  });
};

/**
 * Figures out based on userAgent whether or not the current browser is a mobile
 * browser.
 */
export const isMobileUA = () => {

  const UA = {
    Android: function() { return window.navigator.userAgent.match(/Android/i); },
    BlackBerry: function() { return window.navigator.userAgent.match(/BlackBerry/i); },
    iOS: function() { return window.navigator.userAgent.match(/iPhone|iPad|iPod/i); },
    Opera: function() { return window.navigator.userAgent.match(/Opera Mini/i); },
    Windows: function() { return window.navigator.userAgent.match(/IEMobile/i); }
  };

  return (UA.Android() || UA.BlackBerry() || UA.iOS() || UA.Opera() || UA.Windows());

};
