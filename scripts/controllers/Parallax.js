import { ImageLoader, Tweak } from '@squarespace/core';
import Darwin from '@squarespace/darwin';
import get3dTransformProperty from '../utils/get3dTransformProperty';
import { getIndexSectionRect, invalidateIndexSectionRectCache } from '../utils/getIndexSectionRect';
import { addScrollListener, removeScrollListener } from '../utils/rafScroll';
import resizeEnd from '../utils/resizeEnd';
import isMobileUA from '../utils/isMobileUA';
import isSafari10UA from '../utils/isSafari10UA';
import { indexEditEvents } from '../constants';
import { addIndexGalleryChangeListener, removeIndexGalleryChangeListener } from './IndexGallery';

const parallaxFactor = 0.5;
const parallaxOffset = 300;

// Parallax is implemeneted here with two possible methodologies:
//
// 1) absolute, where Parallax-item is absolutely positoned where its
//    corresponding original position is on the page, and
//
// 2) fixed, where Parallax-item is fixed positioned, and transformed so that it
//    appears to "scroll" with the page
//
// We've found that the fixed method appears to work best for desktop browsers,
// most likely because the renderer is better able to handle large layers if
// it's in relation to the viewport and not the entire document. Without the
// fixed methodology, parallax becomes noticeably jittery on desktop Firefox.
//
// However, fixed causes issues on mobile, where the browser's ability to paint
// the background layers appears to lag behind its ability to paint naturally
// scrolling elements. As a result, we need to use method (1) on mobile (and
// desktop Safari 10, which behaves like mobile), and method (2) on all other
// browsers (desktop).
const parallaxItemPositioningMethod = isMobileUA() || isSafari10UA() ? 'absolute' : 'fixed';

/**
 * Where the magic happens. Performs all setup for parallax for indexes and page
 * banners, and sets the transform string when the user scrolls, as well as
 * handling /config functionality.
 */
