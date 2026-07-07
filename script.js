const root = document.documentElement;
const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const navLinks = document.querySelector('[data-nav-links]');
const cursorGlow = document.querySelector('.cursor-glow');
const progressBar = document.querySelector('[data-scroll-progress]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let lenis = null;
let ticking = false;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const navOffset = -126;

const setHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 16);
};

const updateScrollEffects = () => {
  const scrollTop = window.scrollY;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = clamp(scrollTop / maxScroll, 0, 1);

  if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
  setHeader();

  if (!prefersReducedMotion.matches && window.matchMedia('(min-width: 900px)').matches) {
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const strength = Number(el.dataset.parallax || 0);
      const rect = el.getBoundingClientRect();
      const viewportProgress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const y = viewportProgress * strength * -120;
      const rotate = el.classList.contains('surface-panel') ? ' rotate(-10deg)' : '';
      el.style.transform = `translate3d(0, ${y}px, 0)${rotate}`;
    });
  }
};

const requestScrollEffects = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateScrollEffects();
    ticking = false;
  });
};

const initLenis = async () => {
  if (prefersReducedMotion.matches) return;
  try {
    const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/lenis@1.1.20/+esm');
    lenis = new Lenis({
      duration: 1.08,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.15
    });
    root.classList.add('lenis', 'lenis-smooth');
    document.body.classList.add('lenis', 'lenis-smooth');
    lenis.on('scroll', requestScrollEffects);
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  } catch {
    root.classList.remove('lenis', 'lenis-smooth');
    document.body.classList.remove('lenis', 'lenis-smooth');
  }
};

setHeader();
updateScrollEffects();
initLenis();
window.addEventListener('scroll', requestScrollEffects, { passive: true });
window.addEventListener('resize', requestScrollEffects, { passive: true });

const closeMenu = () => {
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Open navigation');
  navLinks?.classList.remove('is-open');
  document.body.classList.remove('menu-open');
};

menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  navLinks?.classList.toggle('is-open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');
    if (hash?.startsWith('#') && lenis) {
      event.preventDefault();
      lenis.scrollTo(hash, { offset: navOffset });
      history.pushState(null, '', hash);
    }
    closeMenu();
  });
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.16 });

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks?.querySelectorAll('a').forEach((link) => {
        link.toggleAttribute('aria-current', link.getAttribute('href') === `#${id}`);
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px' });

  document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
}

const animateNumber = (el, target, suffix = '') => {
  if (prefersReducedMotion.matches) {
    el.textContent = `${target}${suffix}`;
    return;
  }
  const duration = 1100;
  const start = performance.now();
  const tick = (now) => {
    const progress = clamp((now - start) / duration, 0, 1);
    const current = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    el.textContent = `${current}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const countEl = document.querySelector('[data-count]');
if (countEl && 'IntersectionObserver' in window) {
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateNumber(countEl, Number(countEl.dataset.count || 0), '+');
      countObserver.disconnect();
    });
  }, { threshold: 0.8 });
  countObserver.observe(countEl);
} else if (countEl) {
  countEl.textContent = `${countEl.dataset.count}+`;
}

window.addEventListener('pointermove', (event) => {
  if (!cursorGlow || window.matchMedia('(max-width: 700px)').matches || prefersReducedMotion.matches) return;
  root.style.setProperty('--x', `${event.clientX}px`);
  root.style.setProperty('--y', `${event.clientY}px`);
}, { passive: true });

document.querySelectorAll('.magnetic').forEach((el) => {
  el.addEventListener('pointermove', (event) => {
    if (prefersReducedMotion.matches) return;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
  });
  el.addEventListener('pointerleave', () => {
    el.style.transform = '';
  });
});

document.querySelectorAll('.tilt-card, .clarity-stage').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (window.matchMedia('(max-width: 900px)').matches || prefersReducedMotion.matches) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 6}deg) translateY(-4px)`;
  });
  card.addEventListener('pointerleave', () => {
    card.style.transform = '';
  });
});

document.querySelectorAll('[data-service-card]').forEach((card) => {
  const button = card.querySelector('button');
  const setActive = (active) => {
    card.classList.toggle('is-active', active);
    button?.setAttribute('aria-expanded', String(active));
  };
  button?.addEventListener('click', () => {
    setActive(!card.classList.contains('is-active'));
  });
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setActive(!card.classList.contains('is-active'));
  });
});

