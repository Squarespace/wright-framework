let scrollHandlers = [];
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
  let scrollTop = window.pageYOffset;
  let scrolling = false;
  let ticking = false;

  const scroll = () => {
    ticking = false;
    scrollHandlers.forEach(({ fn, type }) => {
      if (type !== 'scroll') {
        return;
      }
      fn(scrollTop);
    });
  };

  const requestTick = () => {
    if (!ticking) {
      window.requestAnimationFrame(scroll);
    }
    ticking = true;
  };

  return () => {
    if (scrolling === false) {
      scrolling = true;
      scrollHandlers.forEach(({ fn, type }) => {
        if (type !== 'start') {
          return;
        }
        fn();
      });
    }

    scrollTop = window.pageYOffset;
    requestTick();

    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(() => {
      scrolling = false;
      scrollHandlers.forEach(({ fn, type }) => {
        if (type !== 'end') {
          return;
        }
        fn();
      });
    }, 100);
  };

};

/**
 * Destructor.
 */
const destroy = () => {
  clearTimeout(scrollTimeout);
};

/**
 * Initialize scroll by binding unified scroll handler to scroll and destructor
 * to mercury unload.
 */
const initScroll = () => {
  const handleScroll = getUnifiedScrollHandler();
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('mercury:unload', destroy);
};


initScroll();

/**
 * Add a function to be run in the unified scroll handler.
 *
 * @param  {String}   type   'start', 'scroll', or 'end'
 * @param  {Function} fn     Function to attach
 */
export const addScrollListener = (type, fn) => {
  scrollHandlers.push({ type, fn });
};

/**
 * Remove a given function from unified scroll handler.
 *
 * @param  {String}   type   'start', 'scroll', or 'end'
 * @param  {Function} fn     Function to detach
 */
export const removeScrollListener = (type, fn) => {
  scrollHandlers.some((handler, i) => {
    const isSameHandler = handler.type === type && handler.fn === fn;
    if (isSameHandler) {
      scrollHandlers.splice(i, 1);
      return true;
    }
    return false;
  });
};

export default { addScrollListener, removeScrollListener };