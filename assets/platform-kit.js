/* Widgets for the AI platform onboarding tracks. Load after aidlc-sim.js. */
(function () {
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  /* Quizzes: clicking an option locks the question, marks it and shows .why. */
  document.querySelectorAll('.quiz').forEach(quiz => {
    const qs = quiz.querySelectorAll('.q');
    let score = 0, answered = 0;
    const out = document.createElement('div');
    out.className = 'quiz-score';
    const paint = () => {
      out.textContent = 'Score: ' + score + ' / ' + answered + ' answered (' + qs.length + ' questions)' +
        (answered === qs.length ? (score >= Math.ceil(qs.length * 0.8) ? ' · ✅ Pass' : ' · Review the module and try again') : '');
    };
    qs.forEach(q => {
      if (q.dataset.why && !q.querySelector('.why')) {
        const w = document.createElement('div');
        w.className = 'why';
        w.textContent = q.dataset.why;
        q.appendChild(w);
      }
      const opts = q.querySelectorAll('.qo');
      opts.forEach(o => o.addEventListener('click', () => {
        if (q.classList.contains('done')) return;
        q.classList.add('done');
        answered++;
        if (o.hasAttribute('data-ok')) score++;
        opts.forEach(x => {
          x.disabled = true;
          if (x.hasAttribute('data-ok')) x.classList.add('right');
          else if (x === o) x.classList.add('wrong');
        });
        paint();
      }));
    });
    const reset = document.createElement('button');
    reset.className = 'btn btn-secondary btn-small';
    reset.textContent = '↻ Reset quiz';
    reset.style.marginTop = '6px';
    reset.addEventListener('click', () => {
      score = 0; answered = 0;
      qs.forEach(q => {
        q.classList.remove('done');
        q.querySelectorAll('.qo').forEach(x => { x.disabled = false; x.classList.remove('right', 'wrong'); });
      });
      paint();
    });
    quiz.append(out, reset);
    paint();
  });

  /* Checklists that remember progress per viewer (browser storage only). */
  document.querySelectorAll('.track').forEach(list => {
    const key = 'pk-track:' + (list.dataset.key || location.pathname);
    const items = Array.from(list.querySelectorAll('li'));
    const saved = store(key) || [];
    const meter = list.dataset.meter ? document.getElementById(list.dataset.meter) : null;
    const paint = () => {
      const n = items.filter(li => li.classList.contains('ok')).length;
      if (meter) meter.textContent = n + ' / ' + items.length + ' done';
    };
    items.forEach((li, i) => {
      const box = document.createElement('span');
      box.className = 'box';
      li.prepend(box);
      if (saved[i]) { li.classList.add('ok'); box.textContent = '✓'; }
      li.setAttribute('role', 'checkbox');
      li.tabIndex = 0;
      const toggle = () => {
        const on = !li.classList.contains('ok');
        li.classList.toggle('ok', on);
        box.textContent = on ? '✓' : '';
        li.setAttribute('aria-checked', on ? 'true' : 'false');
        store(key, items.map(x => x.classList.contains('ok')));
        paint();
      };
      li.addEventListener('click', toggle);
      li.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
    });
    paint();
  });
})();
