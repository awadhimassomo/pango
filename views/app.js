const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Only allow http(s) and same-site paths in media URLs.
const safeUrl = (u) => (/^(https?:\/\/|\/uploads\/)/i.test(u) ? u : '');
const money = (h) => `$${Number(h.price).toLocaleString()}${h.listingType === 'rent' ? '/mo' : ''}`;

let houses = [];

async function load() {
  const params = new URLSearchParams();
  for (const [k, v] of new FormData($('#filters'))) if (v) params.set(k, v);
  const res = await fetch('/api/houses?' + params);
  const data = await res.json();
  houses = data.results;
  $('#count').textContent = `${data.count} home${data.count === 1 ? '' : 's'} found`;
  $('#grid').innerHTML = houses.map(card).join('') || '<p>No homes match your search.</p>';
}

function card(h) {
  const img = safeUrl(h.images?.[0]);
  return `<article class="card" data-id="${esc(h.id)}">
    ${img ? `<img src="${esc(img)}" alt="${esc(h.title)}" loading="lazy">` : '<img alt="">'}
    <div class="body">
      <h3>${esc(h.title)}</h3>
      <div class="price">${esc(money(h))}</div>
      <div class="meta">${esc(h.city)} · ${esc(h.bedrooms)} bd · ${esc(h.bathrooms)} ba · ${esc(h.areaSqm || '–')} m²</div>
      ${h.videos?.length ? '<span class="badge">▶ Video tour</span>' : ''}
      ${h.models3d?.length ? '<span class="badge">🧊 3D view</span>' : ''}
    </div></article>`;
}

function showDetail(h) {
  const tabs = [];
  if (h.videos?.length) tabs.push(['video', '▶ Video tour']);
  if (h.models3d?.length) tabs.push(['3d', '🧊 3D view']);
  if (h.images?.length) tabs.push(['photos', '🖼 Photos']);

  $('#detailBody').innerHTML = `<div class="detail">
    <h2>${esc(h.title)}</h2>
    <div class="price">${esc(money(h))} · ${esc(h.listingType === 'rent' ? 'For rent' : 'For sale')}</div>
    <div class="tabs">${tabs.map(([k, l]) => `<button data-tab="${k}">${l}</button>`).join('')}</div>
    <div class="viewer" id="viewer">No media yet</div>
    <p>${esc(h.description)}</p>
    <p class="meta">${esc(h.address)}, ${esc(h.city)} · ${esc(h.bedrooms)} bd · ${esc(h.bathrooms)} ba · ${esc(h.areaSqm || '–')} m²</p>
    ${(h.amenities || []).map((a) => `<span class="badge">${esc(a)}</span>`).join('')}
  </div>`;

  const viewer = $('#viewer');
  const render = {
    video: () => { const v = h.videos[0]; viewer.innerHTML = `<video controls playsinline src="${esc(safeUrl(v.url))}"></video>`; },
    '3d': () => {
      const m = h.models3d[0];
      viewer.innerHTML = `<model-viewer src="${esc(safeUrl(m.url))}" camera-controls auto-rotate touch-action="pan-y" shadow-intensity="1" ar></model-viewer>`;
    },
    photos: () => { viewer.innerHTML = `<img src="${esc(safeUrl(h.images[0]))}" alt="">`; },
  };
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x === b));
    render[b.dataset.tab]();
  }));
  if (tabs.length) document.querySelector('.tabs button').click();
  $('#detail').showModal();
}

$('#detail').addEventListener('close', () => { $('#viewer').innerHTML = ''; }); // stop playback
$('#closeDetail').onclick = () => $('#detail').close();
$('#detail').addEventListener('click', (e) => { if (e.target === $('#detail')) $('#detail').close(); });
$('#filters').addEventListener('submit', (e) => { e.preventDefault(); load(); });
$('#grid').addEventListener('click', (e) => {
  const c = e.target.closest('.card');
  if (c) showDetail(houses.find((h) => h.id === c.dataset.id));
});

// ---- Chat ----
const history = [];
const toggleChat = () => {
  $('#chat').classList.toggle('hidden');
  if (!history.length) addMsg('bot', 'Hi! Tell me what kind of home you are looking for.');
};
$('#chatToggle').onclick = toggleChat;
$('#chatClose').onclick = () => $('#chat').classList.add('hidden');

function addMsg(role, text, found = []) {
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  el.textContent = text;
  for (const h of found) {
    const a = document.createElement('a');
    a.className = 'mini';
    a.textContent = `${h.title} — ${money(h)} (${h.city})`;
    a.onclick = () => showDetail(h);
    el.appendChild(a);
  }
  $('#chatLog').appendChild(el);
  $('#chatLog').scrollTop = 1e9;
  return el;
}

$('#chatForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = $('#chatInput').value.trim();
  if (!text) return;
  $('#chatInput').value = '';
  history.push({ role: 'user', content: text });
  addMsg('user', text);
  const pending = addMsg('bot', '…');
  try {
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) });
    const data = await res.json();
    pending.remove();
    if (!res.ok) throw new Error(data.error);
    history.push({ role: 'assistant', content: data.reply });
    addMsg('bot', data.reply, data.houses);
  } catch (err) {
    pending.remove();
    addMsg('bot', err.message || 'Something went wrong.');
  }
});

const sess = Auth.get();
$('#session').innerHTML = sess
  ? `Signed in as ${esc(sess.user.name)} · <a href="#" id="logout">Log out</a>`
  : '<a href="/login.html">Sign in</a>';
if (sess) $('#logout').onclick = (e) => { e.preventDefault(); Auth.clear(); location.reload(); };

load();
