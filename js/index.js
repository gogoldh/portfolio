// Import utility function for preloading images
import { preloadImages } from './utils.js';

// Wait for GSAP to be loaded, then register plugins
document.addEventListener('DOMContentLoaded', () => {
  // Check if GSAP is loaded
  if (typeof gsap === 'undefined') {
    console.error('GSAP is not loaded - animations will not work');
    // Try to continue without GSAP for basic functionality
    initBasicApp();
    return;
  }
  
  // Register the GSAP plugins with error checking
  try {
    if (typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
    if (typeof ScrollSmoother !== 'undefined') gsap.registerPlugin(ScrollSmoother);
    if (typeof ScrollToPlugin !== 'undefined') gsap.registerPlugin(ScrollToPlugin);
    if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);
    
    console.log('GSAP and plugins loaded successfully');
    // Initialize the application
    initApp();
  } catch (error) {
    console.error('Error registering GSAP plugins:', error);
    initBasicApp();
  }
});

// Basic app initialization without GSAP
function initBasicApp() {
  console.log('Running in basic mode without GSAP');
  // Add basic event listeners that don't require GSAP
  setupBasicInteractions();
}

function setupBasicInteractions() {
  // Basic preview functionality without animations
  document.querySelectorAll('a[href^="#preview-"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.style.display = 'block';
        target.style.opacity = '1';
      }
    });
  });
}

