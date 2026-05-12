/* Nebula — Portfolio v2 interactive layer.
   Filter chips, scroll-spy TOC, stat counters, copy-email,
   reveal-on-scroll, skill↔role hover linking. No dependencies. */
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- 1. Filter chips ----- */
  const chips = document.querySelectorAll('.nb-chip');
  function setFilter(value) {
    document.body.dataset.filter = value;
    chips.forEach((c) => {
      const active = c.dataset.filter === value;
      c.classList.toggle('is-active', active);
      c.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  chips.forEach((c) => {
    c.addEventListener('click', () => setFilter(c.dataset.filter));
  });
  // initial state
  if (!document.body.dataset.filter) setFilter('all');

  /* ----- 2. Stat counters ----- */
  const counters = document.querySelectorAll('[data-counter]');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.counter, 10);
    const suffix = el.dataset.suffix || '';
    if (reduceMotion || target <= 0) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 900;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target);
          counterObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => counterObs.observe(el));
  } else {
    counters.forEach(animateCount);
  }

  /* ----- 3. Reveal on scroll ----- */
  const revealEls = document.querySelectorAll('.nb-reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => revealObs.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-revealed'));
  }

  /* ----- 4. Scroll-spy TOC ----- */
  const tocLinks = document.querySelectorAll('.nb-cv__sidebar a[href^="#"]');
  const sectionMap = new Map();
  tocLinks.forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    const sec = document.getElementById(id);
    if (sec) sectionMap.set(sec, a);
  });
  if ('IntersectionObserver' in window && sectionMap.size) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const link = sectionMap.get(e.target);
        if (!link) return;
        if (e.isIntersecting) {
          tocLinks.forEach((l) => {
            l.classList.remove('is-active');
            l.removeAttribute('aria-current');
          });
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'location');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sectionMap.forEach((_, sec) => spy.observe(sec));
  }

  /* ----- 5. Copy-email button ----- */
  const copyBtn = document.querySelector('.nb-copy-btn');
  const toast = document.querySelector('.nb-toast');
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    toast.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => { toast.hidden = true; }, 200);
    }, 1600);
  }
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email;
      if (!email) return;
      try {
        await navigator.clipboard.writeText(email);
        showToast('Email copied');
      } catch {
        // Fallback: select + execCommand
        const ta = document.createElement('textarea');
        ta.value = email; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showToast('Email copied'); }
        catch { showToast('Copy failed'); }
        ta.remove();
      }
    });
  }

  /* ----- 6. Skill ↔ role hover linking ----- */
  const skills = document.querySelectorAll('.nb-skill[data-skill-tags]');
  skills.forEach((s) => {
    const tags = s.dataset.skillTags.split(/\s+/);
    s.addEventListener('mouseenter', () => {
      tags.forEach((tag) => {
        document.querySelectorAll('.nb-timeline__item[data-skills~="' + tag + '"]').forEach((item) => {
          item.classList.add('is-pulsed');
        });
      });
    });
    s.addEventListener('mouseleave', () => {
      document.querySelectorAll('.nb-timeline__item.is-pulsed').forEach((item) => {
        item.classList.remove('is-pulsed');
      });
    });
  });

  /* ----- 7. Keyboard: '?' focuses chip bar ----- */
  document.addEventListener('keydown', (e) => {
    if (e.key === '?' && !e.target.matches('input, textarea, [contenteditable]')) {
      const first = document.querySelector('.nb-chip');
      if (first) first.focus();
    }
  });

  /* ----- 8. Print hooks: expand all, reset filter ----- */
  let prevFilter = null;
  const printables = document.querySelectorAll('.nb-role');
  function beforePrint() {
    prevFilter = document.body.dataset.filter;
    setFilter('all');
    printables.forEach((d) => {
      d.dataset.wasOpen = d.open ? '1' : '0';
      d.open = true;
    });
  }
  function afterPrint() {
    if (prevFilter) setFilter(prevFilter);
    printables.forEach((d) => {
      d.open = d.dataset.wasOpen === '1';
      delete d.dataset.wasOpen;
    });
  }
  if ('matchMedia' in window) {
    const mql = matchMedia('print');
    if (mql.addEventListener) {
      mql.addEventListener('change', (e) => e.matches ? beforePrint() : afterPrint());
    }
  }
  addEventListener('beforeprint', beforePrint);
  addEventListener('afterprint',  afterPrint);
})();
