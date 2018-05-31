import jump from 'jump.js';
import URL from 'url-parse';
import { isOverlayOpen, closeOverlay } from './MobileOverlayToggle';

/**
 * We need to figure out whether or not a given link hash a hash that possibly
 * refers to some element on the same page.
 *
 * @param  {String} href  URL to check
 * @return {String}       Hash from URL if on current page
 */
const getSamePageHash = (href) => {
  const url = new URL(href);
  const loc = new URL(window.location.href);

  if (url.host !== loc.host || url.pathname !== loc.pathname || url.hash === '' || url.hash === '#') {
    return '';
  }

  return url.hash;
};

/**
 * Our click handler below ignores clicks that are modified.
 *
 * @param  {Object} e  Event object from click handler
 * @return {Boolean}   Whether it's key modified
 */
const isKeyModified = (e) => {
  return e.metaKey || e.ctrlKey || e.altKey || e.shiftKey;
};


/**
 * When a user clicks on an anchor element that hash a hash link possibly
 * referring to an element on the same page, we want to smoothly scroll to that
 * element's position on the page. Otherwise, we follow the browser's behavior.
 */
function HashManager(element) {

  const handleClick = (e) => {
    if (isKeyModified(e)) {
      return;
    }
    let target = e.target;
    while (target && target !== document.body && target.tagName.toUpperCase() !== 'A') {
      target = target.parentElement;
    }
    if (!target || target === document.body) {
      return;
    }

    const hash = getSamePageHash(target.href);
    const hashElement = hash ? element.querySelector(hash) : null;

    if (hash && hashElement) {
      e.preventDefault();
      e.stopImmediatePropagation();

      if (isOverlayOpen()) {
        closeOverlay();
      }

      window.history.replaceState(undefined, undefined, hash);

      const hashElementTop = Math.ceil(hashElement.getBoundingClientRect().top);
      jump(hashElementTop, {
        duration: 500
      });
    }

  };

  element.addEventListener('click', handleClick);


}

export default HashManager;