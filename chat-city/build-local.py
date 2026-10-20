"""Create a fully offline, double-clickable local version. No build dependencies."""
from pathlib import Path
import base64
import re

ROOT = Path(__file__).resolve().parent
DIST = ROOT
art = 'data:image/webp;base64,' + base64.b64encode((DIST/'assets/town.webp').read_bytes()).decode('ascii')
html = (DIST/'index.html').read_text()
css = (DIST/'styles.css').read_text().replace("url('assets/town.webp')", f"url('{art}')")
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>' + css + '</style>')
html = html.replace('src="assets/town.webp"', f'src="{art}"')
for name in ('residents.js', 'app.js'):
    code = (DIST/name).read_text().replace('</script', '<\\/script')
    html = html.replace(f'<script src="{name}"></script>', '<script>\n' + code + '\n</script>')
assert not re.search(r'(?:src|href)="(?:assets/|styles\.css|residents\.js|app\.js)', html)
target = DIST/'Chat_City_Local.html'
target.write_text(html)
print(f'{target} ({target.stat().st_size:,} bytes)')
