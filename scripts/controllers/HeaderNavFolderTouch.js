/**
 * On touch devices, prevent taps on a folder link in header from navigating to
 * that folder's URL, showing the folder's contents instead.
 */
function HeaderNavFolderTouch(element) {

  if (!document.documentElement.classList.contains('touch')) {
    return;
  }

  const handleClick = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
  };

  const bindListeners = () => {
    element.addEventListener('click', handleClick);
  };

  const destroy = () => {
    element.removeEventListener('click', handleClick);
  };

  bindListeners();

  return {
    destroy
  };
}

export default HeaderNavFolderTouch;