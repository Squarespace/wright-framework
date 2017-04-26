let map = {};

/**
 * Function to get the bounding client rect for any section in the index. Since
 * this logic is shared between multiple controllers that affect the index, this
 * is memoized so we don't have to do the function call unnecessarily.
 *
 * @param  {HTMLElement} section  The section to measure
 * @return {Object}               Object with bounding box measurements
 */
export const getIndexSectionRect = (section) => {
  const id = section.getAttribute('id');

  if (map[id]) {
    return map[id];
  }

  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const rect = section.getBoundingClientRect();

  // Math.floor, Math.ceil, and +2 here are to solve lines appearing between
  // parallax sections due to pixel rounding issues in safari
  map[id] = {
    top: Math.floor(rect.top + scrollTop),
    right: rect.right,
    bottom: Math.ceil(rect.bottom + scrollTop),
    left: rect.left,
    width: section.offsetWidth,
    height: section.offsetHeight + 2
  };

  return map[id];
};

/**
 * Clears the stored bounding client rect values.
 *
 * NOTE: This should be called only from Parallax.js, which is arbitrarily
 * designated to handle cache invalidation.
 */
export const invalidateIndexSectionRectCache = () => {
  map = {};
};

export default {
  getIndexSectionRect,
  invalidateIndexSectionRectCache
};