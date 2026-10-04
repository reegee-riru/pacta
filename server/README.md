# PACTA relay server

Lockstep relay for online matches. It does **not** simulate the game — it only:

- groups players into rooms (4-letter code, host = seat 0, host's settings apply to all),
- stamps each intent with the sender's nation (clients can't act for someone else),
- batches intents into 100 ms turns and broadcasts every turn to the room,
- compares state hashes every 100 turns and warns everyone on a desync,
- hands a disconnected player's nation to a bot (`leave` intent, same turn on every client).

It also serves `../index.html`, so one process is enough.

## Run locally

```bash
cd territory-game/server
npm install
node server.js          # http://localhost:6020  (PORT env var overrides)
```

Open two browser tabs on `http://localhost:6020`, click **Create room** in one, open the invite link (`?room=CODE`) in the other.

## Hosting

Needs a host that keeps a Node process + WebSocket alive (not plain PHP shared hosting).
Any of: Render (free tier sleeps when idle), Fly.io, Railway, a small VPS.

- Start command: `node server.js`, port from `PORT`.
- Health check: `GET /health`.
- If the page is hosted elsewhere (e.g. itch.io), point it at the relay with `?server=wss://your-relay.example`
  or set `CONFIG.net.server` in `index.html`.

## Limits (server.js)

`MAX_PLAYERS` 16 humans per room · 20 intents/s per player · 64 KB max message.

## Registered names

Players can claim a nickname (no e-mail/password): the server stores only the name + hashes; the browser keeps a secret
token, and a one-time **recovery code** moves the name to another device. Registered names show ✓; nobody else can join
with them. Guests can still play with any free name.

- Local: stored in `server/data/players.json` (git-ignored).
- Online (Render's disk is wiped on restart): create a Supabase project, run `SUPABASE.sql`, then set env vars
  `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (service role key — server only) and `TOKEN_PEPPER` (any long random string).
- API: `GET /api/name?nick=`, `POST /api/register {nick}`, `POST /api/recover {nick, code}` (8 tries / 10 min per IP).
