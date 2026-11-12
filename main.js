/* Wiseandfit · site scripts */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';

  // Footer year
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // Nav
  const nav = $('[data-nav]');
  const burger = $('[data-burger]');
  const mmenu = $('[data-mmenu]');
  let lastY = scrollY;

  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('is-solid', y > 40);
    const goingDown = y > lastY && y > innerHeight * 0.6;
    nav.classList.toggle('is-hidden', goingDown && burger.getAttribute('aria-expanded') !== 'true');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    mmenu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) nav.classList.remove('is-hidden');
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mmenu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Active section link
  const links = $$('.nav__links a');
  const secObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => secObs.observe(s));

  // Reveal on scroll
  const revObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const sibs = $$('.reveal', el.parentElement);
      el.style.transitionDelay = Math.min(sibs.indexOf(el), 5) * 0.08 + 's';
      el.classList.add('is-in');
      revObs.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.reveal').forEach((el) => revObs.observe(el));

  // Hero
  if (!hasGSAP || reduce) {
    document.documentElement.classList.add('no-motion');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const hero = $('[data-hero]');
  const box = $('[data-scenebox]');
  const L = (n) => $(`[data-layer="${n}"]`);
  const bg = L('bg'), hazeFar = L('haze'), shadow = L('shadow'), torii = L('torii'), wash = L('wash'), foot = L('foot'), path = L('path'), pathWash = L('pathwash');
  const cloudL = $('[data-cloud="l"]'), cloudR = $('[data-cloud="r"]');
  const fade = $('[data-fade]');
  const copy = $('[data-herocopy]');
  const quote = $('[data-heroquote]');
  const cue = $('[data-cue]');
  const lines = $$('.hero__title .line > span');
  const eyebrow = $('.hero .eyebrow');

  // Zoom origin: opening between the gate posts (% of artwork)
  const GATE = '48.9% 66%';
  const GATE_FOOT = '48.9% 69%';

  // Intro: clouds part
  gsap.set([cloudL, cloudR], { scale: 1.12 });
  gsap.set(cloudL, { xPercent: 12 });
  gsap.set(cloudR, { xPercent: -12 });
  gsap.set(box, { scale: 1.06 });

  const heroImgs = $$('img', hero);
  const ready = Promise.race([
    Promise.all(heroImgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

  ready.then(() => {
    const intro = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
    intro
      .to(cloudL, { xPercent: -30, scale: 1.2, duration: 2.8 }, 0.15)
      .to(cloudR, { xPercent: 30, scale: 1.2, duration: 2.8 }, 0.15)
      .to(box, { scale: 1, duration: 3.2, ease: 'power2.out' }, 0)
      .to(eyebrow, { opacity: 1, duration: 1, ease: 'power2.out' }, 1.6)
      .to(lines, { y: 0, duration: 1.3, stagger: 0.12, ease: 'expo.out' }, 1.7)
      .to(cue, { opacity: 1, duration: 0.8 }, 2.2)
      .eventCallback('onComplete', buildScroll);
  });

  // Pointer parallax
  if (finePointer) {
    const movers = [bg, hazeFar, shadow, torii, wash, foot, path, pathWash, cloudL, cloudR].map((el) => ({
      d: parseFloat(el.dataset.depth || 0.5),
      x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3.out' }),
    }));
    const tiltX = gsap.quickTo(box, 'rotationX', { duration: 1.4, ease: 'power3.out' });
    const tiltY = gsap.quickTo(box, 'rotationY', { duration: 1.4, ease: 'power3.out' });

    hero.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = (e.clientY / innerHeight) * 2 - 1;
      movers.forEach((m) => { m.x(-nx * m.d * 22); m.y(-ny * m.d * 12); });
      tiltY(nx * 2.2);
      tiltX(-ny * 1.4);
    });
    hero.addEventListener('pointerleave', () => {
      movers.forEach((m) => { m.x(0); m.y(0); });
      tiltX(0); tiltY(0);
    });
  } else if (window.DeviceOrientationEvent && !('requestPermission' in DeviceOrientationEvent)) {
    // Device tilt (Android)
    const movers = [bg, torii, wash, path, pathWash, cloudL, cloudR].map((el) => ({
      d: parseFloat(el.dataset.depth || 0.5),
      x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3.out' }),
    }));
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      const nx = gsap.utils.clamp(-1, 1, e.gamma / 30);
      movers.forEach((m) => m.x(-nx * m.d * 14));
    });
  }

  // Scroll: walk up the path through the gate
  let built = false;
  function buildScroll() {
    if (built) return;
    built = true;

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 1.1 },
    });

    tl
      .to(copy, { opacity: 0, y: -40, duration: 0.18 }, 0)
      .fromTo(cue, { opacity: 1 }, { opacity: 0, duration: 0.06 }, 0)
      .to(cloudL, { xPercent: -80, opacity: 0, duration: 0.35 }, 0)
      .to(cloudR, { xPercent: 80, opacity: 0, duration: 0.35 }, 0)
      .to([bg, hazeFar], { scale: 1.45, transformOrigin: GATE, duration: 1 }, 0)
      .to([torii, wash, shadow, foot], { scale: 6.5, transformOrigin: GATE, duration: 0.9, ease: 'power2.in' }, 0.1)
      .to([path, pathWash], { scale: 4.2, yPercent: 8, transformOrigin: GATE_FOOT, duration: 0.85, ease: 'power1.in' }, 0.05)
      .to([path, pathWash], { opacity: 0, duration: 0.2 }, 0.6)
      .fromTo(quote, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.12 }, 0.2)
      .to(quote, { opacity: 0, y: -30, duration: 0.1 }, 0.46)
      .to([torii, wash], { opacity: 0, duration: 0.16 }, 0.74)
      .to(fade, { opacity: 1, duration: 0.2 }, 0.72);
  }

  // Fallback if the intro never completes
  setTimeout(buildScroll, 4000);

  addEventListener('load', () => ScrollTrigger.refresh());
})();
