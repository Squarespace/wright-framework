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


const scrollFunctions = [];
let handleScroll = () => {};
let scrollTimeout;

const getUnifiedScrollHandler = (fns) => {
  let scrolling = false;

  const scroll = () => {
    fns.forEach((fn) => {
      fn();
    });
  };

  /**
   * A wrapper for the scroll logic that can be called recursively by raf.
   */
  const scrollCallback = () => {
    scroll(window.pageYOffset);
    if (scrolling === true) {
      window.requestAnimationFrame(scrollCallback);
    }
  };

  /**
   * The actual scroll handler that wraps the scroll callback and starts the
   * raf calls.
   */
  return () => {
    if (scrolling === false) {
      scrolling = true;
      document.documentElement.style.pointerEvents = 'none';
      scrollCallback();
    }
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(() => {
      scrolling = false;
      document.documentElement.style.pointerEvents = 'auto';
    }, 100);
  };

};

export const rafScroll = (fn) => {
  scrollFunctions.push(fn);
  window.removeEventListener('scroll', handleScroll);
  handleScroll = getUnifiedScrollHandler(scrollFunctions);
  window.addEventListener('scroll', handleScroll);

  window.addEventListener('mercury:unload', () => {
    clearTimeout(scrollTimeout);
    window.removeEventListener('scroll', handleScroll);
  });
};