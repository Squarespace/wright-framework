/**
 * Given a function, run the function, debounced, after resize. Also unbinds the
 * function from resize automatically on mercury's unload event.
 *
 * @param  {Function} fn      Function to bind
 * @param  {Object}   thisArg Context
 */
const resizeEnd = (fn, thisArg) => {
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

export default resizeEnd;