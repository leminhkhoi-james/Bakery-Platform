"""Chạy check có exit code thật, tránh PowerShell coi stderr warning là lỗi build."""
from pathlib import Path
import json, os, shutil, subprocess, sys, time

ROOT = Path(__file__).resolve().parents[2]
MOBILE = ROOT / 'mobile'
OUT = ROOT / 'docs/mobile/evidence'
flutter = os.environ.get('FLUTTER_BIN') or shutil.which('flutter')
if not flutter:
    raise SystemExit('Cần Flutter trong PATH hoặc đặt FLUTTER_BIN trước khi chạy.')
dart = str(Path(flutter).with_name('dart.bat' if os.name == 'nt' else 'dart'))
steps = {
    'format': [dart, 'format', '.'],
    'analyze': [flutter, 'analyze'],
    'test': [flutter, 'test', '--reporter', 'expanded'],
    'build': [flutter, 'build', 'apk', '--debug'],
}
results = json.loads((OUT/'commands.json').read_text(encoding='utf-8')) if (OUT/'commands.json').exists() else {}
for name in sys.argv[1:] or steps:
    start = time.monotonic()
    env = dict(os.environ)
    with (OUT/f'final-{name}.txt').open('w', encoding='utf-8') as log:
        process = subprocess.run(steps[name], cwd=MOBILE, env=env, stdout=log, stderr=subprocess.STDOUT)
    results[name] = {'command':' '.join(steps[name][1:]), 'exitCode':process.returncode, 'seconds':round(time.monotonic()-start,2), 'evidence':f'final-{name}.txt'}
    (OUT/'commands.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(results[name]), flush=True)
    if process.returncode: sys.exit(process.returncode)
