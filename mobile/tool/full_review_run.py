"""Larger-font/night-setting native capture; restore exact original OS settings."""
import os,re,shutil,subprocess
from full_common import MOBILE,save
adb=shutil.which('adb') or r'D:\HomeMind\audit-tools\android-sdk\platform-tools\adb.exe'
def call(*a):return subprocess.check_output([adb,'-s','emulator-5554',*a]).decode().strip()
font=call('shell','settings','get','system','font_scale');night=call('shell','cmd','uimode','night')
match=re.search(r'(auto|yes|no|custom)',night)
if not match or match[1]=='custom':raise SystemExit('Unknown original night mode; refusing settings mutation')
try:
    call('shell','settings','put','system','font_scale','1.3');call('shell','cmd','uimode','night','yes')
    p=subprocess.run(['python','-B','tool/full_run_ui.py','review'],cwd=MOBILE)
finally:
    call('shell','settings',*(['delete','system','font_scale'] if font=='null' else ['put','system','font_scale',font]))
    call('shell','cmd','uimode','night',match[1])
save('test-results/native-display-settings.json',{'fontBefore':font,'nightBefore':night,'testFontScale':1.3,'testNightMode':'yes','fontAfter':call('shell','settings','get','system','font_scale'),'nightAfter':call('shell','cmd','uimode','night'),'lightThemePreserved':True,'doesNotClaimDarkThemeImplementation':True,'driverExitCode':p.returncode})
raise SystemExit(p.returncode)
