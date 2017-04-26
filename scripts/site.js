import 'raf/polyfill';
import controller from '@squarespace/controller';
import VideoBackground from '@squarespace/video-background';

import './polyfills/classList';

import AncillaryLayout from './controllers/AncillaryLayout';
import FooterBreakpoints from './controllers/FooterBreakpoints';
import HashManager from './controllers/HashManager';
import IndexFirstSectionHeight from './controllers/IndexFirstSectionHeight';
import IndexGallery from './controllers/IndexGallery';
import IndexGalleryVideo from './controllers/IndexGalleryVideo';
import IndexNavigation from './controllers/IndexNavigation';
import HeaderNavFolderTouch from './controllers/HeaderNavFolderTouch';
import HeaderOverlay from './controllers/HeaderOverlay';
import MobileClassname from './controllers/MobileClassname';
import MobileOverlayFolders from './controllers/MobileOverlayFolders';
import MobileOffset from './controllers/MobileOffset';
import MobileOverlayToggle from './controllers/MobileOverlayToggle';
import Parallax from './controllers/Parallax';
import ScrollIndicator from './controllers/ScrollIndicator';
import SiteLoader from './controllers/SiteLoader';

controller.register('AncillaryLayout', AncillaryLayout);
controller.register('FooterBreakpoints', FooterBreakpoints);
controller.register('HashManager', HashManager);
controller.register('IndexFirstSectionHeight', IndexFirstSectionHeight);
controller.register('IndexGallery', IndexGallery);
controller.register('IndexGalleryVideo', IndexGalleryVideo);
controller.register('IndexNavigation', IndexNavigation);
controller.register('HeaderNavFolderTouch', HeaderNavFolderTouch);
controller.register('HeaderOverlay', HeaderOverlay);
controller.register('MobileClassname', MobileClassname);
controller.register('MobileOverlayFolders', MobileOverlayFolders);
controller.register('MobileOffset', MobileOffset);
controller.register('MobileOverlayToggle', MobileOverlayToggle);
controller.register('Parallax', Parallax);
controller.register('ScrollIndicator', ScrollIndicator);
controller.register('SiteLoader', SiteLoader);
controller.register('VideoBackground', (element) => {
  return VideoBackground(element, [ 'tweak-overlay-parallax-enabled' ]);
});