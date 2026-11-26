/* ============================================================
   Banbi 営業カレンダー
   ------------------------------------------------------------
   ふだん書き換えるのは、この「設定」の部分だけです。
   ・定休日（第1・第3水曜／日曜／祝日）は自動で休みになります。
   ・臨時休業 … CLOSED に「'日付': 'メモ'」を1行ずつ足す
   ・定休日だけど営業する日 … OPEN に同じ形で足す
   ・日付は '2026-12-31' の形（半角）。行の最後に , を付ける
   ============================================================ */

const CLOSED = {
  // '2026-12-29': '臨時休業',
};

const OPEN = {
  // '2026-12-27': '年末営業',
};

/* ---------------- ここから下はさわらなくてOK ---------------- */

// 国民の祝日・休日（内閣府発表）。2028年分は2027年2月に発表されたら追加
const HOLIDAYS = [
  '2026-01-01','2026-01-12','2026-02-11','2026-02-23','2026-03-20','2026-04-29',
  '2026-05-03','2026-05-04','2026-05-05','2026-05-06','2026-07-20','2026-08-11',
  '2026-09-21','2026-09-22','2026-09-23','2026-10-12','2026-11-03','2026-11-23',
  '2027-01-01','2027-01-11','2027-02-11','2027-02-23','2027-03-21','2027-03-22',
  '2027-04-29','2027-05-03','2027-05-04','2027-05-05','2027-07-19','2027-08-11',
  '2027-09-20','2027-09-23','2027-10-11','2027-11-03','2027-11-23'
];

(function () {
  var root = document.getElementById('bcal');
  if (!root) return;

  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var WEEK = ['日','月','火','水','木','金','土'];
  var WEEK_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var MON_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var holi = {};
  HOLIDAYS.forEach(function (d) { holi[d] = true; });

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function key(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }

  // その日が休みか：{closed:true/false, note:'…', special:true/false}
  function status(y, m, d) {
    var k = key(y, m, d);
    if (OPEN[k] !== undefined) return { closed: false, note: OPEN[k] || '営業', special: true };
    if (CLOSED[k] !== undefined) return { closed: true, note: CLOSED[k] || '臨時休業', special: true };
    var wd = new Date(y, m, d).getDay();
    var nth = Math.floor((d - 1) / 7) + 1;
    if (wd === 0) return { closed: true };
    if (wd === 3 && (nth === 1 || nth === 3)) return { closed: true };
    if (holi[k]) return { closed: true };
    return { closed: false };
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function month(y, m, today) {
    var first = new Date(y, m, 1).getDay();
    var days = new Date(y, m + 1, 0).getDate();
    var cells = '', notes = [];
    for (var i = 0; i < first; i++) cells += '<span class="bc-d is-empty"></span>';
    for (var d = 1; d <= days; d++) {
      var s = status(y, m, d);
      var wd = new Date(y, m, d).getDay();
      var cls = 'bc-d' + (s.closed ? ' is-closed' : '') + (s.special ? ' is-special' : '') +
        (key(y, m, d) === today ? ' is-today' : '') + (wd === 0 ? ' is-sun' : '') + (wd === 6 ? ' is-sat' : '');
      var label = (m + 1) + '月' + d + '日（' + WEEK[wd] + '）' + (s.closed ? ' 休業日' : ' 営業日') + (s.note ? '・' + s.note : '');
      cells += '<span class="' + cls + '" aria-label="' + esc(label) + '"' + (s.note ? ' title="' + esc(s.note) + '"' : '') + '>' + d + '</span>';
      if (s.special) notes.push('<li><b>' + (m + 1) + '/' + d + ' ' + WEEK_EN[wd] + '</b>' + esc(s.note) + '</li>');
    }
    return '<div class="bc-month" data-ym="' + y + '-' + m + '">' +
      '<p class="bc-title"><span class="bc-m">' + MONTHS[m] + '</span><span class="bc-y">' + y + '</span></p>' +
      '<div class="bc-grid" role="grid">' +
      WEEK_EN.map(function (w, i) { return '<span class="bc-w' + (i === 0 ? ' is-sun' : '') + (i === 6 ? ' is-sat' : '') + '">' + w + '</span>'; }).join('') +
      cells + '</div>' +
      (notes.length ? '<ul class="bc-notes">' + notes.join('') + '</ul>' : '') +
      '</div>';
  }

  var now = new Date();
  var today = key(now.getFullYear(), now.getMonth(), now.getDate());
  var y1 = now.getFullYear(), m1 = now.getMonth();
  var y2 = m1 === 11 ? y1 + 1 : y1, m2 = (m1 + 1) % 12;

  root.innerHTML =
    '<div class="bc-tabs" role="tablist">' +
      '<button type="button" class="bc-tab is-active" role="tab" aria-selected="true" data-i="0">' + MON_EN[m1] + '</button>' +
      '<button type="button" class="bc-tab" role="tab" aria-selected="false" data-i="1">' + MON_EN[m2] + '</button>' +
    '</div>' +
    '<div class="bc-months">' + month(y1, m1, today) + month(y2, m2, today) + '</div>';

  var tabs = root.querySelectorAll('.bc-tab'), months = root.querySelectorAll('.bc-month');
  months[0].classList.add('is-show');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var i = Number(t.dataset.i);
      tabs.forEach(function (x, j) { x.classList.toggle('is-active', j === i); x.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
      months.forEach(function (x, j) { x.classList.toggle('is-show', j === i); });
    });
  });

  // 今日の営業状況（営業日かどうか＋時間帯）
  var badge = document.getElementById('bcal-today');
  if (badge) {
    var st = status(y1, m1, now.getDate());
    var mins = now.getHours() * 60 + now.getMinutes();
    var label, sub, open;
    if (st.closed) { label = 'Closed today'; sub = '本日は休業日です'; open = false; }
    else if (mins < 600) { label = 'Open today'; sub = '10:00 – 16:00'; open = true; }
    else if (mins < 960) { label = 'Open now'; sub = '16:00まで営業中'; open = true; }
    else { label = 'Closed now'; sub = '本日の営業は終了しました'; open = false; }
    badge.innerHTML = '<span class="bt-dot"></span><span class="bt-label"></span><span class="bt-sub"></span>';
    badge.querySelector('.bt-label').textContent = label;
    badge.querySelector('.bt-sub').textContent = sub;
    badge.classList.add(open ? 'is-open' : 'is-closed');
    if (label === 'Open now') badge.classList.add('is-live');
  }
})();