function initApp() {

// TEMPORARILY DISABLE ScrollSmoother to fix scrolling issues
// Initialize GSAP's ScrollSmoother for smooth scrolling and scroll-based effects
const smoother = null; // ScrollSmoother.create({
//   smooth: 1,
//   effects: true,
//   normalizeScroll: true,
// });

// Reference to the container that wraps all the 3D scene elements
const sceneWrapper = document.querySelector('.scene-wrapper');
const scrollIndicator = document.querySelector('.scroll-indicator');
let isAnimating = false;
const mainNav = document.getElementById('main-nav');
const splitMap = new Map();

const getCarouselCellTransforms = (count, radius) => {
  const angleStep = 360 / count;
  return Array.from({ length: count }, (_, i) => {
    const angle = i * angleStep;
    return `rotateY(${angle}deg) translateZ(${radius}px)`;
  });
};

function closeAllPreviews() {
  document.querySelectorAll('.preview').forEach(preview => {
    gsap.set(preview, { autoAlpha: 0, pointerEvents: 'none' });
  });
}

const setupCarouselCells = (carousel) => {
  const wrapper = carousel.closest('.scene');
  const radius = parseFloat(wrapper.dataset.radius) || 500;
  const cells = carousel.querySelectorAll('.carousel__cell');
  const transforms = getCarouselCellTransforms(cells.length, radius);
  cells.forEach((cell, i) => {
    cell.style.transform = transforms[i];
  });
};

const createScrollAnimation = (carousel) => {
  const wrapper = carousel.closest('.scene');
  const cards = carousel.querySelectorAll('.card');
  const titleSpan = wrapper.querySelector('.scene__title span');
  const split = splitMap.get(titleSpan);
  const chars = split?.chars || [];

  carousel._timeline = gsap.timeline({
    defaults: { ease: 'sine.inOut' },
    scrollTrigger: {
      trigger: wrapper,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });

  carousel._timeline
    .fromTo(carousel, { rotationY: 0 }, { rotationY: -180 }, 0)
    .fromTo(carousel, { rotationZ: 3, rotationX: 3 }, { rotationZ: -3, rotationX: -3 }, 0)
    .fromTo(cards, { filter: 'brightness(250%)' }, { filter: 'brightness(80%)', ease: 'power3' }, 0)
    .fromTo(cards, { rotationZ: 10 }, { rotationZ: -10, ease: 'none' }, 0);

  if (chars.length > 0) {
    animateChars(chars, 'in', {
      scrollTrigger: {
        trigger: wrapper,
        start: 'top center',
        toggleActions: 'play none none reverse',
      },
    });
  }

  return carousel._timeline;
};

const initTextsSplit = () => {
  document
    .querySelectorAll('.scene__title span, .preview__title span, .preview__close')
    .forEach((span) => {
      const split = SplitText.create(span, {
        type: 'chars',
        charsClass: 'char',
        autoSplit: true,
      });
      splitMap.set(span, split);
    });
};

const getInterpolatedRotation = (progress) => ({
  rotationY: gsap.utils.interpolate(0, -180, progress),
  rotationX: gsap.utils.interpolate(3, -3, progress),
  rotationZ: gsap.utils.interpolate(3, -3, progress),
});

const animateGridItemIn = (el, dx, dy, rotationY, delay) => {
  gsap.fromTo(
    el,
    {
      transformOrigin: `% 50% ${dx > 0 ? -dx * 0.8 : dx * 0.8}px`,
      autoAlpha: 0,
      y: dy * 0.5,
      scale: 0.5,
      rotationY: dx < 0 ? rotationY : rotationY,
    },
    {
      y: 0,
      scale: 1,
      rotationY: 0,
      autoAlpha: 1,
      duration: 0.4,
      ease: 'sine',
      delay: delay + 0.1,
    }
  );
  gsap.fromTo(
    el,
    { z: -3500 },
    {
      z: 0,
      duration: 0.3,
      ease: 'expo',
      delay,
    }
  );
};

const animateGridItemOut = (
  el,
  dx,
  dy,
  rotationY,
  delay,
  isLast,
  onComplete
) => {
  gsap.to(el, {
    startAt: {
      transformOrigin: `50% 50% ${dx > 0 ? -dx * 0.8 : dx * 0.8}px`,
    },
    y: dy * 0.4,
    rotationY: dx < 0 ? rotationY : rotationY,
    scale: 0.4,
    autoAlpha: 0,
    duration: 0.4,
    ease: 'sine.in',
    delay,
  });
  gsap.to(el, {
    z: -3500,
    duration: 0.4,
    ease: 'expo.in',
    delay: delay + 0.9,
    onComplete: isLast ? onComplete : undefined,
  });
};

const animateGridItems = ({
  items,
  centerX,
  centerY,
  direction = 'in',
  onComplete,
}) => {
  const itemData = Array.from(items).map((el) => {
    const rect = el.getBoundingClientRect();
    const elCenterX = rect.left + rect.width / 2;
    const elCenterY = rect.top + rect.height / 2;
    const dx = centerX - elCenterX;
    const dy = centerY - elCenterY;
    const dist = Math.hypot(dx, dy);
    const isLeft = elCenterX < centerX;
    return { el, dx, dy, dist, isLeft };
  });

  const maxDist = Math.max(...itemData.map((d) => d.dist));
  const totalStagger = 0.025 * (itemData.length - 1);

  let latest = { delay: -1, el: null };

  itemData.forEach(({ el, dx, dy, dist, isLeft }) => {
    const norm = maxDist ? dist / maxDist : 0;
    const exponential = Math.pow(direction === 'in' ? 1 - norm : norm, 1);
    const delay = exponential * totalStagger;
    const rotationY = isLeft ? 100 : -100;

    if (direction === 'in') {
      animateGridItemIn(el, dx, dy, rotationY, delay);
    } else {
      if (delay > latest.delay) {
        latest = { delay, el };
      }
      animateGridItemOut(el, dx, dy, rotationY, delay, false, onComplete);
    }
  });

  if (direction === 'out' && latest.el) {
    const { el, dx, dy, isLeft } = itemData.find((d) => d.el === latest.el);
    const rotationY = isLeft ? 100 : -100;
    animateGridItemOut(el, dx, dy, rotationY, latest.delay, true, onComplete);
  }
};

const animatePreviewGridIn = (preview) => {
  const items = preview.querySelectorAll('.grid__item');
  gsap.set(items, { clearProps: 'all' });
  animateGridItems({
    items,
    centerX: window.innerWidth / 2,
    centerY: window.innerHeight / 2,
    direction: 'in',
  });
};

const animatePreviewGridOut = (preview) => {
  const items = preview.querySelectorAll('.grid__item');
  const onComplete = () =>
    gsap.set(preview, { pointerEvents: 'none', autoAlpha: 0 });
  animateGridItems({
    items,
    centerX: window.innerWidth / 2,
    centerY: window.innerHeight / 2,
    direction: 'out',
    onComplete,
  });
};

const getSceneElementsFromTitle = (titleEl) => {
  const wrapper = titleEl.closest('.scene');
  const carousel = wrapper?.querySelector('.carousel');
  const cards = carousel?.querySelectorAll('.card');
  const span = titleEl.querySelector('span');
  const chars = splitMap.get(span)?.chars || [];
  return { wrapper, carousel, cards, span, chars };
};

const getSceneElementsFromPreview = (previewEl) => {
  const previewId = `#${previewEl.id}`;
  const titleLink = document.querySelector(
    `.scene__title a[href="${previewId}"]`
  );
  const titleEl = titleLink?.closest('.scene__title');
  return { ...getSceneElementsFromTitle(titleEl), titleEl };
};

const animateChars = (chars, direction = 'in', opts = {}) => {
  const base = {
    autoAlpha: direction === 'in' ? 1 : 0,
    duration: 0.02,
    ease: 'none',
    stagger: { each: 0.04, from: direction === 'in' ? 'start' : 'end' },
    ...opts,
  };
  gsap.fromTo(chars, { autoAlpha: direction === 'in' ? 0 : 1 }, base);
};

const animatePreviewTexts = (
  preview,
  direction = 'in',
  selector = '.preview__title span, .preview__close'
) => {
  preview.querySelectorAll(selector).forEach((el) => {
    const chars = splitMap.get(el)?.chars || [];
    animateChars(chars, direction);
  });
};

const activatePreviewFromCarousel = (e) => {
  mainNav.classList.add('hide-nav');
  // Hide scroll indicator when opening project
  if (scrollIndicator) scrollIndicator.classList.add('hidden');
  e.preventDefault();
  if (isAnimating) return;
  isAnimating = true;

  closeAllPreviews();

  const titleEl = e.currentTarget;
  const { wrapper, carousel, cards, chars } =
    getSceneElementsFromTitle(titleEl);

  const offsetTop = wrapper.getBoundingClientRect().top + window.scrollY;
  const targetY = offsetTop - window.innerHeight / 2 + wrapper.offsetHeight / 2;

  ScrollTrigger.getAll().forEach((t) => t.disable(false));

  gsap
    .timeline({
      defaults: { duration: 1.5, ease: 'power2.inOut' },
      onComplete: () => {
        isAnimating = false;
        ScrollTrigger.getAll().forEach((t) => t.enable());
        carousel._timeline.scrollTrigger.scroll(targetY);
      },
    })
    .to(window, {
      onComplete: () => {
        unlockUserScroll();
        if (smoother) smoother.paused(true);
      },
      scrollTo: { y: targetY, autoKill: true },
    })
    .to(
      chars,
      {
        autoAlpha: 0,
        duration: 0.02,
        ease: 'none',
        stagger: { each: 0.04, from: 'end' },
      },
      0
    )
    .to(carousel, { rotationX: 90, rotationY: -360, z: -2000 }, 0)
    .to(
      carousel,
      {
        duration: 2.5,
        ease: 'power3.inOut',
        z: 1500,
        rotationZ: 270,
        onComplete: () => gsap.set(sceneWrapper, { autoAlpha: 0 }),
      },
      0.7
    )
    .to(cards, { rotationZ: 0 }, 0)
    .add(() => {
      const previewSelector = titleEl.querySelector('a')?.getAttribute('href');
      const preview = document.querySelector(previewSelector);
      gsap.set(preview, { pointerEvents: 'auto', autoAlpha: 1 });
      animatePreviewGridIn(preview);
      animatePreviewTexts(preview, 'in');
      mainNav.classList.add('hide-nav');
    }, '<+=1.9');
};

const deactivatePreviewToCarousel = (e) => {
  if (isAnimating) return;
  isAnimating = true;

  const preview = e.currentTarget.closest('.preview');
  if (!preview) return;

  // Special case for About modal (no carousel/scene)
  if (preview.id === 'preview-about') {
    animatePreviewTexts(preview, 'out');
    animatePreviewGridOut(preview);
    gsap.delayedCall(0.7, () => {
      gsap.set(preview, { autoAlpha: 0, pointerEvents: 'none' });
      document.querySelector('main').classList.remove('blurred');
      gsap.set(sceneWrapper, { autoAlpha: 1 });
      mainNav.classList.remove('hide-nav');
      // Show scroll indicator when closing preview
      if (scrollIndicator) scrollIndicator.classList.remove('hidden');
      // Unlock scrolling when closing about page
      unlockUserScroll();
      isAnimating = false;
    });
    return;
  }

  // Special case for Contact modal (no carousel/scene)
  if (preview.id === 'preview-contact') {
    gsap.delayedCall(0.3, () => {
      gsap.set(preview, { autoAlpha: 0, pointerEvents: 'none' });
      gsap.set(sceneWrapper, { autoAlpha: 1 });
      mainNav.classList.remove('hide-nav');
      // Show scroll indicator when closing preview
      if (scrollIndicator) scrollIndicator.classList.remove('hidden');
      // Unlock scrolling when closing contact page
      unlockUserScroll();
      isAnimating = false;
    });
    return;
  }

  const { carousel, cards, chars } = getSceneElementsFromPreview(preview);

  animatePreviewTexts(preview, 'out');
  animatePreviewGridOut(preview);

  gsap.set(sceneWrapper, { autoAlpha: 1 });

  const progress = 0.5;
  const { rotationX, rotationY, rotationZ } = getInterpolatedRotation(progress);

  gsap
    .timeline({
      delay: 0.7,
      defaults: { duration: 1.3, ease: 'expo' },
      onComplete: () => {
        if (smoother) smoother.paused(false);
        mainNav.classList.remove('hide-nav');
        // Show scroll indicator when closing preview
        if (scrollIndicator) scrollIndicator.classList.remove('hidden');
        isAnimating = false;
      },
    })
    .fromTo(
      chars,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.02,
        ease: 'none',
        stagger: { each: 0.04, from: 'start' },
      }
    )
    .fromTo(
      carousel,
      {
        z: -550,
        rotationX,
        rotationY: -720,
        rotationZ,
        yPercent: 300,
      },
      {
        rotationY,
        yPercent: 0,
      },
      0
    )
    .fromTo(cards, { autoAlpha: 0 }, { autoAlpha: 1 }, 0.3);
};

// Function to handle scroll indicator state based on scroll position
const handleScrollIndicator = () => {
  if (!scrollIndicator) return;
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollBottom = scrollTop + windowHeight;
  
  // Check if we're near the bottom (within 100px)
  const isAtBottom = scrollBottom >= documentHeight - 100;
  
  if (isAtBottom) {
    scrollIndicator.classList.add('at-bottom');
    scrollIndicator.querySelector('.scroll-text').textContent = 'Scroll to top';
  } else {
    scrollIndicator.classList.remove('at-bottom');
    scrollIndicator.querySelector('.scroll-text').textContent = 'Scroll to explore';
  }
};

const initEventListeners = () => {
  document.querySelectorAll('.scene__title').forEach((title) => {
    title.addEventListener('click', (e) => {
      // Lock scrolling immediately when a project is clicked
      lockUserScroll();
      closeAllPreviews();
      activatePreviewFromCarousel(e);
    });
  });

  document.querySelectorAll('.preview__close').forEach((btn) => {
    btn.addEventListener('click', deactivatePreviewToCarousel);
  });

  const aboutLink = document.querySelector('a[href="#preview-about"]');
  if (aboutLink) {
    aboutLink.addEventListener('click', function(e) {
      e.preventDefault();
      // Lock background scrolling but allow modal scrolling
      lockUserScroll();
      closeAllPreviews();
      // Hide scroll indicator when opening about
      if (scrollIndicator) scrollIndicator.classList.add('hidden');
      gsap.set(sceneWrapper, { autoAlpha: 1 });
      const preview = document.getElementById('preview-about');
      if (preview) {
        gsap.set(preview.querySelectorAll('.grid__item'), { clearProps: 'all' });
        gsap.set(preview, { pointerEvents: 'auto', autoAlpha: 1 });
        animatePreviewTexts(preview, 'in');
        document.querySelector('main').classList.add('blurred');
      }
    });
  }
  
  // Add scroll event listener for scroll indicator
  window.addEventListener('scroll', handleScrollIndicator);
  
  // Add click handler for scroll indicator
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      if (scrollIndicator.classList.contains('at-bottom')) {
        // Scroll to top smoothly
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  }
  
  // Initialize scroll indicator state
  handleScrollIndicator();
};
const contactLink = document.querySelector('a[href="#preview-contact"]');
if (contactLink) {
  contactLink.addEventListener('click', function(e) {
    e.preventDefault();
    // Lock scrolling immediately when contact page is opened
    lockUserScroll();
    closeAllPreviews();
    // Hide scroll indicator when opening contact
    if (scrollIndicator) scrollIndicator.classList.add('hidden');
    gsap.set(sceneWrapper, { autoAlpha: 1 });
    const preview = document.getElementById('preview-contact');
    if (preview) {
      gsap.set(preview, { pointerEvents: 'auto', autoAlpha: 1 });
      // Optionally reset the businesscard tilt
      const businesscard = document.getElementById('businesscard');
      if (businesscard) {
        businesscard.style.transform = 'translate(-50%, -50%) rotateY(0deg) rotateX(0deg)';
        businesscard.style.boxShadow = '0 8px 32px #0005';
      }
    }
  });
}

const initCarousels = () => {
  document.querySelectorAll('.carousel').forEach((carousel) => {
    setupCarouselCells(carousel);
    carousel._timeline = createScrollAnimation(carousel);
  });
};

function preventScroll(e) {
  e.preventDefault();
}

function lockUserScroll() {
  // Only prevent scrolling on the body/html, not within modals
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  
  // Add a class to indicate scroll is locked for styling purposes
  document.documentElement.classList.add('scroll-locked');
}

function unlockUserScroll() {
  // Restore scrolling
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  
  // Remove the scroll locked class
  document.documentElement.classList.remove('scroll-locked');
}

function preventArrowScroll(e) {
  const keys = [
    'ArrowUp',
    'ArrowDown',
    'PageUp',
    'PageDown',
    'Home',
    'End',
    ' ',
  ];
  if (keys.includes(e.key)) e.preventDefault();
}

// Function to validate and fix carousel sizes
const validateCarouselSizes = () => {
  document.querySelectorAll('.carousel').forEach((carousel) => {
    const rect = carousel.getBoundingClientRect();
    const maxWidth = window.innerWidth * 0.8;
    const maxHeight = window.innerHeight * 0.8;
    
    // Reset any inline styles that might cause oversizing
    if (rect.width > maxWidth || rect.height > maxHeight) {
      console.log('Resetting oversized carousel');
      carousel.style.transform = 'translateZ(-550px) rotateY(0deg)';
      carousel.style.width = '';
      carousel.style.height = '';
      
      // Re-setup the carousel cells
      setupCarouselCells(carousel);
    }
  });
};

// Debounced resize handler
let resizeTimeout;
const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    validateCarouselSizes();
    ScrollTrigger.refresh();
  }, 250);
};

