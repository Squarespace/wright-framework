import { Tweak } from '@squarespace/core';
import Ancillary from '@squarespace/ancillary';
import resizeEnd from '../utils/resizeEnd';
import { debug } from '../constants';

const mobileLayoutTweaks = [
  'ancillary-mobile-bar-branding-position',
  'ancillary-mobile-bar-menu-icon-position',
  'ancillary-mobile-bar-search-icon-position',
  'ancillary-mobile-bar-cart-position',
  'ancillary-mobile-bar-account-position'
];

const desktopLayoutTweaks = [
  'ancillary-header-branding-position',
  'ancillary-header-tagline-position',
  'ancillary-header-primary-nav-position',
  'ancillary-header-secondary-nav-position',
  'ancillary-header-social-position',
  'ancillary-header-search-position',
  'ancillary-header-cart-position',
  'ancillary-header-account-position'
];


/**
 * The AncillaryLayout controller will generate an instance of Ancillary with
 * the controller element as the base. Also contains logic to add collapsed
 * data-attribute to container if elements are detected to be too large to fit.
 */
function AncillaryLayout(element) {

  // Get settings from DOM for this particular Ancillary base
  const ancillary = new Ancillary(element, { debug });

  if (element.classList.contains('Mobile')) {
    const sync = () => {
      ancillary.sync();
      element.classList.add('loaded');
    };
    sync();

    Tweak.watch(mobileLayoutTweaks, sync);

    return { sync };
  }

  // Collapse logic is specific to desktop header
  const baseName = element.getAttribute('data-nc-base');
  const groups = Array.from(element.querySelectorAll('[data-nc-group]')).reduce((acc, groupNode) => {
    const groupName = groupNode.getAttribute('data-nc-group');
    if (!groupName) {
      return acc;
    }
    const containers = Array.from(groupNode.querySelectorAll('[data-nc-container]'));
    acc[groupName] = {
      node: groupNode,
      containers,
      breakpoint: {
        min: 0,
        max: 999999
      }
    };
    return acc;
  }, {});

  /**
   * Collapse method cycles through each container in a collapse group and sees
   * if the combined width of its children exceeds its width (in horizontal
   * mode), or if the width of any one of its children exceeds its width (in
   * stacked mode). If so, it adds the nc-collapse class to the group; if not,
   * it removes the classname.
   *
   * @param  {String} groupName   Name of the group
   * @return {Boolean}            Whether the group should be collapsed
   */
  const shouldCollapse = (groupName) => {
    const group = groups[groupName];

    // Loop through all containers in group
    for (let i = 0; i < group.containers.length; i++) {
      const container = group.containers[i];
      const containerName = container.getAttribute('data-nc-container');
      const containerWidth = Math.ceil(parseFloat(window.getComputedStyle(container).width));
      const elements = container.querySelectorAll('[data-nc-element]');
      const isStacked = document.body.classList.contains(`ancillary-${baseName}-${containerName}-layout-stacked`);
      let totalWidth = 0;

      // Loop through all elements in container
      for (let j = 0; j < elements.length; j++) {
        const el = elements[j];
        const elementWidth = el.offsetWidth;

        if (elementWidth > 0 && !isStacked) {
          totalWidth += elementWidth;
        }

        if (isStacked && elementWidth > containerWidth ||
          !isStacked && totalWidth > containerWidth) {
          if (window.innerWidth > group.breakpoint.min) {
            group.breakpoint.min = window.innerWidth;
          }
          return true;
        }
      }
    }

    if (window.innerWidth < group.breakpoint.max) {
      group.breakpoint.max = window.innerWidth;
    }
    return false;
  };

  /**
   * Checks to see if we're in desktop nav and should run collapse logic
   * @return {Boolean}
   */
  const isInRange = () => {
    return !document.body.classList.contains('is-mobile');
  };

  /**
   * Function that actually adds collapse data-attribute or not based on
   * shouldCollapse result.
   */
  const syncCollapse = () => {
    if (!isInRange()) {
      return;
    }
    Object.keys(groups).forEach((groupName) => {
      const group = groups[groupName];
      if (window.innerWidth > group.breakpoint.min && window.innerWidth <= group.breakpoint.max) {
        group.node.removeAttribute('data-nc-collapse');
        if (shouldCollapse(groupName)) {
          group.node.setAttribute('data-nc-collapse', '');
        }
      } else if (window.innerWidth <= group.breakpoint.min) {
        group.node.setAttribute('data-nc-collapse', '');
      } else if (window.innerWidth > group.breakpoint.max) {
        group.node.removeAttribute('data-nc-collapse');
      }
    });
  };

  const sync = () => {
    ancillary.sync();
    syncCollapse();
    element.classList.add('loaded');
  };

  resizeEnd(() => {
    syncCollapse();
  });

  Tweak.watch(desktopLayoutTweaks, sync);

  sync();

  return { sync };

}


export default AncillaryLayout;