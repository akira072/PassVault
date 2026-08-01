const UI = (() => {
  let toastTimer = null;

  function toast(msg, type = '') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'show' + (type ? ' ' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.className = '', 2200);
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
  }

  function closeAllModals() {
    document.querySelectorAll('.overlay.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  }

  function initSidebar() {
    const toggle   = document.getElementById('menuToggle');
    const sidebar  = document.getElementById('sidebar');
    const backdrop = document.getElementById('sbBackdrop');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('sb-open');
      backdrop.classList.toggle('open');
    });
    if (backdrop) backdrop.addEventListener('click', () => {
      sidebar.classList.remove('sb-open');
      backdrop.classList.remove('open');
    });
  }

  function markActiveNav() {
    const page = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sb-item').forEach(a => {
      const href = a.getAttribute('href') || '';
      a.classList.toggle('active', href === page || (page === '' && href === 'dashboard.html'));
    });
  }

  function fillUser() {
    const s = Auth.getSession();
    if (!s) return;
    const nameEl   = document.getElementById('sbName');
    const emailEl  = document.getElementById('sbEmail');
    const avatarEl = document.getElementById('sbAvatar');
    if (nameEl)   nameEl.textContent  = s.name;
    if (emailEl)  emailEl.textContent = s.email || 'Guest';
    if (avatarEl) avatarEl.textContent = s.name.charAt(0).toUpperCase();
  }

  function strengthScore(pw) { return Vault.scorePassword(pw); }

  function renderStrengthBar(pw, barId, hintId) {
    const score  = strengthScore(pw);
    const colors = ['','var(--red)','var(--orange)','var(--yellow)','var(--blue)','var(--green)'];
    const labels = ['','Very Weak','Weak','Fair','Strong','Very Strong'];
    const pips   = document.querySelectorAll(`#${barId} .str-pip`);
    pips.forEach((p, i) => {
      p.style.background = i < score ? colors[score] : 'rgba(255,255,255,.06)';
    });
    const hint = document.getElementById(hintId);
    if (hint) { hint.textContent = pw ? labels[score] || '' : ''; hint.style.color = colors[score]; }
  }

  function catClass(cat) {
    const map = { social:'cat-s', finance:'cat-f', work:'cat-w', shopping:'cat-sh', email:'cat-e', gaming:'cat-g', other:'cat-o' };
    return map[cat] || 'cat-o';
  }

  function catColor(cat) {
    const map = {
      social:'background:rgba(29,161,242,.12);color:#1DA1F2;border:1px solid rgba(29,161,242,.2)',
      finance:'background:rgba(57,255,20,.1);color:#39FF14;border:1px solid rgba(57,255,20,.2)',
      work:'background:rgba(45,125,210,.12);color:#2D7DD2;border:1px solid rgba(45,125,210,.2)',
      shopping:'background:rgba(255,154,60,.12);color:#FF9A3C;border:1px solid rgba(255,154,60,.2)',
      email:'background:rgba(234,67,53,.12);color:#EA4335;border:1px solid rgba(234,67,53,.2)',
      gaming:'background:rgba(124,58,237,.12);color:#9f67ff;border:1px solid rgba(124,58,237,.2)',
      other:'background:rgba(136,146,176,.08);color:#8892B0;border:1px solid rgba(136,146,176,.15)'
    };
    return map[cat] || map.other;
  }

  function catEmoji(cat) {
    const map = { social:'🌐', finance:'💰', work:'💼', shopping:'🛒', email:'📧', gaming:'🎮', other:'🔑' };
    return map[cat] || '🔑';
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60)    return 'just now';
    if (s < 3600)  return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    if (s < 2592000) return Math.floor(s/86400) + 'd ago';
    return Math.floor(s/2592000) + 'mo ago';
  }

  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => toast(label + ' copied', 'green'));
  }

  function confirm(msg, title, onOk) {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    document.getElementById('confirmTitle').textContent = title || 'Are you sure?';
    document.getElementById('confirmMsg').textContent   = msg;
    document.getElementById('confirmOkBtn').onclick     = () => { closeModal('confirmModal'); onOk(); };
    openModal('confirmModal');
  }

  return { toast, openModal, closeModal, closeAllModals, initSidebar, markActiveNav, fillUser, renderStrengthBar, catColor, catEmoji, timeAgo, copyToClipboard, confirm };
})();
