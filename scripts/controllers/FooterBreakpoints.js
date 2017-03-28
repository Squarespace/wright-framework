import { Tweak } from '@squarespace/core';
import resizeEnd from '../utils/resizeEnd';

const midClassname = 'Footer--mid';
const compactClassname = 'Footer--compact';


/**
 * Calculates and stores a set of "breakpoints" (full, mid, and compact for the
 * footer in "Columns" mode.
 */
function FooterBreakpoints(element) {
  const nav = element.querySelector('.Footer-nav');

  if (!nav) {
    return;
  }

  const navGroups = Array.from(nav.querySelectorAll('.Footer-nav-group'));

  let breakpoints = {
    mid: Number.MAX_VALUE,
    full: Number.MAX_VALUE
  };

  const doesFit = () => {
    if (!breakpoints.mid) {
      return true;
    }
    const navWidth = parseFloat(window.getComputedStyle(nav).width);
    let navGroupsTotalWidth = 0;

    for (let i = 0; i < navGroups.length; i++) {
      const isMid = element.classList.contains(midClassname);
      const navGroup = navGroups[i];
      const navGroupWidth = navGroup.offsetWidth;
      navGroupsTotalWidth += navGroupWidth;

      if (isMid && navGroupWidth > navWidth || !isMid && navGroupsTotalWidth > navWidth) {
        return false;
      }
    }
    return true;
  };

  const sync = () => {
    const isColumns = Tweak.getValue('tweak-footer-layout') === 'Columns';
    if (!isColumns) {
      return;
    }

    if (window.innerWidth > breakpoints.mid) {
      // Known to be mid
      element.classList.remove(compactClassname);
      if (window.innerWidth > breakpoints.full) {
        // Known to be full
        element.classList.remove(midClassname);
        return;
      }
    }

    // Unknown, try full
    element.classList.remove(compactClassname);
    element.classList.remove(midClassname);

    if (doesFit()) {
      // Fits in full
      if (window.innerWidth < breakpoints.full) {
        breakpoints.full = window.innerWidth;
      }
    } else {
      // Try mid
      element.classList.add(midClassname);
      if (doesFit()) {
        // Fits in mid
        if (window.innerWidth < breakpoints.mid) {
          breakpoints.mid = window.innerWidth;
        }
      } else {
        // Compact
        element.classList.add(compactClassname);
      }
    }

  };

  Tweak.watch([
    'tweak-footer-layout',
    'tweak-footer-business-info-show',
    'tweak-footer-business-hours-show'
  ], (tweak) => {
    breakpoints.mid = Number.MAX_VALUE;
    breakpoints.full = Number.MAX_VALUE;
    sync();
  });

  resizeEnd(sync);

  sync();

}

export default FooterBreakpoints;
