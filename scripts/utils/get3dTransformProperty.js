let propToUse;

/**
 * Find out which 3d transform property a browser supports, in priority order,
 * and return that property as a string.
 *
 * @return {String} Supported 3d transform property, or 'transform' if none
 */
const get3dTransformProperty = () => {
  if (propToUse) {
    return propToUse;
  }

  const possibleProps = [
    'transform',
    'webkitTransform',
    'msTransform'
  ];
  const testElement = document.createElement('div');

  testElement.style.visibility = 'hidden';
  document.body.appendChild(testElement);
  const elementStyle = window.getComputedStyle(testElement);
  possibleProps.some((prop) => {
    if (typeof elementStyle[prop] === 'string') {
      propToUse = prop;
      return true;
    }
    return false;
  });
  if (!propToUse) {
    propToUse = 'transform';
  }

  document.body.removeChild(testElement);
  return propToUse;
};

export default get3dTransformProperty;