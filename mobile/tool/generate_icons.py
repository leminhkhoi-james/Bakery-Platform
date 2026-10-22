"""Resize the existing SweetCake favicon into the generated platform icon slots."""
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
source = Image.open(root.parent / 'frontend/public/favicon.png').convert('RGBA')
def icon(path, size):
    background = Image.new('RGBA', (size, size), '#FFFDFA')
    mark = ImageOps.contain(source, (round(size * .82), round(size * .82)), Image.Resampling.LANCZOS)
    background.alpha_composite(mark, ((size-mark.width)//2, (size-mark.height)//2))
    background.convert('RGB').save(path)

for density, size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
    icon(root / f'android/app/src/main/res/mipmap-{density}/ic_launcher.png', size)
folder = root / 'ios/Runner/Assets.xcassets/AppIcon.appiconset'
for image in json.loads((folder / 'Contents.json').read_text())['images']:
    if 'filename' not in image:
        continue
    size = round(float(image['size'].split('x')[0]) * float(image['scale'].replace('x','')))
    icon(folder / image['filename'], size)
print('Generated Android and iOS development icons from the existing web favicon.')
