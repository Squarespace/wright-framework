import { Tweak } from '@squarespace/core';
import Darwin from '@squarespace/darwin';
import resizeEnd from '../utils/resizeEnd';

/**
 * A simple value parser to return a number and unit from a string value e.g.
 * '40px'. WARNING: Only works with values that have digits first, followed by
 * an alphabetical string unit.
 *
 * @param  {String} val  String value to parse
 * @return {Object}      Parsed object with keys 'number' and 'unit'
 */
const parseValue = (val) => {
  const [ number, unit ] = val.match(/([\d\.])+|([A-Za-z])+/g);
  return { number: parseFloat(number), unit };
};

/**
 * Convenience method to apply a style to all elements in an array.
 * @param  {Array} els
 * @param  {String} prop
 * @param  {String} style
 */
const applyStyleTo = (els, prop, style) => {
  els.forEach((el) => {
    el.style[prop] = style;
  });
};

/**
 * If min-height tweak is applied to the first index page or gallery, we need to
 * potentially account for the height of the top header, bottom header, top
 * mobile bar, announcement bar, and border, and subtract that from the vh
 * height of the first section, so the bottom of the section lines up with the
 * bottom of the screen.
 */
function IndexFirstSectionHeight(element) {
  if (element.classList.contains('Index--empty')) {
    return;
  }

  let darwin;
  const site = document.querySelector('.Site');
  const headerTop = document.querySelector('.Header--top');
  const headerBottom = document.querySelector('.Header--bottom');
  const mobileBarTop = document.querySelector('.Mobile-bar--top');
  const announcementBar = document.querySelector('.sqs-announcement-bar-dropzone');
  const firstSection = element.querySelector('.Index-page, .Index-gallery');
  const isGallery = firstSection.classList.contains('Index-gallery');
  const galleryItems = isGallery && Array.from(firstSection.querySelectorAll('.Index-gallery-item'));

  /**
   * Get the height of the border that we need to offset, taking into account
   * cases like the border tweak being on or off, border being mirrored, top
   * border not showing due to mobile header being the same color, etc.
   * @return {Number}  Border width needing to be offset
   */
  const getBorderHeight = () => {
    if (Tweak.getValue('tweak-site-border-show') !== 'true') {
      return 0;
    }
    if (parseFloat(Tweak.getValue('tweak-site-border-width')) <= 0) {
      return 0;
    }
    const borderWidth = parseFloat(window.getComputedStyle(site).borderLeftWidth);
    const borderTopWidth = parseFloat(window.getComputedStyle(site).borderTopWidth);

    const isMobileBorderTopRemoved = borderWidth !== borderTopWidth && borderTopWidth === 0;
    if (isMobileBorderTopRemoved) {
      return borderWidth;
    }

    const doubleBorderGallery = isGallery && Tweak.getValue('tweak-index-gallery-apply-bottom-spacing') === 'true';
    const doubleBorderPage = !isGallery && Tweak.getValue('tweak-index-page-apply-bottom-spacing') === 'true';
    if (doubleBorderGallery || doubleBorderPage) {
      return borderWidth * 2;
    }
    return borderWidth;
  };

  /**
   * When a gallery is first in the index, the user has the option to not
   * overlay the bottom header on the gallery. This function gets the height
   * of the bottom header, taking into account whether or not it's overlaid on
   * the first index gallery.
   * @return {Number}  Bottom header height needing to be offset
   */
  const getHeaderBottomHeight = () => {
    const isOverlaidOnIndexGallery = Tweak.getValue('tweak-header-bottom-overlay-on-index-gallery') === 'true';
    const hasIndexGallery = headerBottom.classList.contains('Header--index-gallery');

    return !isOverlaidOnIndexGallery && hasIndexGallery ? headerBottom.offsetHeight : 0;
  };

  /**
   * Function to actually apply the offset to the first section. If given 0,
   * will clear out the height instead.
   *
   * @param  {String}      height         Height of first section (Raw CSS value, not parsed number)
   * @param  {HTMLElement} heightElement  Element to apply adjusted height to
   */
  const applyHeight = (height, heightElements = [ firstSection ]) => {
    const prop = isGallery ? 'height' : 'minHeight';

    if (!height) {
      applyStyleTo(heightElements, prop, '');
      return;
    }

    const borderHeight = getBorderHeight();
    const headerTopHeight = headerTop.offsetHeight;
    const headerBottomHeight = getHeaderBottomHeight();
    const mobileBarTopHeight = mobileBarTop.offsetHeight;
    const announcementBarHeight = announcementBar ? announcementBar.offsetHeight : 0;

    const totalHeight = [
      borderHeight,
      headerTopHeight,
      headerBottomHeight,
      mobileBarTopHeight,
      announcementBarHeight
    ].reduce((a, b) => a + b, 0);

    if (totalHeight > 0) {
      applyStyleTo(heightElements, prop, `calc(${height} - ${totalHeight}px)`);
    } else {
      applyStyleTo(heightElements, prop, '');
    }
  };

  /**
   * Sync function that determines which element to set height on (if any), and
   * calls the applyHeight function with the proper values.
   */
  const setMinHeight = () => {

    if (isGallery) {
      const isSlideshow = Tweak.getValue('tweak-index-gallery-layout') === 'Slideshow';
      const isFixedHeight = Tweak.getValue('tweak-index-gallery-fixed-height') === 'true';
      const height = Tweak.getValue('tweak-index-gallery-height');
      const { unit } = parseValue(height);

      // Height is applied on all .Index-gallery-item and not just the wrapper
      // in order to fix a Safari clientHeight issue. See index.less for more info
      const innerWrapper = firstSection.querySelector('.Index-gallery-wrapper');
      const heightElements = [ innerWrapper ].concat(galleryItems);

      if (!isSlideshow || !isFixedHeight || unit !== 'vh') {
        applyHeight(0, heightElements);
        return;
      }

      applyHeight(height, heightElements);
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