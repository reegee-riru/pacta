# Territory — economy, paths & buildings (design v1)

Status: proposal, 2026-10-04. Nothing here is built yet.

## 1. One victory

The match has **one** winner, decided by **Prestige** (one number, shown on the leaderboard):

- **Total conquest** — hold the host's win share of land (60–90%) → instant win.
- **Otherwise, at the time limit** → highest Prestige wins (∞ matches: first to the host's Prestige target).

Prestige comes from every path, so a small, clever nation can win without out-fighting the big one:

| Source | Prestige |
|---|---|
| Land held | +1 per 100 tiles every 10 s |
| Gold earned (lifetime) | +1 per 500 gold |
| Each research step | +15 |
| Each path's final building (wonder) | +100 |
| Allies (influence) | +1 per ally every 10 s |
| Nation eliminated by you | +25 |

Numbers live in CONFIG and get tuned by bot simulations, as before.

## 2. Resources

| Resource | From | Spent on |
|---|---|---|
| **Troops** | population growth (as now) | attacks, garrison |
| **Gold** | worked land + Mines + Markets | buildings, artillery/raiders, air strikes |
| **Science** | Universities | research steps |
| **Influence** | allies + Monuments | diplomatic actions |

**Workforce slider** (one new control): % of population that works instead of fighting.
More workers → more gold & science, slower troop growth. One clear trade-off, every second of the match.

## 3. Four paths (research tracks)

Each path is a 4-step track. Steps cost Science (economy steps cost Gold, influence steps cost Influence).
Every step is a permanent bonus; step 4 unlocks that path's **wonder** (big Prestige + a unique power).
You can mix paths, but you can't afford all of them — that is the strategy.

| | Military | Science | Economy | Influence |
|---|---|---|---|---|
| 1 | Drill: +10% attack | Engineering: Forts +50% hp/range | Mining: Mines +30% | Envoys: +1 influence/ally |
| 2 | Logistics: attacks 25% faster | Medicine: +15% max troops | Banking: 2% interest on gold, capped | Pact: non-aggression treaty with a non-ally (influence) |
| 3 | Unlock **Raiders** + **Artillery** | Unlock **Air strike** + **Air defense** | Trade: Markets link with allied Markets (+gold both) | Sway: peacefully annex a neutral/tiny neighbour that has < 1/4 your influence |
| 4 | Wonder **War College**: +20% attack & defence for you and allies | Wonder **Metropolis**: one city, +100% max troops | Wonder **Grand Exchange**: gold → Prestige | Wonder **Grand Council**: allies' land counts 25% toward your Prestige |

Weapons now come **from progress**, not from minute one — the early game stays simple, the late game gets the toolbox.

## 4. Buildings and how they work together

Rule of thumb: every building has one job and **likes** one or two neighbours.
Each liked building within **5 tiles** gives **+15%** (max 3 neighbours = +45%).
The placement preview shows the bonus before you click.

| Building | Job | Likes (+15% each, within 5 tiles) | Notes |
|---|---|---|---|
| **City** | +max troops, +troop growth | Market, Monument | heart of a district |
| **Mine** | +gold (mountains only) | Market | gold where it's hard to conquer |
| **Market** | +gold | City, Mine | step Economy-3: links with allied Markets |
| **University** | +science | City | |
| **Monument** | +influence | City | |
| **Fort** | defence ×2 nearby (as now) | City (citadel) | protects buildings in range from capture cost |
| **Air defense** | blocks air strikes nearby (as now) | — | protects a whole district |

**The core tension:** packing buildings into a district stacks bonuses (City + Market + University + Mine ≈ +45% each),
but an **air strike (radius 2) wrecks a whole district at once**. So clusters need Air defense and Forts,
spread-out buildings are safe but weak. Bombing a rival's science district is how you stop a science leader.

Capturing a tile with a building **captures the building** (instead of destroying it) — conquest steals economy.
Air strikes still destroy.

## 5. Bots

Each bot gets a **personality** at spawn (seeded): Warlord / Scholar / Merchant / Diplomat.
It sets the workforce slider, which path it researches first and which buildings it prefers.
Same core AI as now, just weighted — keeps the mix of strategies on the map.

## 6. Lobby (host settings)

- Victory: Prestige + conquest (default) / conquest only.
- Start tech: none (default) / all unlocked (current behaviour, for quick fights).

## 7. Build order (each step playable + simulated)

1. Workforce slider + City / Mine / Market + the adjacency rule.
2. Science + University + the 4 research tracks (weapons move behind research).
3. Prestige + the new victory rule + leaderboard by Prestige.
4. Influence: Monument, alliance points, Pact, Sway.
5. Wonders + bot personalities + balance pass (do small clever nations win sometimes? does one path dominate?).

## Risks

- Real-time game + many systems = can get noisy. Every building = one number + one "like" rule, no exceptions.
- Bots must use every path, or the simulations lie. Personalities handle that.
- Influence depends on alliances; mid-game alliances/betrayal still need building (step 4 adds simple Pacts first).

## Built 2026-10-04 (after playtest feedback)

- **Units** with distinct behaviour: Infantry (broad wave), Artillery (shells the enemy army), Raiders (narrow spear, loots gold), Tanks (heavy, cheap per tile). Clash cycle Inf > Raid > Art > Tanks > Inf.
- **Defences:** Fort, Bunker, Minefield (hidden trap), Air defense.
- **Economy:** City, Market, Mine, **Logistics hub** — adjacency likes (+15% each, max 3); captured intact; calm revolts nearby.
- **Upgrades:** click your building → level 2 (×2 base cost) / 3 (×4); +60% output per level, defences gain range.
- **Trade network:** Markets trade with foreign Markets in range (10 tiles) or through hubs (14/18/22 tiles); hub owner takes 3/4/5% toll (by level — science will add later). Neighbours ×1.5, pacts ×1.25/1.5/2. No trade for 30 s after an attack between two nations. **Railway** (600g on a hub) links rail hubs up to 45 tiles apart, only with transit rights (same team or any pact).
- **Diplomacy** (right-click a nation or click its leaderboard row): Trade pact (5 min, +25% trade, transit), Alliance (10 min, peace, shared air defence, +50% trade), Eternal (forever, 500g, +10% max troops, ×2 trade, shared victory row, can't break). Breaking a trade pact −10% gold; breaking an alliance = betrayal (−25% gold, half trade 3 min, traitor 10 min — bots refuse you, victim +25% defence vs you 2 min). Attacking a trade partner auto-breaks the pact.
- Bots: answer/propose pacts, sometimes betray much weaker allies, build hubs at borders, railways, upgrade.

## Round 3 (2026-10-04, playtest feedback)

- **Game speed** host setting Slow 0.5 / Normal 0.7 / Fast 1.0 (old pace) — scales growth, income, attack speed, artillery barrage, bot thinking, air-strike cooldown.
- **Pacts:** Trade (5 min), Non-aggression (8), Tribute (10, payer gives 10% income), Defensive (10, call to arms +25% vs aggressor), Alliance (10), Eternal. Harsher breaks: up to −40% gold, 20% troops desert to the victim, traitor up to 15 min (bots refuse + gang up), half trade, victim +40% defence. Trade-pact break = gold only.
- **Prisoners:** 5% of attacker losses on your land join you (20% under any defence); a broken attack surrenders half of what's left.
- **Defences:** + Barbed wire (vs infantry/raiders), Hedgehogs (vs tanks). Defence multipliers now live on the buildings (`builds.*.vs`).
- **Visuals:** little soldiers / tanks / guns / riders at each front with troop count; trade routes drawn as roads (rail for long rail links) with moving cargo crates.

## Round 4 (2026-10-04)

- **Terrain:** + Hills, Marsh, Rivers (flow downhill from mountains to the sea). Each terrain has movement points per unit (plains 1; tanks 2.2 forest / 3 marsh / 3.5 mountains) and an extra troop cost per unit (tanks ×1.5–2 in forest/marsh/mountains/rivers).
- **Aim:** units hold the clicked direction tighter (spread halved).
- **Spearheads bleed:** a tile with enemies on most sides costs up to +80% troops. **Pockets:** any part of a nation cut off from its largest body is hatched and costs half to take; the capital always moves into the main body.
- **Stability 0–100** (with Rebellions on): new fronts −0.5, air strike −2, war −0.025/s per enemy, overreach, broken pacts (−3 … −25); peace +0.3/s after 30 s, pacts, economy. Levels: Stable ≥60 · Protests (−10% gold/growth) · Strikes (−25%) · Riots (−40%, buildings wrecked) · Revolution (<8: 8% of land breaks away, −20% army, reset to 35). Unstable bots stop opening new fronts.
- **UI:** compact HUD with stability bar (details behind ▾), one Activity panel (fronts + diplomacy), top-5 leaderboard, one bottom command bar (units · send % · Build · ?), build drawer with tabs, help as a modal.
- **Map idea (pending):** real Eastern Europe geography with fictional nations — NOT a Russia–Ukraine scenario (ongoing war; backlash/platform risk). Needs open geodata (Natural Earth) download, ask first.

## Eastern Europe map (2026-10-04)

Lobby **Map: Random island / Eastern Europe**. 230×175 grid, lon 22–40.5°E, lat 43.6–53°N. Coastlines, lakes and main rivers
(Dnipro, Dniester, Don, Donets, Desna, Prut, Bug, Southern Bug, Pripyat, Danube, Kuban …) rasterised from Natural Earth
(public domain); Carpathians, Crimean Mountains, uplands, Polesia and the Danube/Kuban deltas drawn by hand; forests from
noise, denser in the north. Kakhovka reservoir left out (destroyed 2023). Nations stay fictional; only geographic labels.
Big maps scale spawn radius + starting troops by sqrt(land/6000) (max 2.5×). Build script: `tools/build_eeu.py` — put the Natural Earth GeoJSON files (ne_50m_land, ne_50m_lakes,
ne_10m_rivers_lake_centerlines from github.com/nvkelso/natural-earth-vector) next to it, run it, paste eeu_map.js into index.html.

## Baltics map + hub fix (2026-10-04)

- **Baltics** map (200×217, lon 20–30°E, lat 53.8–59.75°N): Natural Earth coast/lakes (Peipus, Pskov, Võrtsjärv), Daugava, Nemunas,
  Neris, Narva, Velikaya; Gauja, Venta, Lielupe, Emajõgi, Pärnu traced by hand; uplands (Vidzeme, Latgale, Haanja, Pandivere,
  Samogitian…) and bogs (Soomaa, Teiči, Ķemeri…) by hand; Saaremaa/Muhu/Hiiumaa kept via short "ferry causeways". Sea names removed
  from all maps. One builder for all regions: `tools/build_maps.py` (NE_DIR=folder with the GeoJSON).
- **Hub fix:** ranges were too short (hub 14, market 10) — real games had markets 25–33 tiles apart, so hubs did nothing.
  Now hub 22 (+6/level), market 14, and every hub builds **supply roads** to your own City/Market/Mine in reach (+20% output),
  so it always shows roads + cargo. Hub popup says what it supplies and how many routes pass through. Placement shows the reach circle.
- Bots: cities and markets in step (no more 90 cities / 6 markets on big maps); hubs go on the border near one of their markets.

## Round 6 (2026-10-04): MMO lobby, science, ports, icons, encirclement

- **Game browser** (lobby, right): server `/rooms` lists public rooms (lobbies + running matches). "List my room publicly" toggle.
  **Late join:** server keeps the turn history; a joiner gets `catchup`, replays every turn (deterministic) and watches;
  clicking a bot nation sends `takeover` (server prevents double claims, clients check it's a living bot). Verified: joiner and
  host identical at 27 hash checkpoints incl. replay + takeover.
- **Map picker** with thumbnails (Random island / Eastern Europe / Baltics).
- **HUD:** "of which trade" gold/s; Research level + progress bar.
- **University** (J): science; each research level +4% growth & gold, +3% attack & defence, +0.5% hub/port toll.
  Universities in the same trade network (roads/hubs/ports/markets, also a peaceful neighbour's) +25% each (max 3), violet links.
- **Port** (O, coast only): fishing gold; shipping lanes to ports ≤60 tiles (any nation not at war), relays trade like a hub; ships on the lanes.
- **Building icons** (city houses, market awning, mine, warehouse, university columns, anchor, fort towers, bunker dome, AA gun).
  Supply roads grow as a tree (nearest node), not a star. Gold dot = building on a supply road.
- **Encirclement:** a pocket = cut-off piece < 15% of the main body (bigger pieces are just exclaves). Taking it costs 30%,
  its defenders surrender to the attacker (2× prisoners). Your own pocket pays no gold and loses 5% of a tile's garrison per tile
  per second; half of that flees as **refugees** to whoever surrounds it.

## Round 7 (2026-10-04): deposits, seasons, supply, numbers

- **Deposits:** Oil (Oil well, 6 g/s, field holds 10 000 g then runs dry), Coal (Mine, 3.5 g/s, 14 000), Iron ore (Mine, 2.5 g/s,
  16 000; each active iron mine −15% gold cost of units, max −45%), Black earth (passive: +0.02 g/s per tile and up to +50% troop
  growth by share held). More extractors drain a field faster; 50%/25%/dry pop up. Eastern Europe: Donbas & Lviv-Volyn coal,
  Kryvbas & Kursk iron, Carpathian / Ploiești / Poltava oil, black-earth belt. Baltics: oil shale, amber, peat, bog iron,
  Zemgale + central Lithuania black earth. Random maps: oil on plains/marsh, coal in hills, iron in hills/mountains, noise black earth.
- **Seasons** (host setting): summer → winter (rivers & marshes freeze and cross like plains, all movement ×1.4 slower, growth −20%)
  → mud (tanks & artillery ×2 slower, raiders ×1.5 on open ground). Frost / mud tint on the map, HUD countdown.
- **River line:** attacking a river tile +25% (not in winter). **Supply lines:** attacking > 35 tiles (× map scale) from your capital
  with no hub/port of yours in reach +20%.
- **Floating numbers** (P toggles): front losses both sides, POW, surrendered, loot, building income every 5 s, science, stability
  hits, research level-ups, field depletion, air strikes, revolts, cut-off losses, refugees.

## Polish + review pass (2026-10-04)

- **Look:** NW hillshade, snowy ridges, speckled forests, water depth gradient + surf line, lighter nation wash with crisp
  borders, "TERRITORY" brand, Rajdhani/Inter fonts, unit + building pictures on the buttons, shorter season label.
- **Fixed after a full code review:** takeover during spawn desynced the joiner (now never changes phase in spawn, seat-checked,
  failed takeovers free the seat); intents validated on server (shape) and client (ranges) — junk can't crash/corrupt anyone and the
  server survives `null`; humans who left during spawn are auto-placed; dead nations' pacts/tribute removed; an old proposal can't
  replace an equal/deeper pact (never an eternal one); breaking a tribute only clears that tribute; mines only extract coal/iron;
  rebels in team mode no longer crash the HUD and appear in standings; late join into an ended match stays ended; catch-up replays
  in chunks with a progress hint and buffers live turns; server closes rooms after time limit + 10 min (3 h for ∞).
- **Not done (measured fine for now):** structure lookups are linear scans (≈0.4 ms/tick on big maps); trade graph is O(nodes²).

## Names + cities (2026-10-04)

- **Registered names:** claim a nick in the lobby (server/players.js): token in localStorage + one-time recovery code; registered
  names get ✓ and can't be used by anyone else; guests still play. Storage: JSON locally, Supabase online (server/SUPABASE.sql).
- **Bots in multiplayer:** the host's Bots setting applies online too; leavers become bots; late joiners can take bots over.
- **Real cities:** on Eastern Europe / Baltics the bots start in the biggest real cities (largest first) with made-up names that
  echo them (Kyvaria, Harkovia, Odessara… Rigavia, Tallindor, Vilnara…). Every capital is marked with a star.

## PACTA — name + Swiss minimal look (2026-10-04)

- **Name:** PACTA ("pacta sunt servanda" — tagline "Make pacts. Break them."). Marchlands and Borderfall were already taken by
  very similar territory games; no strategy game called Pacta found.
- **Look:** Swiss minimal + pixels: light UI (white panels, black Inter 800 type, 3–4 px corners, no glow), quiet paper-like terrain
  palette with subtle NW relief and snowy ridges, pale water with a shore line, pixel grid when zoomed in. Nations are flat muted
  fields with **white pixel borders**; the local player is the only loud colour (#ff4d00). Deposits = sparse dark dots,
  black earth = slightly warmer soil. Map labels black with white halo; geo labels in muted ink.
- Folder / localStorage keys keep the old "territory" name on purpose (renaming them would log players out of their names).

## Relations, kinship, trade pacts, resource fog (2026-10-04)

**Trade needs a pact.** Markets only trade (and hubs only relay) across a border when both sides share a Trade pact,
Defensive pact, Alliance or Eternal alliance (`CONFIG.diplo.*.trade`). Team-mates always trade. Bots now open most
relationships with a trade pact and reach out to the nation that likes them most.

**Opinion (−100…100)** — rebuilt every 5 s in `relationsUpdate()` from readable reasons (shown as chips in the nation popup):

| Reason | Value | IR idea |
|---|---|---|
| kindred people | up to +20 | identity / kinship |
| trade routes between you | +5 each, max +25 | commercial peace |
| pact | +10 trade … +50 eternal (tribute payer −5) | institutions |
| shared border | −5 | proximity breeds friction |
| their forts on our border | −2 each, max −15 | security dilemma |
| too powerful (>25 % of land) | −20 from everyone | balance of power / coalitions |
| common enemy | +15 | "enemy of my enemy" |
| seeking protection | +10 (tiny nation next to a big peaceful one) | bandwagoning |
| remembers attacks / betrayal | −20 per new front, −60 per broken pact ≥ defensive, floor −80, heals +2.5 / 5 s | grudge memory |
| traitor | −25 | reputation |

Bots: acceptance chance ×(1 + opinion/100), war target weight ×(1 − opinion/150), betrayal ×2 if they dislike, ×0.5 if they like.

**Kinship by colour.** Hue difference < 40° = related peoples (kin 0…1). Trade between kin +8 %·kin; conquering kin moves
8 %·kin slower; +20·kin opinion. Small, but adds texture (blue + light blue cooperate, blue vs red fight).

**Resource fog + clarity.** Deposits are drawn and listed in the tooltip only on your own land. Your deposits are drawn in
their own colour (oil black, coal grey, iron rust, black earth = brown seed dots) with a label pill (`Coal 80% · build Mine`,
green outline once tapped). HUD row *Resources*: black-earth share + tapped/total per deposit type.

**Depth.** Relief stronger (0.24), terrain shows 28 % through the nation colour, and each country has a 1-tile bevel
(lit top/left, shaded bottom/right) so it reads as a slightly raised plate.

UI: build buttons fixed 102 px, toast top-centre, Activity panel follows HUD height, bottom ratio label no longer overflows.

## Round 9 — playtest fixes (2026-10-04)

- **Defence lines in one click:** pick Wire / Hedgehogs / Mines / Bunker / Fort, then click a *neighbour* → the whole shared border
  is lined every few tiles (`fortLine`, gap per type, max 15 per click, stops when gold runs out). Defence mode stays selected.
  Intent: `{type:'build', kind, target}` (no new server type).
- **Trade pact up front:** Diplomacy card is always visible in play with "⇄ Offer trade pact to all neighbours"; trade offers are
  listed first, highlighted, with a life bar; offers to humans wait 90 s (bots 30 s). Nation popup: Trade pact is the top button.
- **Calmer pace:** slow/normal/fast 0.45 / 0.6 / 0.9 (was 0.5 / 0.7 / 1).
- **Roads stay put:** each building keeps its hub + link (`st.road/roadHub/roadSeq`) until one end is lost; markets keep their
  trade partners while still reachable (`a.partners`). Only conquest or an expired pact re-routes.
- **Gifts to anyone not at war** (gold or troops, % slider) → +opinion "gifts" (1 per 15 gold / 40 troops, max +30, fades).
- **Air strikes fly:** plane from your capital, dashed contrail, red reticle on the target, 1.5–4 s flight (`flights`), then
  flash/fireball/smoke; air defence → "SHOT DOWN" with flak. Victim gets an "incoming" warning.
- **Conquest loot:** wiping a nation out gives its treasury + 300 + 0.5 × its peak tiles.
- **Gold sinks / balance:** bots were sitting on up to 35k gold.
  - *Mercenaries* (Ability tab): gold → troops at 2 per gold, up to 130 % of max troops, dearer the more you hire; extra above
    max drifts off ~2 %/s.
  - *Treasury cap* 2500 + 0.5/tile: gold above it leaks 3 % of the excess per game-second (HUD shows the red −x/s).
  - *Nuke* (6000 g, key A): missile can't be intercepted, radius 7 wiped (all buildings), 30 % of victim troops lost, fallout
    stripes nobody can conquer for ~4 min, −25 stability for you and −40 opinion from every nation. Bots use it rarely.
  - Result: richest bots now ~5–10k at 20 min instead of 15–35k.
- **UI:** build hint moved into the build drawer header (no floating card), drawer sits exactly on the bar, toast placed between
  the side cards (or under the leaderboard when narrow), Activity height stops above the drawer/bar, popup never taller than the
  screen, bottom bar wraps only below 780 px. Checked at 800×600, 1024×640 and 375×812.

## Round 10 (2026-10-04)

- **Nuke interception:** each Air defence holds 1 interceptor per level (reload ~2 game-min each). A nuke over land covered by
  ≥2 loaded interceptors (own + allies, nearest batteries first) is shot down: blue trails from the batteries + burst,
  "☢ NUKE INTERCEPTED". So: one Lv2 battery or two Lv1 batteries. The world's anger/stability cost now applies at launch.
- **Plunder per tile:** every tile taken in an attack gives 60 % of the defender's per-tile treasury share + 0.5 × the land's
  gold value ×100 (≈1.5 g plains, 5.5 g mountains). Plus the elimination loot from round 9.
- **Map fills the screen:** in a match the camera "covers" the window (no empty frame), can't zoom out past the edges, starts
  centred on you; ⛶ button = browser full screen.
- **Deposits clearer:** your deposit fields are tinted in the resource colour with a dense checker dot pattern; the label pill
  sits on the part you hold, is drawn above nation names, and reads `Coal 99% · +3.5/s` / `· build Mine here` / `· empty`
  (short tag when zoomed out).

## Round 11 — Home guard (2026-10-04)

Every attack on owned land meets an automatic **home guard** of infantry (`CONFIG.guard`): it musters over a few seconds up to
min(35 % of the defender's troops ÷ number of fronts, 0.8 × attacking force) and fights the attackers every tick via the clash
table (infantry beats raiders, loses to tanks). The guard stays part of the defender's army (land keeps full density defence);
only its losses come off the defender's troops. **Home-ground odds** = √(attacker tiles / defender tiles), clamped 0.4–1.8:
a small nation's guard hits harder and takes less against a giant, a giant's guard is half-hearted — without it the guard
fed the snowball (leader 35 % vs 25 %). With it: leaders ~13–17 % at 20 min (vs 19–25 % without guard).
UI: Fronts list shows "vs N" (their guard) on your attacks and 🛡N (your guard) on incoming; guard soldiers drawn in the
defender's colour at the front.
