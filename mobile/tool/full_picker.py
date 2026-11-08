"""Select one owned synthetic fixture through Android's real Documents UI."""
import re,subprocess,sys,time,xml.etree.ElementTree as ET
adb=r'D:\HomeMind\audit-tools\android-sdk\platform-tools\adb.exe'
name=sys.argv[1]
if not re.fullmatch(r'[a-zA-Z0-9._-]+',name):raise SystemExit('Invalid fixture filename')
def call(*args):return subprocess.check_output([adb,'-s','emulator-5554',*args])
def nodes():
    raw=call('exec-out','uiautomator','dump','/dev/tty').decode(errors='replace');end=raw.rfind('</hierarchy>')
    return list(ET.fromstring(raw[:end+12]).iter('node')) if end>=0 else []
def tap(node):
    coords=list(map(int,re.findall(r'\d+',node.get('bounds',''))));x=(coords[0]+coords[2])//2;y=(coords[1]+coords[3])//2
    call('shell','input','tap',str(x),str(y));time.sleep(2)
def text(ns,value):return next((n for n in ns if n.get('text')==value and n.get('class')=='android.widget.TextView'),None)
def desc(ns,value):return next((n for n in ns if n.get('content-desc')==value),None)
for attempt in range(18):
    ns=nodes()
    file=text(ns,name)
    if file is not None:
        tap(file)
        for _ in range(5):
            time.sleep(1)
            if not any(n.get('package')=='com.google.android.documentsui' for n in nodes()):print('Selected owned fixture through Documents UI');raise SystemExit(0)
        raise SystemExit('Fixture tap did not close Documents UI')
    # Drawer contains the local device root as well as Downloads. Do not confuse
    # a breadcrumb with the actual provider choice or tap a truncated preview.
    downloads=text(ns,'Downloads')
    if downloads is not None and any(n.get('text')=='Open from' or 'sdk_gphone' in n.get('text','') for n in ns):tap(downloads);continue
    showing_downloads=downloads is not None
    root=desc(ns,'Show roots')
    if not showing_downloads and root is not None:tap(root);continue
    list_view=desc(ns,'List view')
    if list_view is not None:tap(list_view);continue
    call('shell','input','swipe','360','1100','360','430','450');time.sleep(1.5)
raise SystemExit('Owned fixture not found within bounded Documents UI navigation')
