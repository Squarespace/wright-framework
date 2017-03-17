import { Tweak, ImageLoader } from '@squarespace/core';
import { authenticated } from '../constants';
import { isMobileUA, resizeEnd } from '../util';


/**
 * Bootstraps the index gallery, ensuring that it will always have a smooth
 * "bottom edge" by looking at the last two sets of 10 images and dividing them
 * to ensure that there are at least 3 images in the last set. Also handles a
 * Safari rendering bug where the images "jiggle".
 */
function IndexGallery(element) {

  const galleryItems = Array.from(element.querySelectorAll('.Index-gallery-item'));
  const numWrappers = Math.floor(galleryItems.length / 9) + 1;
  const numLastWrapperItems = galleryItems.length % 9;

  if (galleryItems.length === 0) {
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

  const wrapGalleryItems = () => {
    for (let i = 0; i < numWrappers; i++) {
      const wrapper = document.createElement('div');
      const numWrapperItems = i === numWrappers - 1 ? numLastWrapperItems : 9;
      wrapper.className = 'Index-gallery-inner clear';
      wrapper.setAttribute('data-index-gallery-images', numWrapperItems);

      const currentWrapperItems = galleryItems.slice(i * 9, (i + 1) * 9);
      currentWrapperItems.forEach((galleryItem) => {
        wrapper.appendChild(galleryItem);
      });
      element.appendChild(wrapper);
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

  const sync = () => {
    const layout = Tweak.getValue('tweak-index-gallery-layout');
    if (layout === 'Packed' || layout === 'Split') {
      wrapGalleryItems();
    }
    loadImages();
    element.classList.add('loaded');
  };

  const bindListeners = () => {
    if (authenticated) {
      Tweak.watch([
        'tweak-index-gallery-layout',
        'tweak-index-gallery-items-per-row',
        'tweak-index-gallery-min-item-width',
        'tweak-index-gallery-spacing',
        'tweak-index-gallery-aspect'
      ], sync);
    }

    resizeEnd(loadImages);
  };

  // Init
  sync();
  bindListeners();

}



export default IndexGallery;