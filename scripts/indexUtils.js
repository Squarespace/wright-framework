let map = {};

export const getIndexSectionDOMInfo = (section) => {
  const id = section.getAttribute('id');

  if (map[id]) {
    console.log('returning stored value for ' + id);
    return map[id];
  }

  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const rect = section.getBoundingClientRect();

  map[id] = {
    top: rect.top + scrollTop,
    right: rect.right,
    bottom: rect.bottom + scrollTop,
    left: rect.left,
    width: section.offsetWidth,
    height: section.offsetHeight
  };

  console.log('returning new value for ' + id);
  return map[id];
};

export const invalidateSectionCache = () => {
  map = {};
};