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

  const getBorderHeight = () => {
    if (Tweak.getValue('tweak-site-border-show') !== 'true') {
      return 0;
    }
    if (parseFloat(Tweak.getValue('tweak-site-border-width')) <= 0) {
      return 0;
    }
    return parseFloat(window.getComputedStyle(site).borderWidth);
  };

  const setMinHeight = () => {
    const fullscreenSetting = Tweak.getValue('tweak-index-page-fullscreen');
    if (fullscreenSetting === 'None') {
      element.style.height = '';
      return;
    }
    if (fullscreenSetting === 'Pages with Backgrounds Only' && !element.classList.contains('Index-page--has-image')) {
      element.style.height = '';
      return;
    }


    const vhHeight = Tweak.getValue('tweak-index-page-min-height');
    const borderHeight = getBorderHeight();
    const headerHeight = headerTop.offsetHeight;
    const announcementBarHeight = announcementBar ? announcementBar.offsetHeight : 0;

    const totalHeight = borderHeight + headerHeight + announcementBarHeight;
    if (totalHeight > 0) {
      element.style.minHeight = `calc(${vhHeight} - ${totalHeight}px)`;
    } else {
      element.style.height = '';
    }
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