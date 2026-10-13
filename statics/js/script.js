// ---------- config: API addresses ----------
// In production Django fills window.APP (see index.html) using {% url %},
// so changing urls.py never requires touching this file.
// The defaults below are only a fallback for opening the page without Django.
const APP = window.APP || {};
const API = Object.assign({
  services: '/api/v1/services',
  days: '/api/v1/days',
  slots: '/api/v1/slots',
  appointments: '/api/v1/appointments',
}, APP.api || {});

async function getJSON(url, params = {}) {
  const q = new URLSearchParams(params).toString();
  const r = await fetch(q ? `${url}?${q}` : url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

// ---------- helpers ----------
const $ = id => document.getElementById(id);
const fa = n => Number(n).toLocaleString('fa-IR', {useGrouping:false});
const faDigits = s => String(s).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const toEn = s => String(s).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const fmtWd = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {weekday:'long'});
const fmtDay = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {day:'numeric', month:'long'});
const fmtFull = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {weekday:'long', day:'numeric', month:'long'});
// "2026-10-14" -> local Date (no UTC shift)
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

// "00:30:00" -> 30 minutes (also handles Django's "1 02:00:00" with days)
function parseDuration(s) {
  const m = String(s).match(/^(?:(\d+) )?(\d+):(\d+)/);
  if (!m) return 0;
  const [, d = 0, h, min] = m;
  return Number(d) * 1440 + Number(h) * 60 + Number(min);
}
// 30 -> "۳۰ دقیقه" | 60 -> "۱ ساعت" | 90 -> "۱ ساعت و ۳۰ دقیقه"
function formatDuration(total) {
  const h = Math.floor(total / 60), m = total % 60, parts = [];
  if (h) parts.push(fa(h) + ' ساعت');
  if (m) parts.push(fa(m) + ' دقیقه');
  return parts.join(' و ') || '—';
}
// 500000 -> "۵۰۰٬۰۰۰ تومان"
const formatPrice = p => Number(p).toLocaleString('fa-IR') + ' تومان';

// ---------- state ----------
let SERVICES = [];   // [{id, name, min, price}]
const S = {
  days:[], daysLoading:false,    // [{key:'2026-10-14', date:Date, free:3}]
  slots:[], loading:false,       // [{id, t, free}]
  service:null, day:null, slot:null,
  name:'', phone:'', errors:{}, done:null
};

// ---------- talking to Django ----------
// services: from <script id="services-data"> (json_script) if present, otherwise from the API
async function loadServices() {
  try {
    const el = $('services-data');
    const data = el ? JSON.parse(el.textContent) : await getJSON(API.services);
    SERVICES = data.map(s => ({id: s.id, name: s.title, min: parseDuration(s.visit_time), price: s.price}));
  } catch (e) { alert('دریافت لیست ویزیت‌ها انجام نشد.'); }
  render();
}
// days: expected JSON -> {"days":[{"date":"2026-10-14","free":3}, ...]}
async function loadDays() {
  const svc = S.service;
  S.daysLoading = true; render();
  try {
    const data = await getJSON(API.days, {service: svc.id});
    if (S.service !== svc) return; // user changed service meanwhile
    S.days = data.days.map(d => ({key: d.date, date: parseYmd(d.date), free: d.free}));
  } catch (e) { S.days = []; alert('دریافت روزها انجام نشد. اینترنت را بررسی کن.'); }
  S.daysLoading = false; render();
}
// slots: expected JSON -> {"slots":[{"id":12,"t":"16:00","free":true}, ...]}
async function loadSlots() {
  const day = S.day, svc = S.service;
  S.loading = true; render();
  try {
    const data = await getJSON(API.slots, {date: day.key, service: svc.id});
    if (S.day !== day || S.service !== svc) return; // user changed selection meanwhile
    S.slots = data.slots.map(s => ({id: s.id, t: faDigits(s.t), free: s.free}));
  } catch (e) { S.slots = []; alert('دریافت ساعت‌ها انجام نشد. اینترنت را بررسی کن.'); }
  S.loading = false; render();
}