const init = () => {
  initTextsSplit();
  initCarousels();
  initEventListeners();
  
  // Hide scrollbar on homepage for cleaner look
  document.documentElement.classList.add('hide-scrollbar');
  
  // Add resize handler with carousel validation
  window.addEventListener('resize', handleResize);
  
  // Validate carousel sizes on initial load
  setTimeout(validateCarouselSizes, 100);
};

// Initialize immediately, then enhance when images are loaded
init();

// Handle page visibility changes (e.g., after refresh, tab switching)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    setTimeout(validateCarouselSizes, 100);
  }
});

// Additional safeguard for page load
window.addEventListener('load', () => {
  setTimeout(validateCarouselSizes, 200);
});

preloadImages('.grid__item-image').then(() => {
  // Images are loaded, can now trigger any image-dependent animations
  console.log('All images preloaded');
  // Add a class to indicate images are ready
  document.body.classList.add('images-loaded');
});

document.addEventListener('DOMContentLoaded', function() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox.querySelector('.lightbox__img');
  const closeBtn = lightbox.querySelector('.lightbox__close');
  const leftBtn = lightbox.querySelector('.lightbox__arrow--left');
  const rightBtn = lightbox.querySelector('.lightbox__arrow--right');
  let currentGallery = [];
  let currentIndex = 0;

  const galleries = {};
  document.querySelectorAll('.grid__item-image').forEach(imgDiv => {
    const gallery = imgDiv.dataset.gallery;
    if (!galleries[gallery]) galleries[gallery] = [];
    galleries[gallery].push(imgDiv);
  });

  document.querySelectorAll('.grid__item-image').forEach(imgDiv => {
    imgDiv.addEventListener('click', function() {
      const galleryName = imgDiv.dataset.gallery;
      currentGallery = galleries[galleryName];
      currentIndex = parseInt(imgDiv.dataset.index, 10);
      showImage();
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });

  function showImage() {
    const imgDiv = currentGallery[currentIndex];
    const url = imgDiv.style.backgroundImage.slice(5, -2);
    lightboxImg.src = url;
  }

  function closeLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeLightbox);

  leftBtn.addEventListener('click', function() {
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
    showImage();
  });

  rightBtn.addEventListener('click', function() {
    currentIndex = (currentIndex + 1) % currentGallery.length;
    showImage();
  });

  document.addEventListener('keydown', function(e) {
    if (lightbox.style.display === 'flex') {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') leftBtn.click();
      if (e.key === 'ArrowRight') rightBtn.click();
    }
  });

  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) closeLightbox();
  });
});

