"""Rasterise Natural Earth data into Territory's real-world maps (REAL_MAPS in index.html).

Put these GeoJSON files next to this script (github.com/nvkelso/natural-earth-vector, folder geojson/):
  ne_50m_land, ne_50m_lakes, ne_10m_rivers_lake_centerlines
Run:  python build_maps.py   (or set NE_DIR=folder-with-the-geojson)   ->  writes real_maps.js (paste over the REAL_MAPS block) + <id>_preview.png
Grid codes: 0 water, 1 plains, 3 mountains, 4 hills, 5 marsh, 6 river, 7 forest/marsh mix (decided in game).
Geography only - nations in the game are always fictional.
"""
import json, math, os
HERE = os.environ.get('NE_DIR') or os.path.dirname(os.path.abspath(__file__))   # data + output folder

REGIONS = {
    'eeu': {
        'name': 'Eastern Europe', 'bbox': (22.0, 40.5, 43.6, 53.0), 'w': 230, 'forest': (0.47, 0.25),
        'rivers': {'Dnieper', 'Dniester', 'Don', 'Donets', 'Desna', 'Prut', 'Bug', 'Southern Bug', 'Pripyat', 'Danube', 'Kuban',
                   'Bratul Chillia', 'Bratul Sfintu Gheorghe', 'Bratul Sulina', 'Borcea', 'Siret', 'Olt', 'Ialomita', 'Seym', 'Vorskla', 'Psel'},
        'skip_lakes': {'Kakhovka'},   # destroyed in 2023 - leave it out
        'mountains': [
            [(22.0, 49.6), (23.0, 49.4), (24.0, 48.9), (25.0, 48.2), (25.8, 47.6), (26.4, 46.8), (26.6, 45.9), (26.0, 45.4), (25.0, 45.2),
             (23.5, 45.1), (22.0, 45.0), (22.0, 44.6), (23.5, 44.7), (25.0, 44.85), (26.0, 45.0), (26.2, 45.6), (25.9, 46.6), (25.3, 47.4),
             (24.4, 48.0), (23.4, 48.6), (22.6, 48.9), (22.0, 49.0)],                                         # Carpathians
            [(33.4, 44.45), (34.4, 44.6), (35.3, 44.85), (35.4, 45.0), (34.5, 44.85), (33.6, 44.7)],         # Crimean Mountains
        ],
        'hills': [
            [(23.8, 50.6), (26.5, 50.4), (28.5, 49.6), (29.5, 48.6), (28.0, 48.2), (25.5, 48.6), (24.0, 49.6)],   # Volhynian-Podolian
            [(29.0, 50.0), (31.5, 49.5), (32.5, 48.5), (31.0, 47.9), (29.5, 48.4)],                                 # Dnieper Upland
            [(37.5, 48.6), (39.8, 48.3), (40.2, 47.8), (38.0, 47.9)],                                               # Donets Ridge
            [(35.0, 52.8), (38.5, 52.8), (39.5, 51.0), (37.5, 50.4), (35.5, 51.2)],                                 # Central Russian Upland
            [(27.8, 47.4), (28.9, 47.3), (28.6, 46.8), (27.9, 46.9)],                                               # Codri
        ],
        'marsh': [
            [(28.7, 45.5), (29.7, 45.4), (29.7, 44.8), (28.9, 44.9)],    # Danube delta
            [(32.4, 46.7), (33.5, 46.8), (33.6, 46.5), (32.5, 46.45)],   # lower Dnieper floodplain
            [(37.5, 46.1), (38.3, 46.2), (38.4, 45.3), (37.5, 45.3)],    # Kuban delta
        ],
        'mix': [[(23.8, 52.4), (27.0, 52.6), (30.5, 52.3), (31.0, 51.6), (29.0, 51.2), (26.0, 51.3), (24.2, 51.6)]],   # Polesia
        'extra_rivers': [],
        'bridges': [],
        'connect': [((34.2, 45.2), (33.8, 46.6), [(33.7, 46.2), (33.75, 45.95)])],   # Crimea <-> mainland over Perekop
        'labels': [('Dnipro', 31.2, 49.55, 'river'), ('Dniester', 27.9, 48.3, 'river'), ('Danube', 26.6, 43.85, 'river'),
                   ('Don', 39.6, 47.4, 'river'), ('Desna', 32.5, 51.55, 'river'), ('Pripyat', 26.5, 51.75, 'river'),
                   ('Carpathians', 24.7, 47.5, 'land'), ('Crimea', 34.3, 45.25, 'land'), ('Polesia', 27.6, 51.95, 'land')],
    },
    'baltics': {
        'name': 'Baltics', 'bbox': (20.0, 30.0, 53.8, 59.75), 'w': 200, 'forest': (0.45, 0.0),
        'rivers': {'Zapadnaya Dvina', 'Vilija', 'Velikaya', 'Narva', 'Nemunas', 'Dnieper'},
        'skip_lakes': set(),
        'mountains': [],
        'hills': [
            [(25.6, 57.3), (26.6, 57.2), (26.7, 56.75), (25.8, 56.7), (25.4, 56.95)],    # Vidzeme Upland
            [(26.8, 56.45), (28.0, 56.4), (28.1, 55.8), (27.0, 55.75), (26.6, 56.0)],    # Latgale Upland
            [(21.5, 57.0), (22.3, 57.1), (22.6, 56.7), (21.8, 56.5), (21.4, 56.7)],      # Kurzeme hills
            [(21.8, 56.2), (22.8, 56.2), (22.9, 55.6), (22.0, 55.55)],                   # Samogitian Upland
            [(25.3, 55.9), (26.6, 55.8), (26.7, 55.2), (25.5, 55.0)],                    # Baltic (Aukstaitija) Upland
            [(26.3, 58.15), (27.3, 58.1), (27.4, 57.6), (26.5, 57.55)],                  # Haanja / Otepaa
            [(25.8, 59.15), (26.6, 59.1), (26.6, 58.85), (25.9, 58.8)],                  # Pandivere
            [(25.3, 58.5), (25.9, 58.4), (25.9, 58.0), (25.3, 58.1)],                    # Sakala
            [(26.0, 54.4), (28.0, 54.3), (28.3, 53.8), (26.2, 53.85)],                   # Minsk Upland
        ],
        'marsh': [
            [(24.6, 58.55), (25.2, 58.55), (25.2, 58.3), (24.6, 58.3)],     # Soomaa
            [(26.0, 56.7), (26.6, 56.7), (26.5, 56.5), (26.0, 56.5)],       # Teici
            [(23.3, 57.0), (23.6, 57.0), (23.6, 56.85), (23.3, 56.85)],     # Kemeri
            [(21.2, 55.4), (21.7, 55.4), (21.7, 55.15), (21.2, 55.15)],     # Nemunas delta
            [(27.9, 58.9), (28.6, 58.9), (28.4, 58.3), (27.9, 58.4)],       # east of Peipus
            [(28.0, 55.6), (29.0, 55.7), (29.2, 55.2), (28.2, 55.1)],       # Polotsk lowland bogs
        ],
        'mix': [],
        # rivers missing from the data, traced roughly by hand
        'extra_rivers': [
            [(25.95, 57.0), (26.35, 57.35), (26.0, 57.6), (25.45, 57.55), (25.2, 57.35), (24.85, 57.15), (24.27, 57.13)],   # Gauja
            [(22.6, 55.9), (22.4, 56.3), (22.0, 56.6), (21.97, 56.97), (21.56, 57.4)],                                      # Venta
            [(24.2, 56.4), (23.73, 56.65), (23.6, 56.85), (23.94, 57.04)],                                                 # Lielupe
            [(26.0, 58.35), (26.72, 58.38), (27.2, 58.38)],                                                                # Emajogi
            [(25.6, 58.7), (24.95, 58.55), (24.5, 58.38)],                                                                 # Parnu
        ],
        # short "ferry causeways" so the islands stay in play (the game has no sea crossing)
        'bridges': [[(23.56, 58.57), (23.12, 58.58)], [(22.52, 58.6), (22.56, 58.76)]],
        'connect': [],
        'labels': [('Daugava', 25.6, 56.35, 'river'), ('Nemunas', 22.6, 55.15, 'river'), ('Gauja', 25.15, 57.45, 'river'),
                   ('Venta', 21.75, 56.8, 'river'), ('Neris', 24.9, 54.75, 'river'), ('Narva', 28.0, 59.25, 'river'),
                   ('Peipus', 27.5, 58.75, 'river'), ('Saaremaa', 22.55, 58.35, 'land')],
    },
}

