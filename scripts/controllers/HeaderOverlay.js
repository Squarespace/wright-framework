import { Tweak } from '@squarespace/core';
import resizeEnd from '../utils/resizeEnd';
import { indexEditEvents } from '../constants';

const overlayClassname = 'Header--overlay';
const indexContentSelector = '.Index-page--has-image:first-child .Index-page-content';
const introContentSelector = '.Intro--has-image .Intro-content';

/**
 * Manages overlay header in two ways:
 *
 * 1. When overlay header is present, since it's position: absolute, we need to
 *    apply padding to offset some element on the page so that content is not
 *    overlaid. This only applies on desktop since mobile header is never overlay.
 *
 * 2. In /config, the header's overlay state itself needs to be managed. For
 *    example, when the index is reordered or the first section is removed,
 *    it may go from overlay -> not overlay or vice versa.
 *
 * @return {Object}  controller lifecycle methods
 */
function HeaderOverlay(element) {
  const header = element.querySelector('.Header--bottom');

  /**
   * Given an offset element, applies a margin top of the header height to
   * offset that element.
   * @param  {HTMLElement} offsetElement
   */
  const applyOffset = (offsetElement) => {
    if (!document.body.classList.contains('is-mobile')) {
      offsetElement.style.marginTop = header.offsetHeight + 'px';
    } else {
      offsetElement.style.marginTop = '';
    }
  };

  /**
   * Figures out whether it's an overlay header or not, and adds/removes the
   * classname and applies offset where appropriate.
   */
  const sync = () => {
    const overlayOnIndexGallery = Tweak.getValue('tweak-header-bottom-overlay-on-index-gallery') === 'true';
    const isOverIndexGallery = header.classList.contains('Header--index-gallery');

    if (overlayOnIndexGallery && isOverIndexGallery) {
      header.classList.add(overlayClassname);
      return;
    }

    const indexPageContent = element.querySelector(indexContentSelector);
    const introContent = element.querySelector(introContentSelector);
    const offsetElement = indexPageContent || introContent;

    if (offsetElement) {
      header.classList.add(overlayClassname);
      applyOffset(offsetElement);

      return;
    }

    header.classList.remove(overlayClassname);
  };

  /**
   * Binds sync to resize and index edit events.
   */
  const bindListeners = () => {
    resizeEnd(sync);
    Object.values(indexEditEvents).forEach((eventName) => {
      window.addEventListener(eventName, sync);
    });
    Tweak.watch([
      'tweak-header-bottom-overlay-on-index-gallery'
    ], () => {
      sync();
    });
  };

  /**
   * Removes index edit event listener.
   */
  const destroy = () => {
    Object.values(indexEditEvents).forEach((eventName) => {
      window.removeEventListener(eventName, sync);
    });
  };

  bindListeners();
  sync();

  return {
    sync,
    destroy
  };
}


export default HeaderOverlay;
