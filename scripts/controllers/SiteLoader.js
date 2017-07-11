import { refresh } from '@squarespace/controller';
import { Lifecycle, Tweak } from '@squarespace/core';
import Mercury from '@squarespace/mercury';
import { authenticated } from '../constants';

// Exceptions: external links, hash links
const onClickExceptions = [
  '[data-no-ajax]'
];

// Exceptions after making the request. Does a string match for any of these
// in the responseText
const onRequestExceptions = [
  'sqs-slide-container'
];

// updateMatrix indicates which elements need to be updated on load. You can
// choose whether to update attributes, replace HTML, or both.
const updateMatrix = [
  { selector: 'title', updateHTML: true },
  { selector: 'meta[property="og:title"]', updateAttrs: true },
  { selector: 'meta[property="og:latitude"]', updateAttrs: true },
  { selector: 'meta[property="og:longitude"]', updateAttrs: true },
  { selector: 'meta[property="og:url"]', updateAttrs: true },
  { selector: 'meta[property="og:type"]', updateAttrs: true },
  { selector: 'meta[property="og:description"]', updateAttrs: true },
  { selector: 'meta[property="og:image"]', updateAttrs: true },
  { selector: 'meta[itemprop="name"]', updateAttrs: true },
  { selector: 'meta[itemprop="url"]', updateAttrs: true },
  { selector: 'meta[itemprop="description"]', updateAttrs: true },
  { selector: 'meta[itemprop="thumbnailUrl"]', updateAttrs: true },
  { selector: 'meta[itemprop="image"]', updateAttrs: true },
  { selector: 'meta[name="twitter:title"]', updateAttrs: true },
  { selector: 'meta[name="twitter:image"]', updateAttrs: true },
  { selector: 'meta[name="twitter:url"]', updateAttrs: true },
  { selector: 'meta[name="twitter:card"]', updateAttrs: true },
  { selector: 'meta[name="twitter:description"]', updateAttrs: true },
  { selector: 'meta[name="twitter:url"]', updateAttrs: true },
  { selector: 'meta[name="description"]', updateAttrs: true },
  { selector: 'link[rel="canonical"]', updateAttrs: true },
  { selector: 'link[rel="image_src"]', updateAttrs: true },
  { selector: 'link[rel="alternate"]', updateAttrs: true },
  { selector: 'body', updateAttrs: true },
  { selector: '.Parallax-host-outer', updateHTML: true },
  { selector: '.Site-inner', updateAttrs: true },
  { selector: '.Header--bottom', updateAttrs: true },
  { selector: '.Header-nav--primary', updateHTML: true },
  { selector: '.Header-nav--secondary', updateHTML: true },
  { selector: '.Content-outer', updateHTML: true },
  { selector: 'script[data-name="static-context"]', updateScript: true }
];

/**
 * Instantiates a mercury loader for the site in unauthenticated sessions.
 */
function SiteLoader() {

  // Don't use ajax in authenticated session or when tweak option is disabled.
  const ajaxEnabled = Tweak.getValue('tweak-site-ajax-loading-enable') === 'true';
  if (authenticated || !ajaxEnabled) {
    return false;
  }

  const mercury = new Mercury({
    enableCache: true,
    updateMatrix: updateMatrix,
    onClickExceptions: onClickExceptions,
    onRequestExceptions: onRequestExceptions,
    timeout: 10000
  });

  // Squarespace init and destroy
  window.addEventListener('mercury:load', function() {
    Lifecycle.init();
    document.documentElement.setAttribute('data-mercury-loading', 'done');
    setTimeout(function() {
      document.documentElement.removeAttribute('data-mercury-loading');
    }, 500);
  });
  window.addEventListener('mercury:unload', function() {
    Lifecycle.destroy();
    document.documentElement.setAttribute('data-mercury-loading', '');
  });

  // Sync controllers on ajax load
  window.addEventListener('mercury:load', refresh);

}


export default SiteLoader;
