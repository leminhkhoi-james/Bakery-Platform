"""Native Web/Android clients, root .env only, public configuration allowlist.

Run --help. This launcher never passes Backend secrets to Node or Flutter.
"""
import argparse
import json
import os
import pathlib
import subprocess
import sys
import urllib.parse
import time

from native_backend import ROOT, dotenv

PUBLIC_WEB_KEYS = ('VITE_API_BASE_URL','VITE_ENABLE_MOCK_FALLBACK',
                   'VITE_ENABLE_BUSINESS_SIMULATION','VITE_DEMO_EMPTY_DATA')
OS_KEYS = {'SYSTEMROOT','WINDIR','COMSPEC','PATH','TEMP','TMP','USERPROFILE','APPDATA',
           'LOCALAPPDATA','PATHEXT','SYSTEMDRIVE','PROCESSOR_ARCHITECTURE',
           'NUMBER_OF_PROCESSORS','JAVA_HOME','ANDROID_HOME','ANDROID_SDK_ROOT',
           'PUB_CACHE','GRADLE_USER_HOME','FLUTTER_ROOT'}


def environment(settings):
    child = {key:value for key,value in os.environ.items() if key.upper() in OS_KEYS}
    child['BAKERY_NATIVE_RUNTIME'] = 'true'
    for key in PUBLIC_WEB_KEYS:
        if key in settings: child[key] = settings[key]
    if child.get('VITE_API_BASE_URL') != '/api/v1':
        raise ValueError('Native Web API base must be /api/v1')
    if any(child.get(key) != 'false' for key in PUBLIC_WEB_KEYS[1:]):
        raise ValueError('Native verification requires all mock/simulation flags false')
    target = settings['NATIVE_WEB_GATEWAY_ORIGIN']
    validate_origin(target)
    child['DEV_GATEWAY_TARGET'] = target
    return child


def validate_origin(value):
    url = urllib.parse.urlsplit(value)
    if url.scheme != 'http' or url.hostname not in ('localhost','127.0.0.1','::1') or url.port != 8080 or url.path or url.query or url.fragment or url.username or url.password:
        raise ValueError('Expected a public loopback Gateway origin on port 8080')
    return value


def executable(settings, name):
    path = pathlib.Path(settings[name])
    if not path.is_file(): raise ValueError('Missing native executable: ' + name)
    return str(path)


def mobile_defines(settings):
    origin = validate_origin(settings['NATIVE_ANDROID_API_ORIGIN'])
    mode = settings.get('NATIVE_ANDROID_CAKE_AI_MODE','unknown')
    if mode not in ('unknown','provider-configured'): raise ValueError('Invalid native Cake AI display mode')
    return ['--dart-define='+key+'_URL='+origin for key in
            ('IDENTITY','BAKERY','MARKETPLACE','SUBSCRIPTION','CAKE_AI','ORDER','CHAT')] + ['--dart-define=CAKE_AI_MODE='+mode]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['web-start','web-build','mobile-build','mobile-run','android-start','android-connect','verify'])
    parser.add_argument('--state-dir', required=True, help='Task-owned log/PID directory')
    parser.add_argument('--device', default='emulator-5554')
    args = parser.parse_args()
    state = pathlib.Path(args.state_dir).resolve(); state.mkdir(parents=True, exist_ok=True)
    settings = dotenv(ROOT/'.env'); child = environment(settings)
    if args.action == 'verify':
        print(json.dumps({'configuration':'ROOT_ENV_ONLY','webKeys':list(PUBLIC_WEB_KEYS),
                          'mobileDefines':[v.split('=')[1] for v in mobile_defines(settings)],'backendSecretsExported':False})); return
    if args.action.startswith('web-'):
        node = executable(settings,'NATIVE_NODE_EXE')
        command = [node,str(ROOT/'frontend/node_modules/vite/bin/vite.js')]
        if args.action == 'web-build':
            raise SystemExit(subprocess.call(command+['build'],cwd=ROOT/'frontend',env=child))
        host = urllib.parse.urlsplit(settings['NATIVE_WEB_ORIGIN'])
        if host.scheme != 'http' or host.hostname not in ('localhost','127.0.0.1') or host.port != 5173:
            raise ValueError('Expected native Web loopback origin on port 5173')
        with (state/'web.log').open('w',encoding='utf-8') as log:
            proc = subprocess.Popen(command+['--host','127.0.0.1','--port','5173','--strictPort'],
                cwd=ROOT/'frontend',env=child,stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW)
        (state/'web-process.json').write_text(json.dumps({'pid':proc.pid,'origin':settings['NATIVE_WEB_ORIGIN'],
            'upstream':settings['NATIVE_WEB_GATEWAY_ORIGIN'],'configuration':'ROOT_ENV_ONLY'},indent=2),encoding='utf-8')
        print(json.dumps({'pid':proc.pid,'origin':settings['NATIVE_WEB_ORIGIN']})); return
    flutter = executable(settings,'NATIVE_FLUTTER_EXE')
    if args.action == 'mobile-build':
        raise SystemExit(subprocess.call([flutter,'build','apk','--debug',*mobile_defines(settings)],cwd=ROOT/'mobile',env=child))
    adb = executable(settings,'NATIVE_ADB_EXE')
    if args.action == 'android-start':
        emulator = pathlib.Path(adb).parents[1]/'emulator/emulator.exe'
        avd = settings['NATIVE_ANDROID_AVD']
        available = subprocess.check_output([str(emulator),'-list-avds'],env=child,text=True).splitlines()
        if avd not in available: raise ValueError('Configured Android AVD is not installed')
        online = subprocess.run([adb,'-s',args.device,'get-state'],env=child,capture_output=True)
        if online.returncode:
            port = args.device.removeprefix('emulator-')
            if not port.isdigit() or int(port)%2: raise ValueError('Expected emulator device with even console port')
            with (state/'android-emulator.log').open('w',encoding='utf-8') as log:
                proc = subprocess.Popen([str(emulator),'-avd',avd,'-port',port,'-no-boot-anim','-no-snapshot-save'],
                    env=child,stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW)
            (state/'android-process.json').write_text(json.dumps({'pid':proc.pid,'avd':avd,'device':args.device}),encoding='utf-8')
        for _ in range(90):
            boot = subprocess.run([adb,'-s',args.device,'shell','getprop','sys.boot_completed'],env=child,capture_output=True,text=True)
            if boot.returncode == 0 and boot.stdout.strip() == '1': break
            time.sleep(2)
        else: raise ValueError('Android boot did not complete; existing AVD data preserved')
    # Android reaches the same canonical Gateway. Object URLs use their real
    # native storage ports; no API service bypass is configured.
    subprocess.run([adb,'-s',args.device,'get-state'],check=True,env=child)
    for port in (8080,9000,9002):
        subprocess.run([adb,'-s',args.device,'reverse','tcp:'+str(port),'tcp:'+str(port)],check=True,env=child)
    if args.action == 'mobile-run':
        raise SystemExit(subprocess.call([flutter,'run','--debug','-d',args.device,*mobile_defines(settings)],cwd=ROOT/'mobile',env=child))


if __name__ == '__main__':
    try: main()
    except (ValueError,KeyError) as error:
        print(type(error).__name__+': '+str(error),file=sys.stderr); raise SystemExit(1)
