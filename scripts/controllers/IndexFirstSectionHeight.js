import { Tweak } from '@squarespace/core';
import Darwin from '@squarespace/darwin';
import resizeEnd from '../utils/resizeEnd';

/**
 * If min-height tweak is applied to the first index page, we need to account
 * for the height of the top header and announcement bar (and border) and
 * subtract that from the vh height of the first section, so the bottom of the
 * section lines up with the bottom of the screen.
 *
 * @return {Object}  controller lifecycle methods
 */

function IndexFirstSectionHeight(element) {
  let darwin;
  const site = document.querySelector('.Site');
  const headerTop = document.querySelector('.Header--top');
  const headerBottom = document.querySelector('.Header--bottom');
  const announcementBar = document.querySelector('.sqs-announcement-bar-dropzone');
  const firstSection = element.querySelector('.Index-page, .Index-gallery');
  const isGallery = firstSection.classList.contains('Index-gallery');

  const getBorderHeight = () => {
    if (Tweak.getValue('tweak-site-border-show') !== 'true') {
      return 0;
    }
    if (parseFloat(Tweak.getValue('tweak-site-border-width')) <= 0) {
      return 0;
    }
    const borderWidth = parseFloat(window.getComputedStyle(site).borderWidth);
    const doubleBorderGallery = isGallery && Tweak.getValue('tweak-index-gallery-apply-bottom-spacing') === 'true';
    const doubleBorderPage = !isGallery && Tweak.getValue('tweak-index-page-apply-bottom-spacing') === 'true';
    if (doubleBorderGallery || doubleBorderPage) {
      return borderWidth * 2;
    }
    return borderWidth;
  };

  const getHeaderBottomHeight = () => {
    const isOverlaidOnIndexGallery = Tweak.getValue('tweak-header-bottom-overlay-on-index-gallery') === 'true';
    const hasIndexGallery = headerBottom.classList.contains('Header--index-gallery');

    return !isOverlaidOnIndexGallery && hasIndexGallery ? headerBottom.offsetHeight : 0;
  };

  const applyHeight = (height, heightElement = firstSection) => {
    const prop = isGallery ? 'height' : 'minHeight';

    if (!height) {
      heightElement.style[prop] = '';
      return;
    }

    const borderHeight = getBorderHeight();
    const headerTopHeight = headerTop.offsetHeight;
    const headerBottomHeight = getHeaderBottomHeight();
    const announcementBarHeight = announcementBar ? announcementBar.offsetHeight : 0;

    const totalHeight = borderHeight + headerTopHeight + headerBottomHeight + announcementBarHeight;
    if (totalHeight > 0) {
      heightElement.style[prop] = `calc(${height} - ${totalHeight}px)`;
    } else {
      heightElement.style[prop] = '';
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

      const innerWrapper = firstSection.querySelector('.Index-gallery-wrapper');

      if (!isSlideshow || !isFixedHeight || unit !== 'vh') {
        applyHeight(0, innerWrapper);
        return;
      }

      applyHeight(height, innerWrapper);
      return;
    }

    const fullscreenSetting = Tweak.getValue('tweak-index-page-fullscreen');
    if (fullscreenSetting === 'None') {
      applyHeight(0);
      return;
    }
    if (fullscreenSetting === 'Pages with Backgrounds Only' && !firstSection.classList.contains('Index-page--has-image')) {
      applyHeight(0);
      return;
    }

    const vhHeight = Tweak.getValue('tweak-index-page-min-height');
    applyHeight(vhHeight);
  };

  const bindListeners = () => {
    Tweak.watch([
      'tweak-header-bottom-overlay-on-index-gallery',
      'tweak-index-page-fullscreen',
      'tweak-index-page-min-height',
      'tweak-index-page-apply-bottom-spacing',
      'tweak-index-gallery-fixed-height',
      'tweak-index-gallery-height',
      'tweak-index-gallery-apply-bottom-spacing'
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

export default IndexFirstSectionHeight;