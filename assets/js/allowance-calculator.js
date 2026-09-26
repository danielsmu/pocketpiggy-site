// Allowance calculator: per-kid weekly and monthly amounts with a spend,
// save and give split that always adds up to 100%. Plain JavaScript,
// updates as you type. Money is handled in whole cents so the split always
// adds back up to the total.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var formEl = $('calc'), results = $('ac-results');
  var DEFAULT_AGES = [8, 5, 11, 3, 13, 15];
  var ages = DEFAULT_AGES.slice();
  var split = { spend: 70, save: 20, give: 10 };
  var WEEKS_PER_MONTH = 52 / 12;

  function num(el, min, max) {
    var v = parseFloat(el.value);
    if (!isFinite(v)) v = 0;
    return Math.min(max, Math.max(min, v));
  }
  function money(cents) {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  function checked(name) { return formEl.querySelector('input[name="' + name + '"]:checked').value; }

  // ---- ages ---------------------------------------------------------------
  function renderAges() {
    var n = +$('ac-kids').value, box = $('ac-ages');
    box.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var d = document.createElement('div');
      d.className = 'age-field';
      d.innerHTML = '<label for="ac-age-' + i + '">Kid ' + (i + 1) + '</label>' +
        '<input id="ac-age-' + i + '" type="number" inputmode="numeric" min="1" max="18" step="1" value="' + ages[i] + '" data-i="' + i + '">' +
        '<span class="unit">years</span>';
      box.appendChild(d);
    }
  }
  $('ac-ages').addEventListener('input', function (e) {
    if (e.target.dataset.i != null) ages[+e.target.dataset.i] = Math.round(num(e.target, 0, 18));
  });

  // ---- split: moving one slider shares the rest between the other two -----
  function setSplit(key, value) {
    var others = ['spend', 'save', 'give'].filter(function (k) { return k !== key; });
    var v = Math.round(Math.min(100, Math.max(0, value)) / 5) * 5;
    var rest = 100 - v, a = split[others[0]], b = split[others[1]];
    var first = a + b === 0 ? Math.floor(rest / 10) * 5 : Math.round(rest * a / (a + b) / 5) * 5;
    first = Math.min(rest, Math.max(0, first));
    split[key] = v;
    split[others[0]] = first;
    split[others[1]] = rest - first;
  }
  function renderSplit() {
    ['spend', 'save', 'give'].forEach(function (k) {
      var el = $('ac-' + k);
      el.value = split[k];
      el.setAttribute('aria-valuetext', split[k] + ' percent');
      $('ac-' + k + '-out').textContent = split[k] + '%';
      formEl.querySelector('.split-bar .' + k).style.width = split[k] + '%';
    });
  }
  ['spend', 'save', 'give'].forEach(function (k) {
    $('ac-' + k).addEventListener('input', function (e) { setSplit(k, +e.target.value); renderSplit(); });
  });

  function splitCents(total) {
    var spend = Math.round(total * split.spend / 100);
    var save = Math.round(total * split.save / 100);
    return { spend: spend, save: save, give: total - spend - save };
  }

  // ---- the calculation ----------------------------------------------------
  function calculate() {
    var approach = checked('ac-approach'), period = checked('ac-period');
    var n = +$('ac-kids').value;
    var kids = [];
    for (var i = 0; i < n; i++) {
      var base; // dollars in the chosen period
      if (approach === 'per_age') base = num($('ac-per-year'), 0, 1000) * ages[i];
      else if (approach === 'flat') base = num($('ac-flat-amt'), 0, 10000);
      else base = num($('ac-per-chore'), 0, 1000) * Math.round(num($('ac-chore-count'), 0, 100));
      var baseCents = Math.round(base * 100);
      var weekly = period === 'weekly' ? baseCents : Math.round(baseCents / WEEKS_PER_MONTH);
      var monthly = period === 'monthly' ? baseCents : Math.round(baseCents * WEEKS_PER_MONTH);
      kids.push({ age: ages[i], weekly: weekly, monthly: monthly, split: splitCents(period === 'weekly' ? weekly : monthly) });
    }
    return { approach: approach, period: period, kids: kids };
  }

  function render() {
    var r = calculate(), per = r.period === 'weekly' ? 'week' : 'month';
    formEl.querySelectorAll('.per').forEach(function (el) { el.textContent = 'per ' + per; });
    formEl.querySelectorAll('[data-for]').forEach(function (el) { el.hidden = el.dataset.for !== r.approach; });
    var totalW = 0, totalM = 0, html = '';
    r.kids.forEach(function (k, i) {
      totalW += k.weekly; totalM += k.monthly;
      html += '<div class="kid-result">' +
        '<h3>Kid ' + (i + 1) + ' <span>age ' + k.age + '</span></h3>' +
        '<dl class="amounts"><div><dt>Weekly</dt><dd>' + money(k.weekly) + '</dd></div><div><dt>Monthly</dt><dd>' + money(k.monthly) + '</dd></div></dl>' +
        '<ul class="split-list" aria-label="Split per ' + per + '">' +
        '<li class="spend">Spend <strong>' + money(k.split.spend) + '</strong></li>' +
        '<li class="save">Save <strong>' + money(k.split.save) + '</strong></li>' +
        '<li class="give">Give <strong>' + money(k.split.give) + '</strong></li></ul>' +
        '<p class="per-note">Split shown per ' + per + '.</p></div>';
    });
    html += '<div class="family-total"><h3>Family total</h3><p><strong>' + money(totalW) + '</strong> a week · <strong>' + money(totalM) + '</strong> a month</p></div>';
    results.innerHTML = html;
    return r;
  }

  // ---- analytics: once per session, after the visitor changes something --
  var SENT_KEY = 'pocketpiggy.allowanceCalculated', sentInMemory = false, timer = null;
  function alreadySent() { try { return sessionStorage.getItem(SENT_KEY) === '1'; } catch (e) { return sentInMemory; } }
  function markSent() { sentInMemory = true; try { sessionStorage.setItem(SENT_KEY, '1'); } catch (e) {} }
  function userChanged(e) {
    if (!e.isTrusted || alreadySent()) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (alreadySent()) return;
      var r = calculate();
      if (window.posthog && posthog.capture) posthog.capture('allowance_calculated', { approach: r.approach, kids: r.kids.length, period: r.period });
      markSent();
    }, 1500);
  }

  formEl.addEventListener('input', function (e) { if (e.target.id === 'ac-kids') renderAges(); render(); userChanged(e); });
  formEl.addEventListener('change', function (e) { if (e.target.id === 'ac-kids') renderAges(); render(); userChanged(e); });
  formEl.addEventListener('submit', function (e) { e.preventDefault(); });

  renderAges();
  renderSplit();
  render();

  // Exposed for testing the maths from the console.
  window.__allowance = { calculate: calculate, setSplit: function (k, v) { setSplit(k, v); renderSplit(); render(); return Object.assign({}, split); } };
})();
