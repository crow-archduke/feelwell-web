// Mobile nav toggle
const menuToggle = document.getElementById('menuToggle');
const mobileNav = document.getElementById('mobileNav');

if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Header recolors to match the hovered nav item
const siteHeader = document.querySelector('.site-header');
const hoverPills = document.querySelectorAll('.nav-pill[data-color]');

if (siteHeader && hoverPills.length) {
  hoverPills.forEach(pill => {
    pill.addEventListener('mouseenter', () => {
      siteHeader.dataset.hover = pill.dataset.color;
    });
    pill.addEventListener('focus', () => {
      siteHeader.dataset.hover = pill.dataset.color;
    });
  });
  siteHeader.addEventListener('mouseleave', () => {
    delete siteHeader.dataset.hover;
  });
  document.querySelector('.main-nav')?.addEventListener('focusout', (e) => {
    if (!siteHeader.contains(e.relatedTarget)) delete siteHeader.dataset.hover;
  });
}

// Gallery lightbox — click a screenshot to view it maximized
const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

if (galleryItems.length && lightbox && lightboxImg) {
  let currentIndex = 0;
  let lastFocused = null;

  function showImage(index) {
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentIndex];
    lightboxImg.src = item.dataset.full;
    lightboxImg.alt = item.querySelector('img').alt;
  }

  function openLightbox(index) {
    lastFocused = document.activeElement;
    showImage(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => showImage(currentIndex - 1));
  lightboxNext.addEventListener('click', () => showImage(currentIndex + 1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
  });
}

// Trailer video play button
const video = document.getElementById('teaserVideo');
const playBtn = document.getElementById('playBtn');

if (video && playBtn) {
  playBtn.addEventListener('click', () => {
    video.play();
  });
  video.addEventListener('play', () => playBtn.classList.add('is-hidden'));
  video.addEventListener('pause', () => playBtn.classList.remove('is-hidden'));
  video.addEventListener('ended', () => playBtn.classList.remove('is-hidden'));
}

// Contact form (front-end only — wire to a real backend such as Formspree
// or Netlify Forms before this site goes live)
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

if (contactForm && formNote) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValid) {
      formNote.textContent = 'Zadejte prosím platnou e-mailovou adresu.';
      return;
    }
    formNote.textContent = 'Děkujeme! Ozveme se vám co nejdříve.';
    contactForm.reset();
  });
}

// Scroll-reveal animations
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => observer.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Cursor-reactive variable headlines — Fraunces thickens as the pointer nears
const REST_WEIGHT = 420;
const MAX_WEIGHT = 720;
const REACH = 260; // px radius of influence

const vfHeadings = document.querySelectorAll('.vf-heading');
let vfWords = [];

function wrapWords(heading) {
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);

  textNodes.forEach(textNode => {
    const parts = textNode.textContent.split(/(\s+)/);
    const frag = document.createDocumentFragment();
    parts.forEach(part => {
      if (part === '') return;
      if (/^\s+$/.test(part)) {
        frag.appendChild(document.createTextNode(part));
      } else {
        const span = document.createElement('span');
        span.className = 'vf-word';
        span.textContent = part;
        frag.appendChild(span);
      }
    });
    textNode.parentNode.replaceChild(frag, textNode);
  });
}

if (vfHeadings.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  vfHeadings.forEach(wrapWords);
  vfWords = Array.from(document.querySelectorAll('.vf-word')).map(el => ({ el, cx: 0, cy: 0 }));

  let rafId = null;
  let pointerX = -9999;
  let pointerY = -9999;

  function measure() {
    vfWords.forEach(w => {
      const rect = w.el.getBoundingClientRect();
      w.cx = rect.left + rect.width / 2;
      w.cy = rect.top + rect.height / 2;
    });
  }
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('scroll', measure, { passive: true });

  function applyWeights() {
    rafId = null;
    vfWords.forEach(w => {
      const dx = pointerX - w.cx;
      const dy = pointerY - w.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t = Math.max(0, 1 - dist / REACH);
      const weight = Math.round(REST_WEIGHT + (MAX_WEIGHT - REST_WEIGHT) * t);
      w.el.style.setProperty('--wght', weight);
    });
  }

  window.addEventListener('mousemove', (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
    if (rafId === null) rafId = requestAnimationFrame(applyWeights);
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    pointerX = -9999;
    pointerY = -9999;
    if (rafId === null) rafId = requestAnimationFrame(applyWeights);
  });
}
