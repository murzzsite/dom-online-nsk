const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/NQS9YG9M5E';

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rub = n => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';

  // year
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  // page load
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-loaded')));

  // ===== header, progress, burger =====
  const header = $('#header'), progress = $('#progress');
  const burger = $('#burger'), nav = $('#nav');
  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('is-open'); nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', false);
  }));

  // ===== facade of windows =====
  const svg = $('#facadeSvg');
  const NS = 'http://www.w3.org/2000/svg';
  const wins = [];
  if (svg) {
    const mk = (tag, attrs, parent = svg) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      parent.appendChild(el); return el;
    };
    const towers = [
      { x: 18, y: 130, w: 156, h: 418, cls: 'tower', cols: 5, rows: 15 },
      { x: 186, y: 230, w: 124, h: 318, cls: 'tower tower--b', cols: 4, rows: 11 },
      { x: 322, y: 320, w: 100, h: 228, cls: 'tower tower--c', cols: 3, rows: 8 },
    ];
    towers.forEach(t => {
      mk('rect', { x: t.x, y: t.y, width: t.w, height: t.h, class: t.cls });
      const padX = 12, padY = 14, gap = 8;
      const ww = (t.w - padX * 2 - gap * (t.cols - 1)) / t.cols;
      const wh = (t.h - padY * 2 - gap * (t.rows - 1)) / t.rows;
      for (let r = 0; r < t.rows; r++) for (let c = 0; c < t.cols; c++) {
        const cx = t.x + padX + c * (ww + gap) + ww / 2, cy = t.y + padY + r * (wh + gap) + wh / 2;
        const el = mk('rect', { x: cx - ww / 2, y: cy - wh / 2, width: ww, height: wh, class: 'win' });
        wins.push({ el, cx, cy, on: false });
      }
    });
    mk('rect', { x: 0, y: 548, width: 440, height: 12, class: 'ground' });

    const set = (w, on) => { if (w.on !== on) { w.on = on; w.el.classList.toggle('is-on', on); } };
    // initial sequence: lights come on one by one
    const order = wins.map((w, i) => i).sort(() => Math.random() - 0.5);
    const target = Math.round(wins.length * 0.38);
    if (reduce) order.slice(0, target).forEach(i => set(wins[i], true));
    else order.slice(0, target).forEach((i, k) => setTimeout(() => set(wins[i], true), 700 + k * 45));

    // slow life: one window flips now and then
    if (!reduce) setInterval(() => {
      if (document.hidden) return;
      const w = wins[(Math.random() * wins.length) | 0]; set(w, !w.on);
    }, 900);

    // cursor lights windows nearby
    const lightAt = (clientX, clientY) => {
      const r = svg.getBoundingClientRect();
      const scale = Math.min(r.width / 440, r.height / 560);
      const ox = r.left + (r.width - 440 * scale) / 2, oy = r.top + (r.height - 560 * scale);
      const px = (clientX - ox) / scale, py = (clientY - oy) / scale;
      wins.forEach(w => { if (Math.hypot(w.cx - px, w.cy - py) < 34) set(w, true); });
    };
    svg.addEventListener('pointermove', e => lightAt(e.clientX, e.clientY));
    svg.addEventListener('pointerdown', e => lightAt(e.clientX, e.clientY));
  }

  // ===== counters =====
  const fmt = (v, dec) => v.toFixed(dec).replace('.', ',');
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; countIO.unobserve(el);
    const to = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || '0', 10);
    if (reduce || to === 0) { el.textContent = fmt(to, dec); return; }
    const dur = 1400, t0 = performance.now();
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 4)), dec);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.5 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  // ===== calculator =====
  const price = $('#price'), down = $('#down'), term = $('#term'), mkt = $('#mkt');
  const OUR_RATE = 0.5;
  const pay = (sum, rate, years) => {
    const n = years * 12, i = rate / 100 / 12;
    return i === 0 ? sum / n : sum * i / (1 - Math.pow(1 + i, -n));
  };
  let calcSummary = '';
  const paintRange = el => el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100) + '%');
  const calc = () => {
    [price, down, term, mkt].forEach(paintRange);
    const p = +price.value, dp = +down.value, y = +term.value, m = +mkt.value;
    const loan = p * (1 - dp / 100);
    $('#oPrice').textContent = rub(p);
    $('#oDown').textContent = dp === 0 ? 'без взноса' : dp + '% · ' + rub(p * dp / 100);
    $('#oTerm').textContent = y + ' ' + (y % 10 === 1 && y !== 11 ? 'год' : (y % 10 >= 2 && y % 10 <= 4 && (y < 12 || y > 14)) ? 'года' : 'лет');
    $('#oMkt').textContent = String(m).replace('.', ',') + '%';
    const our = pay(loan, OUR_RATE, y), other = pay(loan, m, y);
    $('#rOur').textContent = rub(our) + '/мес';
    $('#rMkt').textContent = rub(other) + '/мес';
    $('#rOver').textContent = 'Переплата за весь срок: ' + rub(our * y * 12 - loan);
    $('#rSave').textContent = 'Экономия: ' + rub(Math.max(0, other - our)) + ' в месяц';
    calcSummary = `Калькулятор: цена ${rub(p)}, взнос ${dp}%, срок ${y} л., платёж по программе 0,5% — ${rub(our)}/мес`;
  };
  [price, down, term, mkt].forEach(el => el?.addEventListener('input', calc));
  if (price) calc();
  $('#calcCta')?.addEventListener('click', () => { $('#calcField').value = calcSummary; });

  // ===== fears tabs =====
  const tabs = $$('.fears__tabs [role=tab]');
  const pick = i => tabs.forEach((t, k) => {
    const on = k === i;
    t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on);
    const panel = $('#' + t.getAttribute('aria-controls')); if (panel) { panel.hidden = !on; panel.classList.toggle('is-active', on); }
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(i));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const n = (i + (e.key === 'ArrowDown' ? 1 : tabs.length - 1)) % tabs.length; pick(n); tabs[n].focus();
    });
  });

  // ===== reviews: drag to scroll =====
  const track = $('#rvTrack');
  if (track) {
    let down0 = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down0 = true; moved = false; sx = e.clientX; sl = track.scrollLeft; });
    window.addEventListener('pointermove', e => {
      if (!down0) return;
      const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; track.classList.add('is-drag'); }
      track.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', () => { if (!down0) return; down0 = false; track.classList.remove('is-drag'); });
    track.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') track.scrollBy({ left: 360, behavior: 'smooth' });
      if (e.key === 'ArrowLeft') track.scrollBy({ left: -360, behavior: 'smooth' });
    });
  }

  // ===== reveal on scroll (selectors listed explicitly) =====
  const targets = $$('.h2, .hero + .terms .h2, .lead, .term, .terms__note, .calc__panel, .fears__tabs, .fears__panels, .who__list li, .srv, .road__steps li, .about__photo, .about__list li, .about__links, .rv, .faq__item, .form, .contact__list li, .facts > div');
  const seen = new Set();
  targets.filter(el => !seen.has(el) && seen.add(el)).forEach(el => {
    const sibs = el.parentElement ? [...el.parentElement.children] : [];
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 5) * 80 + 'ms');
    el.classList.add('reveal');
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    el.classList.add('is-visible');
    setTimeout(() => el.classList.remove('reveal', 'is-visible'), 1300);
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  // ===== scroll-linked: progress, road, portrait parallax =====
  const road = $('#road'), roadFill = $('#roadFill'), steps = $$('.road__steps li');
  const photo = $('.about__photo img');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;
    header?.classList.toggle('scrolled', y > 8);
    const max = document.documentElement.scrollHeight - vh;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
    if (road && roadFill) {
      const r = road.getBoundingClientRect();
      roadFill.style.transform = `scaleY(${reduce ? 1 : clamp((vh * 0.65 - r.top) / r.height, 0, 1)})`;
      steps.forEach(li => li.classList.toggle('is-passed', reduce || li.getBoundingClientRect().top < vh * 0.65));
    }
    if (photo && !reduce) {
      const r = photo.parentElement.getBoundingClientRect();
      const k = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
      photo.style.transform = `translateY(${k * -18}px) scale(1.1)`;
    }
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // ===== magnetic button =====
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  // ===== smooth anchor offset =====
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    const t = $(href); if (!t) return;
    e.preventDefault();
    const top = t.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));

  // ===== phone mask =====
  $$('input[type="tel"]').forEach(input => input.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.startsWith('8')) v = '7' + v.slice(1);
    if (!v.startsWith('7')) v = '7' + v;
    v = v.slice(0, 11);
    let out = '+7';
    if (v.length > 1) out += ' (' + v.slice(1, 4);
    if (v.length >= 4) out += ') ' + v.slice(4, 7);
    if (v.length >= 7) out += '-' + v.slice(7, 9);
    if (v.length >= 9) out += '-' + v.slice(9, 11);
    e.target.value = out;
  }));

  // ===== form -> worker -> telegram =====
  const form = $('#leadForm'), status = $('#formStatus');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.querySelector('span');
    const orig = label.textContent;
    const payload = {};
    new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    const phoneOk = (payload.phone || '').replace(/\D/g, '').length === 11;
    form.querySelectorAll('input[name=name], input[name=phone]').forEach(i => i.classList.remove('is-bad'));
    if (!payload.name?.trim()) { form.elements.name.classList.add('is-bad'); status.textContent = 'Укажите имя'; return; }
    if (!phoneOk) { form.elements.phone.classList.add('is-bad'); status.textContent = 'Проверьте номер телефона'; return; }
    if (!form.elements.agree.checked) { status.textContent = 'Нужно согласие на обработку данных'; return; }
    delete payload.agree;
    payload.comment = [payload.interest, payload.calc].filter(Boolean).join('. ');
    btn.disabled = true; label.textContent = 'Отправляем…'; status.textContent = '';
    try {
      const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      label.textContent = 'Заявка отправлена';
      status.textContent = 'Спасибо! Свяжемся с вами в ближайшее время.';
      form.reset(); $('#calcField').value = '';
    } catch (err) {
      console.error(err);
      label.textContent = 'Не отправилось';
      status.textContent = 'Не удалось отправить. Позвоните нам: +7 913 009-66-39';
    } finally {
      setTimeout(() => { label.textContent = orig; btn.disabled = false; }, 3500);
    }
  });
})();
