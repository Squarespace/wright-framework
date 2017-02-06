/**
 * When clicking on a video in an index gallery, open that video in a lightbox.
 */
function IndexGalleryVideo(element) {

  const video = element.querySelector('.sqs-video-wrapper');

  if (!video) {
    return null;
  }

  const handleClick = (e) => {
    e.preventDefault();

    // WARNING: Y.Squarespace.Lightbox2 is an unstable API meant strictly for
    // internal Squarespace use.
    const lightbox = new window.Y.Squarespace.Lightbox2({
      content: window.Y.one(video),
      controls: {
        previous: false,
        next: false
      }
    });

    lightbox.render();
  };

  const bindListeners = () => {
    element.addEventListener('click', handleClick);
  };
  const destroy = () => {
    element.removeEventListener('click', handleClick);
  };

  video.parentNode.removeChild(video);
  bindListeners();

  return {
    destroy
  };

}

export default IndexGalleryVideo;