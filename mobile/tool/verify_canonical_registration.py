"""Stepped native UI check on lib/main.dart; synthetic credentials stay in this process.

Coordinates are chosen from inspected 720x1280 screenshots. This is a diagnostic
with visual checkpoints, not a portable unattended UI test.
"""
from pathlib import Path
import json,secrets,shlex,subprocess,time,urllib.error,urllib.request
OUT=Path(__file__).resolve().parents[1]/'docs/evidence/docker-api-diagnostic'
email='canonical-'+str(time.time_ns())+'@audit.invalid';password=secrets.token_urlsafe(24)
result={'entrypoint':'lib/main.dart','driverExtensionUsed':False,'credentialsPersisted':False,'registerStatusDirectlyCaptured':False}
def adb(*args):return subprocess.run(['adb','-s','emulator-5554',*args],capture_output=True,check=True,timeout=40)
def tap(x,y):adb('shell','input','tap',str(x),str(y));time.sleep(.4)
def text(x,y,value):
 tap(x,y)
 subprocess.run(['adb','-s','emulator-5554','shell','-T'],input='input text '+shlex.quote(value)+'\nexit\n',text=True,capture_output=True,check=True,timeout=30)
def shot(name):(OUT/name).write_bytes(adb('exec-out','screencap','-p').stdout)
def save(): (OUT/'canonical-registration.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
text(250,246,email);text(250,380,password);text(250,510,'Canonical Native Synthetic')
adb('shell','input','keyevent','4');time.sleep(.5);tap(360,760);time.sleep(4)
shot('canonical-registration-success-login.png')
try:
 request=urllib.request.Request('http://127.0.0.1:18101/api/v1/auth/login',data=json.dumps({'email':email,'password':password}).encode(),headers={'Content-Type':'application/json'},method='POST')
 with urllib.request.urlopen(request,timeout=20) as response:
  token=json.load(response)['data']['accessToken'];cookie=next(v.split(';',1)[0] for v in response.headers.get_all('Set-Cookie') if v.startswith('refresh_token='));result['hostReconciliationLoginStatus']=response.status
 with urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:18101/api/v1/auth/me',headers={'Authorization':'Bearer '+token}),timeout=20) as response:
  profile=json.load(response)['data'];result.update(syntheticUserId=profile['id'],hostMeStatus=response.status,roles=profile['roles'])
 urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:18101/api/v1/auth/logout',data=b'',headers={'Authorization':'Bearer '+token,'Cookie':cookie},method='POST'),timeout=20).close()
except Exception as e:result['hostReconciliationErrorType']=type(e).__name__
save();print('CHECKPOINT registration image and host reconciliation saved; send login button y coordinate after visual review.',flush=True)
loginY=int(input().strip())
text(250,380,password);adb('shell','input','keyevent','4');time.sleep(.5);tap(360,loginY);time.sleep(5);tap(677,118);time.sleep(2)
shot('canonical-registration-native-profile.png');print('CHECKPOINT normal native profile saved; send restart after visual review.',flush=True)
if input().strip()!='restart':raise SystemExit('Visual review did not authorize the diagnostic continuation')
adb('shell','am','force-stop','com.example.bakery_mobile');adb('shell','am','start','-W','-n','com.example.bakery_mobile/.MainActivity');time.sleep(25);tap(677,118);time.sleep(2)
shot('canonical-registration-cold-profile.png');print('CHECKPOINT normal cold profile saved; send logout after visual review.',flush=True)
if input().strip()!='logout':raise SystemExit('Visual review did not authorize the diagnostic continuation')
adb('shell','input','swipe','500','1000','500','400','350');time.sleep(1)
shot('canonical-profile-logout-position.png');print('CHECKPOINT logout position saved; send logout button y coordinate.',flush=True)
logoutY=int(input().strip());tap(360,logoutY);time.sleep(3);tap(677,118);time.sleep(2)
shot('canonical-registration-logged-out.png');result['nativeVisualCheckpointsComplete']=True;save()
print('Native canonical diagnostic complete; review images for final classification.',flush=True)
