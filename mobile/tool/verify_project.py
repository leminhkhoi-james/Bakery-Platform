"""Read-only repository, offline-source and native-scaffold audit; writes evidence in mobile."""
from pathlib import Path
import hashlib
import json
import plistlib
import re
import struct
import subprocess
import xml.etree.ElementTree as ET

mobile = Path(__file__).resolve().parents[1]
root = mobile.parent
evidence = mobile / 'docs/evidence'
baseline = json.loads((evidence / 'repository-before.json').read_text(encoding='utf-8'))
def git(*args):
    return subprocess.check_output(['git', *args], cwd=root).decode('utf-8').strip()
outside = baseline['outsideMobileHashes']
changed, missing = [], []
for name, original_hash in outside.items():
    path = root / name
    if not path.exists():
        missing.append(name)
    elif hashlib.sha256(path.read_bytes()).hexdigest() != original_hash:
        changed.append(name)
paths = git('ls-files', '-c', '-o', '--exclude-standard', '-z').split('\0')
new_outside = [p for p in paths if p and not p.startswith('mobile/') and p not in outside]
status = git('status', '--porcelain=v1', '-uall')
status_outside = [line for line in status.splitlines() if not line[3:].startswith('mobile/')]

forbidden = re.compile(r"dart:(io|html)|package:(http|dio|web_socket)|Image\.network|NetworkImage\(|SvgPicture\.network|HttpClient\(|WebSocket|Socket\.connect")
network_uses = []
for path in (mobile / 'lib').rglob('*.dart'):
    for number, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        if forbidden.search(line):
            network_uses.append({'file': str(path.relative_to(mobile)), 'line': number})
manifest = json.loads((mobile / 'assets/data/image_manifest.json').read_text())
missing_images = [asset for asset in manifest.values() if not (mobile / asset).exists()]
failures = json.loads((evidence / 'asset-downloads.json').read_text())

required_ios = ['Runner.xcodeproj/project.pbxproj', 'Runner.xcworkspace/contents.xcworkspacedata',
                'Runner/AppDelegate.swift', 'Runner/SceneDelegate.swift', 'Runner/Info.plist',
                'Runner/Base.lproj/Main.storyboard', 'Runner/Base.lproj/LaunchScreen.storyboard',
                'Runner.xcodeproj/xcshareddata/xcschemes/Runner.xcscheme']
missing_ios = [name for name in required_ios if not (mobile / 'ios' / name).exists()]
info = plistlib.loads((mobile / 'ios/Runner/Info.plist').read_bytes())
ET.parse(mobile / 'ios/Runner/Base.lproj/Main.storyboard')
ET.parse(mobile / 'ios/Runner/Base.lproj/LaunchScreen.storyboard')
ET.parse(mobile / 'android/app/src/main/AndroidManifest.xml')
icon_errors = []
icon_folder = mobile / 'ios/Runner/Assets.xcassets/AppIcon.appiconset'
for record in json.loads((icon_folder / 'Contents.json').read_text())['images']:
    if 'filename' not in record:
        continue
    path = icon_folder / record['filename']
    expected = round(float(record['size'].split('x')[0]) * float(record['scale'].replace('x', '')))
    if not path.exists() or struct.unpack('>II', path.read_bytes()[16:24]) != (expected, expected):
        icon_errors.append(record['filename'])
pbx = (mobile / 'ios/Runner.xcodeproj/project.pbxproj').read_text()
native = {
    'iosRequiredFilesMissing': missing_ios,
    'iosPlistAndStoryboardXml': 'PASSED',
    'iosDisplayName': info['CFBundleDisplayName'],
    'iosDevelopmentBundleIdentifierPresent': 'dev.sweetcake.sweetcakeMobile' in pbx,
    'iosIconErrors': icon_errors,
    'iosNativeBuild': 'NOT RUN: Windows host; requires macOS/Xcode',
    'androidManifestXml': 'PASSED',
    'androidProductionInternetPermission': 'android.permission.INTERNET' in (mobile / 'android/app/src/main/AndroidManifest.xml').read_text(),
}
report = {
    'branchBefore': baseline['branch'], 'branchAfter': git('branch', '--show-current'),
    'initialWorkingTreeStatus': baseline['status'],
    'outsideMobileFilesHashed': len(outside), 'outsideMobileChanged': changed,
    'outsideMobileMissing': missing, 'newOutsideMobile': new_outside,
    'workingTreeChangesOutsideMobile': status_outside,
    'mobileNonIgnoredInventory': [p for p in paths if p.startswith('mobile/')],
    'sourceNetworkUses': network_uses, 'bundledImageCount': len(manifest),
    'sourceImageFailures': len([r for r in failures if r['error']]),
    'missingBundledImages': missing_images,
    'flutterDestinations': len(re.findall(r"^  [a-zA-Z]+\(", (mobile / 'lib/app/router/destination.dart').read_text(), re.M)),
    'native': native,
}
passed = not any([changed, missing, new_outside, status_outside, network_uses, missing_images, missing_ios, icon_errors])
report['result'] = 'PASSED' if passed else 'FAILED'
(evidence / 'repository-and-project-audit.json').write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
(evidence / 'git-status-after.txt').write_text(status + '\n', encoding='utf-8')
print(json.dumps({k: v for k, v in report.items() if k != 'mobileNonIgnoredInventory'}, indent=2, ensure_ascii=False))
raise SystemExit(0 if passed else 1)
