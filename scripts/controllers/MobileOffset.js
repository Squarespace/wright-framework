import { Tweak } from '@squarespace/core';
import resizeEnd from '../utils/resizeEnd';

/**
 * In mobile, we need to set a margin on body in order to offset the fixed top/
 * bottom mobile bars. Also accounts for mobile info bar.
 */
function MobileOffset(element) {
  const mobileInfoBar = document.querySelector('.sqs-mobile-info-bar');

  const applyOffset = () => {
    if (document.body.classList.contains('is-mobile')) {
      const computedStyle = window.getComputedStyle(element);
      const isFixed = computedStyle.display !== 'none' && computedStyle.position === 'fixed';
      const offset = isFixed ? element.offsetHeight : 0;

      if (parseFloat(computedStyle.bottom) === 0) {
        document.body.style.marginBottom = offset + 'px';
        if (mobileInfoBar) {
          mobileInfoBar.style.bottom = offset + 'px';
        }
      } else {
        document.body.style.marginTop = offset + 'px';
      }

    } else {
      document.body.style.marginTop = '';
      document.body.style.marginBottom = '';
    }
  };

  Tweak.watch([
    'tweak-mobile-bar-branding-position',
    'tweak-mobile-bar-menu-icon-position',
    'tweak-mobile-bar-cart-position',
    'tweak-mobile-bar-search-icon-position',
    'tweak-mobile-bar-top-fixed'
  ], applyOffset);

  resizeEnd(applyOffset);

  applyOffset();

  return {
    sync: applyOffset
  };

}


export default MobileOffset;