const previewContact = document.getElementById('preview-contact');
const businesscard = document.getElementById('businesscard');
const qr = document.querySelector('.businesscard__qr');

let zoomedIn = false;

if (previewContact && businesscard && qr) {
  previewContact.addEventListener('mousemove', (e) => {
    if (zoomedIn) return; // Skip tilt when zoomed in

    const rect = previewContact.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = x - centerX;
    const deltaY = y - centerY;

    const percentX = deltaX / centerX;
    const percentY = deltaY / centerY;

    const maxTilt = 45; // 🔥 More tilt for a stronger 3D effect

    const rotateX = percentY * -maxTilt;
    const rotateY = percentX * maxTilt;

    businesscard.style.transform = `translate(-50%, -50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    businesscard.style.boxShadow = `${-percentX * 40}px ${percentY * 40}px 48px #0005`;
  });

  previewContact.addEventListener('mouseleave', () => {
    if (!zoomedIn) {
      businesscard.style.transform = 'translate(-50%, -50%) rotateX(0deg) rotateY(0deg) scale(1)';
      businesscard.style.boxShadow = '0 8px 32px #0005';
    }
  });

  qr.addEventListener('click', (e) => {
    e.stopPropagation();

    if (zoomedIn) {
      // Zoom out
      businesscard.style.transform = 'translate(-50%, -50%) rotateX(0deg) rotateY(0deg) scale(1)';
      businesscard.style.boxShadow = '0 8px 32px #0005';
      zoomedIn = false;
    } else {
      const cardRect = businesscard.getBoundingClientRect();
      const qrRect = qr.getBoundingClientRect();

      const offsetX = (qrRect.left + qrRect.width / 2) - (cardRect.left + cardRect.width / 2);
      const offsetY = (qrRect.top + qrRect.height / 2) - (cardRect.top + cardRect.height / 2);

      const scale = 2;
      const translateX = -offsetX * scale;
      const translateY = -offsetY * scale;

      businesscard.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`;
      businesscard.style.boxShadow = '0 24px 64px #0008';
      zoomedIn = true;
    }
  });
}

} // End of initApp function