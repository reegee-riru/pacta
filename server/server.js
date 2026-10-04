// PACTA — lockstep relay server.
// It never simulates the game: it groups players into rooms, stamps every intent with the sender's nation,
// batches intents into fixed 100 ms turns and broadcasts each turn to the whole room. Every browser runs the
// same deterministic sim on the same turns, so all of them stay in sync. Also serves ../index.html.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const players = require('./players');

const PORT = +process.env.PORT || 6020;
const TURN_MS = 100;
const MAX_PLAYERS = 16;
const MAX_INTENTS_PER_SEC = 20;
const INTENT_TYPES = new Set(['spawn', 'attack', 'build', 'strike', 'hire', 'donate', 'retreat', 'upgrade', 'rail', 'propose', 'accept', 'decline', 'break']);
const INDEX = path.join(__dirname, '..', 'index.html');

// tiny JSON API for names (CORS open: the game page may live on itch.io)
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...CORS }); res.end(JSON.stringify(obj)); };
const hits = new Map();   // ip -> recent register/recover attempts
function limited(req) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(), now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  list.push(now); hits.set(ip, list);
  return list.length > 8;
}
function body(req) {
  return new Promise(resolve => {
    let b = ''; req.on('data', c => { b += c; if (b.length > 2000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch { resolve({}); } });
  });
}
async function api(req, res, url) {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  try {
    if (url === '/api/name' && req.method === 'GET') return json(res, 200, await players.status(new URL(req.url, 'http://x').searchParams.get('nick')));
    if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
    if (limited(req)) return json(res, 429, { error: 'Too many tries — wait a few minutes' });
    const b = await body(req);
    if (url === '/api/register') return json(res, 200, await players.register(b.nick));
    if (url === '/api/recover') return json(res, 200, await players.recover(b.nick, b.code));
    return json(res, 404, { error: 'unknown' });
  } catch (e) { console.error('api', e.message); return json(res, 500, { error: 'Name service unavailable' }); }
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url.startsWith('/api/')) { api(req, res, url); return; }
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    fs.createReadStream(INDEX).pipe(res);
  } else if (url === '/rooms') {   // public game browser: open lobbies + running matches you can watch / join
    const list = [...rooms.values()].filter(r => r.public).map(r => ({
      code: r.code, host: r.members[0]?.name || '?', hostVerified: !!r.members[0]?.verified, players: r.members.filter(m => m.ws.readyState === 1).length,
      map: r.settings.map || 'random', size: r.settings.size, bots: r.settings.bots, teams: r.settings.teams,
      started: r.started, minutes: Math.floor(r.turn / 600),
    }));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' });
    res.end(JSON.stringify(list));
  } else if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, names: players.storeKind() }));   // names: 'supabase' (persistent) or 'file'
  } else { res.writeHead(404); res.end('not found'); }
});

// shape-check intents before relaying them (clients re-check ranges against the live game)
const UNIT_KINDS = new Set(['infantry', 'artillery', 'raiders', 'tanks']);
const PACTS = new Set(['trade', 'nap', 'tribute', 'defensive', 'alliance', 'eternal']);
const int = v => Number.isInteger(v) && v >= 0 && v < 1e7;
function cleanIntent(it) {
  if (!it || typeof it !== 'object' || !INTENT_TYPES.has(it.type)) return null;
  const o = { type: it.type };
  for (const k of ['tile', 'target', 'x', 'y', 'to', 'from', 'with']) if (k in it) { if (!int(it[k])) return null; o[k] = it[k]; }
  if ('ratio' in it) { if (typeof it.ratio !== 'number' || !(it.ratio >= 0 && it.ratio <= 1)) return null; o.ratio = it.ratio; }
  if ('kind' in it) {
    if (typeof it.kind !== 'string' || it.kind.length > 16) return null;
    if ((it.type === 'attack' || it.type === 'retreat') && !UNIT_KINDS.has(it.kind)) return null;
    if ((it.type === 'propose' || it.type === 'accept') && !PACTS.has(it.kind)) return null;
    o.kind = it.kind;
  }
  if ('what' in it) { if (it.what !== 'troops' && it.what !== 'gold') return null; o.what = it.what; }
  return o;
}

