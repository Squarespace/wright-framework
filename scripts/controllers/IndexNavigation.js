import URL from 'url-parse';
import { rafScroll } from '../util';
import { getIndexSectionDOMInfo } from '../indexUtils';

function IndexNavigation(element) {
  let currentId;
  const sections = Array.from(element.querySelectorAll('.Index-page, .Index-gallery'));
  const sectionInfo = sections.reduce((acc, section) => {
    const { top, bottom } = getIndexSectionDOMInfo(section);
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

  // const items = Array.from(element.querySelectorAll('.Index-nav-item'));
  // let activeItem = items[0];

  // const itemMap = items.reduce((acc, item) => {
  //   const url = new URL(item.href);
  //   acc[url.hash] = item;
  //   return acc;
  // }, {});

  // console.log(itemMap);

  // window.addEventListener('hashchange', () => {
  //   activeItem.classList.remove('active');
  //   activeItem = itemMap[window.location.hash];
  //   activeItem.classList.add('active');
  // });
}

export default IndexNavigation;