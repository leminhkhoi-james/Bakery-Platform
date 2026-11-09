"""Run real Android UI checks; keeps test APK distinct from README main APK."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess
import sys
import time
from cake_ai_runtime import MOBILE, OUT, save

flutter = r'D:/HomeMind/audit-tools/flutter/bin/flutter.bat'
adb = r'D:/HomeMind/audit-tools/android-sdk/platform-tools/adb.exe'
state = json.loads((OUT / 'startup-live/runtime-start.json').read_text())
driver = 'tool/cake_ai_visual_driver.dart' if '--visual' in sys.argv else 'tool/cake_ai_driver.dart'
command = [flutter, 'drive', '--keep-app-running', '--driver=' + driver,
           '--target=test_driver/full_app.dart', '-d', 'emulator-5554']
for domain in ['identity', 'bakery', 'subscription', 'marketplace', 'order', 'chat']:
    command.append('--dart-define=' + domain.upper() + '_URL=' + state['services'][domain + '-service']['origin'])
command.extend(['--dart-define=CAKE_AI_URL=http://127.0.0.1:18105', '--dart-define=CAKE_AI_MODE=local-fallback'])
cache = MOBILE / '.dart_tool/cake-ai-apks'
cache.mkdir(parents=True, exist_ok=True)
paths = sorted([*(MOBILE / 'lib').rglob('*.dart'), MOBILE / 'test_driver/full_app.dart'])
fingerprint = hashlib.sha256(json.dumps({str(p.relative_to(MOBILE)): hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}, sort_keys=True).encode()).hexdigest()
if '--reuse-apk' in sys.argv:
    meta = json.loads((cache / 'driver.json').read_text())
    if meta['sourceFingerprint'] != fingerprint or hashlib.sha256((cache / 'driver.apk').read_bytes()).hexdigest() != meta['sha256']:
        raise RuntimeError('APK source fingerprint/checksum mismatch')
    command.append('--use-application-binary=' + str(cache / 'driver.apk'))
subprocess.run([adb, '-s', 'emulator-5554', 'push', str(MOBILE / 'assets/demo/cake_01.jpg'),
                '/sdcard/Download/sweetcake-mobile-cake.jpg'], check=True, capture_output=True)
stamp = str(time.time_ns())
if '--visual' in sys.argv:
    prior = [*(OUT / 'screenshots').glob('final-*.png'),
             *[p for p in [OUT / 'android-visual-results.json', OUT / 'android-visual-events.json'] if p.exists()]]
    if prior:
        archive = OUT / ('previous-visual-' + stamp)
        archive.mkdir()
        for p in prior:
            shutil.move(str(p), archive / p.name)
log = OUT / ('android-drive-' + stamp + '.log')
started = time.monotonic()
built = False
with log.open('w', encoding='utf-8') as file:
    p = subprocess.Popen(command, cwd=MOBILE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                         text=True, encoding='utf-8', errors='replace')
    for line in p.stdout:
        if 'Built build' in line:
            built = True
        safe = re.sub(r'(?:https?|wss?)://(?:127\.0\.0\.1|localhost):\d+/[A-Za-z0-9_=-]{8,}/?', '[LOCAL_VM_SERVICE]/', line)
        if 'DevTools' in safe:
            safe = '[LOCAL_DEBUG_ENDPOINT_REDACTED]\n'
        file.write(safe); file.flush()
        if any(word in safe for word in ['PASS:', 'BLOCKED:', 'Built ', 'Error:']):
            print(safe.strip(), flush=True)
    p.wait()
if built:
    apk = MOBILE / 'build/app/outputs/flutter-apk/app-debug.apk'
    shutil.copy2(apk, cache / 'driver.apk')
    meta = {'sourceFingerprint': fingerprint, 'sha256': hashlib.sha256(apk.read_bytes()).hexdigest(),
            'entrypoint': 'test_driver/full_app.dart', 'memorySession': True,
            'cakeAiOrigin': 'http://127.0.0.1:18105', 'mode': 'local-fallback'}
    (cache / 'driver.json').write_text(json.dumps(meta, indent=2))
    save('android-driver-build.json', meta)
save('android-command-' + stamp + '.json', {'command': command, 'exitCode': p.returncode,
                                          'seconds': round(time.monotonic() - started, 2),
                                          'log': log.name})
raise SystemExit(p.returncode)