function Parallax(element) {

  invalidateIndexSectionRectCache();

  let darwin;
  let windowHeight;
  let matrix = [];
  let isEditingIndex = false;

  const transformProp = get3dTransformProperty();

  /**
   * Apply the body classname that acts as the hook for CSS specific to each
   * parallax item positioning method (absolute or fixed).
   */
  const applyParallaxItemPositioningMethodBodyClassname = () => {
    document.body.classList.add(`parallax-item-positioning-method-${parallaxItemPositioningMethod}`);
  };

  /**
   * Find out whether or not to use parallax, based on user option in tweak and
   * whether the user is currently in index editing mode.
   * @return {Boolean}
   */
  const isParallaxEnabled = () => {
    return isEditingIndex ? false : Tweak.getValue('tweak-overlay-parallax-enabled') === 'true';
  };

  /**
   * Find out whether to use the new math for parallax.
   * @return {Boolean}
   */
  const isNewMethodology = () => {
    return Tweak.getValue('tweak-overlay-parallax-new-math') === 'true';
  };

  /**
   * Gets the original elements to be parallaxed and puts them into an array
   * ("matrix") of objects with references to the nodes and focal points.
   */
  const initParallax = () => {
    // Construct matrix (necessary for image loading even when parallax isn't enabled)
    const isOriginalElement = element.getAttribute('data-parallax-original-element') !== null;
    const originalDOMNodes = Array.from(element.querySelectorAll('[data-parallax-original-element]'));
    const nodes = isOriginalElement ? [ element ] : originalDOMNodes;

    matrix = nodes.map((originalNode) => {
      // Get original parallax node, image wrapper, and element
      const mediaWrapper = originalNode.querySelector('[data-parallax-image-wrapper]');
      // The media wrapper query selector may be null if initParallax is
      // called with only some of the original parallax nodes having been
      // moved. InitParallax may be called again on a page with only one image
      // replaced in certain scenarios. The not-new nodes are filtered at the
      // end of the map to prevent null errors later on
      if (mediaWrapper === null) {
        return null;
      }
      const mediaElement = mediaWrapper.querySelector('img:not(.custom-fallback-image)') ||
        mediaWrapper.querySelector('div.sqs-video-background');

      // Construct object to be pushed to matrix
      const focalPointString = mediaElement.getAttribute('data-image-focal-point');
      const focalPoint = focalPointString ? parseFloat(focalPointString.split(',')[1]) : 0.5;
      return {
        originalNode,
        mediaWrapper,
        mediaElement,
        focalPoint
      };
    }).filter(matrixObject => matrixObject !== null);
  };

  /**
   * Add information to each item in the matrix about its position on the page
   * and its height/width.
   * @param  {Object} matrixItem  Matrix item to update
   * @return {Boolean}            Whether or not it was udpated
   */
  const updateMatrixItem = (matrixItem) => {
    const currentDims = getIndexSectionRect(matrixItem.originalNode);

    for (const prop in currentDims) {
      if (matrixItem[prop] !== currentDims[prop]) {
        matrixItem.top = currentDims.top;
        matrixItem.right = currentDims.right;
        matrixItem.bottom = currentDims.bottom;
        matrixItem.left = currentDims.left;
        matrixItem.width = currentDims.width;
        matrixItem.height = currentDims.height;
        return true;
      }
    }
    return false;
  };

  /**
   * Loop through all items in the matrix and update each one.
   * @return {Boolean}  Whether or not any matrix item was updated
   */
  const updateAllMatrixItems = () => {
    let didUpdate = false;
    matrix.forEach((matrixItem) => {
      if (updateMatrixItem(matrixItem)) {
        didUpdate = true;
      }
    });
    return didUpdate;
  };

  /**
   * The guts of the parallax - the scroll logic. Based on the information
   * we've collected about each parallax item, as well as the current scroll
   * position, calculate how much to offset the media element (image or video).
   * This runs every frame on scroll so it's not actually doing much - just
   * setting a transform. Most of the heavy lifting occurs in syncParallax.
   * @param  {Number} scrollTop  Current scrollTop (passed in for performance)
   */
  const handleScroll = (scrollTop) => {

    if (!isParallaxEnabled()) {
      return;
    }
    matrix.forEach((matrixItem) => {
      const {
        parallaxItem,
        mediaWrapper,
        top,
        bottom,
        left,
        width,
        height,
        focalPoint
      } = matrixItem;
      if (scrollTop + windowHeight > top && scrollTop < bottom) {

        let parallaxAmount;

        if (isNewMethodology()) {
          // New methodology, determine the amount of the added area that has
          // passed by using scroll and parallax factor, and offset by that.
          parallaxAmount = -1 * parallaxFactor * (top - scrollTop);
        } else {
          // Old methodology. Element is in view, find the 'parallax proportion'
          // - the percentage of the total vertical screen space that has
          // elapsed since the element scrolled into view vs when it would
          // scroll out of view.
          const focalPointVertical = height * focalPoint;
          const parallaxProportion = 1 - ((top + focalPointVertical - scrollTop) / windowHeight);
          parallaxAmount = parallaxProportion * parallaxOffset;
        }

        // Apply amount of parallax
        const elementTransformString = `translate3d(0, ${parallaxAmount}px, 0)`;
        mediaWrapper.style[transformProp] = elementTransformString;

        if (parallaxItemPositioningMethod === 'fixed') {
          const parallaxItemTransformString = `translate3d(0, ${-scrollTop}px, 0)`;
          parallaxItem.style[transformProp] = parallaxItemTransformString;
        }
      } else if (parallaxItemPositioningMethod === 'fixed') {
        parallaxItem.style[transformProp] = `translate3d(${-width - left}px, 0, 0)`;
      }
    });
  };


  /**
   * Uses ImageLoader to load the image for a given media element.
   * @param  {HTMLElement} mediaElement
   */
  const loadImage = (mediaElement) => {
    const isVideoBackground = mediaElement.classList.contains('sqs-video-background');
    const videoBackgroundFallbackImage = mediaElement.querySelector('img.custom-fallback-image');
    const isMediaElementImage = mediaElement.hasAttribute('data-src');
    const image = isVideoBackground && videoBackgroundFallbackImage || isMediaElementImage && mediaElement;
    if (!image) {
      return;
    }
    ImageLoader.load(image, {
      load: true,
      mode: 'fill'
    });
  };

  const moveParallaxElements = () => {
    const parallaxHost = document.body.querySelector('[data-parallax-host]');

    matrix = matrix.filter((matrixItem) => {
      const {
        originalNode,
        mediaWrapper
      } = matrixItem;
      let { parallaxItem } = matrixItem;

      // If original node is no longer present, we should sync the change to
      // parallax host as well and remove its corresponding media wrapper
      if (!element.contains(originalNode)) {
        const parallaxItemsArray = Array.from(parallaxHost.children);
        if (parallaxItem && parallaxItemsArray.indexOf(parallaxItem) >= 0) {
          parallaxHost.removeChild(parallaxItem);
        }
        return false;
      }

      if (isParallaxEnabled()) {

        if (mediaWrapper.parentNode === originalNode) {
          // Get all the images to be parallaxed from the original nodes and
          // move into a separate container (for performance purposes)
          const id = originalNode.getAttribute('data-parallax-id');

          // Match with proper node in parallax image container, and add it to
          // matrix item
          parallaxItem = parallaxHost.querySelector('[data-parallax-item][data-parallax-id="' + id + '"]');
          matrixItem.parallaxItem = parallaxItem;

          // Move mediaWrapper to its new home
          parallaxItem.appendChild(mediaWrapper);
        }

      } else if (mediaWrapper.parentNode !== originalNode) {
        // Parallax is off, so if the mediaWrapper is not in its original
        // node, move it back.
        originalNode.appendChild(mediaWrapper);
      }

      return true;
    });
  };

  const applyParallaxStyles = () => {

    matrix.forEach((matrixItem) => {
      const {
        mediaWrapper,
        mediaElement,
        top,
        left,
        width,
        height
      } = matrixItem;
      let { parallaxItem } = matrixItem;

      if (isParallaxEnabled()) {

        // Apply styles to parallaxItem so it has the right position
        parallaxItem.style.top = top + 'px';
        parallaxItem.style.left = left + 'px';
        parallaxItem.style.width = width + 'px';
        parallaxItem.style.height = height + 'px';

        if (isNewMethodology()) {
          // Offset bottom of mediaWrapper to allow for room to scroll
          mediaWrapper.style.bottom = -1 * parallaxFactor * (window.innerHeight - height) + 'px';
          mediaWrapper.style.top = '';
        } else {
          mediaWrapper.style.top = (-1 * parallaxOffset) + 'px';
          mediaWrapper.style.bottom = '';
        }

      } else {

        // Parallax is off, but if it was on at some point, we'll need to
        // clear styles from affected elements
        if (parallaxItem) {
          parallaxItem.style.top = '';
          parallaxItem.style.left = '';
          parallaxItem.style.width = '';
          parallaxItem.style.height = '';
        }

        // Clear offset top and bottom
        mediaWrapper.style.top = '';
        mediaWrapper.style.bottom = '';

        // Clear transforms
        mediaWrapper.style.webkitTransform = '';
        mediaWrapper.style.msTransform = '';
        mediaWrapper.style.transform = '';
      }

      // Load image
      loadImage(mediaElement);

      // Add loaded class
      mediaWrapper.classList.add('loaded');
    });

  };

  /**
   * Based on whether parallax is enabled or not, move elements into the proper
   * containers (or remove them), position them, size them, and load images.
   * @param  {Boolean} force  Here you can force all elements to update even if
   *                          updateAllMatrixItems hasn't picked up any changes
   *                          to their position or size. Useful for changes
   *                          propagated by /config
   */
  const syncParallax = (force = false) => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    windowHeight = window.innerHeight;

    const hasUpdated = updateAllMatrixItems();
    if (!hasUpdated && force === false) {
      return;
    }

    moveParallaxElements();
    applyParallaxStyles();

    // Calculate proper position of images by calling scroll
    if (isParallaxEnabled()) {
      handleScroll(scrollTop);
    }
  };

  /**
   * In order to fix a bug in Safari 10 where LayoutEngine sections are not the
   * correct size before all their fonts have finished loading, we rerun the
   * sync on the window load event. If none of the containers have changed, as
   * should be the case in normal browsers, this essentially amounts to a noop.
   */
  const handleLoad = () => {
    invalidateIndexSectionRectCache();
    syncParallax();
  };

  /**
   * Handlers for index editing
   */
  const handleIndexEditEnabled = () => {
    isEditingIndex = true;
    syncParallax(true);
  };
  const handleIndexEditDisabled = () => {
    isEditingIndex = false;
    syncParallax(true);
  };
  const handleIndexEditDeleted = () => {
    syncParallax(true);
  };
  const handleIndexEditReorder = () => {
    syncParallax(true);
  };

  /**
   * Bind all functionality, including scroll handler, index edit event
   * listeners, and tweak watcher.
   */
  const bindListeners = () => {
    addScrollListener('scroll', handleScroll);

    addIndexGalleryChangeListener(syncParallax);

    resizeEnd(() => {
      invalidateIndexSectionRectCache();
      syncParallax();
    });

    window.addEventListener('load', handleLoad);

    window.addEventListener(indexEditEvents.enabled, handleIndexEditEnabled);
    window.addEventListener(indexEditEvents.disabled, handleIndexEditDisabled);
    window.addEventListener(indexEditEvents.deleted, handleIndexEditDeleted);
    window.addEventListener(indexEditEvents.reorder, handleIndexEditReorder);

    Tweak.watch([
      'tweak-site-border-show',
      'tweak-site-border-width',
      'tweak-overlay-parallax-enabled',
      'tweak-overlay-parallax-new-math',
      'tweak-site-width-option',
      'tweak-site-width',
      'tweak-index-page-padding',
      'tweak-index-page-overlay-padding',
      'tweak-index-page-fullscreen',
      'tweak-index-page-min-height',
      'tweak-index-page-apply-bottom-spacing'
    ], () => {
      invalidateIndexSectionRectCache();
      syncParallax(true);
    });
  };

  /**
   * Initialize parallax, running init, sync, binding listeners, and
   * initializing Darwin MutationObserver instance.
   */
  const init = () => {
    applyParallaxItemPositioningMethodBodyClassname();
    initParallax();
    moveParallaxElements();
    syncParallax();
    bindListeners();
    darwin = new Darwin({
      targets: [
        '.sqs-block-form',
        '.sqs-block-tourdates',
        '.sqs-block-code',
        '.sqs-block-image',
        '.sqs-block-product',
        '.sqs-block-summary-v2',
        '.Header',
        '.sqs-announcement-bar-dropzone'
      ],
      callback: () => {
        invalidateIndexSectionRectCache();
        syncParallax();
      }
    });
    if (darwin) {
      darwin.init();
    }
  };

  /**
   * Destroy parallax, calling destroy on Darwin and nulling it out, as well
   * as removing event listeners.
   */
  const destroy = () => {
    removeScrollListener('scroll', handleScroll);

    removeIndexGalleryChangeListener(syncParallax);

    if (darwin) {
      darwin.destroy();
      darwin = null;
    }

    window.removeEventListener('load', handleLoad);

    window.removeEventListener(indexEditEvents.enabled, handleIndexEditEnabled);
    window.removeEventListener(indexEditEvents.disabled, handleIndexEditDisabled);
    window.removeEventListener(indexEditEvents.deleted, handleIndexEditDeleted);
    window.removeEventListener(indexEditEvents.reorder, handleIndexEditReorder);
  };

  /** Destroy parallax and reinitialize it (used when an image gets changed) */
  const sync = () => {
    destroy();
    init();
  }

  init();

  return {
    destroy,
    sync
  };

}



export default Parallax;
