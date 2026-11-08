"""Validate a genuine screenrecord file and derive explicitly disclosed chapters."""
import datetime,hashlib,json,re,shutil,subprocess
from pathlib import Path
import cv2,numpy as np,imageio_ffmpeg
from full_common import MOBILE,OUT,DOCS,RUN,save

def utc(s):return datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def tc(s):
    ms=round(s*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
records=[json.loads(p.read_text()) for p in (OUT/'test-results').glob('recording-*.json')]
record=sorted([r for r in records if r['driverExitCode']==0],key=lambda r:r['startUtc'])[-1]
start=utc(record['startUtc']);raw=MOBILE/record['rawPath']
walks=[json.loads(p.read_text()) for p in (OUT/'test-results').glob('walk-recording-*.json') if not p.stem.endswith('chapters')]
walk=next(w for w in walks if start<=utc(w['resourceChain']['startedAt'])<=utc(record['stopRequestedUtc']))
if walk['resourceChain'].get('terminal')!='PARTIAL_BLOCKED_FINAL_GUEST':raise RuntimeError('Recording did not reach its declared partial terminal state')
videos=DOCS/'videos';master=videos/'SWEETCAKE_PARTIAL_BLOCKED_WALKTHROUGH.mp4'
if master.exists() and digest(master)!=digest(raw):raise RuntimeError('Refusing overwrite of a different master recording')
shutil.copy2(raw,master)
samples=OUT/'video-frames';samples.mkdir(exist_ok=True)

def validate(p,label):
    result=subprocess.run([ffmpeg,'-hide_banner','-i',str(p),'-map','0:v:0','-fps_mode','passthrough','-f','null','-'],capture_output=True,text=True,encoding='utf-8',errors='replace')
    duration=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',result.stderr)
    if result.returncode or not duration:raise RuntimeError('Media decode failed: '+p.name)
    h,m,s=map(float,duration.groups());seconds=h*3600+m*60+s
    if seconds<=0:raise RuntimeError('Empty recording')
    cap=cv2.VideoCapture(str(p));width=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH));height=int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT));frames=[]
    # Android encoder is variable-frame-rate. Sequential decoding avoids OpenCV's
    # average-FPS seek error near a static tail; use each decoded frame's own PTS.
    selected={};decoded=0;black=0;changes=0;previous=None;last=None;lastAt=0
    while True:
        ok,img=cap.read()
        if not ok:break
        decoded+=1;at=cap.get(cv2.CAP_PROP_POS_MSEC)/1000
        small=cv2.resize(img,(64,114));black+=int(small.mean()<3)
        if previous is not None and np.abs(previous.astype(float)-small.astype(float)).mean()>1:changes+=1
        previous=small;last=img;lastAt=at
        if 0 not in selected:selected[0]=(at,img.copy())
        if 1 not in selected and at>=seconds/2:selected[1]=(at,img.copy())
    if last is None:raise RuntimeError('No decodable frames')
    selected[2]=(lastAt,last)
    for number,(at,img) in sorted(selected.items()):
        path=samples/f'{label}-{number}.png';cv2.imwrite(str(path),img)
        frames.append({'atSeconds':round(at,3),'path':str(path.relative_to(MOBILE)),'mean':round(float(img.mean()),3),'std':round(float(img.std()),3),'black':bool(img.mean()<3),'sha256':digest(path)})
    cap.release()
    stream=re.search(r'Video: ([^\r\n]+)',result.stderr)
    return {'path':str(p.relative_to(MOBILE)),'bytes':p.stat().st_size,'sha256':digest(p),'format':'MP4','durationSeconds':seconds,'width':width,'height':height,'stream':stream.group(1).strip() if stream else 'UNKNOWN','fullDecodeExitCode':result.returncode,'decodedFrames':decoded,'blackFrameCount':black,'visibleFrameChanges':changes,'lastDecodedPtsSeconds':lastAt,'samples':frames,'representativeBlackFrames':sum(x['black'] for x in frames)}

main=validate(master,'master');duration=main['durationSeconds']
if duration<=180:raise RuntimeError('Long recording unexpectedly truncated at or below 180 seconds')
coverage=json.loads((OUT/'api-coverage.json').read_text())['operations']
events=json.loads((OUT/'sanitized-events'/('walk-'+walk['resourceChain']['tag']+'.json')).read_text())
def matched(e,o):
    route=re.sub(r'\{[^}]+\}',r'[0-9a-fA-F-]{36}',o['path'])
    return e['method']==o['method'] and re.fullmatch(route,e['path'].split('?')[0])
