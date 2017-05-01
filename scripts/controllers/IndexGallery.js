import Slideshow from '@squarespace/layout-slideshow';
import { Tweak, ImageLoader } from '@squarespace/core';
import { authenticated } from '../constants';
import resizeEnd from '../utils/resizeEnd';
import isMobileUA from '../utils/isMobileUA';
import { addScrollListener, removeScrollListener } from '../utils/rafScroll';
import { invalidateIndexSectionRectCache } from '../utils/getIndexSectionRect';

const itemsPerGalleryWrapper = 9;
const minItemsInLastWrapper = 3;
let changeListeners = [];

/**
 * To ensure that the last gallery wrapper always has at least 3 items, we need
 * to take some items from the previous wrapper and move those into the last
 * wrapper. This function calculates the number of items in the the last and
 * second-to-last wrappers after this adjustment.
 * @param  {Number} totalItems  Total items, overall
 * @return {Array}              Array with number of items in last and second to last wrappers
 */
const getLastAndSecondToLastWrapperItems = (totalItems) => {
  const remainder = totalItems % itemsPerGalleryWrapper;
  if (remainder === 0) {
    return [ itemsPerGalleryWrapper, itemsPerGalleryWrapper ];
  }

  if (remainder < minItemsInLastWrapper && totalItems >= minItemsInLastWrapper) {
    const numSecondToLastWrapperItems = itemsPerGalleryWrapper - minItemsInLastWrapper + remainder;
    const numLastWrapperItems = minItemsInLastWrapper;
    return [ numSecondToLastWrapperItems, numLastWrapperItems ];
  }

  return [ itemsPerGalleryWrapper, remainder ];
};

/**
 * Bootstraps the index gallery, ensuring that it will always have a smooth
 * "bottom edge" by looking at the last two sets of 10 images and dividing them
 * to ensure that there are at least 3 images in the last set. Also handles a
 * Safari rendering bug where the images "jiggle".
 */
