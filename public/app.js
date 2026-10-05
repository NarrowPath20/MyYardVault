import {initSite} from '/controllers/site-controller.js';
import {initRouter} from '/controllers/router-controller.js';
import {initImmersion} from '/views/renderers/immersion.js';
import {initAgentPortal} from '/controllers/agent-portal-controller.js';
import {initPaymentEstimator} from '/controllers/payment-estimator-controller.js';
import {initChat} from '/controllers/chat-controller.js';
import {LEGACY_PATHS} from '/models/pages.js';

const legacy = LEGACY_PATHS[location.hash.slice(1)];
if (location.pathname === '/' && legacy && legacy !== '/') {
  location.replace(legacy + location.search);
} else {
  const page = document.body.dataset.page;
  const scene = {setVaultColor() {}, setScene() {}};
  initSite(scene);
  initRouter();
  initImmersion();
  initAgentPortal();
  initPaymentEstimator();
  initChat();

  const initialize = async (module, name) => (await import(`/controllers/${module}-controller.js`))[name]();
  if (page === 'home') {
    const {initVaultScene} = await import('/views/renderers/vault-scene.js');
    initVaultScene(scene);
  } else if (page === 'storage') {
    await initialize('storage-gallery', 'initStorageGallery');
  } else if (page === 'office') {
    await initialize('office-use-cases', 'initOfficeUseCases');
    await initialize('office-weather', 'initOfficeWeather');
  } else if (page === 'kiosk') {
    await initialize('kiosk-gallery', 'initKioskGallery');
  } else if (page === 'multi') {
    await initialize('rental-estimator', 'initRentalEstimator');
  } else if (page === 'build') {
    await initialize('build-walkthrough', 'initBuildWalkthrough');
  } else if (page === 'gallery') {
    await initialize('gallery-filter', 'initGalleryFilter');
    await initialize('lightbox', 'initLightbox');
  } else if (page === 'contact') {
    await initialize('lead-forms', 'initLeadForms');
  }
  document.documentElement.dataset.appReady = 'true';
}
