// Tiny client-side session helper. Token is kept in localStorage and sent as a Bearer header.
const Auth = {
  save({ token, user }) { try { localStorage.setItem('session', JSON.stringify({ token, user })); } catch {} },
  get() { try { return JSON.parse(localStorage.getItem('session')); } catch { return null; } },
  clear() { try { localStorage.removeItem('session'); } catch {} },
  headers() { const s = Auth.get(); return s ? { Authorization: 'Bearer ' + s.token } : {}; },
};
