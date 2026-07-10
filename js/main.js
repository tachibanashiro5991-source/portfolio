(function () {
  'use strict';

  var root = document.getElementById('root');
  var heroSection = document.querySelector('.hero');
  var canvas = document.getElementById('hero-canvas');
  var imgGarden = document.getElementById('img-garden');
  var heroContent = document.getElementById('hero-content');
  var heroGreet = document.getElementById('hero-greet');
  var heroName = document.getElementById('hero-name');
  var heroChars = [].slice.call(heroName.querySelectorAll('.hero__char'));
  var flash = document.getElementById('hero-flash');
  var maskIntro = document.getElementById('mask-intro');
  var maskCharm = document.getElementById('mask-charm');
  var paintRed = document.getElementById('paint-red');
  var sparkles = document.getElementById('sparkles');
  var switcher = document.getElementById('switcher');
  var replayBtn = document.getElementById('replay-btn');
  var stickyNav = document.getElementById('sticky-nav');
  var rippleCanvas = document.getElementById('ripple-canvas');
  var visitEl = document.getElementById('visit-count');

  var W = 0, H = 0, ctx = null;
  var ambient = [];
  var raf = null;
  var startTime = 0;
  var timers = [];
  var returning = false;

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function after(ms, fn) { var id = setTimeout(fn, ms); timers.push(id); return id; }

  function timeTheme() {
    var h = new Date().getHours();
    if (h >= 5 && h < 10) return { greet: 'Good morning', bg: 'radial-gradient(125% 135% at 50% 36%, #6c6774 0%, #524c58 52%, #45404a 100%)' };
    if (h >= 10 && h < 16) return { greet: 'Welcome', bg: 'radial-gradient(125% 135% at 50% 40%, #706a77 0%, #565059 52%, #46414b 100%)' };
    if (h >= 16 && h < 19) return { greet: 'Good evening', bg: 'radial-gradient(125% 135% at 50% 42%, #6e5a65 0%, #524a54 52%, #443e48 100%)' };
    return { greet: 'Good evening', bg: 'radial-gradient(125% 135% at 50% 40%, #514c58 0%, #45404a 52%, #39353e 100%)' };
  }

  // ---- ambient sparkle-dust field on the hero canvas ----
  function sizeCanvas() {
    var r = heroSection.getBoundingClientRect();
    W = r.width; H = r.height;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildAmbient() {
    ambient = [];
    var n = Math.min(Math.round((W * H) / 26000), 90);
    for (var i = 0; i < n; i++) {
      ambient.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 0.6, baseA: Math.random() * 0.22 + 0.07,
        ph: Math.random() * 6.28, tws: 0.4 + Math.random() * 0.8
      });
    }
  }

  function loop(now) {
    if (!ctx) { raf = requestAnimationFrame(loop); return; }
    var t = (now - startTime) / 1000;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < ambient.length; i++) {
      var p = ambient[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < -8) p.x = W + 8; if (p.x > W + 8) p.x = -8;
      if (p.y < -8) p.y = H + 8; if (p.y > H + 8) p.y = -8;
      var tw = 0.55 + 0.45 * Math.sin((t + p.ph) * p.tws);
      ctx.globalAlpha = p.baseA * tw;
      ctx.fillStyle = 'rgba(250,174,187,0.9)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(loop);
  }

  // ---- figures (img-garden clusters) ----
  function resetImgGarden() {
    [].forEach.call(imgGarden.querySelectorAll('[data-imgcluster]'), function (c) {
      var start = c.getAttribute('data-imgcluster') === 'R' ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)';
      c.style.transition = 'none';
      c.style.opacity = '0';
      c.style.clipPath = start; c.style.webkitClipPath = start;
      void c.offsetWidth; // force reflow so the next transition actually animates
    });
  }

  function bloomImgGarden() {
    [].forEach.call(imgGarden.querySelectorAll('[data-imgcluster]'), function (c) {
      c.style.transition = 'opacity 1.1s ease, clip-path 1.7s cubic-bezier(.2,.75,.2,1), -webkit-clip-path 1.7s cubic-bezier(.2,.75,.2,1)';
      after(30, function () {
        c.style.opacity = '1';
        c.style.clipPath = 'inset(0 0 0 0)'; c.style.webkitClipPath = 'inset(0 0 0 0)';
      });
    });
  }

  // ---- hero name reveal ----
  function resetHero() {
    heroContent.style.animation = 'none';
    heroContent.style.opacity = '0';
    heroGreet.style.animation = 'none'; heroGreet.style.opacity = '0';
    void heroContent.offsetWidth;
  }

  function playFlash() {
    flash.style.transition = 'none'; flash.style.opacity = '0'; void flash.offsetWidth;
    flash.style.transition = 'opacity .28s ease-out'; flash.style.opacity = '0.55';
    after(230, function () { flash.style.transition = 'opacity 1.2s ease'; flash.style.opacity = '0'; });
  }

  function applyNameSheen() {
    heroName.style.textShadow = 'none';
    heroName.style.animation = 'none';
  }

  function spawnBurst() {
    var layer = document.createElement('div');
    layer.className = 'name-burst-layer';
    var halo = document.createElement('div');
    halo.className = 'name-burst-halo';
    layer.appendChild(halo);
    var N = 18;
    for (var i = 0; i < N; i++) {
      var ang = (i / N) * Math.PI * 2 + Math.random() * 0.4;
      var dist = 120 + Math.random() * 150;
      var sz = 4 + Math.random() * 6;
      var s = document.createElement('span');
      s.className = 'name-burst-particle';
      var pink = Math.random() > 0.5;
      s.style.width = sz + 'px'; s.style.height = sz + 'px';
      s.style.background = pink ? '#FAAEBB' : '#fff6f8';
      s.style.boxShadow = '0 0 8px ' + (pink ? 'rgba(250,174,187,.9)' : 'rgba(255,255,255,.85)');
      s.style.setProperty('--bx', (Math.cos(ang) * dist).toFixed(0) + 'px');
      s.style.setProperty('--by', (Math.sin(ang) * dist).toFixed(0) + 'px');
      s.style.animation = 'burstOut ' + (0.85 + Math.random() * 0.5).toFixed(2) + 's cubic-bezier(.15,.7,.3,1) forwards';
      layer.appendChild(s);
    }
    heroName.insertAdjacentElement('beforebegin', layer);
    after(1600, function () { layer.remove(); });
  }

  function popName() {
    heroChars.forEach(function (c) { c.style.opacity = '0'; c.style.animation = 'none'; });
    void heroName.offsetWidth;
    heroChars.forEach(function (c, i) {
      c.style.animation = 'charPop .82s cubic-bezier(.2,.8,.3,1) ' + (i * 0.13) + 's both';
    });
    var total = heroChars.length * 0.13 + 0.5;
    after((total - 0.16) * 1000, function () { spawnBurst(); playFlash(); });
    after((heroChars.length * 0.13 + 0.92) * 1000, function () {
      heroChars.forEach(function (c) { c.style.animation = 'none'; c.style.opacity = '1'; c.style.transform = 'none'; c.style.filter = 'none'; });
    });
    after(total * 1000, function () {
      heroName.style.animation = 'nameGlow 1.4s ease-out forwards';
      after(1700, applyNameSheen);
    });
  }

  function revealHero(theme) {
    heroGreet.textContent = theme.greet;
    heroGreet.style.animation = 'none'; void heroGreet.offsetWidth;
    heroGreet.style.animation = 'greetFade 1s ease 0.3s forwards';
    popName();
    heroContent.style.opacity = '1';
    heroContent.style.animation = 'heroRise 1.3s cubic-bezier(.2,.7,.2,1) forwards';
    switcher.style.display = 'flex';
    switcher.style.transition = 'opacity .8s ease';
    switcher.style.opacity = '1';
  }

  // ---- splash intro: heart-lock charm knockout ----
  function playMaskIntro(theme) {
    var ov = maskIntro, red = paintRed, spark = sparkles;
    var w = W || window.innerWidth, h = H || window.innerHeight;
    var cx = w / 2, cy = h * 0.45;
    var size = Math.max(150, Math.min(Math.min(w, h) * 0.32, 250));
    var s = size / 100;
    // charm spans local y ~13..93 (centre ~53); centre it on cy independent of viewport scaling
    maskCharm.setAttribute('transform', 'translate(' + (cx - 50 * s) + ' ' + (cy - 53 * s) + ') scale(' + s + ')');
    var circleY = cy - 53 * s + 40 * s;

    ov.style.transition = 'none'; ov.style.opacity = '0'; ov.style.transform = 'scale(0.96)'; ov.style.display = 'block';
    red.style.transition = 'none'; red.style.opacity = '1';
    void ov.offsetWidth;

    ov.style.transition = 'opacity .5s ease, transform .8s cubic-bezier(.2,.7,.2,1)';
    ov.style.opacity = '1'; ov.style.transform = 'scale(1)';

    spark.innerHTML = '';
    var n = 22;
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * 6.283;
      var rad = size * (0.5 + Math.random() * 1.15);
      var sx = cx + Math.cos(ang) * rad;
      var sy = cy + Math.sin(ang) * rad * 0.92;
      var sz = 7 + Math.random() * 16;
      var el = document.createElement('div');
      el.className = 'sparkle';
      el.style.left = sx + 'px'; el.style.top = sy + 'px';
      el.style.width = sz + 'px'; el.style.height = sz + 'px';
      spark.appendChild(el);
      (function (el, delay, dur) {
        after(delay, function () { el.style.animation = 'sparkleTwinkle ' + dur + 'ms ease-out forwards'; });
      })(el, 260 + Math.random() * 900, 700 + Math.random() * 620);
    }

    var hold = returning ? 900 : 1350;
    after(hold, function () {
      var originPct = (circleY / h * 100).toFixed(1);
      ov.style.transformOrigin = '50% ' + originPct + '%';
      ov.style.transition = 'transform 2.2s cubic-bezier(.72,0,.28,1), filter 2.2s ease';
      ov.style.transform = 'scale(19)';
      ov.style.filter = 'blur(5px)';
      // pink clears almost immediately so the opening charm reveals the page, not a pink flash
      red.style.transition = 'opacity .3s ease'; red.style.opacity = '0';
      spark.style.transition = 'opacity .55s ease'; spark.style.opacity = '0';
      after(520, function () {
        revealHero(theme);
        after(700, bloomImgGarden);
      });
      after(2300, function () { ov.style.display = 'none'; ov.style.filter = 'none'; });
    });
  }

  function startSplash() {
    clearTimers();
    cancelAnimationFrame(raf);
    sizeCanvas();
    if (W < 2 || H < 2) { raf = requestAnimationFrame(startSplash); return; }
    var theme = timeTheme();
    heroSection.style.background = theme.bg;
    resetHero();
    flash.style.transition = 'none'; flash.style.opacity = '0';
    maskIntro.style.transition = 'none'; maskIntro.style.opacity = '0'; maskIntro.style.transform = 'scale(1)'; maskIntro.style.display = 'none';
    paintRed.style.transition = 'none'; paintRed.style.opacity = '0';
    sparkles.style.transition = 'none'; sparkles.style.opacity = '1'; sparkles.innerHTML = '';
    resetImgGarden();
    buildAmbient();
    startTime = performance.now();
    loop(performance.now());
    playMaskIntro(theme);
  }

  // ---- visit counter ----
  function setupVisitCounter() {
    var v = 1;
    try {
      v = parseInt(localStorage.getItem('shiro_visits') || '0', 10);
      v = (isNaN(v) ? 0 : v) + 1;
      localStorage.setItem('shiro_visits', String(v));
    } catch (e) {}
    returning = v > 1;
    if (visitEl) visitEl.textContent = v.toLocaleString();
  }

  // ---- mouse water-ripple trail ----
  function setupRipple() {
    var c = rippleCanvas; if (!c) return;
    var rctx, rW, rH;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      rW = window.innerWidth; rH = window.innerHeight;
      c.width = rW * dpr; c.height = rH * dpr;
      rctx = c.getContext('2d');
      rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    var ripples = [];
    var last = { x: -999, y: -999, t: 0 };
    window.addEventListener('mousemove', function (e) {
      var x = e.clientX, y = e.clientY, now = performance.now();
      var d = Math.hypot(x - last.x, y - last.y);
      if (d > 54 || now - last.t > 190) {
        ripples.push({ x: x, y: y, t: now, max: 42 + Math.random() * 34 });
        if (ripples.length > 36) ripples.shift();
        last = { x: x, y: y, t: now };
      }
    }, { passive: true });
    function tick() {
      if (rctx) {
        rctx.clearRect(0, 0, rW, rH);
        var now = performance.now(), dur = 1150;
        for (var i = 0; i < ripples.length; i++) {
          var r = ripples[i];
          var p = (now - r.t) / dur;
          if (p >= 1) { r.dead = true; continue; }
          var ease = 1 - Math.pow(1 - p, 2);
          var rad = r.max * ease;
          var a = 1 - p;
          rctx.beginPath(); rctx.arc(r.x, r.y, rad, 0, 6.283);
          rctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.2) + ')';
          rctx.lineWidth = 1.4; rctx.stroke();
        }
        ripples = ripples.filter(function (r) { return !r.dead; });
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  // ---- sticky nav + hero parallax exit on scroll ----
  function setupScrollEffects() {
    var pxOn = false;
    function onScroll() {
      var h = heroSection.offsetHeight || window.innerHeight;
      stickyNav.classList.toggle('is-visible', window.scrollY > h * 0.72);

      var sy = window.scrollY;
      if (sy > 6 && sy <= h * 1.3) {
        pxOn = true;
        var p = Math.min(sy / (h * 0.85), 1);
        if (heroContent.style.animation && heroContent.style.animation !== 'none') heroContent.style.animation = 'none';
        heroContent.style.transform = 'translateY(' + Math.round(sy * 0.34) + 'px)';
        heroContent.style.opacity = Math.max(0, 1 - p * 1.25).toFixed(3);
        imgGarden.style.transform = 'translateY(' + Math.round(sy * 0.18) + 'px)';
        imgGarden.style.opacity = Math.max(0, 1 - p).toFixed(3);
      } else if (pxOn && sy <= 6) {
        pxOn = false;
        heroContent.style.transform = ''; heroContent.style.opacity = '1';
        imgGarden.style.transform = ''; imgGarden.style.opacity = '';
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- subtle mouse parallax on the two figures ----
  function setupHeroParallax() {
    heroSection.addEventListener('mousemove', function (e) {
      var r = heroSection.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      var L = imgGarden.querySelector('[data-imgcluster="L"]');
      var R = imgGarden.querySelector('[data-imgcluster="R"]');
      if (L) L.style.transform = 'translate(' + (dx * 11) + 'px,' + (dy * 7) + 'px)';
      if (R) R.style.transform = 'translate(' + (-dx * 11) + 'px,' + (dy * 7) + 'px)';
    }, { passive: true });
  }

  // ---- fade-in sections as they scroll into view ----
  function setupSectionReveals() {
    if (typeof IntersectionObserver === 'undefined') return;
    var secs = ['#profile', '#gallery', '#sns', '#contact'].map(function (s) { return document.querySelector(s); }).filter(Boolean);
    var footer = document.querySelector('.footer'); if (footer) secs.push(footer);
    var targets = [];
    secs.forEach(function (sec) {
      [].forEach.call(sec.children, function (ch, i) {
        ch.style.opacity = '0';
        ch.style.transform = 'translateY(28px)';
        ch.style.transition = 'opacity .9s ease, transform 1s cubic-bezier(.2,.7,.2,1)';
        ch.dataset.revDelay = i * 0.1;
        targets.push(ch);
      });
    });
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (e.isIntersecting) {
          var el = e.target;
          setTimeout(function () { el.style.opacity = '1'; el.style.transform = 'none'; }, (parseFloat(el.dataset.revDelay) || 0) * 1000);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.16 });
    targets.forEach(function (t) { io.observe(t); });
  }

  // ---- lightbox: view a gallery piece full size ----
  function openLightbox(src, alt) {
    var ov = document.createElement('div');
    ov.className = 'lightbox';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', alt || '作品の拡大表示');

    var img = document.createElement('img');
    img.className = 'lightbox__img';
    img.src = src;
    img.alt = alt || '';
    img.draggable = false;

    var btn = document.createElement('button');
    btn.className = 'lightbox__close';
    btn.type = 'button';
    btn.setAttribute('aria-label', '閉じる');
    btn.textContent = '✕';

    ov.appendChild(img);
    ov.appendChild(btn);
    document.body.appendChild(ov);
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(function () { ov.classList.add('is-open'); }, 16);

    function close() {
      ov.classList.remove('is-open');
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { if (ov.parentNode) ov.remove(); }, 280);
    }
    function onKey(e) { if (e.key === 'Escape' || e.key === 'Esc') close(); }
    document.addEventListener('keydown', onKey);
    // closing on the backdrop (but not on the artwork itself) and on the ✕
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target === btn) close(); });
    btn.focus();
  }

  // ---- gallery: infinite drag/momentum carousel ----
  function setupGallery() {
    var cont = document.getElementById('gallery-scroll');
    var items = [].slice.call(document.querySelectorAll('[data-gitem]'));
    if (!cont || !items.length) return;
    var itemW = 0, total = 0, offset = 0, disp = 0, vel = 0, hover = false, down = null, dragging = false, lastX = 0;

    function renderAt(pos) {
      if (!total) return;
      for (var i = 0; i < items.length; i++) {
        var x = ((i * itemW + pos) % total + total) % total;
        if (x > total - itemW) x -= total;
        items[i].style.transform = 'translateX(' + x + 'px)';
      }
    }
    function layout() {
      itemW = items[0].offsetWidth || 280;
      total = itemW * items.length;
      renderAt(disp);
    }
    layout();
    window.addEventListener('resize', layout);

    function endDrag() {
      down = null;
      if (dragging) { dragging = false; cont.classList.remove('is-dragging'); }
    }

    // the browser's native image drag would steal the pointer and swallow pointerup,
    // leaving the carousel stuck to the cursor after the button is released
    cont.addEventListener('dragstart', function (e) { e.preventDefault(); });

    cont.addEventListener('pointerenter', function () { hover = true; });
    cont.addEventListener('pointerleave', function () { hover = false; });
    var pressPos = null;
    cont.addEventListener('pointerdown', function (e) {
      down = { x: e.clientX, start: offset };
      pressPos = { x: e.clientX, y: e.clientY };
      lastX = e.clientX;
      dragging = false;
      vel = 0;
    });

    // a click only counts as "open this piece" when the pointer barely moved —
    // otherwise it was a drag and opening the lightbox would be infuriating
    cont.addEventListener('click', function (e) {
      if (!pressPos) return;
      var moved = Math.abs(e.clientX - pressPos.x) + Math.abs(e.clientY - pressPos.y);
      pressPos = null;
      if (moved > 6) return;
      var card = e.target.closest && e.target.closest('.gallery-card');
      if (!card) return;
      var im = card.querySelector('img');
      if (im) openLightbox(im.getAttribute('src'), im.getAttribute('alt'));
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      // safety net: the button was released where we couldn't see it (outside the
      // window, or a native gesture ate the pointerup) — stop following the cursor
      if (e.pointerType === 'mouse' && e.buttons === 0) { endDrag(); return; }
      var dx = e.clientX - down.x;
      if (!dragging && Math.abs(dx) > 4) { dragging = true; cont.classList.add('is-dragging'); }
      if (dragging) {
        offset = down.start + dx;
        // low-pass filter the velocity so the release momentum is smooth, not jittery
        vel = vel * 0.6 + (e.clientX - lastX) * 0.4;
        lastX = e.clientX;
        e.preventDefault();
      }
    }, { passive: false });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    function tick() {
      if (!dragging) {
        if (Math.abs(vel) > 0.05) { offset += vel; vel *= 0.95; }
        else { vel = 0; if (!hover) offset -= 0.35; }
      }
      // ease the displayed position toward the target for a smooth, weighted glide
      disp += (offset - disp) * 0.16;
      renderAt(disp);
      requestAnimationFrame(tick);
    }
    tick();
  }

  // ---- contact form (mailto) ----
  function showThanks() {
    var sec = document.getElementById('contact');
    if (!sec) return;
    sec.style.position = 'relative';
    var ov = document.createElement('div'); ov.className = 'thanks-overlay';
    var bd = document.createElement('div'); bd.className = 'thanks-overlay__backdrop';
    var msg = document.createElement('div'); msg.className = 'thanks-overlay__msg';
    msg.innerHTML = '<div class="thanks-overlay__title">ありがとうございます</div><div class="thanks-overlay__sub">メール画面を開きました。そのまま送信してください。</div>';
    ov.appendChild(bd); ov.appendChild(msg);
    for (var i = 0; i < 16; i++) {
      var p = document.createElement('span');
      p.className = 'thanks-overlay__petal';
      var w = 9 + Math.random() * 8;
      p.style.left = (6 + Math.random() * 88) + '%';
      p.style.width = w + 'px'; p.style.height = (w * 1.9) + 'px';
      ov.appendChild(p);
      p.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
        { opacity: 0.9, offset: 0.12 },
        { opacity: 0.9, offset: 0.82 },
        { transform: 'translate(' + ((Math.random() - 0.5) * 170) + 'px,' + (340 + Math.random() * 280) + 'px) rotate(' + ((Math.random() - 0.5) * 420) + 'deg)', opacity: 0 }
      ], { duration: 2600 + Math.random() * 1400, delay: Math.random() * 500, easing: 'cubic-bezier(.3,.4,.6,1)' });
    }
    sec.appendChild(ov);
    bd.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, fill: 'forwards' });
    msg.animate([{ opacity: 0, transform: 'translate(-50%,-38%)' }, { opacity: 1, transform: 'translate(-50%,-50%)' }], { duration: 700, delay: 150, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' });
    setTimeout(function () {
      bd.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, fill: 'forwards' });
      msg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: 'forwards' });
      setTimeout(function () { ov.remove(); }, 760);
    }, 3400);
  }

  function setupContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    var reqBlock = form.querySelector('[data-request-fields]');
    var inqBlock = form.querySelector('[data-inquiry-fields]');
    var typeEls = form.querySelectorAll('input[name="c-type"]');
    var ENDPOINT = 'https://formspree.io/f/xkolepld';
    var submitBtn = form.querySelector('.contact-form__submit');

    function selectedType() {
      for (var i = 0; i < typeEls.length; i++) { if (typeEls[i].checked) return typeEls[i].value; }
      return 'inquiry';
    }
    function setDisabled(block, dis) {
      if (!block) return;
      var ctrls = block.querySelectorAll('input, select, textarea');
      for (var i = 0; i < ctrls.length; i++) { ctrls[i].disabled = dis; }
    }
    // show only the active block, and disable the hidden one so it isn't submitted
    function applyType() {
      var isReq = selectedType() === 'request';
      if (reqBlock) { reqBlock.hidden = !isReq; setDisabled(reqBlock, !isReq); }
      if (inqBlock) { inqBlock.hidden = isReq; setDisabled(inqBlock, isReq); }
    }
    for (var i = 0; i < typeEls.length; i++) { typeEls[i].addEventListener('change', applyType); }
    applyType();

    function setStatus(text, isError) {
      var el = form.querySelector('.contact-form__status');
      if (!el) { el = document.createElement('div'); el.className = 'contact-form__status'; form.appendChild(el); }
      el.textContent = text || '';
      el.classList.toggle('is-error', !!isError);
    }
    function resetForm() {
      form.reset();
      var def = form.querySelector('input[name="c-type"][value="request"]');
      if (def) def.checked = true;
      applyType();
    }

    // fields a request must carry. the selects start on "選択してください" so the
    // sender consciously picks 用途 / SNS公開 rather than silently accepting a default
    var REQUIRED_REQUEST = [
      { id: 'r-kind', label: '依頼の種類' },
      { id: 'r-use', label: '用途' },
      { id: 'r-sns', label: 'SNSでの実績公開' },
      { id: 'r-detail', label: '内容・ご希望' },
      { id: 'r-pay', label: 'お支払い方法' }
    ];
    function clearFlags() {
      var ctrls = form.querySelectorAll('input, select, textarea');
      for (var i = 0; i < ctrls.length; i++) { ctrls[i].style.borderColor = ''; }
    }
    function firstProblem(isReq) {
      var emailEl = document.getElementById('c-email');
      var email = emailEl ? emailEl.value.trim() : '';
      // without a reply address the enquiry is unanswerable, so this is non-negotiable
      if (!email) return { el: emailEl, msg: 'メールアドレスをご入力ください（ご返信に必要です）。' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { el: emailEl, msg: 'メールアドレスの形式をご確認ください。' };
      if (isReq) {
        for (var i = 0; i < REQUIRED_REQUEST.length; i++) {
          var el = document.getElementById(REQUIRED_REQUEST[i].id);
          if (el && !el.value.trim()) {
            var verb = el.tagName === 'SELECT' ? 'をお選びください。' : 'をご入力ください。';
            return { el: el, msg: '「' + REQUIRED_REQUEST[i].label + '」' + verb };
          }
        }
      } else {
        var msgEl = document.getElementById('c-msg');
        if (msgEl && !msgEl.value.trim()) return { el: msgEl, msg: 'メッセージをご入力ください。' };
      }
      return null;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('');
      clearFlags();
      var isReq = selectedType() === 'request';
      var typeLabel = isReq ? 'ご依頼' : 'お問い合わせ';

      var problem = firstProblem(isReq);
      if (problem) {
        if (problem.el) { problem.el.style.borderColor = '#FAAEBB'; problem.el.focus(); }
        setStatus(problem.msg, true);
        return;
      }

      // FormData(form) auto-collects every enabled named field, so each item
      // (依頼の種類・用途・納期…) arrives as its own line in the email
      var data = new FormData(form);
      data.delete('c-type');
      data.append('種別', typeLabel);
      data.append('_subject', '【' + typeLabel + '】立花しろ');

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '送信中…'; }
      fetch(ENDPOINT, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
        .then(function (res) {
          if (res.ok) { showThanks(); resetForm(); return; }
          return res.json().then(function (d) {
            setStatus((d && d.errors && d.errors[0] && d.errors[0].message) || '送信に失敗しました。時間をおいて再度お試しください。', true);
          });
        })
        .catch(function () {
          setStatus('送信に失敗しました。通信環境をご確認のうえ、もう一度お試しください。', true);
        })
        .then(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '送信'; }
        });
    });
  }

  function init() {
    setupVisitCounter();
    setupRipple();
    setupScrollEffects();
    setupHeroParallax();
    setupSectionReveals();
    setupGallery();
    setupContactForm();

    replayBtn.addEventListener('click', startSplash);

    // On resize, just re-fit the hero canvas + ambient field to the new size.
    // We deliberately do NOT replay the whole intro here: replaying on every resize
    // step made the splash restart repeatedly (flicker) while dragging the window edge.
    // Manual replay is still available via the "もう一度" button.
    // (width-only guard also skips the height-only resize mobile browsers fire when the
    // URL bar collapses on scroll.)
    var resizeTimer;
    var lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        sizeCanvas();
        buildAmbient();
      }, 200);
    });

    var started = false;
    function go() { if (started) return; started = true; startSplash(); }
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); }
    setTimeout(go, 1300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
