let handleScroll = () => {};
let destructor = () => {};
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
      document.documentElement.style.pointerEvents = 'none';
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
      document.documentElement.style.pointerEvents = '';
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
 * Given a scroll handler, get the destructor for that scroll handler.
 * @param  {Function} fn   Scroll Handler.
 * @return {Function}      Destructor
 */
const getScrollDestructor = (fn) => {
  return () => {
    scrollHandlers = [];
    handleScroll = () => {};
    clearTimeout(scrollTimeout);
    window.removeEventListener('scroll', fn);
  };
};

/**
 * When a new function is added, unbind and rebind the event listeners for
 * scroll and mercury:unload.
 */
const rebindListeners = () => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('mercury:unload', destructor);

  handleScroll = getUnifiedScrollHandler(scrollHandlers);
  destructor = getScrollDestructor(handleScroll);

  window.addEventListener('scroll', handleScroll);
  window.addEventListener('mercury:unload', destructor);
};

/**
 * Add a function to the unified scroll handler to be run each frame during
 * scroll.
 *
 * @param  {Function} fn   Function to bind to scroll
 */
export const rafScroll = (fn) => {
  scrollHandlers.push({
    fn,
    type: 'scroll'
  });
  rebindListeners();
};

/**
 * Add a function to the unified scroll handler to be run when scroll starts.
 *
 * @param  {Function} fn   Function to bind to scroll start
 */
export const rafScrollStart = (fn) => {
  scrollHandlers.push({
    fn,
    type: 'start'
  });
  rebindListeners();
};

/**
 * Add a function to the unified scroll handler to be run when scroll ends.
 *
 * @param  {Function} fn   Function to bind to scroll start
 */
export const rafScrollEnd = (fn) => {
  scrollHandlers.push({
    fn,
    type: 'end'
  });
  rebindListeners();
};

export default rafScroll;