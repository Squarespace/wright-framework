import { Tweak } from '@squarespace/core';
import resizeEnd from '../utils/resizeEnd';

export const mobileOverlayActiveClassname = 'is-mobile-overlay-active';
const mobileOverlayTweaks = [
  'slide-origin',
  'back-color',
  'close-show',
  'close-background-color',
  'close-icon-color',
  'menu-color',
  'menu-indicator-color',
  'menu-primary-font',
  'menu-primary-text-color',
  'menu-primary-style-button',
  'menu-primary-button-style',
  'menu-primary-button-shape',
  'menu-primary-button-font',
  'menu-primary-button-color',
  'menu-primary-button-text-color',
  'menu-secondary-inherit',
  'menu-secondary-font',
  'menu-secondary-text-color',
  'menu-secondary-style-button',
  'menu-secondary-button-style',
  'menu-secondary-button-shape',
  'menu-secondary-button-font',
  'menu-secondary-button-color',
  'menu-secondary-button-text-color'
].map((tweakName) => 'tweak-mobile-overlay-' + tweakName);

let scrollPos;

/**
 * Checks to see if the overlay is currently open
 * @return {Boolean}
 */
export const isOverlayOpen = () => {
  return document.body.classList.contains(mobileOverlayActiveClassname);
};

/**
 * Close the mobile overlay
 */
export const closeOverlay = () => {
  document.body.classList.remove(mobileOverlayActiveClassname);
  document.body.style.top = '';
  window.scrollTo(0, scrollPos);
};

/**
 * Binds the functionality to toggle the mobile overlay's visibility.
 */
function MobileOverlayToggle(element) {

  const handleClick = (e) => {
    e.preventDefault();

    if (isOverlayOpen()) {
      closeOverlay();
    } else {
      scrollPos = document.documentElement.scrollTop || document.body.scrollTop;
      document.body.classList.add(mobileOverlayActiveClassname);
      document.body.style.top = -1 * scrollPos + 'px';
    }
  };

  const handleResize = () => {
    if (!document.body.classList.contains('is-mobile')) {
      document.body.classList.remove(mobileOverlayActiveClassname);
    }
  };

  const bindListeners = function() {
    resizeEnd(handleResize);
    element.addEventListener('click', handleClick);
  };

  const destroy = function() {
    element.removeEventListener('click', handleClick);
  };

  Tweak.watch((tweak) => {
    const isMobileActive = document.body.classList.contains('is-mobile') &&
                         tweak.name &&
                         mobileOverlayTweaks.indexOf(tweak.name) >= 0;

    document.body.classList.toggle(mobileOverlayActiveClassname, isMobileActive);
  });

  bindListeners();

  return {
    destroy
  };

}


export default MobileOverlayToggle;