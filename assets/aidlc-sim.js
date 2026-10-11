/* Shared behaviour for the AIDLC simulators.
   Steps are <section class="step-panel" data-title=".." data-sub=".." data-section="..">.
   The sidebar, progress bar and Back/Next rows are generated from them. */
(function () {
  const panels = Array.from(document.querySelectorAll('.step-panel'));
  const nav = document.getElementById('steps-nav');
  const bar = document.getElementById('progress');
  const label = document.getElementById('progress-label');
  let current = 0;

  if (nav && panels.length) {
    let lastSection = null;
    panels.forEach((p, i) => {
      const sec = p.dataset.section;
      if (sec && sec !== lastSection) {
        const h = document.createElement('div');
        h.className = 'sidebar-section';
        h.textContent = sec;
        nav.appendChild(h);
        lastSection = sec;
      }
      const b = document.createElement('button');
      b.className = 'step-item';
      b.type = 'button';
      b.innerHTML = '<span class="step-num">' + (i + 1) + '</span><span><span class="step-label"></span>' +
        (p.dataset.sub ? '<span class="step-sublabel"></span>' : '') + '</span>';
      b.querySelector('.step-label').textContent = p.dataset.title || ('Step ' + (i + 1));
      if (p.dataset.sub) b.querySelector('.step-sublabel').textContent = p.dataset.sub;
      b.addEventListener('click', () => goTo(i));
      nav.appendChild(b);

      const row = document.createElement('div');
      row.className = 'nav-row';
      const back = document.createElement('button');
      back.className = 'btn btn-secondary';
      back.textContent = '← Back';
      back.disabled = i === 0;
      back.addEventListener('click', () => goTo(i - 1));
      const ctr = document.createElement('span');
      ctr.className = 'step-counter';
      ctr.textContent = 'Step ' + (i + 1) + ' of ' + panels.length;
      const next = document.createElement('button');
      next.className = 'btn btn-primary';
      if (i < panels.length - 1) {
        next.textContent = 'Next: ' + (panels[i + 1].dataset.title || 'continue') + ' →';
        next.addEventListener('click', () => goTo(i + 1));
      } else {
        next.textContent = '↩ Restart';
        next.style.background = 'var(--teal)';
        next.addEventListener('click', () => goTo(0));
      }
      row.append(back, ctr, next);
      p.appendChild(row);
    });
  }

  function goTo(n) {
    if (n < 0 || n >= panels.length) return;
    const items = nav ? nav.querySelectorAll('.step-item') : [];
    panels[current].classList.remove('active');
    if (items[current]) {
      items[current].classList.remove('active');
      if (n > current) items[current].classList.add('done');
    }
    current = n;
    panels[current].classList.add('active');
    if (items[current]) {
      items[current].classList.add('active');
      items[current].classList.remove('done');
      items[current].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    const pct = panels.length > 1 ? Math.round((current / (panels.length - 1)) * 100) : 100;
    if (bar) bar.style.width = pct + '%';
    if (label) label.textContent = 'Step ' + (current + 1) + ' / ' + panels.length;
    try { history.replaceState(null, '', '#step-' + (current + 1)); } catch (e) {}
    const top = document.querySelector('.main-area');
    if (top && window.scrollY > top.offsetTop) window.scrollTo({ top: top.offsetTop, behavior: 'smooth' });
  }
  window.simGoTo = goTo;

  if (panels.length) {
    const m = /#step-(\d+)/.exec(location.hash);
    const start = m ? Math.min(Math.max(parseInt(m[1], 10) - 1, 0), panels.length - 1) : 0;
    panels.forEach(p => p.classList.remove('active'));
    panels[0].classList.add('active');
    const items = nav ? nav.querySelectorAll('.step-item') : [];
    if (items[0]) items[0].classList.add('active');
    if (start) goTo(start); else goTo(0);
  }

  document.addEventListener('keydown', e => {
    if (!panels.length) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (e.key === 'ArrowRight') goTo(current + 1);
    if (e.key === 'ArrowLeft') goTo(current - 1);
  });

  /* Tabs: <div data-tabs> with .tab-btn[data-tab] and .tab-pane[data-pane] inside. */
  document.querySelectorAll('[data-tabs]').forEach(group => {
    const btns = group.querySelectorAll('.tab-btn');
    const panes = group.querySelectorAll('.tab-pane');
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.classList.toggle('on', x === b));
      panes.forEach(p => p.classList.toggle('on', p.dataset.pane === b.dataset.tab));
    }));
  });

  /* Typed terminals: .terminal.typer with a .run-btn; lines (.l) appear one by one. */
  document.querySelectorAll('.terminal.typer').forEach(term => {
    const btn = term.querySelector('.run-btn');
    const lines = term.querySelectorAll('.l');
    if (!btn) { lines.forEach(l => l.classList.add('shown')); return; }
    btn.addEventListener('click', () => {
      lines.forEach(l => l.classList.remove('shown'));
      btn.disabled = true;
      let i = 0;
      const tick = () => {
        if (i >= lines.length) { btn.disabled = false; btn.textContent = '↻ Replay'; return; }
        lines[i].classList.add('shown');
        const slow = lines[i].dataset.wait ? parseInt(lines[i].dataset.wait, 10) : 140;
        i++;
        setTimeout(tick, slow);
      };
      tick();
    });
  });

  /* Step-through chats: .chat.reveal — messages appear on "Next message". */
  document.querySelectorAll('.chat.reveal').forEach(chat => {
    const msgs = chat.querySelectorAll('.msg');
    let shown = 0;
    const ctl = document.createElement('div');
    ctl.className = 'reveal-ctl';
    const next = document.createElement('button');
    next.className = 'btn btn-secondary btn-small';
    const all = document.createElement('button');
    all.className = 'btn btn-secondary btn-small';
    all.textContent = 'Show all';
    const count = document.createElement('span');
    count.className = 'count';
    const update = () => {
      msgs.forEach((m, i) => m.classList.toggle('shown', i < shown));
      count.textContent = shown + ' / ' + msgs.length;
      next.textContent = shown >= msgs.length ? '↻ Replay' : 'Next message ▸';
    };
    next.addEventListener('click', () => { shown = shown >= msgs.length ? 1 : shown + 1; update(); });
    all.addEventListener('click', () => { shown = msgs.length; update(); });
    ctl.append(next, all, count);
    chat.appendChild(ctl);
    shown = 1;
    update();
  });
})();
