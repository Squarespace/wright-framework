import jump from 'jump.js';
import URL from 'url-parse';


function HashManager(element) {

  const getSamePageHash = (href) => {
    const url = new URL(href);
    const loc = new URL(window.location.href);

    if (url.host !== loc.host || url.pathname !== loc.pathname || url.hash === '' || url.hash === '#') {
      return null;
    }

    return url.hash;
  };

  const isKeyModified = (e) => {
    return e.metaKey || e.ctrlKey || e.altKey || e.shiftKey;
  };

  const handleClick = (e) => {
    if (isKeyModified(e)) {
      return;
    }
    let target = e.target;
    while (target && target !== document.body && target.tagName.toUpperCase() !== 'A') {
      target = target.parentElement;
    }
    if (!target || target === document.body) {
      return;
    }

    const hash = getSamePageHash(target.href);
    const hashElement = element.querySelector(hash);

    if (hash && hashElement) {
      e.preventDefault();
      e.stopImmediatePropagation();

      window.history.replaceState(undefined, undefined, hash);

      const hashElementTop = Math.ceil(hashElement.getBoundingClientRect().top);
      jump(hashElementTop, {
        duration: 500
      });
    }

  };

  element.addEventListener('click', handleClick);


}

export default HashManager;