def pip(px, py, ring):
    inside = False; j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]; xj, yj = ring[j][0], ring[j][1]
        if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi + 1e-12) + xi: inside = not inside
        j = i
    return inside

def polys(geom):
    if geom['type'] == 'Polygon': return [geom['coordinates']]
    if geom['type'] == 'MultiPolygon': return geom['coordinates']
    return []

LAND = json.load(open(os.path.join(HERE, 'ne_50m_land.geojson'), encoding='utf-8'))['features']
LAKES = json.load(open(os.path.join(HERE, 'ne_50m_lakes.geojson'), encoding='utf-8'))['features']
RIVERS = json.load(open(os.path.join(HERE, 'ne_10m_rivers_lake_centerlines.geojson'), encoding='utf-8'))['features']

def build(rid, R):
    lon0, lon1, lat0, lat1 = R['bbox']; W = R['w']
    dlon = (lon1 - lon0) / W; dlat = dlon * math.cos(math.radians((lat0 + lat1) / 2)); H = round((lat1 - lat0) / dlat)
    center = lambda x, y: (lon0 + (x + 0.5) * dlon, lat1 - (y + 0.5) * dlat)
    at = lambda lon, lat: (int((lon - lon0) / dlon), int((lat1 - lat) / dlat))
    near = lambda ring: not (max(c[0] for c in ring) < lon0 - 1 or min(c[0] for c in ring) > lon1 + 1 or
                             max(c[1] for c in ring) < lat0 - 1 or min(c[1] for c in ring) > lat1 + 1)
    land = [p for f in LAND for p in polys(f['geometry']) if near(p[0])]
    lakes = [p for f in LAKES if (f['properties'].get('name_en') or '') not in R['skip_lakes']
             for p in polys(f['geometry']) if near(p[0])]
    inside = lambda lon, lat, pl: any(pip(lon, lat, p[0]) and not any(pip(lon, lat, h) for h in p[1:]) for p in pl)
    g = [[1 if inside(*center(x, y), land) and not inside(*center(x, y), lakes) else 0 for x in range(W)] for y in range(H)]

    def line(pts, code, only_land=True):
        for a, b in zip(pts, pts[1:]):
            n = max(1, int(max(abs(b[0] - a[0]) / dlon, abs(b[1] - a[1]) / dlat) * 4))
            for k in range(n + 1):
                x, y = at(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n)
                if 0 <= x < W and 0 <= y < H and (g[y][x] or not only_land): g[y][x] = code
    for br in R['bridges']: line(br, 1, only_land=False)
    def paint(shapes, code):
        for y in range(H):
            for x in range(W):
                if g[y][x] and any(pip(*center(x, y), s) for s in shapes): g[y][x] = code
    paint(R['hills'], 4); paint(R['mix'], 7); paint(R['marsh'], 5); paint(R['mountains'], 3)
    foot = [(x, y) for y in range(H) for x in range(W) if g[y][x] in (1, 7) and any(
        0 <= y + dy < H and 0 <= x + dx < W and g[y + dy][x + dx] == 3 for dy in range(-2, 3) for dx in range(-2, 3))]
    for x, y in foot: g[y][x] = 4
    for f in RIVERS:
        nm = f['properties'].get('name_en') or f['properties'].get('name') or ''
        if nm not in R['rivers'] or not f['geometry']: continue
        geo = f['geometry']
        for ln in (geo['coordinates'] if geo['type'] == 'MultiLineString' else [geo['coordinates']]): line(ln, 6)
    for ln in R['extra_rivers']: line(ln, 6)

    def comps():
        seen = [[-1] * W for _ in range(H)]; sizes = []
        for y in range(H):
            for x in range(W):
                if g[y][x] and seen[y][x] < 0:
                    cid = len(sizes); st = [(x, y)]; seen[y][x] = cid; n = 0
                    while st:
                        cx, cy = st.pop(); n += 1
                        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                            if 0 <= nx < W and 0 <= ny < H and g[ny][nx] and seen[ny][nx] < 0: seen[ny][nx] = cid; st.append((nx, ny))
                    sizes.append(n)
        return seen, sizes
    for a, b, fix in R['connect']:
        seen, _ = comps(); (ax, ay), (bx, by) = at(*a), at(*b)
        if seen[ay][ax] != seen[by][bx]: line(fix, 1, only_land=False)
    seen, sizes = comps()
    big = max(range(len(sizes)), key=lambda i: sizes[i])
    kept = sum(1 for y in range(H) for x in range(W) if g[y][x] and seen[y][x] == big)
    flat = [str(c) for row in g for c in row]
    runs, i = [], 0
    while i < len(flat):
        j = i
        while j < len(flat) and flat[j] == flat[i]: j += 1
        runs.append(flat[i] + format(j - i, 'x')); i = j
    print(rid, W, 'x', H, 'land kept', kept, 'of', sum(sizes), 'islands', len(sizes) - 1, 'rle', len(','.join(runs)))
    try:
        from PIL import Image
        COL = {0: (36, 66, 104), 1: (128, 160, 96), 3: (138, 130, 120), 4: (150, 156, 104), 5: (88, 108, 84), 6: (74, 128, 178), 7: (72, 112, 66)}
        im = Image.new('RGB', (W, H)); im.putdata([COL[c] for row in g for c in row])
        im.resize((W * 3, H * 3), Image.NEAREST).save(os.path.join(HERE, rid + '_preview.png'))
    except Exception as e:
        print('no preview', e)
    labels = [{'t': t, 'x': round((lon - lon0) / dlon, 1), 'y': round((lat1 - lat) / dlat, 1), 'k': k} for t, lon, lat, k in R['labels']]
    return '  %s: { name: "%s", w: %d, h: %d, forest: [%s, %s],\n    data: "%s",\n    labels: %s },' % (
        rid, R['name'], W, H, R['forest'][0], R['forest'][1], ','.join(runs), json.dumps(labels))

out = 'const REAL_MAPS = {\n' + '\n'.join(build(k, v) for k, v in REGIONS.items()) + '\n};'
open(os.path.join(HERE, 'real_maps.js'), 'w', encoding='utf-8').write(out)
print('written real_maps.js', len(out))