chapters=[];chapterdir=videos/'chapters';chapterdir.mkdir(exist_ok=True)
for i,c in enumerate(walk['chapters']):
    a=0 if i==0 else max(0,(utc(c['startUtc'])-start).total_seconds())
    b=min(duration,(utc(c['endUtc'])-start).total_seconds()) if i<len(walk['chapters'])-1 else duration
    clip=chapterdir/(c['id']+'.mp4')
    p=subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-ss',f'{a:.3f}','-i',str(master),'-t',f'{b-a:.3f}','-an','-vf','fps=30','-fps_mode','cfr','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(clip)],capture_output=True)
    if p.returncode:raise RuntimeError('Chapter encode failed')
    data=validate(clip,c['id'])
    rowevents=[e for e in events if utc(c['startUtc'])<=utc(e['at'])<=utc(c['endUtc'])]
    ids=sorted({o['id'] for e in rowevents for o in coverage if o['applicable'] and matched(e,o)})
    photos=[str(p.relative_to(MOBILE)) for p in (OUT/'screenshots').glob('walk-'+walk['resourceChain']['tag']+'-*.png') if utc(c['startUtc']).timestamp()<=p.stat().st_mtime<=utc(c['endUtc']).timestamp()]
    chapters.append({**c,'startSeconds':round(a,3),'endSeconds':round(b,3),'startTimecode':tc(a),'endTimecode':tc(b),'apiIds':ids,'eventCount':len(rowevents),'screenshots':photos,'result':'PARTIAL_BLOCKED' if c['id'] in ['V02','V05','V06','V08'] else 'VERIFIED_CAPTURED_SUBSET','media':data,'cut':'Explicit contiguous derivative from original master; no speed changes or overlays'})
last=main['samples'][-1]
finalshot=OUT/'screenshots'/('walk-'+walk['resourceChain']['tag']+'-final-guest-home.png')
a=cv2.imread(str(MOBILE/last['path']));b=cv2.imread(str(finalshot))
comparison=float(np.abs(a.astype(float)-b.astype(float)).mean()) if a.shape==b.shape else None
manifest={'runId':RUN,'assessment':'PARTIAL_BLOCKED','recording':record,'rawSha256':digest(raw),'master':main,'masterIdenticalToRaw':digest(raw)==main['sha256'],'resourceChain':walk['resourceChain'],'driverResult':walk['cases'],'build':json.loads((OUT/'driver-build.json').read_text()),'gate':json.loads((OUT/'acceptance-gate.json').read_text()),'eventFile':str((OUT/'sanitized-events'/('walk-'+walk['resourceChain']['tag']+'.json')).relative_to(MOBILE)),'chapters':chapters,'fullDecodeAllClips':True,'finalGuestScreenshot':str(finalshot.relative_to(MOBILE)),'lastFrameMeanAbsoluteDifferenceToFinalScreenshot':comparison,'lastActionVisualReview':'PENDING_MANUAL_REVIEW','continuousBeyond180Seconds':duration>180,'audio':False,'masterEdits':[],'chapterEdits':['Explicit time cuts and H264 re-encode, no speed change, captions, blur or overlays'],'timecodeMethod':'Host UTC chapter cues minus screenrecord process start; three-decimal index, capture-start uncertainty under 1 second; manually inspect boundaries','missingCapture':['Registration/onboarding/approval/subscription activation/catalog mutations occurred earlier as genuine screenshots/events, not in this recording','Order creation/acceptance/fulfillment/Review blocked by public address prerequisite','AI lifecycle/results/moderation/select blocked','Chat successful history/read/media-view unavailable','Not every independent Owner/Admin function or recovery branch is filmed'],'privacyReview':'Synthetic inputs; password fields masked; no audio; representative-frame review plus pending final privacy scan; not automated OCR'}
(videos/'video_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print({'master':str(master.relative_to(MOBILE)),'duration':duration,'chapters':len(chapters),'lastFrameDifference':comparison,'allDecode':True},flush=True)
