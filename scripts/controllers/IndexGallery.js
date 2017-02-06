import { Tweak, ImageLoader } from '@squarespace/core';
import { authenticated } from '../constants';
import { isMobileUA, resizeEnd } from '../util';

const imageQuantityAttr = 'data-index-gallery-images';
const itemSelector = '.Index-gallery-item';

/**
 * Bootstraps the index gallery, ensuring that it will always have a smooth
 * "bottom edge" by looking at the last two sets of 10 images and dividing them
 * to ensure that there are at least 3 images in the last set. Also handles a
 * Safari rendering bug where the images "jiggle".
 */
function IndexGallery(element) {
  const sections = Array.from(element.querySelectorAll('.Index-gallery-inner'));

  if (sections.length === 0) {
    return null;
  }

  const images = Array.from(element.querySelectorAll('img'));

  const promoteLayers = () => {
    // Gallery images will jiggle in Safari unless they are layer-promoted.
    // We don't want to layer promote them in all cases becauses creating
    // extra layers is bad for parallax performance, so we have to do this
    // userAgent lookup for Safari specifically.

    // Note: the Chrome condition negates Chrome and Microsoft Edge, which
    // mysteriously has both "Safari" and "Chrome" in its UA string.
    const userAgent = window.navigator.userAgent;
    const hasHoverTransition = document.body.classList.contains('tweak-index-gallery-hover-style-fade');
    if (!hasHoverTransition || isMobileUA() || !userAgent.match(/Safari/i) || userAgent.match(/Chrome/i)) {
      return;
    }
    images.forEach((image) => {
      image.style.webkitTransform = 'translatez(0)';
    });
  };

  const buildGrid = () => {
    // If there's more than 1 section, ensure there are at least 3 items in the last section
    const lastSection = sections[sections.length - 1];
    const lastSectionItems = lastSection.querySelectorAll(itemSelector);

    if (sections.length > 1 && lastSectionItems.length < 3) {
      const secondToLastSection = sections[sections.length - 2];
      const secondToLastSectionItems = Array.from(secondToLastSection.querySelectorAll(itemSelector));

      for (let i = lastSectionItems.length; i < 3; i++) {
        lastSection.insertBefore(secondToLastSectionItems[8 - i], lastSection.firstChild);
      }

      secondToLastSection.setAttribute(imageQuantityAttr, 6 + lastSectionItems.length);
      lastSection.setAttribute(imageQuantityAttr, 3);

    } else {
      lastSection.setAttribute(imageQuantityAttr, lastSectionItems.length);
    }
  };

  const loadImages = () => {
    images.forEach((image) => {
      ImageLoader.load(image, {
        load: true,
        mode: 'fill'
      });
    });
    promoteLayers();
  };

  if (authenticated) {
    Tweak.watch([
      'tweak-index-gallery-layout',
      'tweak-index-gallery-spacing',
      'tweak-index-gallery-aspect'
    ], loadImages);
  }

  resizeEnd(loadImages);

  // Init
  buildGrid();
  loadImages();
  element.classList.add('loaded');

}



export default IndexGallery;