const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });
const rooms = new Map();   // code -> room

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // no I/O: easy to read out loud
function newCode() {
  for (;;) {
    let c = '';
    for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    if (!rooms.has(c)) return c;
  }
}
const send = (ws, m) => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); };
const cleanName = n => String(n || 'Player').replace(/[<>&"]/g, '').trim().slice(0, 16) || 'Player';

function broadcastLobby(room) {
  room.members.forEach((m, i) => send(m.ws, {
    t: 'lobby', code: room.code, you: i, host: 0, players: room.members.map(x => x.name), verified: room.members.map(x => !!x.verified),
    settings: room.settings, seed: room.seed,
  }));
}

function startRoom(room) {
  room.started = true;
  room.members.forEach((m, i) => { m.nation = i + 1; });   // humans are nations 1..n, in seat order
  room.startNames = room.members.map(m => m.name);
  const mins = +room.settings.time || 0;
  room.maxTurns = mins ? (mins + 10) * 600 : 3 * 3600 * 10;   // time limit + 10 min grace, or 3 hours for open-ended matches
  const msg = { t: 'start', seed: room.seed, settings: room.settings, players: room.startNames };
  room.members.forEach(m => send(m.ws, msg));
  room.timer = setInterval(() => {
    room.turn++;
    if (room.turn > room.maxTurns) { room.members.forEach(m2 => send(m2.ws, { t: 'error', msg: 'This match has ended on the server' })); return closeRoom(room); }
    const turn = JSON.stringify({ t: 'turn', n: room.turn, i: room.pending });
    if (room.pending.length) room.history.push([room.turn, room.pending]);   // late joiners replay this
    room.pending = [];
    for (const m of room.members) if (m.ws.readyState === 1) m.ws.send(turn);
    if (room.hashes.size > 20) room.hashes.clear();
  }, TURN_MS);
  console.log(`room ${room.code} started with ${room.members.length} player(s)`);
}

function closeRoom(room) {
  clearInterval(room.timer);
  rooms.delete(room.code);
  console.log(`room ${room.code} closed`);
}

wss.on('connection', ws => {
  let room = null, me = null;

  ws.on('message', raw => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
    handle(m).catch(e => console.error('bad message', e.message));
  });
  async function handle(m) {

    let who = null;
    if ((m.t === 'create' || m.t === 'join') && !room) {   // a registered name needs its token; free names play as guests
      who = await players.check(m.name, typeof m.token === 'string' ? m.token : '');
      if (who.error) return send(ws, { t: 'error', msg: who.error });
      if (room) return;   // a second create/join raced us while we were checking
    }
    if (m.t === 'create' && !room) {
      room = { code: newCode(), members: [], settings: m.settings || {}, seed: m.seed | 0, started: false, public: m.public !== false,
               turn: 0, pending: [], history: [], startNames: [], timer: null, hashes: new Map() };
      rooms.set(room.code, room);
      me = { ws, name: who.nick, verified: who.verified, nation: 0, sent: [] };
      room.members.push(me);
      broadcastLobby(room);
      console.log(`room ${room.code} created by ${me.name}`);
      return;
    }
    if (m.t === 'join' && !room) {
      const r = rooms.get(String(m.code || '').toUpperCase());
      if (!r) return send(ws, { t: 'error', msg: 'No room with that code' });
      if (r.members.filter(x => x.ws.readyState === 1).length >= MAX_PLAYERS) return send(ws, { t: 'error', msg: 'Room is full' });
      room = r;
      me = { ws, name: who.nick, verified: who.verified, nation: 0, sent: [] };
      room.members.push(me);
      if (!r.started) { broadcastLobby(room); return; }
      // running match: send everything so far; the client replays it (the sim is deterministic) and watches,
      // then may take over a bot nation
      send(ws, { t: 'catchup', code: r.code, you: room.members.length - 1, seed: r.seed, settings: r.settings,
                 players: r.startNames, history: r.history, turn: r.turn });
      return;
    }
    if (!room) return;
    const isHost = room.members[0] === me;

    if (m.t === 'settings' && isHost && !room.started) {
      room.settings = m.settings || room.settings; room.seed = m.seed | 0;
      broadcastLobby(room);
    } else if (m.t === 'start' && isHost && !room.started) {
      startRoom(room);
    } else if (m.t === 'intent' && room.started && m.it && INTENT_TYPES.has(m.it.type)) {
      const now = Date.now();
      me.sent = me.sent.filter(t => now - t < 1000);
      if (me.sent.length >= MAX_INTENTS_PER_SEC) return;
      me.sent.push(now);
      const it = cleanIntent(m.it); if (!it) return;
      room.pending.push({ ...it, nation: me.nation });   // the server decides who sent it
    } else if (m.t === 'takeover' && room.started && !me.nation) {
      const id = m.nation | 0;   // clients check the nation is a living bot; the server only stops double claims
      if (id < 1 || room.members.some(x => x.nation === id && x.ws.readyState === 1)) return send(ws, { t: 'error', msg: 'That nation is taken' });
      me.nation = id;
      room.pending.push({ type: 'takeover', nation: id, name: me.name, seat: room.members.indexOf(me) });
    } else if (m.t === 'unclaim' && room.started) {   // the clients rejected our takeover (bot died / taken): free the seat
      me.nation = 0;
    } else if (m.t === 'hash' && room.started) {
      const seen = room.hashes.get(m.turn);
      if (seen === undefined) room.hashes.set(m.turn, m.h);
      else if (seen !== m.h) room.members.forEach(x => send(x.ws, { t: 'desync', turn: m.turn }));
    }
  }


  ws.on('close', () => {
    if (!room || !me) return;
    if (!room.started) {
      room.members = room.members.filter(x => x !== me);
      if (!room.members.length) return closeRoom(room);
      broadcastLobby(room);   // seat 0 is always the host, so the next player inherits it
      return;
    }
    // mid-match: their nation is handed to a bot on every client, in turn order (spectators have none)
    if (me.nation) room.pending.push({ type: 'leave', nation: me.nation });
    me.ws = { readyState: 3 };
    if (room.members.every(x => x.ws.readyState !== 1)) closeRoom(room);
  });
});

server.listen(PORT, () => console.log(`PACTA relay on http://localhost:${PORT}`));
