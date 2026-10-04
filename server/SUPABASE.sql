-- PACTA: registered nicknames. Run once in the Supabase SQL editor.
-- The game server talks to this table with the SERVICE key (server-side only, never in the browser).
create table if not exists players (
  nick_key      text primary key,          -- lower-case name, unique
  nick          text not null,             -- name as typed
  token_hash    text not null,             -- sha256 of the browser's secret token
  recovery_hash text not null,             -- sha256 of the recovery code
  created_at    timestamptz not null default now()
);
alter table players enable row level security;   -- no public access; only the service key (server) can read/write
