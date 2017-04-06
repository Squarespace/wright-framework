import { getIndexSectionRect } from '../utils/getIndexSectionRect';
import rafScroll from '../utils/rafScroll';
import resizeEnd from '../utils/resizeEnd';

function IndexNavigation(element) {
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
  let currentIdForColor = currentId;

  const getSectionRects = () => {
    return sections.reduce((acc, section) => {
      const { top, bottom } = getIndexSectionRect(section);
      acc[section.getAttribute('id')] = { top, bottom };
      return acc;
    }, {});
  };

  const isOverlaySection = (section) => {
    const isGallery = section.classList.contains('Index-gallery');
    const isOverlayPage = section.classList.contains('Index-page--has-image');
    return isGallery || isOverlayPage;
  };

  const handleScroll = (scrollTop) => {
    const scrollMid = scrollTop + viewportHeight / 2;

    Object.keys(sectionRects).forEach((id) => {
      const { top, bottom } = sectionRects[id];

      // Update color
      if (currentIdForColor !== id && scrollMid >= top && scrollMid < bottom) {
        const currentSection = sectionMap[id];
        indexNav.classList.toggle('overlay', isOverlaySection(currentSection));
        currentIdForColor = id;
      }

      // Update address bar
      if (currentId !== id && scrollTop >= top && scrollTop < bottom) {
        const hashId = '#' + id;
        currentIndexNavItem.classList.remove('active');
        const indexNavItem = indexNavItemMap[hashId];
        indexNavItem.classList.add('active');

        currentId = id;
        currentIndexNavItem = indexNavItem;
      }
    });
  };

  sectionRects = getSectionRects();
  indexNav.classList.toggle('overlay', isOverlaySection(sections[0]));

  resizeEnd(() => {
    viewportHeight = window.innerHeight;
    sectionRects = getSectionRects();
  });
  rafScroll(handleScroll);
}

export default IndexNavigation;