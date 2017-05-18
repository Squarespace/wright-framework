import { Tweak } from '@squarespace/core';
import { getIndexSectionRect } from '../utils/getIndexSectionRect';
import { addScrollListener, removeScrollListener } from '../utils/rafScroll';
import resizeEnd from '../utils/resizeEnd';
import { addIndexGalleryChangeListener, removeIndexGalleryChangeListener } from './IndexGallery';

function IndexNavigation(element) {
  if (element.classList.contains('Index--empty')) {
    return;
  }

  let sectionRects;
  let viewportHeight = window.innerHeight;
  const sections = Array.from(element.querySelectorAll('.Index-page, .Index-gallery'));
  const sectionMap = sections.reduce((acc, item) => {
    acc[item.getAttribute('id')] = item;
    return acc;
  }, {});
  const indexNav = element.querySelector('.Index-nav');
  const indexNavItems = Array.from(indexNav.querySelectorAll('.Index-nav-item'));
  const indexNavItemMap = indexNavItems.reduce((acc, item) => {
    acc[item.getAttribute('href')] = item;
    return acc;
  }, {});
  let currentIndexNavItem = indexNavItems.filter((item) => {
    return item.classList.contains('active');
  })[0];
  let currentId = currentIndexNavItem.getAttribute('href').substring(1);
  let currentIdForColor = null;
  let isWithinBorder;

  /**
   * Get relevant section rects so we can know where the positions are and where
   * to update the state of the index nav.
   * @return {Array} Array of section rect positions
   */
  const getSectionRects = () => {
    return sections.reduce((acc, section) => {
      const { top, bottom, left, right } = getIndexSectionRect(section);
      acc[section.getAttribute('id')] = { top, bottom, left, right };
      return acc;
    }, {});
  };

  /**
   * Convenience method for determining if a section is an overlay section.
   * @param  {HTMLElement} section
   * @return {Boolean}
   */
  const isOverlaySection = (section) => {
    const isGallery = section.classList.contains('Index-gallery');
    const isOverlayPage = section.classList.contains('Index-page--has-image');
    return isGallery || isOverlayPage;
  };

  /**
   * Scroll handler. Updates the color of the index nav depending on whether
   * it's over an overlay section, and updates the index nav element that's
   * currently active.
   * @param  {Number} scrollTop
   */
  const handleScroll = (scrollTop) => {
    const scrollMid = scrollTop + viewportHeight / 2;

    Object.keys(sectionRects).forEach((id) => {
      const { top, bottom } = sectionRects[id];

      // Update active index nav element
      if (currentId !== id && scrollTop >= top && scrollTop < bottom) {
        const hashId = '#' + id;
        currentIndexNavItem.classList.remove('active');
        const indexNavItem = indexNavItemMap[hashId];
        indexNavItem.classList.add('active');

        currentId = id;
        currentIndexNavItem = indexNavItem;
      }

      // Check if is within border before updating color
      if (isWithinBorder) {
        indexNav.classList.remove('overlay');
        return;
      }

      // Update color
      if (currentIdForColor !== id && scrollMid >= top && scrollMid < bottom) {
        const currentSection = sectionMap[id];
        indexNav.classList.toggle('overlay', isOverlaySection(currentSection));
        currentIdForColor = id;
      }
    });
  };

  const sync = () => {
    sectionRects = getSectionRects();

    // Can get this from any of the section rects, as they are all the same
    const borderWidth = sectionRects[Object.keys(sectionRects)[0]].left;
    const position = Tweak.getValue('tweak-index-nav-position').toLowerCase();
    const offset = parseFloat(window.getComputedStyle(indexNav)[position]);
    isWithinBorder = borderWidth > offset;

    handleScroll(window.pageYOffset);
  };

  const bindListeners = () => {
    resizeEnd(() => {
      viewportHeight = window.innerHeight;
      sectionRects = getSectionRects();
    });
    addScrollListener('scroll', handleScroll);
    addIndexGalleryChangeListener(sync);
  };

  const destroy = () => {
    removeScrollListener('scroll', handleScroll);
    removeIndexGalleryChangeListener(sync);
  };

  sync();
  bindListeners();

  return {
    destroy: destroy
  };
}

export default IndexNavigation;