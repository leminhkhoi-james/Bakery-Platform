"""Install the development APK on the task emulator and capture reproducible smoke evidence."""
from pathlib import Path
import hashlib
import json
import os
import re
import subprocess
import time

mobile = Path(__file__).resolve().parents[1]
apk = mobile / 'artifacts/sweetcake-debug.apk'
evidence = mobile / 'docs/evidence'
adb = Path(os.environ['ANDROID_HOME']) / 'platform-tools/adb.exe'
device = 'emulator-5556'
package = 'dev.sweetcake.sweetcake_mobile'
logs = []
def run(*args):
    result = subprocess.run([str(adb), '-s', device, *args], check=True,
                            capture_output=True, text=True, encoding='utf-8')
    logs.append('$ adb ' + ' '.join(args) + '\n' + result.stdout + result.stderr)
    return result.stdout.strip()

run('install', '-r', str(apk))
run('logcat', '-c')
run('shell', 'am', 'force-stop', package)
startup = run('shell', 'am', 'start', '-W', '-n', package + '/.MainActivity')
if 'Status: ok' not in startup:
    raise RuntimeError(startup)
time.sleep(2)
pid = run('shell', 'pidof', package)
run('shell', 'screencap', '-p', '/sdcard/sweetcake-home.png')
run('pull', '/sdcard/sweetcake-home.png', str(evidence / 'android-home.png'))
runtime_errors = run('logcat', '-d', '-s', 'flutter:E', 'AndroidRuntime:E')
wifi = run('shell', 'settings', 'get', 'global', 'wifi_on')
data = run('shell', 'settings', 'get', 'global', 'mobile_data')
model = run('shell', 'getprop', 'ro.product.model')
api = run('shell', 'getprop', 'ro.build.version.sdk')
milliseconds = int(re.search(r'TotalTime: (\d+)', startup)[1])
digest = hashlib.sha256(apk.read_bytes()).hexdigest()
size = apk.stat().st_size
record = {'path': str(apk.relative_to(mobile)), 'bytes': size, 'sha256': digest,
          'entrypoint': 'lib/main.dart', 'applicationId': package, 'emulator': device,
          'model': model, 'api': api, 'startup': startup, 'startupMilliseconds': milliseconds,
          'pid': pid, 'offline': {'wifi_on': wifi, 'mobile_data': data},
          'runtimeErrorLog': runtime_errors, 'screenshot': 'docs/evidence/android-home.png',
          'result': 'PASSED' if pid and not runtime_errors else 'FAILED'}
(evidence / 'android-smoke.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
(evidence / 'android-smoke-log.txt').write_text('\n'.join(logs), encoding='utf-8')
report = mobile / 'docs/MOBILE_IMPLEMENTATION_REPORT_VI.md'
text = report.read_text(encoding='utf-8')
text = re.sub(r'cold start \d+ms', f'cold start {milliseconds}ms', text, flags=re.I)
text = re.sub(r'COLD start \d+ms', f'COLD start {milliseconds}ms', text)
text = re.sub(r'\*\*[\d.]+ bytes\*\*', '**' + f'{size:,}'.replace(',', '.') + ' bytes**', text)
text = re.sub(r'SHA-256 `[0-9a-f]{64}`', f'SHA-256 `{digest}`', text)
report.write_text(text, encoding='utf-8')
print(json.dumps(record, indent=2))
raise SystemExit(0 if record['result'] == 'PASSED' else 1)
