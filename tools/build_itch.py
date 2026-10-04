"""Build the itch.io upload: dist/pacta-itch.zip with index.html pointed at the online relay.

usage: python tools/build_itch.py [wss://your-relay.onrender.com]
"""
import re, sys, zipfile, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
relay = sys.argv[1] if len(sys.argv) > 1 else 'wss://pacta-relay.onrender.com'
if not relay.startswith('wss://'):
    sys.exit('relay must start with wss://')
html = (root / 'index.html').read_text(encoding='utf-8')
html, n = re.subn(r"server: '[^']*',", f"server: '{relay}',", html, count=1)
if n != 1:
    sys.exit('CONFIG.net.server not found in index.html')
dist = root / 'dist'; dist.mkdir(exist_ok=True)
(dist / 'index.html').write_text(html, encoding='utf-8')
with zipfile.ZipFile(dist / 'pacta-itch.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    z.write(dist / 'index.html', 'index.html')
print(f'dist/pacta-itch.zip ready ({(dist / "pacta-itch.zip").stat().st_size // 1024} KB) -> relay {relay}')
