// Chore chart maker: builds a printable weekly or monthly chart from a
// child's name and a list of chores. Everything stays in the browser. The
// last chart is remembered in localStorage on this device only; the name
// and chore text are never sent anywhere, including analytics.
(function () {
  var SUGGEST = JSON.parse(document.getElementById('cm-data').textContent);
  var STORE_KEY = 'pocketpiggy.chartMaker.v1';
  var MAX = 15;
  var PAGE = { letter: { w: '8.5in', h: '11in', hIn: 11, wIn: 8.5 }, a4: { w: '210mm', h: '297mm', hIn: 11.69, wIn: 8.27 } };
  var WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  var $ = function (id) { return document.getElementById(id); };
  var form = { name: $('cm-name'), age: $('cm-age'), list: $('cm-chores'), add: $('cm-new'), addBtn: $('cm-add'),
               count: $('cm-count'), limit: $('cm-limit'), print: $('cm-print') };
  var preview = $('cm-preview'), printRoot = $('print-root');
  var pageStyle = document.createElement('style');
  document.head.appendChild(pageStyle);

  var state = load() || { name: '', age: form.age.value, chores: SUGGEST[form.age.value].top.slice(), layout: 'weekly', paper: 'letter' };

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && SUGGEST[s.age] && Array.isArray(s.chores)) {
        s.chores = s.chores.filter(function (c) { return typeof c === 'string'; }).slice(0, MAX);
        s.layout = s.layout === 'monthly' ? 'monthly' : 'weekly';
        s.paper = s.paper === 'a4' ? 'a4' : 'letter';
        s.name = typeof s.name === 'string' ? s.name.slice(0, 30) : '';
        return s;
      }
    } catch (e) {}
    return null;
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // ---- the chart itself -------------------------------------------------
  function chartHTML() {
    var monthly = state.layout === 'monthly';
    var days = [];
    if (monthly) { for (var d = 1; d <= 31; d++) days.push(String(d)); } else { days = WEEK; }
    var chores = state.chores.filter(function (c) { return c.trim(); });
    var rows = Math.max(chores.length, 6);
    var body = '';
    for (var i = 0; i < rows; i++) {
      var c = chores[i];
      body += '<tr><th scope="row"><div class="pc-chore">' + (c ? esc(c) : '<span class="pc-write"></span>') + '</div></th>' +
        days.map(function () { return '<td><span class="pc-box"></span></td>'; }).join('') + '</tr>';
    }
    return '<div class="pc-sheet ' + (monthly ? 'pc-monthly' : 'pc-weekly') + '" style="--rows:' + rows + '">' +
      '<div class="pc-head"><div><div class="pc-title">My Chore Chart</div></div><img class="pc-penny" src="/assets/penny.svg" alt=""></div>' +
      '<div class="pc-fields"><div class="pc-name">Name <span class="pc-line">' + esc(state.name.trim()) + '</span></div>' +
      '<div>' + (monthly ? 'Month' : 'Week of') + ' <span class="pc-line"></span></div></div>' +
      '<table class="pc-table"><colgroup><col class="pc-chore-col">' + days.map(function () { return '<col>'; }).join('') + '</colgroup>' +
      '<thead><tr><th scope="col">Chore</th>' + days.map(function (d) { return '<th scope="col">' + d + '</th>'; }).join('') + '</tr></thead>' +
      '<tbody>' + body + '</tbody>' +
      '<tfoot><tr><th scope="row">Pay Day</th><td colspan="' + days.length + '">Earned this ' + (monthly ? 'month' : 'week') + ': $<span class="pc-amt"></span></td></tr></tfoot>' +
      '</table><div class="pc-foot"><span>Tick a box each time the chore is done.</span><span>pocketpiggy.app</span></div></div>';
  }

  function pageSize() {
    var p = PAGE[state.paper], land = state.layout === 'monthly';
    return { w: land ? p.h : p.w, h: land ? p.w : p.h, wIn: land ? p.hIn : p.wIn, hIn: land ? p.wIn : p.hIn,
             css: (state.paper === 'a4' ? 'A4' : 'letter') + (land ? ' landscape' : ' portrait') };
  }

  function render() {
    var size = pageSize(), html = chartHTML();
    pageStyle.textContent = '@page { size: ' + size.css + '; margin: 0; }' +
      '.pc-sheet { --page-w: ' + size.w + '; --page-h: ' + size.h + '; }';
    preview.innerHTML = html;
    printRoot.innerHTML = html;
    fitPreview();
    form.count.textContent = '(' + state.chores.length + ' of ' + MAX + ')';
    form.limit.hidden = state.chores.length < MAX;
    form.add.disabled = form.addBtn.disabled = state.chores.length >= MAX;
    save();
  }

  // Scale the full-size sheet down to the preview column's width.
  function fitPreview() {
    var sheet = preview.firstChild;
    if (!sheet) return;
    var size = pageSize();
    var scale = Math.min(1, preview.parentNode.clientWidth / (size.wIn * 96));
    sheet.style.transform = 'scale(' + scale + ')';
    preview.style.height = (size.hIn * 96 * scale) + 'px';
    preview.style.width = (size.wIn * 96 * scale) + 'px';
  }

  // ---- chore list editor ------------------------------------------------
  function renderList() {
    form.list.innerHTML = '';
    state.chores.forEach(function (c, i) {
      var n = i + 1, li = document.createElement('li');
      li.innerHTML = '<label class="visually-hidden" for="cm-c' + i + '">Chore ' + n + '</label>' +
        '<input id="cm-c' + i + '" type="text" maxlength="40" value="' + esc(c) + '" data-i="' + i + '">' +
        '<button type="button" class="icon-btn" data-act="up" data-i="' + i + '" aria-label="Move chore ' + n + ' up"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button type="button" class="icon-btn" data-act="down" data-i="' + i + '" aria-label="Move chore ' + n + ' down"' + (i === state.chores.length - 1 ? ' disabled' : '') + '>↓</button>' +
        '<button type="button" class="icon-btn remove" data-act="remove" data-i="' + i + '" aria-label="Remove chore ' + n + '">✕</button>';
      form.list.appendChild(li);
    });
  }

  form.list.addEventListener('input', function (e) {
    if (e.target.dataset.i == null) return;
    state.chores[+e.target.dataset.i] = e.target.value;
    render();
  });
  form.list.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b) return;
    var i = +b.dataset.i, c = state.chores, act = b.dataset.act, to = i;
    if (act === 'up' && i > 0) { to = i - 1; c.splice(to, 0, c.splice(i, 1)[0]); }
    if (act === 'down' && i < c.length - 1) { to = i + 1; c.splice(to, 0, c.splice(i, 1)[0]); }
    if (act === 'remove') c.splice(i, 1);
    renderList(); render();
    // Keep keyboard focus with the chore that moved, or near the one removed.
    var q = function (sel) { return form.list.querySelector(sel); };
    var el = act === 'remove'
      ? (c.length ? $('cm-c' + Math.min(i, c.length - 1)) : form.add)
      : (q('[data-act="' + act + '"][data-i="' + to + '"]:not([disabled])') || $('cm-c' + to));
    if (el) el.focus();
  });

  function addChore() {
    var v = form.add.value.trim();
    if (!v || state.chores.length >= MAX) return;
    state.chores.push(v);
    form.add.value = '';
    renderList(); render();
    form.add.focus();
  }
  form.addBtn.addEventListener('click', addChore);
  form.add.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addChore(); } });

  // ---- other controls ---------------------------------------------------
  form.name.addEventListener('input', function () { state.name = form.name.value; render(); });

  form.age.addEventListener('change', function () {
    var prev = SUGGEST[state.age] ? SUGGEST[state.age].top : [];
    var edited = state.chores.join('|') !== prev.join('|') && state.chores.some(function (c) { return c.trim(); });
    state.age = form.age.value;
    if (!edited || window.confirm('Replace your chores with the suggestions for ' + SUGGEST[state.age].label + '?')) {
      state.chores = SUGGEST[state.age].top.slice();
      renderList();
    }
    render();
  });

  document.querySelectorAll('input[name="cm-layout"], input[name="cm-paper"]').forEach(function (r) {
    r.addEventListener('change', function () {
      state[r.name === 'cm-layout' ? 'layout' : 'paper'] = r.value;
      render();
    });
  });

  form.print.addEventListener('click', function () {
    render();
    // Only the options are sent: never the child's name or the chore text.
    if (window.posthog && posthog.capture) {
      posthog.capture('chart_maker_print', { age: state.age, layout: state.layout, paper: state.paper,
        chore_count: state.chores.filter(function (c) { return c.trim(); }).length });
    }
    window.print();
  });

  window.addEventListener('resize', fitPreview);
  window.addEventListener('beforeprint', render);

  // ---- start ------------------------------------------------------------
  form.name.value = state.name;
  form.age.value = state.age;
  document.getElementById(state.layout === 'monthly' ? 'cm-monthly' : 'cm-weekly').checked = true;
  document.getElementById(state.paper === 'a4' ? 'cm-a4' : 'cm-letter').checked = true;
  renderList();
  render();
})();
