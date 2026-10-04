// Registered nicknames: a player claims a name and gets a secret token (kept by their browser) plus a recovery code
// (shown once, for other devices). No e-mail, no password, no personal data - only the name and hashes.
// Storage: Supabase when SUPABASE_URL + SUPABASE_SERVICE_KEY are set (persistent on Render), else a local JSON file.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PEPPER = process.env.TOKEN_PEPPER || 'territory-dev-pepper';
const hash = s => crypto.createHash('sha256').update(PEPPER + ':' + s).digest('hex');
const RESERVED = new Set(['admin', 'administrator', 'server', 'bot', 'bots', 'you', 'player', 'guest', 'moderator', 'territory', 'system']);
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function cleanNick(raw) {
  const nick = String(raw || '').replace(/\s+/g, ' ').trim();
  if (nick.length < 3 || nick.length > 16) return { error: 'Name must be 3–16 characters' };
  if (!/^[\p{L}\p{N} _.\-]+$/u.test(nick)) return { error: 'Use letters, numbers, space, _ . -' };
  if (RESERVED.has(nick.toLowerCase())) return { error: 'That name is reserved' };
  return { nick, key: nick.toLowerCase() };
}
function recoveryCode() {
  const b = crypto.randomBytes(12); let s = '';
  for (let i = 0; i < 12; i++) s += CODE_CHARS[b[i] % CODE_CHARS.length];
  return s.match(/.{4}/g).join('-');
}

// ---- storage backends ----
function fileStore() {
  const file = process.env.PLAYERS_FILE || path.join(__dirname, 'data', 'players.json');
  let db = {};
  try { db = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* first run */ }
  const save = () => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(db, null, 1)); };
  return {
    kind: 'file',
    async get(key) { return db[key] || null; },
    async insert(row) { if (db[row.key]) return false; db[row.key] = row; save(); return true; },
    async update(key, patch) { if (!db[key]) return; Object.assign(db[key], patch); save(); },
  };
}
function supabaseStore(url, serviceKey) {
  const api = `${url.replace(/\/$/, '')}/rest/v1/players`;
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
  const row = r => r && { key: r.nick_key, nick: r.nick, tokenHash: r.token_hash, recoveryHash: r.recovery_hash, created: r.created_at };
  return {
    kind: 'supabase',
    async get(key) {
      const r = await fetch(`${api}?nick_key=eq.${encodeURIComponent(key)}&select=*`, { headers });
      if (!r.ok) throw new Error('supabase get ' + r.status);
      return row((await r.json())[0]);
    },
    async insert(p) {
      const r = await fetch(api, { method: 'POST', headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ nick_key: p.key, nick: p.nick, token_hash: p.tokenHash, recovery_hash: p.recoveryHash }) });
      if (r.status === 409) return false;
      if (!r.ok) throw new Error('supabase insert ' + r.status);
      return true;
    },
    async update(key, patch) {
      const body = {};
      if (patch.tokenHash) body.token_hash = patch.tokenHash;
      await fetch(`${api}?nick_key=eq.${encodeURIComponent(key)}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
    },
  };
}
const store = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? supabaseStore(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY) : fileStore();

// ---- operations ----
async function register(rawNick) {
  const c = cleanNick(rawNick); if (c.error) return c;
  const token = crypto.randomBytes(24).toString('hex'), recovery = recoveryCode();
  const ok = await store.insert({ key: c.key, nick: c.nick, tokenHash: hash(token), recoveryHash: hash(recovery.replace(/-/g, '')), created: new Date().toISOString() });
  if (!ok) return { error: 'That name is already taken' };
  return { nick: c.nick, token, recovery };
}
async function recover(rawNick, code) {
  const c = cleanNick(rawNick); if (c.error) return c;
  const p = await store.get(c.key);
  if (!p || p.recoveryHash !== hash(String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''))) return { error: 'Name or recovery code is wrong' };
  const token = crypto.randomBytes(24).toString('hex');
  await store.update(c.key, { tokenHash: hash(token) });   // old devices are logged out
  return { nick: p.nick, token };
}
// who may use this name in a game? registered + right token -> verified; registered + wrong token -> refused; free -> guest
async function check(rawNick, token) {
  const c = cleanNick(rawNick);
  if (c.error) return { nick: String(rawNick || 'Player').slice(0, 16) || 'Player', verified: false };
  const p = await store.get(c.key);
  if (!p) return { nick: c.nick, verified: false };
  if (token && p.tokenHash === hash(token)) return { nick: p.nick, verified: true };
  return { error: `"${p.nick}" is a registered name — log in with its recovery code or pick another` };
}
async function status(rawNick) {
  const c = cleanNick(rawNick); if (c.error) return c;
  return { nick: c.nick, taken: !!(await store.get(c.key)) };
}

module.exports = { register, recover, check, status, storeKind: () => store.kind };
