import Slideshow from '@squarespace/layout-slideshow';
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
  const galleryIndicators = element.querySelector('.Index-gallery-indicators');
  const galleryIndicatorsItems = Array.from(element.querySelectorAll('.Index-gallery-indicators-item'));
  // const galleryIndicators = Array.from(element.querySelectorAll('.Index-gallery-indicator'));
  const innerWrapper = element.querySelector('.Index-gallery-wrapper');
  const numWrappers = Math.floor(galleryItems.length / 9) + 1;
  const numLastWrapperItems = galleryItems.length % 9;

  let slideshow;

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
      innerWrapper.appendChild(wrapper);
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
    const areIndicatorsLines = Tweak.getValue('tweak-index-gallery-indicators') === 'Lines';
    const isAutoplayEnabled = Tweak.getValue('tweak-index-gallery-autoplay-enable') === 'true';
    if (layout === 'Packed' || layout === 'Split') {
      wrapGalleryItems();
    }
    if (layout === 'Slideshow') {
      if (slideshow instanceof Slideshow) {
        slideshow.destroy();
      }
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
        transitionDuration: parseFloat(Tweak.getValue('tweak-index-gallery-transition-duration')),
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
  };

  const bindListeners = () => {
    const tweaksToWatch = [
      'layout',
      'items-per-row',
      'min-item-width',
      'spacing',
      'aspect',
      'controls',
      'controls-color',
      'controls-background-color',
      'indicators',
      'indicators-width',
      'indicators-height',
      'indicators-spacing',
      'indicators-color',
      'indicators-active-color',
      'autoplay-enable',
      'autoplay-duration',
      'transition',
      'transition-duration'
    ].map((str) => {
      return 'tweak-index-gallery-' + str;
    });
    if (authenticated) {
      Tweak.watch(tweaksToWatch, sync);
    }

    resizeEnd(loadImages);
  };

  // Init
  sync();
  bindListeners();

}



export default IndexGallery;