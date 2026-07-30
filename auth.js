const Auth = (() => {
  const SESSION_KEY = 'pv_session';
  const USERS_KEY   = 'pv_users';

  function getUsers() { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
  function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
  function getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }
  function saveSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }

  function requireAuth() {
    const s = getSession();
    if (!s) { window.location.href = 'login.html'; return null; }
    return s;
  }

  function logout() {
    clearSession();
    window.location.href = 'login.html';
  }

  function login(email, pass) {
    const users = getUsers();
    const user  = users[email];
    if (!user || user.pass !== btoa(pass)) return { ok: false, msg: 'Invalid email or password.' };
    const session = { id: user.id, name: user.name, email };
    saveSession(session);
    return { ok: true, session };
  }

  function signup(name, email, pass) {
    const users = getUsers();
    if (users[email]) return { ok: false, field: 'email', msg: 'Email already registered.' };
    const id   = 'u_' + Date.now();
    users[email] = { id, name, email, pass: btoa(pass), created: Date.now() };
    saveUsers(users);
    const session = { id, name, email };
    saveSession(session);
    return { ok: true, session };
  }

  function guestLogin() {
    const session = { id: 'guest', name: 'Guest', email: '', isGuest: true };
    saveSession(session);
    return session;
  }

  return { requireAuth, logout, login, signup, guestLogin, getSession };
})();