// ---------- rendering ----------
function render() {
  const f = $('flow');
  if (S.done) {
    f.innerHTML = `<div class="ok"><div class="tick" aria-hidden="true">✓</div>
      <h2>نوبتت ثبت شد</h2>
      <p>${S.name} عزیز، ${S.service.name} در ${fmtFull.format(S.day.date)} ساعت ${S.slot.t}</p>
      <div>کد پیگیری</div><div class="code">${S.done}</div>
      <p class="hint">پیامک تأیید به شماره ${S.phone} ارسال می‌شود.</p>
      <button class="ghost" id="again">رزرو نوبت جدید</button></div>`;
    $('again').onclick = () => {
      Object.assign(S, {service:null, day:null, slot:null, days:[], slots:[], name:'', phone:'', errors:{}, done:null});
      render();
    };
    $('go').style.display = 'none'; sum(); return;
  }
  $('go').style.display = '';
  const s1 = !!S.service, s2 = !!S.slot;

  const servicesHtml = SERVICES.length
    ? `<div class="opts">${SERVICES.map(v => `<button class="opt" data-s="${v.id}" aria-pressed="${!!S.service && S.service.id === v.id}"><strong>${v.name}</strong><small>${formatDuration(v.min)} · ${formatPrice(v.price)}</small></button>`).join('')}</div>`
    : '<p class="hint">در حال دریافت لیست ویزیت‌ها…</p>';

  const daysHtml = !S.service ? '<p class="hint">اول نوع ویزیت را انتخاب کن.</p>'
    : S.daysLoading ? '<p class="hint">در حال دریافت روزها…</p>'
    : !S.days.length ? '<p class="hint">برای این ویزیت فعلاً روزی تعریف نشده است.</p>'
    : `<div class="days">${S.days.map(d => `<button class="day" data-d="${d.key}" ${d.free ? '' : 'disabled'} aria-pressed="${!!S.day && S.day.key === d.key}">${fmtWd.format(d.date)}<small>${fmtDay.format(d.date)}</small></button>`).join('')}</div>`;

  const slotsHtml = !S.service || S.daysLoading || !S.days.length ? ''
    : !S.day ? '<p class="hint">یک روز را انتخاب کن تا ساعت‌های خالی را ببینی.</p>'
    : S.loading ? '<p class="hint">در حال دریافت ساعت‌ها…</p>'
    : !S.slots.length ? '<p class="hint">برای این روز نوبتی تعریف نشده. روز دیگری را انتخاب کن.</p>'
    : `<div class="slots">${S.slots.map(s => `<button class="slot" data-id="${s.id}" ${s.free ? '' : 'disabled'} aria-pressed="${!!S.slot && S.slot.id === s.id}">${s.t}</button>`).join('')}</div><p class="hint">ساعت‌های خط‌خورده پر شده‌اند.</p>`;

  f.innerHTML = `
  <div class="step ${s1 ? 'done' : ''}"><h2><b>${fa(1)}</b>نوع ویزیت را انتخاب کن</h2>${servicesHtml}</div>
  <div class="step ${s2 ? 'done' : ''} ${s1 ? '' : 'lock'}"><h2><b>${fa(2)}</b>روز و ساعت</h2>${daysHtml}${slotsHtml}</div>
  <div class="step ${s2 ? '' : 'lock'}"><h2><b>${fa(3)}</b>مشخصات تماس</h2>
    <div class="field"><label for="nm">نام و نام خانوادگی</label><input type="text" id="nm" value="${S.name}" autocomplete="name" aria-invalid="${!!S.errors.name}"><div class="err">${S.errors.name || ''}</div></div>
    <div class="field"><label for="ph">شماره موبایل</label><input type="tel" id="ph" value="${S.phone}" inputmode="tel" autocomplete="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" aria-invalid="${!!S.errors.phone}"><div class="err">${S.errors.phone || ''}</div></div></div>`;

  f.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
    S.service = SERVICES.find(v => String(v.id) === b.dataset.s);
    S.day = null; S.slot = null; S.days = []; S.slots = [];
    loadDays();                          // days depend on the service
  });
  f.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
    S.day = S.days.find(x => x.key === b.dataset.d); S.slot = null; S.slots = []; loadSlots();
  });
  f.querySelectorAll('[data-id]').forEach(b => b.onclick = () => {
    S.slot = S.slots.find(x => String(x.id) === b.dataset.id); render();
  });
  $('nm').oninput = e => { S.name = e.target.value; sum(); };
  $('ph').oninput = e => { S.phone = e.target.value; sum(); };
  sum();
}

function sum() {
  const row = (t, v) => `<dt>${t}</dt><dd class="${v ? '' : 'empty'}">${v || 'هنوز انتخاب نشده'}</dd>`;
  $('sum').innerHTML =
    row('نوع ویزیت', S.service && `${S.service.name} (${formatDuration(S.service.min)})`) +
    row('زمان', S.slot && `${fmtFull.format(S.day.date)}، ${S.slot.t}`) +
    row('هزینه', S.service && formatPrice(S.service.price));
  $('go').disabled = !(S.service && S.slot && !S.done);
}

// ---------- submit ----------
$('go').onclick = async () => {
  S.errors = {};
  if (S.name.trim().length < 3) S.errors.name = 'نام و نام خانوادگی را کامل وارد کن.';
  if (!/^09\d{9}$/.test(toEn(S.phone).trim())) S.errors.phone = 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.';
  if (S.errors.name || S.errors.phone) { render(); const e = document.querySelector('[aria-invalid="true"]'); e && e.focus(); return; }
  $('go').disabled = true;
  try {
    const r = await fetch(API.appointments, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-CSRFToken': APP.csrf},
      body: JSON.stringify({slot: S.slot.id, name: S.name.trim(), phone: toEn(S.phone).trim()})
    });
    const data = await r.json();
    if (r.ok) { S.done = fa(data.code); render(); }
    else if (r.status === 409) { alert('این ساعت همین الان رزرو شد. ساعت دیگری انتخاب کن.'); S.slot = null; loadSlots(); }
    else { alert('ثبت نوبت انجام نشد. دوباره تلاش کن.'); sum(); }
  } catch (e) { alert('ارتباط با سرور برقرار نشد.'); sum(); }
};

loadServices();
