"""Run requested quality checks, retaining commands, exit codes and sanitized logs."""
from pathlib import Path
import json,shutil,subprocess,sys,time
MOBILE=Path(__file__).resolve().parents[1];OUT=MOBILE/'docs/evidence/phases-5a-5b-5c'
commands={'fix':[shutil.which('dart'),'fix','--apply','--code=unused_import,curly_braces_in_flow_control_structures'],'pub-get':[shutil.which('flutter'),'pub','get'],'format':[shutil.which('dart'),'format','--output=none','--set-exit-if-changed','lib','test','test_driver','tool/phase5_ui_driver.dart'],'analyze':[shutil.which('flutter'),'analyze'],'test':[shutil.which('flutter'),'test','--reporter','expanded'],'build':[shutil.which('flutter'),'build','apk','--debug']}
target=OUT/'checks.json';records=json.loads(target.read_text()) if target.exists() else []
for stage in sys.argv[1:]:
    command=commands[stage];started=time.monotonic();log=OUT/(stage+'-quality.log')
    if log.exists():
        archived=log.with_stem(log.stem+'-'+str(time.time_ns()))
        log.rename(archived)
        for previous in reversed(records):
            if previous['stage']==stage and previous['log']==log.name:
                previous['log']=archived.name;break
    p=subprocess.run(command,cwd=MOBILE,capture_output=True,text=True,encoding='utf-8',errors='replace')
    log.write_text(p.stdout+'\n'+p.stderr,encoding='utf-8');record={'stage':stage,'command':command,'cwd':str(MOBILE),'exitCode':p.returncode,'seconds':round(time.monotonic()-started,2),'log':log.name};records.append(record);target.write_text(json.dumps(records,indent=2),encoding='utf-8');print(json.dumps(record),flush=True)
    if p.returncode:raise SystemExit(p.returncode)
