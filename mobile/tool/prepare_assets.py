"""Bundle web-referenced visual assets; the application never downloads them."""
from pathlib import Path
import concurrent.futures
import hashlib
import json
import re
import shutil
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT.parent / 'frontend'
DATA = ROOT / 'assets/data'
IMAGES = ROOT / 'assets/images'
FONTS = ROOT / 'assets/fonts'
FONTS.mkdir(exist_ok=True)
for name, source in {
    'brand-logo.png': WEB / 'src/assets/brand-logo.png',
}.items():
    shutil.copyfile(source, IMAGES / name)

hero = (WEB / 'src/components/features/home/HeroSection.jsx').read_text(encoding='utf-8')
svg = re.search(r'<svg[\s\S]*?</svg>', hero)[0]
svg = re.sub(r'\{/\*[\s\S]*?\*/\}', '', svg)
svg = re.sub(r' className="[^"]*"', '', svg)
for source, target in [('strokeWidth', 'stroke-width'), ('strokeJoin', 'stroke-linejoin'),
                       ('strokeLinecap', 'stroke-linecap')]:
    svg = svg.replace(source, target)
svg = re.sub(r'<text[\s\S]*?</text>', '', svg)
(IMAGES / 'cat-baker.svg').write_text(svg, encoding='utf-8')

fixtures = json.loads((DATA / 'web_fixtures.json').read_text(encoding='utf-8'))
urls = set()
def walk(value):
    if isinstance(value, str) and value.startswith('https://'):
        urls.add(value)
    elif isinstance(value, dict):
        for child in value.values():
            walk(child)
    elif isinstance(value, list):
        for child in value:
            walk(child)
walk(fixtures)

def download(url):
    name = hashlib.sha256(url.encode()).hexdigest()[:20] + '.jpg'
    target = IMAGES / name
    try:
        if not target.exists():
            request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(request, timeout=18) as response:
                data = response.read(6_000_000)
                if not response.headers.get('Content-Type', '').startswith('image/'):
                    raise ValueError('Not an image')
            target.write_bytes(data)
        return url, 'assets/images/' + name, None
    except Exception as error:
        return url, None, str(error)

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
    results = list(pool.map(download, sorted(urls)))
manifest = {url: asset for url, asset, error in results if asset}
(DATA / 'image_manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
(ROOT / 'docs/evidence/asset-downloads.json').write_text(json.dumps([
    {'url': url, 'asset': asset, 'error': error} for url, asset, error in results
], indent=2), encoding='utf-8')
for family, directory, filename in [
    ('Quicksand', 'quicksand', 'Quicksand[wght].ttf'),
    ('PlusJakartaSans', 'plusjakartasans', 'PlusJakartaSans[wght].ttf'),
]:
    base = 'https://raw.githubusercontent.com/google/fonts/main/ofl/' + directory + '/'
    urllib.request.urlretrieve(base + filename.replace('[', '%5B').replace(']', '%5D'), FONTS / (family + '.ttf'))
    urllib.request.urlretrieve(base + 'OFL.txt', FONTS / (family + '-OFL.txt'))
print(f'Bundled {len(manifest)}/{len(urls)} images and two font families.')