const score = document.querySelector('[data-score]');
const scoreMeter = document.querySelector('[data-score-meter]');
const message = document.querySelector('[data-planner-message]');
const plannerCard = document.querySelector('.planner-card');
const sliders = [...document.querySelectorAll('[data-slider]')];
const resetPlanner = document.querySelector('[data-reset-planner]');
const plannerDiscuss = document.querySelector('[data-planner-discuss]');
const defaults = { years: 12, confidence: 5, priorities: 4 };

const getPlannerValues = () => Object.fromEntries(sliders.map((slider) => [
  slider.dataset.slider,
  Number(slider.value)
]));

const updateScore = () => {
  const values = Object.fromEntries(sliders.map((slider) => {
    const valueOutput = document.querySelector(`[data-slider-value="${slider.dataset.slider}"]`);
    if (valueOutput) valueOutput.textContent = slider.value;
    return [slider.dataset.slider, Number(slider.value)];
  }));
  const yearsWeight = Math.max(0, 35 - values.years) * 0.7;
  const confidenceWeight = values.confidence * 6.8;
  const priorityDrag = Math.max(0, values.priorities - 3) * 5;
  const nextScore = Math.round(Math.min(96, Math.max(18, 42 + yearsWeight + confidenceWeight - priorityDrag)));

  if (score) score.textContent = nextScore;
  if (scoreMeter) scoreMeter.style.transform = `scaleX(${nextScore / 100})`;
  plannerCard?.classList.toggle('is-strong', nextScore >= 78);
  plannerCard?.classList.toggle('is-low', nextScore < 55);

  if (!message) return;
  if (nextScore >= 78) {
    message.textContent = 'Strong foundations - ongoing reviews can help keep the plan resilient as life changes.';
  } else if (nextScore >= 55) {
    message.textContent = 'Good foundations - a structured review could reveal where the plan needs tightening.';
  } else {
    message.textContent = 'There may be too many unknowns. A discovery call could help create a clearer direction.';
  }
};

sliders.forEach((slider) => slider.addEventListener('input', updateScore));
resetPlanner?.addEventListener('click', () => {
  sliders.forEach((slider) => {
    slider.value = defaults[slider.dataset.slider];
  });
  updateScore();
});
updateScore();

const form = document.querySelector('[data-contact-form]');
const formNote = document.querySelector('[data-form-note]');
const contactMessage = form?.querySelector('textarea[name="message"]');

plannerDiscuss?.addEventListener('click', (event) => {
  event.preventDefault();
  const values = getPlannerValues();
  const scoreValue = score?.textContent?.trim() || 'Not calculated';
  const plannerNote = message?.textContent?.trim() || '';
  if (contactMessage) {
    contactMessage.value = [
      'I would like to discuss my clarity score.',
      '',
      `Clarity score: ${scoreValue}`,
      `Years until retirement: ${values.years}`,
      `Confidence in current plan: ${values.confidence}/10`,
      `Number of financial priorities: ${values.priorities}`,
      '',
      plannerNote
    ].join('\n');
  }
  if (formNote) {
    formNote.textContent = 'Planner details added. Complete your contact details and send via WhatsApp.';
  }
  if (lenis) {
    lenis.scrollTo('#contact', { offset: navOffset });
  } else {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  window.setTimeout(() => {
    form?.querySelector('input[name="name"]')?.focus({ preventScroll: true });
  }, 650);
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const formData = new FormData(form);
  const enquiry = [
    'New Taylored Financial Advice enquiry',
    '',
    `Name: ${String(formData.get('name') || '').trim()}`,
    `Email: ${String(formData.get('email') || '').trim()}`,
    `Phone: ${String(formData.get('phone') || '').trim() || 'Not provided'}`,
    '',
    'Message:',
    String(formData.get('message') || '').trim()
  ].join('\n');
  const whatsappUrl = `https://wa.me/447775395662?text=${encodeURIComponent(enquiry)}`;
  if (formNote) {
    formNote.textContent = 'Opening WhatsApp with your enquiry. Please review it and press send.';
  }
  const whatsappWindow = window.open(whatsappUrl, '_blank');
  if (whatsappWindow) {
    whatsappWindow.opener = null;
  } else {
    window.location.href = whatsappUrl;
  }
  form.reset();
});
