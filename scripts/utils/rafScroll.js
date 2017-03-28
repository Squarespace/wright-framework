let scrollFunctions = [];
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