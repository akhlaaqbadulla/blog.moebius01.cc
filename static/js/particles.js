/* Nebula — homepage particle background.
   Vanilla canvas, no dependencies, ~80 particles, mouse-attractive.
   Honours prefers-reduced-motion and Page Visibility API.            */
(() => {
  const canvas = document.querySelector('.nb-particles');
  if (!canvas) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d', { alpha: true });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, particles = [], raf = 0;
  const mouse = { x: -9999, y: -9999, active: false };

  // Auto-scale density to viewport area, clamped.
  const targetCount = () => {
    const a = Math.max(innerWidth * innerHeight, 1);
    return Math.max(28, Math.min(80, Math.floor(a / 22000)));
  };

  function resize() {
    w = innerWidth; h = innerHeight;
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    const n = targetCount();
    particles = [];
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 0.6 + Math.random() * 1.6,
        a: 0.35 + Math.random() * 0.55,
      });
    }
  }

  function step() {
    ctx.clearRect(0, 0, w, h);

    // physics
    for (const p of particles) {
      if (mouse.active) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 150 * 150) {
          const inv = 1 - Math.sqrt(d2) / 150;
          p.vx += dx * inv * 0.0006;
          p.vy += dy * inv * 0.0006;
        }
      }
      p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
    }

    // lines first
    ctx.lineWidth = 0.6;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 130 * 130) {
          const t = 1 - Math.sqrt(d2) / 130;
          ctx.strokeStyle = 'rgba(139, 92, 246, ' + (0.18 * t).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // dots on top
    for (const p of particles) {
      ctx.fillStyle = 'rgba(196, 181, 253, ' + p.a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(step);
  }

  function start() { if (!raf) raf = requestAnimationFrame(step); }
  function stop()  { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function staticRender() {
    // For reduced-motion: draw one frame, no animation loop.
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      ctx.fillStyle = 'rgba(196, 181, 253, ' + p.a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  resize();
  seed();

  if (reduceMotion) {
    staticRender();
  } else {
    addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }, { passive: true });
    addEventListener('mouseout', () => { mouse.active = false; });
    addEventListener('blur',  stop);
    addEventListener('focus', start);
    document.addEventListener('visibilitychange', () =>
      document.hidden ? stop() : start());
    start();
  }

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      seed();
      if (reduceMotion) staticRender();
    }, 120);
  });
})();
