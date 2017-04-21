import Slideshow from '@squarespace/layout-slideshow';
import { Tweak, ImageLoader } from '@squarespace/core';
import { authenticated } from '../constants';
import resizeEnd from '../utils/resizeEnd';
import isMobileUA from '../utils/isMobileUA';
import { addScrollListener, removeScrollListener } from '../utils/rafScroll';
import { invalidateIndexSectionRectCache } from '../utils/getIndexSectionRect';

let changeListeners = [];

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
  const numWrappers = Math.floor(galleryItems.length / 9) + 1;
  const numLastWrapperItems = galleryItems.length % 9;

  let slideshow;
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
   * For Packed and Split grid styles for the index gallery, we need to split
   * the elements up into containers with 9 elements each, and indicate how many
   * elements are in the last container and add that as a data-attribute so our
   * CSS hooks can style them properly.
   */
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
      innerWrapper.appendChild(wrapper);
      galleryInnerWrappers.push(wrapper);
    }
  };

  /**
   * Reverse the logic in wrapGalleryItems by removing the added wrappers and
   * returning elements to their original place.
   */
  const unwrapGalleryItems = () => {
    galleryItems.forEach((galleryItem) => {
      innerWrapper.appendChild(galleryItem);
    });
    galleryInnerWrappers = galleryInnerWrappers.reduce((acc, wrapper) => {
      wrapper.parentNode.removeChild(wrapper);
      return acc;
    }, []);
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