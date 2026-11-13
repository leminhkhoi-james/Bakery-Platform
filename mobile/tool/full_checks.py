"""Record real analyzer and test runner outcomes without verbose fixture payloads."""
import datetime,json,shutil,subprocess,time
from full_common import MOBILE,save
flutter=shutil.which('flutter') or r'D:\HomeMind\audit-tools\flutter\bin\flutter.bat'
start=time.monotonic();p=subprocess.run([flutter,'analyze','--no-pub'],cwd=MOBILE,capture_output=True,text=True,encoding='utf-8',errors='replace')
save('test-results/analyze.json',{'command':'flutter analyze --no-pub','exitCode':p.returncode,'output':(p.stdout+p.stderr).strip(),'seconds':round(time.monotonic()-start,2)})
print({'analyzeExitCode':p.returncode},flush=True)
tests={};results=[];start=time.monotonic()
proc=subprocess.Popen([flutter,'test','--no-pub','--machine'],cwd=MOBILE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,encoding='utf-8',errors='replace')
for line in proc.stdout:
    try:e=json.loads(line)
    except ValueError:continue
    if not isinstance(e,dict):continue
    if e.get('type')=='testStart':tests[e['test']['id']]=e['test']
    elif e.get('type')=='testDone' and not e.get('hidden',False):
        test=tests.get(e['testID'],{})
        results.append({'name':test.get('name'),'url':test.get('url'),'result':e.get('result'),'skipped':e.get('skipped',False),'layer':'UNIT_WIDGET_TEST_DOUBLE'})
proc.wait();stderr=proc.stderr.read()
save('test-results/unit-widget.json',{'command':'flutter test --no-pub --machine','exitCode':proc.returncode,'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'seconds':round(time.monotonic()-start,2),'passed':sum(x['result']=='success' and not x['skipped'] for x in results),'failed':sum(x['result']!='success' for x in results),'tests':results,'stderrPresent':bool(stderr.strip()),'doesNotProveAndroidOrBackendSuccess':True})
print({'testExitCode':proc.returncode,'passed':sum(x['result']=='success' for x in results),'failed':sum(x['result']!='success' for x in results)},flush=True)
raise SystemExit(p.returncode or proc.returncode)
