let handleScroll = () => {};
let scrollFunctions = [];
let scrollTimeout;

/**
 * For performance purposes, we don't want to set multiple scroll handlers on
 * the page. Instead, we store all the handler functions in an array, and
 * execute them all in order in one unified handler. This methodology also
 * implements requestAnimationFrame.
 *
 * @return {Function}     Unified scroll handler
 */
const getUnifiedScrollHandler = () => {
  let scrolling = false;

  const scroll = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    scrollFunctions.forEach((fn) => {
      fn(scrollTop);
    });
  };

  const scrollCallback = () => {
    scroll(window.pageYOffset);
    if (scrolling === true) {
      window.requestAnimationFrame(scrollCallback);
    }
  };

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

/**
 * The scroll method through which functions are added to the unified scroll
 * handler. Also handles unbinding and clearing out on mercury unload.
 *
 * @param  {Function} fn   Function to bind to scroll
 */
const rafScroll = (fn) => {
  scrollFunctions.push(fn);
  window.removeEventListener('scroll', handleScroll);
  handleScroll = getUnifiedScrollHandler(scrollFunctions);
  window.addEventListener('scroll', handleScroll);

  window.addEventListener('mercury:unload', () => {
    scrollFunctions = [];
    handleScroll = () => {};
    clearTimeout(scrollTimeout);
    window.removeEventListener('scroll', handleScroll);
  });
};

export default rafScroll;