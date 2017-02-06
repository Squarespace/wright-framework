/**
 * Binds the click functionality for mobile folders.
 */
function MobileOverlayFolders(element) {

  const handleClick = (e) => {
    let target = e.target;
    while (target !== element && target.getAttribute('data-controller-folder-toggle') === null) {
      target = target.parentNode;
    }
    const folderID = target.getAttribute('data-controller-folder-toggle');
    if (folderID) {
      const folder = element.querySelector('[data-controller-folder="' + folderID + '"]');
      if (folder) {
        folder.classList.toggle('is-active-folder');
        element.classList.toggle('has-active-folder');
      }
    }
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

export default MobileOverlayFolders;