function IndexGallery(element) {

  const galleryItems = Array.from(element.querySelectorAll('.Index-gallery-item'));
  const galleryIndicatorsItems = Array.from(element.querySelectorAll('.Index-gallery-indicators-item'));
  const innerWrapper = element.querySelector('.Index-gallery-wrapper');
  const numWrappers = Math.ceil(galleryItems.length / itemsPerGalleryWrapper);

  const [
    numSecondToLastWrapperItems,
    numLastWrapperItems
  ] = getLastAndSecondToLastWrapperItems(galleryItems.length);

  let slideshow;
  let itemsWrapper;
  let galleryInnerWrappers = [];

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


  /**
   * Convenience function to get the number of items in a wrapper given its
   * order amongst all the wrappers.
   * @param  {Number} wrapperIndex
   * @return {Number}
   */
  const getNumItemsInGalleryWrapper = (wrapperIndex) => {
    if (numWrappers === 1) {
      return galleryItems.length;
    }
    if (wrapperIndex === numWrappers - 2) {
      return numSecondToLastWrapperItems;
    }
    if (wrapperIndex === numWrappers - 1) {
      return numLastWrapperItems;
    }
    return itemsPerGalleryWrapper;
  };

  /**
   * Creates a gallery wrapper and returns it.
   * @param  {Number} numWrapperItems  Applied as a data-attribute
   * @return {HTMLElement}
   */
  const createInnerWrapper = (numWrapperItems) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'Index-gallery-inner clear';
    wrapper.setAttribute('data-index-gallery-images', numWrapperItems);

    return wrapper;
  };

  /**
   * Creates items wrapper and returns it.
   * @return {HTMLElement}
   */
  const createItemsWrapper = () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'Index-gallery-items';

    return wrapper;
  };

  /**
   * For Packed and Split grid styles for the index gallery, we need to split
   * the elements up into containers with 9 elements each, and indicate how many
   * elements are in the last container and add that as a data-attribute so our
   * CSS hooks can style them properly.
   *
   * The last wrapper must have at least 3 items. Items can be moved from the
   * second-to-last wrapper to the last if necessary to satisfy this rule.
   */
  const wrapGalleryItems = () => {
    itemsWrapper = createItemsWrapper();
    const currentGalleryItems = [].concat(galleryItems);

    for (let i = 0; i < numWrappers; i++) {
      const numWrapperItems = getNumItemsInGalleryWrapper(i);
      const wrapper = createInnerWrapper(numWrapperItems);

      const currentWrapperItems = currentGalleryItems.splice(0, numWrapperItems);

      currentWrapperItems.forEach((galleryItem) => {
        wrapper.appendChild(galleryItem);
      });
      itemsWrapper.appendChild(wrapper);
      galleryInnerWrappers.push(wrapper);
    }

    innerWrapper.appendChild(itemsWrapper);
  };

  /**
   * Reverse the logic in wrapGalleryItems by removing the added wrappers and
   * returning elements to their original place.
   */
  const unwrapGalleryItems = () => {
    galleryItems.forEach((galleryItem) => {
      innerWrapper.appendChild(galleryItem);
    });
    galleryInnerWrappers.forEach((wrapper) => {
      wrapper.parentNode.removeChild(wrapper);
    });
    galleryInnerWrappers = [];
    itemsWrapper.parentNode.removeChild(itemsWrapper);
    itemsWrapper = null;
  };

  /**
   * Load all images in the images array.
   */
  const loadImages = () => {
    images.forEach((image) => {
      ImageLoader.load(image, {
        load: true,
        mode: 'fill'
      });
    });
    promoteLayers();
  };

  /**
   * Sync the gallery, running whatever logic is relevant based on the user-
   * selected tweak option.
   */
  const sync = () => {
    const layout = Tweak.getValue('tweak-index-gallery-layout');

    if (slideshow instanceof Slideshow) {
      slideshow.destroy();
      slideshow = null;
    }
    if (galleryInnerWrappers.length > 0) {
      unwrapGalleryItems();
    }

    if (layout === 'Packed' || layout === 'Split') {
      wrapGalleryItems();
    }
    if (layout === 'Slideshow') {
      const areIndicatorsLines = Tweak.getValue('tweak-index-gallery-indicators') === 'Lines';
      const isAutoplayEnabled = Tweak.getValue('tweak-index-gallery-autoplay-enable') === 'true';
      const hasTransition = Tweak.getValue('tweak-index-gallery-transition') !== 'None';
      const transitionDurationFromTweak = parseFloat(Tweak.getValue('tweak-index-gallery-transition-duration'));
      slideshow = new Slideshow(innerWrapper, {
        elementSelector: '.Index-gallery-item',
        autoplay: {
          enabled: isAutoplayEnabled,
          delay: parseFloat(Tweak.getValue('tweak-index-gallery-autoplay-duration')) * 1000
        },
        imageLoaderOptions: {
          load: true,
          mode: 'fill'
        },
        controls: {
          previous: '.Index-gallery-control--left',
          next: '.Index-gallery-control--right',
          indicators: '.Index-gallery-indicators-item'
        },
        transitionDuration: hasTransition ? transitionDurationFromTweak : null,
        afterInteractionEnd: () => {
          if (!isAutoplayEnabled || !areIndicatorsLines) {
            return;
          }

          // We need to add and remove the animation-reset classname because we
          // want to restart the animation at the beginning after interaction
          // end to reflect that the timer for the next slide starts over at
          // the beginning. The offsetWidth expression is in there to force a
          // repaint - without it, the animation-reset doesn't work.
          const activeIndicator = galleryIndicatorsItems[slideshow.index];
          activeIndicator.classList.add('animation-reset');
          void activeIndicator.offsetWidth;
          activeIndicator.classList.remove('animation-reset');
        }
      });
      slideshow.layout();

    } else {
      // Slideshow handles its own image loading logic, so we don't need to call
      // loadImages for it.
      loadImages();
    }
    element.classList.add('loaded');
    invalidateIndexSectionRectCache();
    changeListeners.forEach(fn => fn());
  };

  /**
   * If relevant, stop autoplay on the slideshow.
   */
  const stopAutoplay = () => {
    if (slideshow instanceof Slideshow) {
      slideshow.stopAutoplay();
    }
  };

  /**
   * If relevant start autoplay on the slideshow.
   */
  const startAutoplay = () => {
    if (slideshow instanceof Slideshow) {
      slideshow.startAutoplay();
    }
  };

  const bindListeners = () => {
    const tweaksToWatch = [
      'tweak-site-border-show',
      'tweak-site-border-width',
      'layout',
      'items-per-row',
      'min-item-width',
      'spacing',
      'spacing-sides-show',
      'spacing-top-bottom-show',
      'fixed-height',
      'height',
      'apply-bottom-spacing',
      'aspect',
      'controls',
      'indicators',
      'autoplay-enable',
      'autoplay-duration',
      'transition',
      'transition-duration'
    ].map((str) => {
      return str.indexOf('tweak') === 0 ? str : 'tweak-index-gallery-' + str;
    });
    if (authenticated) {
      Tweak.watch(tweaksToWatch, sync);
    }

    addScrollListener('start', stopAutoplay);
    addScrollListener('end', startAutoplay);

    resizeEnd(loadImages);
  };

  const destroy = () => {
    changeListeners = [];
    removeScrollListener('start', stopAutoplay);
    removeScrollListener('end', startAutoplay);
  };

  // Init
  sync();
  bindListeners();

  return {
    destroy
  };

}

/**
 * Given a function, add it to the change listeners array. This is so other
 * controllers can update when the Index Gallery changes, potentially affecting
 * other things in the DOM like parallax image positioning.
 *
 * @param  {Function} fn  Listener to bind to change
 */
export const addIndexGalleryChangeListener = (fn) => {
  const alreadyRegistered = changeListeners.some((listener) => {
    return changeListeners === fn;
  });
  if (alreadyRegistered) {
    return;
  }
  changeListeners.push(fn);
};

/**
 * Removes the change listener, if one is currently in the array matching the fn.
 * @param  {Function} fn  Listener to detach
 */
export const removeIndexGalleryChangeListener = (fn) => {
  changeListeners.some((listener, i) => {
    const isSameFunction = listener === fn;
    if (isSameFunction) {
      changeListeners.splice(i, 1);
    }
    return isSameFunction;
  });
};



export default IndexGallery;