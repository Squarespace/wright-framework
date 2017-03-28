import { getIndexSectionRect } from '../utils/getIndexSectionRect';
import rafScroll from '../utils/rafScroll';
import resizeEnd from '../utils/resizeEnd';

function IndexNavigation(element) {
  let currentId;
  let sectionRects;
  const sections = Array.from(element.querySelectorAll('.Index-page, .Index-gallery'));

  const getSectionRects = () => {
    return sections.reduce((acc, section) => {
      const { top, bottom } = getIndexSectionRect(section);
      acc[section.getAttribute('id')] = { top, bottom };
      return acc;
    }, {});
  };

  const handleScroll = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    Object.keys(sectionRects).forEach((id) => {
      const { top, bottom } = sectionRects[id];
      if (currentId !== id && scrollTop >= top && scrollTop < bottom) {
        currentId = id;
        window.history.replaceState(undefined, undefined, '#' + id);
      }
    });
  };

  sectionRects = getSectionRects();

  resizeEnd(() => {
    sectionRects = getSectionRects();
  });
  rafScroll(handleScroll);
}

export default IndexNavigation;