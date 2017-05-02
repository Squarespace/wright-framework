/**
 * Figures out based on userAgent whether or not the current browser is desktop
 * Safari 10.x
 */
const isSafari10UA = () => {
  return window.navigator.userAgent.match(/Intel Mac OS X.+Version\/10.+Safari/i);
};

export default isSafari10UA;