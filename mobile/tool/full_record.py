"""Record the actual Android UI, preserving a failed attempt without editing it."""
import datetime,json,os,shutil,subprocess,sys,time
from full_common import MOBILE,OUT,DOCS,RUN,save
from full_apk import verified_cache

adb=shutil.which('adb') or r'D:\HomeMind\audit-tools\android-sdk\platform-tools\adb.exe'
flutter=shutil.which('flutter') or r'D:\HomeMind\audit-tools\flutter\bin\flutter.bat'
def shell(*args):
    return subprocess.run([adb,'-s','emulator-5554','shell',*args],capture_output=True,text=True,encoding='utf-8',errors='replace')
verified_cache()
gate=json.loads((OUT/'acceptance-gate.json').read_text())
if gate['result']!='PARTIAL_BLOCKED' or not gate['independentChecksReadyForPartialRecording']:
    raise SystemExit('Partial recording requires the documented pre-record gate')
help_result=shell('screenrecord','--help')
if 'to remove the time limit' not in help_result.stdout+help_result.stderr:
    raise SystemExit('Installed recorder has no verified unlimited mode')
if shell('pidof','screenrecord').stdout.strip():
    raise SystemExit('Another recorder exists; do not interfere with it')
tag=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
remote=f'/sdcard/sweetcake-full-{RUN}-{tag}.mp4'
raw=DOCS/'videos/raw'/f'partial-{tag}.mp4';raw.parent.mkdir(parents=True,exist_ok=True)
started=datetime.datetime.now(datetime.timezone.utc).isoformat()
recorder=subprocess.Popen([adb,'-s','emulator-5554','shell','screenrecord','--time-limit','0','--bit-rate','2500000',remote],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
pid=None;result=None
try:
    for _ in range(30):
        value=shell('pidof','screenrecord').stdout.strip()
        if value.isdigit():
            cmdline=shell('cat',f'/proc/{value}/cmdline').stdout
            if remote in cmdline:pid=value;break
        if recorder.poll() is not None:break
        time.sleep(.2)
    if not pid:raise RuntimeError('Owned recorder did not become ready')
    env={**os.environ,'FULL_WALK_MODE':'recording','PATH':str(__import__('pathlib').Path(flutter).parent)+';'+str(__import__('pathlib').Path(adb).parent)+';'+os.environ['PATH']}
    result=subprocess.run([sys.executable,'-B','tool/full_run_ui.py','walkthrough','--reuse-apk'],cwd=MOBILE,env=env).returncode
    time.sleep(2)
finally:
    stopped=datetime.datetime.now(datetime.timezone.utc).isoformat()
    stop='NOT_OWNED'
    if pid and remote in shell('cat',f'/proc/{pid}/cmdline').stdout:
        stop='SIGINT' if shell('kill','-INT',pid).returncode==0 else 'SIGNAL_FAILED'
    try:recorder.communicate(timeout=25)
    except subprocess.TimeoutExpired:
        raise RuntimeError('Recorder has not finalized; preserve device file for recovery')
    pull=subprocess.run([adb,'-s','emulator-5554','pull',remote,str(raw)],capture_output=True)
    if pull.returncode==0 and raw.exists() and raw.stat().st_size>0:
        shell('rm',remote) # Only the unique file created by this invocation.
    save('test-results/recording-'+tag+'.json',{'runId':RUN,'tag':tag,'device':'emulator-5554','startUtc':started,'stopRequestedUtc':stopped,'recordCommand':['screenrecord','--time-limit','0','--bit-rate','2500000','<owned-device-file>'],'ownedPidVerified':bool(pid),'stopMethod':stop,'recorderExitCode':recorder.returncode,'pullExitCode':pull.returncode,'driverExitCode':result,'rawPath':str(raw.relative_to(MOBILE)),'bytes':raw.stat().st_size if raw.exists() else 0,'assessment':'PARTIAL_BLOCKED' if result==0 else 'FAILED_RETAINED','audio':False,'cuts':[]})
    print({'raw':str(raw.relative_to(MOBILE)),'driverExitCode':result,'bytes':raw.stat().st_size if raw.exists() else 0},flush=True)
raise SystemExit(result if result is not None else 1)
