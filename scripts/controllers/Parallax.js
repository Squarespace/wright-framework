import { ImageLoader, Tweak } from '@squarespace/core';
import Darwin from '@squarespace/darwin';
import { get3dTransformProperty } from '../utils/get3dTransformProperty';
import { getIndexSectionRect, invalidateIndexSectionRectCache } from '../utils/getIndexSectionRect';
import rafScroll from '../utils/rafScroll';
import resizeEnd from '../utils/resizeEnd';
import { indexEditEvents } from '../constants';

const parallaxFactor = 0.5;
const parallaxOffset = 300;

/**
 * Where the magic happens. Performs all setup for parallax for indexes and page
 * banners, and sets the transform string when the user scrolls, as well as
 * handling /config functionality.
 */
function Parallax(element) {

  let darwin;
  let windowHeight;
  let matrix = [];
  let isEditingIndex = false;

  const transformProp = get3dTransformProperty();

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
    });
  };

  /**
   * Add information to each item in the matrix about its position on the page
   * and its height/width.
   * @param  {Object} matrixItem  Matrix item to update
   * @return {Boolean}            Whether or not it was udpated
   */
  const updateMatrixItem = (matrixItem) => {
    // const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    // const rect = matrixItem.originalNode.getBoundingClientRect();

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
        mediaWrapper,
        top,
        bottom,
        height,
        focalPoint
      } = matrixItem;
      if (scrollTop + windowHeight > top && scrollTop < bottom) {

        let parallaxAmount;

        if (isNewMethodology()) {
          parallaxAmount = -1 * parallaxFactor * (top - scrollTop);
        } else {
          // In view, find the 'parallax proportion' - the percentage of the total
          // vertical screen space that has elapsed since the element scrolled
          // into view vs when it would scroll out of view.
          const focalPointVertical = height * focalPoint;
          const parallaxProportion = 1 - ((top + focalPointVertical - scrollTop) / windowHeight);
          parallaxAmount = parallaxProportion * parallaxOffset;
        }

        // Apply this proportion (max of 1) to the parallax offset, which is the
        // total number of invisible pixels that can be scrolled.
        const elementTransformString = `translate3d(0, ${parallaxAmount}px, 0)`;

        // Sync to DOM
        mediaWrapper.style[transformProp] = elementTransformString;
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
    rafScroll(handleScroll);

    resizeEnd(() => {
      invalidateIndexSectionRectCache();
      syncParallax();
    });

    window.addEventListener(indexEditEvents.enabled, handleIndexEditEnabled);
    window.addEventListener(indexEditEvents.disabled, handleIndexEditDisabled);
    window.addEventListener(indexEditEvents.deleted, handleIndexEditDeleted);
    window.addEventListener(indexEditEvents.reorder, handleIndexEditReorder);

    Tweak.watch([
      'tweak-overlay-parallax-enabled',
      'tweak-overlay-parallax-new-math',
      'tweak-site-width-option',
      'tweak-site-width',
      'tweak-index-page-padding',
      'tweak-index-page-overlay-padding',
      'tweak-index-page-fullscreen',
      'tweak-index-page-min-height'
    ], () => {
      syncParallax(true);
    });
  };

  /**
   * Initialize parallax, running init, sync, binding listeners, and
   * initializing Darwin MutationObserver instance.
   */
  const init = () => {
    initParallax();
    moveParallaxElements();
    syncParallax();
    bindListeners();
    darwin = new Darwin({
      targets: [
        '.sqs-block-form',
        '.sqs-block-tourdates',
        '.sqs-block-code',
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
    if (darwin) {
      darwin.destroy();
      darwin = null;
    }
    // window.removeEventListener('scroll', handleScroll);

    window.removeEventListener(indexEditEvents.enabled, handleIndexEditEnabled);
    window.removeEventListener(indexEditEvents.disabled, handleIndexEditDisabled);
    window.removeEventListener(indexEditEvents.deleted, handleIndexEditDeleted);
    window.removeEventListener(indexEditEvents.reorder, handleIndexEditReorder);
  };

  init();

  return {
    destroy
  };

}



export default Parallax;
