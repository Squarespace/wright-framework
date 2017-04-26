import resizeEnd from '../utils/resizeEnd';

/**
 * Sets a classname `is-mobile` on body depending on whether or not the .Mobile
 * element is currently displayed. Since the breakpoint for mobile is toggleable
 * by the user in tweak, this is used to add an additional CSS hook.
 */
function MobileClassname(element) {
  const mobileNode = element.querySelector('.Mobile');

  const setClassname = () => {
    const isMobile = window.getComputedStyle(mobileNode).display !== 'none';
    element.classList.toggle('is-mobile', isMobile);
  };

  resizeEnd(setClassname);
  setClassname();

  return {
    sync: setClassname
  };
}

export default MobileClassname;