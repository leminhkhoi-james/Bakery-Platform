"""Thu bằng chứng app đã cài và chạy thường, metadata ảnh, contrast token."""
from pathlib import Path
import hashlib, json, os, shutil, struct, subprocess

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'docs/mobile/evidence'
SHOTS = ROOT/'docs/mobile/screenshots'
adb = os.environ.get('ADB_BIN') or shutil.which('adb')
if not adb: raise SystemExit('Cần adb trong PATH hoặc ADB_BIN.')
def shell(*args): return subprocess.check_output([adb, '-s','emulator-5554', 'shell', *args], text=True, encoding='utf-8').strip()
pid = shell('pidof','com.example.bakery_mobile')
assert pid
png = subprocess.check_output([adb,'-s','emulator-5554','exec-out','screencap','-p'])
assert png.startswith(b'\x89PNG')
(SHOTS/'android-installed-home.png').write_bytes(png)
apk = ROOT/'mobile/build/app/outputs/flutter-apk/app-debug.apk'
runtime = {'device':'emulator-5554', 'avd':shell('getprop','ro.boot.qemu.avd_name'), 'androidVersion':shell('getprop','ro.build.version.release'), 'sdk':shell('getprop','ro.build.version.sdk'), 'package':'com.example.bakery_mobile', 'pid':pid, 'startupCommand':'adb shell am start -n com.example.bakery_mobile/.MainActivity', 'installCommand':'adb install -r mobile/build/app/outputs/flutter-apk/app-debug.apk', 'apkBytes':apk.stat().st_size, 'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(), 'screenshot':'android-installed-home.png', 'scope':'App lib/main.dart cài lại sau integration test, không phải báo build thành công là runtime PASS.'}
(OUT/'android-installed-runtime.json').write_text(json.dumps(runtime, ensure_ascii=False,indent=2),encoding='utf-8')
inventory = json.loads((OUT/'mobile-screen-inventory.json').read_text(encoding='utf-8'))
images = []
for path in sorted(SHOTS.glob('*.png')):
    data = path.read_bytes(); width,height = struct.unpack('>II', data[16:24])
    images.append({'file':path.name,'width':width,'height':height,'sha256':hashlib.sha256(data).hexdigest()})
for s in inventory: assert (SHOTS/s['screenshot']).exists()
(OUT/'screenshots.json').write_text(json.dumps(images,ensure_ascii=False,indent=2),encoding='utf-8')
lines = ['# Ảnh chạy thật trên Android', '', 'Ngày chụp 07/11/2026. 35 ảnh canonical và 6 ảnh trạng thái/hành trình được xuất từ Flutter integration test trên emulator. Ảnh `android-installed-home.png` là screenshot Android sau khi cài lại APK app thường và khởi chạy `lib/main.dart`. Không dùng artwork dựng sẵn làm bằng chứng runtime.', '', 'PNG integration 720×1280; viewport logical khoảng 411×731. Device/Android/APK metadata nằm trong [runtime evidence](../evidence/android-installed-runtime.json); SHA-256 từng ảnh trong [screenshots.json](../evidence/screenshots.json).', '']
for group, title in [('public','Guest / Public'),('customer','Customer'),('vendor','Bakery Owner'),('admin','Admin')]:
    lines += [f'## {title}', '']
    group_rows = inventory[0:7] if group == 'public' else inventory[7:18] if group == 'customer' else inventory[18:27] if group == 'vendor' else inventory[27:35]
    lines += [f"- [{s['title']}]({s['screenshot']}) — `{s['path']}`" for s in group_rows]
    lines.append('')
lines += ['## Trạng thái và hành trình bổ sung', '']
known = {s['screenshot'] for s in inventory}
lines += [f"- [{p['file']}]({p['file']})" for p in images if p['file'] not in known]
lines += ['', 'Các ảnh là lát cắt tại thời điểm chụp, có thể cần cuộn để thấy nút phía dưới. Không chứng minh mọi nhánh thao tác, iOS, TalkBack hoặc hiệu năng release.']
(SHOTS/'README.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
def lum(h):
    rgb=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    vals=[v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4 for v in rgb]
    return sum(v*w for v,w in zip(vals,[.2126,.7152,.0722]))
contrasts=[]
for fg,bg in [('6B212E','FFFFFF'),('64748B','FFF8FA'),('0F172A','FFFFFF'),('2C6949','EAF4EC'),('94601C','FFF2DC'),('456B8B','EDF2F8'),('A14B59','FBECEF')]:
    ratio=(max(lum(fg),lum(bg))+.05)/(min(lum(fg),lum(bg))+.05)
    contrasts.append({'foreground':'#'+fg,'background':'#'+bg,'ratio':round(ratio,2),'normalText4_5':ratio>=4.5})
(OUT/'visual-review.json').write_text(json.dumps({'canonicalScreensInspected':35,'method':'Rà source + xem từng ảnh Android; xem lại các màn bị ảnh hưởng sau sửa key/value, metric và chat.', 'fixedDefects':['dropdown overflow','product grid height','landscape rail height','state view scroll','profile controller lifetime','mascot clipped source text','narrow key/value wrapping','currency metric wrapping','chat auto scroll and composer space'], 'contrastTokenPairs':contrasts,'limits':['Không phải WCAG audit toàn app','TalkBack/VoiceOver chưa chạy thủ công','Chưa đo hiệu năng release','Không có iOS runtime']},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'packageRunning':bool(pid),'screenshots':len(images),'canonical':len(inventory),'contrastPairs':len(contrasts)}))
