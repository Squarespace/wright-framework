import { Tweak } from '@squarespace/core';
import Darwin from '@squarespace/darwin';
import { resizeEnd } from '../util';

/**
 * If min-height tweak is applied to the first index page, we need to account
 * for the height of the top header and announcement bar (and border) and
 * subtract that from the vh height of the first section, so the bottom of the
 * section lines up with the bottom of the screen.
 *
 * @return {Object}  controller lifecycle methods
 */

function IndexFirstPageHeight(element) {
  let darwin;
  const site = document.querySelector('.Site');
  const headerTop = document.querySelector('.Header--top');
  const announcementBar = document.querySelector('.sqs-announcement-bar-dropzone');
  const isGallery = element.classList.contains('Index-gallery');

  const getBorderHeight = () => {
    if (Tweak.getValue('tweak-site-border-show') !== 'true') {
      return 0;
    }
    if (parseFloat(Tweak.getValue('tweak-site-border-width')) <= 0) {
      return 0;
    }
    return parseFloat(window.getComputedStyle(site).borderWidth);
  };

  const applyHeight = (height, el = element, prop = 'minHeight') => {
    if (!height) {
      el.style[prop] = '';
      return;
    }

    const borderHeight = getBorderHeight();
    const headerHeight = headerTop.offsetHeight;
    const announcementBarHeight = announcementBar ? announcementBar.offsetHeight : 0;

    const totalHeight = borderHeight + headerHeight + announcementBarHeight;
    if (totalHeight > 0) {
      el.style[prop] = `calc(${height} - ${totalHeight}px)`;
    } else {
      el.style[prop] = '';
    }
  };

  const parseValue = (val) => {
    const [ number, unit ] = val.match(/([\d\.])+|([A-Za-z])+/g);
    return { number: parseFloat(number), unit };
  };

  const setMinHeight = () => {

    if (isGallery) {
      const isSlideshow = Tweak.getValue('tweak-index-gallery-layout') === 'Slideshow';
      const isFixedHeight = Tweak.getValue('tweak-index-gallery-fixed-height') === 'true';
      const height = Tweak.getValue('tweak-index-gallery-height');
      const { unit } = parseValue(height);

      const innerWrapper = element.querySelector('.Index-gallery-wrapper');

      if (!isSlideshow || !isFixedHeight || unit !== 'vh') {
        applyHeight(0, innerWrapper, 'height');
        return;
      }

      applyHeight(height, innerWrapper, 'height');
      return;
    }

    const fullscreenSetting = Tweak.getValue('tweak-index-page-fullscreen');
    if (fullscreenSetting === 'None') {
      applyHeight(0);
      return;
    }
    if (fullscreenSetting === 'Pages with Backgrounds Only' && !element.classList.contains('Index-page--has-image')) {
      applyHeight(0);
      return;
    }

    const vhHeight = Tweak.getValue('tweak-index-page-min-height');
    applyHeight(vhHeight);
  };

  const bindListeners = () => {
    Tweak.watch([
      'tweak-index-page-fullscreen',
      'tweak-index-page-min-height'
    ], setMinHeight);
    darwin = new Darwin({
      targets: [
        '.sqs-announcement-bar-dropzone'
      ],
      callback: setMinHeight
    });
    darwin.init();
    resizeEnd(setMinHeight);
  };

  const destroy = () => {
    darwin.destroy();
    darwin = null;
  };

  setMinHeight();
  bindListeners();

  return {
    sync: setMinHeight,
    destroy: destroy
  };
}

export default IndexFirstPageHeight;