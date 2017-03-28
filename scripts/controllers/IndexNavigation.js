import URL from 'url-parse';
import { getIndexSectionRect } from '../utils/getIndexSectionRect';
import rafScroll from '../utils/rafScroll';

function IndexNavigation(element) {
  let currentId;
  const sections = Array.from(element.querySelectorAll('.Index-page, .Index-gallery'));
  const sectionInfo = sections.reduce((acc, section) => {
    const { top, bottom } = getIndexSectionRect(section);
    acc[section.getAttribute('id')] = { top, bottom };
    return acc;
  }, {});


  const scroll = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    Object.keys(sectionInfo).forEach((id) => {
      const { top, bottom } = sectionInfo[id];
      if (currentId !== id && scrollTop >= top && scrollTop < bottom) {
        // window.location.hash = id;
        currentId = id;
        window.history.replaceState(undefined, undefined, '#' + id);
      }
    });
  };

  rafScroll(scroll);
}

export default IndexNavigation;