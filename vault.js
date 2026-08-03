const Vault = (() => {
  const KEY = 'pv_vault';
  const NOTES_KEY = 'pv_notes';

  function getAll() { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  function saveAll(items) { localStorage.setItem(KEY, JSON.stringify(items)); }
  function getAllNotes() { return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'); }
  function saveAllNotes(n) { localStorage.setItem(NOTES_KEY, JSON.stringify(n)); }

  function add(entry) {
    const items = getAll();
    const item  = { ...entry, id: 'pw_' + Date.now(), created: Date.now(), updated: Date.now(), starred: false };
    items.unshift(item);
    saveAll(items);
    return item;
  }

  function update(id, patch) {
    const items = getAll();
    const idx   = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...patch, updated: Date.now() };
    saveAll(items);
    return items[idx];
  }

  function remove(id) {
    saveAll(getAll().filter(i => i.id !== id));
  }

  function toggleStar(id) {
    const item = getAll().find(i => i.id === id);
    if (!item) return;
    update(id, { starred: !item.starred });
  }

  function search(query, category) {
    const q = query.toLowerCase().trim();
    return getAll().filter(i => {
      const matchQ = !q || i.title.toLowerCase().includes(q) || (i.username || '').toLowerCase().includes(q) || (i.url || '').toLowerCase().includes(q) || (i.tags || '').toLowerCase().includes(q);
      const matchC = !category || category === 'all' || i.category === category;
      return matchQ && matchC;
    });
  }

  function getStats() {
    const all = getAll();
    const notes = getAllNotes();
    const weak  = all.filter(i => scorePassword(i.password) < 2).length;
    const dups  = findDuplicates(all).length;
    const ms30  = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const old   = all.filter(i => i.updated < ms30).length;
    const starred = all.filter(i => i.starred).length;
    return { total: all.length, weak, dups, old, starred, notes: notes.length };
  }

  function securityScore() {
    const all = getAll();
    if (!all.length) return { score: 0, grade: 'N/A', weak: 0, dup: 0, old: 0, strong: 0 };
    const weak   = all.filter(i => scorePassword(i.password) < 2).length;
    const dup    = findDuplicates(all).length;
    const ms30   = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const old    = all.filter(i => i.updated < ms30).length;
    const strong = all.filter(i => scorePassword(i.password) >= 4).length;
    const issues = weak + dup + Math.floor(old / 2);
    const raw    = Math.max(0, Math.min(100, 100 - (issues / all.length) * 100));
    const score  = Math.round(raw);
    const grade  = score >= 80 ? 'Strong' : score >= 60 ? 'Fair' : score >= 40 ? 'Weak' : 'Critical';
    return { score, grade, weak, dup, old, strong, total: all.length };
  }

  function findDuplicates(items) {
    const seen = {}; const dups = [];
    items.forEach(i => {
      if (!i.password) return;
      if (seen[i.password]) { if (!dups.find(d => d.id === i.id)) dups.push(i); if (!dups.find(d => d.id === seen[i.password].id)) dups.push(seen[i.password]); }
      else seen[i.password] = i;
    });
    return dups;
  }

  function getWeakPasswords() { return getAll().filter(i => scorePassword(i.password) < 2); }
  function getOldPasswords()  {
    const ms30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return getAll().filter(i => i.updated < ms30);
  }
  function getDuplicatePasswords() { return findDuplicates(getAll()); }

  function scorePassword(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)  s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    const common = ['password','123456','qwerty','abc123','letmein','admin','welcome'];
    if (common.some(c => pw.toLowerCase().includes(c))) s = Math.min(s, 1);
    return s;
  }

  function addNote(note) {
    const notes = getAllNotes();
    const item  = { ...note, id: 'n_' + Date.now(), created: Date.now(), updated: Date.now() };
    notes.unshift(item);
    saveAllNotes(notes);
    return item;
  }

  function updateNote(id, patch) {
    const notes = getAllNotes();
    const idx   = notes.findIndex(n => n.id === id);
    if (idx === -1) return null;
    notes[idx] = { ...notes[idx], ...patch, updated: Date.now() };
    saveAllNotes(notes);
    return notes[idx];
  }

  function removeNote(id) { saveAllNotes(getAllNotes().filter(n => n.id !== id)); }

  function exportJSON() {
    const data = { version: 1, exported: new Date().toISOString(), passwords: getAll(), notes: getAllNotes() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'passvault-export-' + Date.now() + '.json';
    a.click();
  }

  function importCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const obj  = {};
      headers.forEach((h, idx) => obj[h] = vals[idx] || '');
      if (obj.title || obj.name || obj.website) {
        add({ title: obj.title || obj.name || obj.website, username: obj.username || obj.login || obj.email || '', password: obj.password || '', url: obj.url || obj.website || '', category: obj.category || obj.folder || 'other', notes: obj.notes || obj.note || '', tags: obj.tags || '' });
        count++;
      }
    }
    return count;
  }

  return { getAll, add, update, remove, toggleStar, search, getStats, securityScore, scorePassword, addNote, updateNote, removeNote, getAllNotes, getWeakPasswords, getOldPasswords, getDuplicatePasswords, exportJSON, importCSV };
})();
