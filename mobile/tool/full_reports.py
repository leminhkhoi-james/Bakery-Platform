"""Reconcile Vietnamese deliverables from actual retained evidence."""
import collections,datetime,json,re,subprocess
from pathlib import Path
from full_common import ROOT,MOBILE,DOCS,OUT,RUN,save

def read(name):return json.loads((OUT/name).read_text(encoding='utf-8-sig'))
def reportRelative(name):return name.replace('\\','/').removeprefix('docs/full-integration/')
def write(name,lines):
    content='\n'.join(lines)+'\n'
    # Expand compact technical labels into readable prose; never touch hashes.
    editorial={
      'đủ924':'đủ 924','files,30':'files, 30','config,638':'config, 638',
      'bổ sung12':'bổ sung 12','Review4':'Review 4','CakeAI7':'Cake AI 7','selected-design1':'selected-design 1',
      'network503':'network 503','delete204':'delete 204','AdminOffer':'Admin Offer',
      'route;93':'route; 93','Mobile,20':'Mobile, 20','lý do.93':'lý do. 93','Android,2':'Android, 2','bại,18':'bại, 18',
      'HTTP2xx':'HTTP 2xx','HTTP200':'HTTP 200','history403':'history 403','SQL42P18':'SQL 42P18','send201':'send 201','POST503':'POST 503','mediaID':'media ID',
      'CakeAI:':'Cake AI:','nhưng0AIHTTPattempt':'nhưng chưa có HTTP attempt AI','queuePENDING':'queue PENDING','đó;4adapter':'đó; 4 adapter','reviewqueue':'review queue',
      'ap dụng':'áp dụng','finalship cho exactAndroidcaptures':'được chấp nhận cho đúng các ảnh Android đã cung cấp',
      'dedicatedAdmin Offer':'danh sách Admin Offer riêng','reviewship':'review chấp nhận','AI/Reviewblocked':'AI/Review bị chặn',
      'Phone720':'Phone 720','font1.3':'font 1.3','font1.0':'font 1.0','darktheme':'dark theme',
      'definedorigins':'origins đã cấu hình','sanitizedevents':'events đã lọc nhạy cảm','visibleUI':'UI hiển thị',
      'signedhost':'signed host','disableTLS':'disable TLS','PendingChat':'Pending Chat','processdeath':'process death',
      'safeencryptedrecovery':'recovery mã hóa an toàn','mọioperation':'mọi operation','toàn bộPASS':'toàn bộ PASS',
      'Analyzeexit0;109unit/widgetPASS,0fail; normalmain và fulldriverAPK buildthật.':'Analyzer exit 0; 109 unit/widget test PASS, 0 fail; đã build APK của normal main và full driver.',
      'Unit/testdouble, hostprobe và AndroidUI':'Unit/test double, host probe và Android UI',
      'Coldprocessrestore/logout và baBackendcontainerrestartPASS cùng resourceID, khôngDBrestart.':'Cold process restore/logout và restart ba Backend container PASS với cùng resource ID, không restart DB.',
      'PNGnative':'PNG native','successfulcases':'case thành công','H264,720':'H264, 720','1280,8chương':'1280, 8 chương','khôngaudio/masteredits':'không audio hoặc chỉnh sửa master',
      'lastaction':'last action','vượt180s':'vượt 180 giây','khôngtruncate finalGuest':'không cắt mất Guest cuối','Aregistration':'A registration','allfunctions/FULLPASS':'mọi chức năng/FULL_PASS',
      'freshPowerShell':'PowerShell mới','imagescó':'images có','normalentrypoint/liveorigins':'normal entrypoint/live origins','boundedADB':'ADB có giới hạn lần chờ','giữNOTREADY':'giữ NOT_READY','coldopenHome mớiPASS':'mở lại Home mới PASS',
      'cleanclone/GUIcoldboot/iOS/fullDockerbootstrap':'clean clone/GUI cold boot/iOS/bootstrap Docker từ đầu',
      'toàn vẹnPASS':'toàn vẹn PASS','protected hashes/size/mtime, directory listings,30externalconfig,HEAD/branch/staging':'hash/size/mtime của tệp bảo vệ, directory listings, 30 external config, HEAD/branch/staging',
      'fileMobilebanđầu':'tệp Mobile ban đầu','historicalevidence':'evidence lịch sử','Mobiletext/log/artifacts':'Mobile text/log/artifacts','haiAPK archiveentries':'hai APK archive entries','artifactmanifest':'artifact manifest',
      'OCRtoànmedia/toolhistory/cache':'OCR toàn media/tool history/cache','syntheticaccount/passwordmasked':'tài khoản synthetic/password masked','representativevisualreview':'kiểm tra hình ảnh đại diện',
      'khôngsecretpayloadtrongevents':'không có secret payload trong events','APK/cache/logbịignoređượcgiữtrênđĩa':'APK/cache/log bị ignore được giữ trên đĩa','PNG/video/reportdeliverableskhôngtựcommit/LFS/upload':'PNG/video/report được giữ nguyên, không tự commit/LFS/upload',
      'Chủprojectquyếtđịnhversionlargeartifacts':'Chủ project quyết định cách version các artifact lớn','Khôngcommit':'Không commit',
      'gồm20operationchưathànhcông,fullbusinessjourneys/videofullsuccess,conditionalAI/Reviewnative':'gồm 20 operation chưa thành công, business journeys/video đầy đủ, AI/Review native có điều kiện','giới hạnplatform':'giới hạn platform',
      'và8clip':'và 8 clip','screenshotGuest':'screenshot Guest','mic/desktopaudio/debuglog':'mic/desktop audio/debug log',
      '109unit/widget':'109 unit/widget','0AIHTTPattempt':'0 AI HTTP attempt','NoOrder':'No Order',
    }
    for before,after in editorial.items():content=content.replace(before,after)
    (DOCS/name).write_text(content,encoding='utf-8')
inventory=read('api-coverage.json');ops=inventory['operations'];app=[o for o in ops if o['applicable']]
stats={'total':len(ops),'applicable':len(app),'androidSuccess':sum(o['androidCurrent']=='SUCCESS' for o in app),'androidAttempted':sum(o['androidAttemptCount']>0 for o in app),'androidFailedOnly':sum(o['androidCurrent']=='ATTEMPTED_FAILED' for o in app),'notAndroidAttempted':sum(o['androidAttemptCount']==0 for o in app),'hostOnlySuccess':sum(o['hostCurrent']=='SUCCESS' and o['androidCurrent']!='SUCCESS' for o in app),'newAdapters':sum(o['newThisMission'] for o in app)}
save('coverage-summary.json',stats)
baseline=read('baseline.json');build=read('driver-build.json');unit=read('test-results/unit-widget.json');analyze=read('test-results/analyze.json');runbook=read('test-results/runbook.json');screens=read('screenshots-index.json');fixture=read('fixture-manifest.json');runtime=read('source-runtime-manifest.json')
video=json.loads((DOCS/'videos/video_manifest.json').read_text())
boundary=read('final-verification.json') if (OUT/'final-verification.json').exists() else None
prefix=f'evidence/{RUN}/'
serviceRows=['| Service | Controller | Áp dụng Mobile | Adapter | Android HTTP2xx | Thất bại đã gọi | Chưa gọi Android |','|---|---|---|---|---|---|---|']
for name in sorted({o['service'] for o in ops}):
    rows=[o for o in ops if o['service']==name];selected=[o for o in rows if o['applicable']]
    serviceRows.append(f"| {name} | {len(rows)} | {len(selected)} | {sum(o['adapter'] for o in selected)} | {sum(o['androidCurrent']=='SUCCESS' for o in selected)} | {sum(o['androidCurrent']=='ATTEMPTED_FAILED' for o in selected)} | {sum(not o['androidAttemptCount'] for o in selected)} |")

environment=['## Cấu hình môi trường, Docker và kết quả khởi chạy thực tế','',
'Reuse deployment `bakery-mobile-20261107` và `bakery-local`; ba extension standalone phase5 dùng image/config/mount đã có. Network `bakery-mobile-20261107_runtime` nối các service Mobile; `bakery-local_default` nối DB và các dependency hiện hữu. PostgreSQL/named volumes được giữ nguyên, không restart/reset DB hoặc thay credential. Identity/Bakery/Subscription mount JAR/config/PEM chỉ đọc theo manifest. Internal service URLs dùng DNS/alias Docker; Android dùng public loopback qua ADB reverse. Source/runtime JAR và image hashes nằm trong [manifest]('+prefix+'source-runtime-manifest.json).',
'','| Thành phần | Cách chạy / container | Internal | Host origin | Health/readiness | Kiểm chứng chức năng |','|---|---|---|---|---|---|']
for name,v in runtime['services'].items():
    functional='Android đọc/ghi thật; xem mẫu số theo service'
    if name=='order-service':functional='List200; lifecycle bị chặn bởi thiếu public address'
    elif name=='chat-service':functional='Create/send/delete/close; history403, media-view blocked'
    elif name=='marketplace-service':functional='RFQ/offer thật; RFQ image503, accept prerequisite blocked'
    elif 'storage' in name:functional='Readiness200; Bakery/proof media thật; Chat URL còn chặn Android'
    environment.append(f"| {name} | reuse/start `{v['container']}` | {'9000' if 'storage' in name else '8080'} | {v['origin']} | HTTP200 từ probe/launcher; container {v['state']} | {functional} |")
environment+=['| Cake AI | không có container; build source copy nguyên trạng thất bại | chưa chạy | không gán origin giả | BLOCKED | 0 AI HTTP attempt, không gọi provider |','| API Gateway | container hiện hữu đang dừng, route chưa đầy đủ | không dùng | không dùng | BLOCKED / không nằm đường Mobile local | sáu origins user-facing giữ nguyên topology |','',
'Lệnh đã chạy: `python -B tool/full_runbook.py`; bên trong PowerShell `-NoProfile -ExecutionPolicy Bypass -File tool/start_mobile.ps1 -DeviceId emulator-5554 -EvidenceDirectory docs/full-integration/evidence/'+RUN+'/runbook -NoResident`. Thêm `-PrepareOnly` để readiness/reverse. Restart đã diễn tập: `docker restart bakery-mobile-phase5-marketplace bakery-mobile-phase5-order bakery-mobile-phase5-chat`, sau đó chờ readiness và refetch cùng ID. Không dùng Compose down/prune. [README](../../README.md) hướng dẫn chọn serial/AVD và thư mục evidence mới.',
'','### Ma trận cấu hình từng microservice','',
'Không tạo `.env`, key, password hoặc credential mới trong nhiệm vụ này (**Generated = 0**). Giá trị từ Docker runtime/mounted configuration được tái sử dụng; `.env` Compose interpolation không đồng nghĩa container Env, và Spring property có thể lấy từ YAML mount/default dù không có tên trong Env. `SPRING_PROFILES_ACTIVE` không có trong Env sáu service: không tự đặt dev; app dùng profile mặc định/cấu hình sẵn. Không tuyên bố mọi biến có mặt đều đã validate độc lập. Auth/DB/service calls thật kiểm chứng các quan hệ đã sử dụng, storage AI/Firebase chưa usable. Không có external credential nào được bịa hoặc đổi.','',
'| Microservice | Nhóm biến cần theo source | Existing | Từ Docker / mounted config | Generated | Unresolved | Runtime status |','|---|---|---|---|---|---|---|']
variables=[]
skip={'PATH','JAVA_HOME','JAVA_VERSION','LANG','LANGUAGE','LC_ALL','JAVA_TOOL_OPTIONS'}
for name,v in runtime['services'].items():
    if not name.endswith('-service'):continue
    sourceDir=ROOT/'backend'/name;refs=set()
    for p in sourceDir.rglob('application*'):
        if p.is_file() and p.suffix in {'.yml','.yaml','.properties'} and 'target' not in p.parts:
            refs.update(re.findall(r'\$\{([A-Z][A-Z0-9_]*)(?::[^}]*)?\}',p.read_text(encoding='utf-8-sig')))
    env=set(v['environmentVariableNames'])-skip
    issue='Firebase/provider/storage usability' if name=='marketplace-service' else 'SQL42P18 và public attachment URL' if name=='chat-service' else 'Address prerequisite cho lifecycle' if name=='order-service' else 'Không thấy startup blocker; chức năng ngoài ma trận chưa được khẳng định'
    environment.append(f"| {name} | {', '.join('`'+x+'`' for x in sorted(refs)) or 'Spring/application config'} | {len(env)} tên Env | Env + mounts/default; bảng dưới | 0 | {issue} | RUNNING_WITH_LIMITATIONS |")
    for key in sorted(env|refs|{'SPRING_PROFILES_ACTIVE'}):
        purpose='Cấu hình ứng dụng/service'
        if '_DB_' in key:purpose='PostgreSQL datasource / credential'
        elif any(x in key for x in ['JWT','JWK','PRIVATE_KEY','PUBLIC_KEY']):purpose='JWT signing/verification, issuer/audience'
        elif any(x in key for x in ['SECRET','TOKEN','CLIENT_ID']):purpose='Service-to-service authentication'
        elif any(x in key for x in ['STORAGE','MINIO','FIREBASE','GOOGLE']):purpose='Object storage/provider configuration'
        elif 'URL' in key or 'URI' in key:purpose='Service discovery/routing'
        elif key=='SPRING_PROFILES_ACTIVE':purpose='Spring active profile'
        src='Existing Docker runtime Env; reused' if key in env else 'Not in Env; resolve source default / mounted config (not newly generated)'
        verified='Existing presence; live used subset verified by auth/DB/business calls, not each value independently'
        if key not in env:verified='SOURCE_ONLY_RESOLUTION; no independent value claim'
        if key=='SPRING_PROFILES_ACTIVE':verified='No override in Env; default profile, not forced dev'
        if name=='marketplace-service' and any(x in key for x in ['FIREBASE','GOOGLE','CAKE_AI']):verified='UNRESOLVED_USABILITY: RFQ upload503 / AI unavailable'
        variables.append({'service':name,'variable':key,'technicalPurpose':purpose,'source':src,'action':'REUSED_OR_EXISTING_DEFAULT','verification':verified,'generated':False})
environment+=['| cake-ai-service | biến từ application/service source; chưa có runtime | chỉ source contract | không cấu hình runtime mới | 0 | compile errors, provider/storage và moderation discovery | BLOCKED |','',
'Chi tiết variable-by-variable: [environment-variable-matrix.json]('+prefix+'environment-variable-matrix.json). Các tên ứng dụng dưới đây không chứa giá trị; JDK/system Env được loại khỏi bảng nghiệp vụ.','',
'| Service | Tên biến | Mục đích | Nguồn / xử lý | Kiểm chứng / vấn đề |','|---|---|---|---|---|']
for v in variables:environment.append(f"| {v['service']} | `{v['variable']}` | {v['technicalPurpose']} | {v['source']} | {v['verification']} |")
aiRefs=set()
for path in (ROOT/'backend/cake-ai-service').rglob('application*'):
    if path.is_file() and path.suffix in {'.yml','.yaml','.properties'} and 'target' not in path.parts:
        aiRefs.update(re.findall(r'\$\{([A-Z][A-Z0-9_]*)(?::[^}]*)?\}',path.read_text(encoding='utf-8-sig')))
for key in sorted(aiRefs):
    variables.append({'service':'cake-ai-service','variable':key,'technicalPurpose':'AI datasource/security/provider/storage; source contract only','source':'Current Backend application configuration; no runtime container','action':'READ_ONLY_SOURCE_AUDIT','verification':'BLOCKED: source does not compile, no validated runtime/provider value claim','generated':False})
    environment.append(f'| cake-ai-service | `{key}` | AI datasource/security/provider/storage | Source only, không tạo giá trị | BLOCKED: chưa compile/chạy được |')
save('environment-variable-matrix.json',variables)
environment+=['','Khóa RSA/issuer/audience và DB password hiện hữu không bị thay. Không có generated-secret strength để báo cáo vì không sinh secret. Token/cookie hợp lệ được kiểm chứng qua login/refresh/me; không dùng service token/SQL/admin bootstrap để cấp role. External secrets chỉ đọc tại `H:\\MSS\\.secrets\\bakery-platform`; directory không được chuyển vào repository.']
if (OUT/'infrastructure-detail.json').exists():
    infra=read('infrastructure-detail.json')
    environment+=['','### PostgreSQL, volume và profile thực tế','',
    'Log startup của cả sáu service xác nhận default profile, không chỉ suy từ việc thiếu Env. Database target dưới lấy từ datasource URL đã parse và loại credential/query. [Infrastructure snapshot]('+prefix+'infrastructure-detail.json) ghi profile signals, container health/network/volume; chỉ đọc, không sửa database.','',
    '| Service | DB hostname | Internal port | Database |','|---|---|---|---|']
    for service,target in infra['databaseTargets'].items():environment.append(f"| {service} | `{target['hostname']}` | {target['internalPort']} | `{target['database']}` |")
    environment+=['','| Container dữ liệu / storage hiện hữu | State / health | Persistent volumes hoặc target mount | Network |','|---|---|---|---|']
    for item in infra['databasesAndStorage']:
        mounts=', '.join((m['volumeName'] or m['type'])+' → '+m['target'] for m in item['persistentMounts'])
        environment.append(f"| `{item['container']}` | {item['state']} / {item['health'] or 'không có Docker healthcheck'} | {mounts} | {', '.join(item['networks'])} |")

lines=['# Kết quả kiểm thử E2E Mobile','',
'**PARTIAL_BLOCKED**. Không có full-pass system acceptance. Số operation HTTP2xx là coverage vận chuyển đã quan sát, không phải bằng chứng mọi nhánh/role/journey hoàn chỉnh. Run hiện tại giữ failed automation và rerun thay vì xóa lỗi.','',
f"Controller {stats['total']}; áp dụng Mobile {stats['applicable']}; Android attempted **{stats['androidAttempted']}**; có2xx **{stats['androidSuccess']}**; chỉ thất bại **{stats['androidFailedOnly']}**; chưa gọi **{stats['notAndroidAttempted']}**; host-only success thêm ngoài Android **{stats['hostOnlySuccess']}**. Cả 20 operation chưa thành công vẫn trong denominator93.",'']+serviceRows+['',
'## Các lớp bằng chứng','',
f"- `flutter analyze --no-pub`: exit{analyze['exitCode']}, 0 issue sau sửa lint helper; [analyze.json]({prefix}test-results/analyze.json).",
f"- `flutter test --no-pub --machine`: {unit['passed']} PASS, {unit['failed']} fail; [unit-widget.json]({prefix}test-results/unit-widget.json). Đây là UNIT_WIDGET_TEST_DOUBLE, gồm adapter Review/AI/selection, role guard, malformed response, config-error semantics, refresh/idempotency và các regression trước.",
'- Build APK thật: normal main và full driver. Driver source/APK hashes khớp trước reuse; normal build không thay test cache. Build success không được dùng thay runtime acceptance.',
'- Host probes chỉ đọc: Docker/readiness/auth/me/Orderlist, SQL signals và source copy compile. Không cộng thành Android UI-success.',
'- Android: cùng BakeryApp, NativeTransport, app routes/components; UI taps và sanitized event timestamp/status/resource. Full walkthrough chỉ dùng navigation người dùng, không nav hook. Hook state chỉ đọc để đối chiếu actor/event; không mint token hoặc mutation ngầm.',
'','## Hành trình và terminal state','',
'| Journey | Kết quả thực tế | Terminal / giới hạn | Evidence |','|---|---|---|---|',
f'| A | VERIFIED_CHAIN_WITH_CONTINUATION | Đăng ký mới→onboarding→Admin approve→proof synthetic reject/resubmit/approve→cùng user thành Owner→publish→Customer khác tìm đúng product. Probe đầu trước freeze, lỗi picker đã giữ và chỉ tiếp tục cùng resource; không gọi là clean frozen acceptance run | [probe]({prefix}test-results/journey-a-android-initial-probe.json), [continuation]({prefix}test-results/journey-a-android.json), fixture |',
f'| B | BLOCKED | Cart thật; checkout chặn trước POST vì thiếu public address. Không Order/fulfillment/COMPLETED/review/moderation | [capture]({prefix}screenshots/remaining-checkout-blocked.png) |',
f'| C | PARTIAL_BLOCKED | RFQ create/edit/publish→Owner offer/edit→Customer/Owner send201→withdraw/delete/close. History403/SQL42P18, image503/media URL và accept address chặn phần còn lại | [remaining]({prefix}test-results/remaining-android.json) |',
f'| D | BLOCKED | AI source adapter/UI có, không container, source compile lỗi. Không có generated result thật, moderation/selection chưa live | [source build]({prefix}test-results/cake-ai-unchanged-source-build.json) |',
f'| E | VERIFIED_SUBSET | Profile/operations/logo/cover/members readonly/add-on/category/image/hide/republish/archive/branch; plan patch/renew/review/archive, ACTIVE+SCHEDULED và snapshot100000 giữ sau price120000 | [extra]({prefix}test-results/extra-android.json) |',
f'| F | PARTIAL_VERIFIED | Login/refresh/logout/account switch qua API thật; process cold restore cùng Customer và Guest sau logout; Backend restart giữ record. Concurrency/fault cases chủ yếu unit; pending Chat không durable | [cold]({prefix}test-results/cold-restore.json), [logout]({prefix}test-results/cold-after-logout.json), [restart]({prefix}test-results/backend-persistence.json) |',
'',
'Không đưa A/E/F vào một tỷ lệ phần trăm “workflow PASS” chung vì tiêu chí và độ đầy đủ khác nhau. Ba journey B/C/D quan trọng chưa hoàn chỉnh; F còn nhánh chưa kiểm chứng native. Current video là RFQ targeted mới riêng, dùng lại bakery/product A có provenance, không ghép RFQ cũ thành một chain mới.',
'','## Case ledger hiện tại','',
'| File / lớp | PASS | BLOCKED | FAILED giữ nguyên |','|---|---|---|---|']
for name in sorted(p.name for p in (OUT/'test-results').glob('*android*.json')):
    v=read('test-results/'+name);rows=v if isinstance(v,list) else v.get('cases',[]);counts=collections.Counter(x.get('result') for x in rows)
    lines.append(f"| [{name}]({prefix}test-results/{name}) | {counts['PASS']} | {sum(n for k,n in counts.items() if k and 'BLOCKED' in k)} | {sum(n for k,n in counts.items() if k and 'FAIL' in k)} |")
lines+=['','Các file `*-retained-*` và driver log ghi lỗi picker, race chờ submit, label AI sai encoding, helper compile/lint. Đã sửa trong Mobile và rerun phần liên quan; không sửa evidence cũ. Network fault injection/unit conflict/permission tests được tách khỏi live success. Không xác minh từng status401/403/409 cho mọi operation trên Android; 2xx ở matrix không đánh dấu nhánh âm đó tự động PASS.',
'','## Review, AI và recovery','',
'Review dùng orderId từ OrderDetail.review; create/update/delete/moderate đúng source, ownership/status/rating/comment/204 và malformed success đã test bằng contract doubles. Chỉ hiện create cho Customer có Order COMPLETED; Admin phải khám phá Order hợp lệ. Không tự tạo completed Order bằng SQL để chụp Review.',
'',
'AI create multipart (metadata + tối đa5 image,10MiB/image), validate magic MIME, prompt limits/aspect/count, job pagination0-based, bounded polling và pause theo lifecycle/route/account, cancel/revise, moderation và selected-design đều theo source contract. Chưa gọi provider, không tạo kết quả AI giả. CAKE_AI_URL unset được hiển thị lỗi local configuration, không gắn HTTP503 vì không gửi request.',
'',
'Mutation không auto-retry khi chưa rõ kết quả. Logical IDs/payload giữ trong phiên; đổi actor/logout xóa state. Pending Chat journal sau process death chưa triển khai; đã đánh giá phương án mã hóa/TTL/account+origin+conversation binding và không resend ngầm. Chat history lỗi khiến reconciliation/read cursor chưa chứng minh. Token/cookie ở secure storage; mật khẩu chỉ đọc từ private fixture trong driver, không compile vào APK.',
'',
'## Phạm vi chưa kiểm chứng','',
'Không real payment/email/AI provider request; không native successful Review/AI screen, accepted-offer/direct-order lifecycle, receipts/cursor/media viewing. Không iOS/tablet/dark theme/TalkBack/manual hardware performance. Font1.3 + OS night=yes được chụp trên phone rồi settings phục hồi; app giữ fixed-light hiện có. Các contract thiếu queue/membership/address ghi rõ trong [blocker](BACKEND_BLOCKERS_AND_REQUIRED_CONTRACTS_VI.md).']
write('END_TO_END_TEST_RESULTS_VI.md',lines)

checks=['# Diễn tập startup và kiểm tra local','',
'Kết quả **PASS_EXISTING_DEPLOYMENT** cho quy trình canonical trong [README](../../README.md). Không tuyên bố bootstrap từ clone trắng. Runbook dùng PowerShell mới `-NoProfile`, tool PATH được cấp trong child process; không sửa global PATH/SDK hoặc root config.','',
'| Bước | Lệnh / evidence | Kết quả |','|---|---|---|']
for check in runbook['checks']:checks.append(f"| {check['check']} | `{' '.join(check['command'])}` | exit{check['exitCode']} |")
checks+=['',
f"Normal startup exit{runbook['startupExitCode']}, process alive={runbook['appProcessAlive']}, {runbook['seconds']} giây. [Lệnh và output sanitized]({prefix}test-results/runbook.json). Flutter3.47.1, Dart3.13.1, JDK21; Android SDK/ADB của máy tại `D:\\HomeMind\\audit-tools\\android-sdk`, Flutter tại `D:\\HomeMind\\audit-tools\\flutter`. Doctor có warning unknown channel/file_picker Kotlin compatibility và thiếu Windows-desktop tooling; không tự nâng/cài/xóa SDK.",
'',
'AVD `homemind_local_run`, `emulator-5554`, AndroidAPI36, 720×1280, một thiết bị thực được chọn. Serial/SDK không hardcode vào hướng dẫn máy khác. Boot completion, no-boot-animation fallback và Package Manager được kiểm tra hữu hạn; tám reverse ports đúng runtime. Docker đã chạy sẵn, launcher reuse/start đúng service hiện hữu, actions=[] trong readiness run. Không create/reconfigure container, không đổi secrets hoặc volumes.',
'',
f"Ảnh đầu `readme-normal-main-home.png` chỉ là splash, giữ với nhãn NOT_READY. Sau `adb shell am force-stop com.example.bakery_mobile` và `adb shell am start -n com.example.bakery_mobile/.MainActivity`, [Home thật]({prefix}screenshots/readme-normal-main-cold-home.png) hiển thị và bounded log probe không có FATAL/Unhandled/Eflutter. Không clear app data hoặc đọc token default user store.",
'',
'Build normal-main APK được cache riêng khỏi test-entry APK, có hash/size. 109 test/analyze0 được chạy thật; không dùng test double chứng minh native. Driver review-fix và partial walkthrough đều đã diễn tập. Recording smoke và full partial dùng screenrecord v1.4 help thực tế; script quản lý PID/file của chính mình và SIGINT/pull thành công. [Video index](VIDEO_INDEX_VI.md) ghi media validation và phần còn thiếu.',
'',
'Restart ba container Marketplace/Order/Chat đã thực hiện; GET cùng RFQOPEN/OfferWITHDRAWN/ConversationCLOSED200 sau restart, config/mount unchanged. DB không restart. Cold app restore Customer và Guest sau logout PASS bằng namespace synthetic riêng. Clean clone, tạo deployment từ đầu, GUI Docker startup, Android Studio Cold Boot, iOS và shutdown toàn stack: **NOT_VERIFIED**.',
'',
'Cần deployment/JAR/source-copy/DB/schema/user/credential và images đã có. Không đưa private credentials vào report. Khi config thiếu, launcher dừng để báo prerequisite; không regenerate DB password hoặc dùng Fake API. Không dùng root repair/recreate scripts trong quy trình này. External credential Cake AI/Firebase phải được chủ deployment cấp hợp lệ, không thể bịa bằng auto-env.',
'']+environment
write('LOCAL_RUNBOOK_VERIFICATION_VI.md',checks)

videoLines=['# Chỉ mục video thực tế','',
f"**PARTIAL_BLOCKED**, không đạt video FULL_PASS được yêu cầu. [Master](videos/SWEETCAKE_PARTIAL_BLOCKED_WALKTHROUGH.mp4) dài **{video['master']['durationSeconds']:.2f}s (03:18)**, MP4/H264,720×1280, raw variable-frame-rate (trung bình4.28fps), không audio. [Manifest](videos/video_manifest.json) chứa hash/codec/duration/stream và toàn bộ provenance. Master byte-identical với raw, không trim/blur/caption/speed change/transition. Không ghép ảnh tĩnh thành video.",
'',
'Ghi sau gate PARTIAL_BLOCKED và independent checks: `python -B tool/full_record.py`. Công cụ actual screenrecord v1.4, `--time-limit 0 --bit-rate 2500000`, theo dõi PID/argv riêng, SIGINT, finalized/pull exit0. Thiết bị emulator-5554. Toàn video198s vượt180s; final logout/GuestHome hiện trong decoded last frame. Warmup/reinstall/splash đầu video được giữ, không cắt để che delay.',
'',
'Tám chương là derivative liên tục từ cùng master; encode H264 CFR30 (lặp held frame theo PTS gốc, không tăng tốc). Ranh giới lấy host UTC cues, precision ghi3ms nhưng độ bất định khởi đầu capture <1s; không dùng đồng hồ status bar emulator làm thời gian nguồn. Sai số duration encode tối đa một frame ở mỗi cut. Chapter labels đánh dấu subset/blocked, không tuyên bố đã quay mọi chức năng.',
'',
'| Chương / tệp | Start | End | Role | Chức năng / scenario | API IDs đã quan sát | Resource chain | Screenshot / event | Result | Cut / giới hạn |','|---|---|---|---|---|---|---|---|---|']
scenario={'V01':'G-CATALOG','V02':'B-DIRECT','V03':'C-RFQ targeted','V04':'C-RFQ offer','V05':'C-ACCEPT/C-CHAT','V06':'C-CHAT/E-SUB/B-list','V07':'E-OVERSIGHT','V08':'D-AI/F-SESSION'}
chain=video['resourceChain']
for c in video['chapters']:
    resource='product '+chain['productId'] if c['id'] in ['V01','V02'] else 'RFQ '+chain['requestId']+' / offer '+chain['offerId']+' / conversation '+chain['conversationId']
    photo=reportRelative(c['screenshots'][0] if c['screenshots'] else video['finalGuestScreenshot'])
    videoLines.append(f"| [{c['id']}](videos/chapters/{c['id']}.mp4) | {c['startTimecode']} | {c['endTimecode']} | {c['actor']} | {c['title']} · {scenario[c['id']]} | {', '.join(c['apiIds'])} | {resource} | [ảnh]({photo}); [events]({reportRelative(video['eventFile'])}) | {c['result']} | Cắt liên tục minh bạch; xem giới hạn dưới |")
videoLines+=['','## Nội dung chưa có trong video','',
'Registration/onboarding/approval/activation/catalog publication đã có screenshot/event thật của A trước video nhưng không được quay lại để giả một run liền mạch. Các independent E mutation, refresh/cold restart/Backend restart và đầy đủ Admin Offer discovery cũng không có toàn bộ trong master. Video không thể đáp ứng “all functions/A-to-Z complete” vì không Order/fulfillment/Review, AI success, Chat history/read/media-view. Không gộp quay cũ/ID khác để che những phần thiếu.',
'',
f"Raw: [{Path(video['recording']['rawPath']).name}]({video['recording']['rawPath'].removeprefix('docs'+chr(92)+'full-integration'+chr(92)).replace(chr(92),'/')}). Gate: [acceptance-gate.json]({prefix}acceptance-gate.json). Driver build source fingerprint `{build['sourceFingerprint']}`, APK SHA256 `{build['sha256']}`. Fixture video `{chain['tag']}` dùng cùng bakery/product A, RFQ/offer/chat riêng được UI tạo lần lượt và các role đọc cùng ID.",
'',
f"FFmpeg7.1 giải mã toàn master và8clip exit0; OpenCV đọc {video['master']['decodedFrames']} frame gốc, {video['master']['blackFrameCount']} frame đen, {video['master']['visibleFrameChanges']} thay đổi hình ảnh rõ. Đã xem khung đầu/giữa/cuối, ranh giới chương và các action checkout/offer/send/subscription/AI. Last-frame MAE so screenshotGuest cuối {video['lastFrameMeanAbsoluteDifferenceToFinalScreenshot']:.3f}/255 (nén video); hình cuối xác nhận logout/Home không bị truncate. Metadata/sample hashes có trong manifest. Phát hiện VFR seek của OpenCV không đáng tin ở tail đã được khắc phục bằng sequential PTS decoding; không đổi bản gốc.",
'',
'Privacy: synthetic identity/input, password control masked, không mic/desktopaudio/debuglog/secret overlay. Kiểm tra mẫu bằng mắt và known-secret scan tệp/APK có phạm vi cụ thể; không khẳng định OCR toàn video hay bảo đảm mọi bí mật trên mọi pixel. Frame extract là derivative media trong video-frames, không tính screenshot native mới.',
'',
'Tham khảo công cụ đã đối chiếu với help cài tại máy: [Android ADB](https://developer.android.com/tools/adb), [Emulator screen recording](https://developer.android.com/studio/run/emulator-record-screen), [Flutter integration testing](https://docs.flutter.dev/testing/integration-tests).']
write('VIDEO_INDEX_VI.md',videoLines)

report=['# Báo cáo thực thi tích hợp Mobile và E2E','',
'Kết luận **PARTIAL_BLOCKED**. Đã hoàn tất các phần Mobile khả thi, thực thi kiểm tra Android thật và giao video partial có kiểm chứng. Chưa đạt full-system acceptance/video all-functions A-to-Z do các prerequisite Backend đã xác minh. Không claim rằng adapter/UI build thành công đồng nghĩa nghiệp vụ thành công.','',
'## Phạm vi, baseline và thay đổi','',
f"Đọc đủ924 dòng instruction và quy tắc/context trước implementation. Repository HEAD `{baseline['git']['head']}`, branch `{baseline['git']['branch']}`, Mobile version `{baseline['mobileVersion']}`. Baseline run `{RUN}` tại {baseline['at']}; 3.100 protected files,30 external config,638 Mobile files ban đầu. Staging ban đầu rỗng, nhiều Mobile changes và root prompt untracked đã có trước; không nhận là thay đổi mới của đợt này. [Baseline]({prefix}baseline.json).",
'',
'Chỉ ghi `mobile/`. Backend/Frontend/root config/docs/skills/secrets chỉ đọc; không SQL write/reset DB/delete volume/commit/push/deploy hoặc sửa grant. Synthetic API mutations do UI theo quyền thật. Không thay Web design, Backend business logic hoặc tạo uppercase directory. Tiến độ/evidence lịch sử được giữ.',
'',
'81 adapter cũ được giữ; bổ sung12 adapter và UI/state liên quan: Review4 (create/update/delete/Admin visibility), CakeAI7 (moderate/list/create/job detail/cancel/revise/design detail), selected-design1. Admin có Order/Review discovery qua Order list/detail, RFQ và dedicated Offer list/read-only detail. Không dựng queue/KPI/Address/user CRUD/membership editor từ endpoint tưởng tượng. [API matrix](API_COVERAGE_MATRIX_VI.md) có source/controller line/hash/annotations/DTO/handler.',
'',
'Product/Context cập nhật scope đúng, giữ theme/type/token SweetCake. Local configuration error được tách khỏi HTTP error; AI unset không tạo network503 giả. Review response dùng orderId, malformed success được giữ uncertain; delete204. AI và selection dùng đúng multipart/DTO/state/idempotency, không auto-resend. Admin RFQ/Offer bỏ Customer scope, AdminOffer không có chat/accept và dùng operational slate.',
'',
'## Coverage và vai trò','',
f"113 controller operations theo service+method+route;93 áp dụng Mobile,20 internal/service/JWK loại có lý do.93/93 có source adapter, **{stats['androidSuccess']}/{stats['applicable']}** có ít nhất một HTTP2xx từ UI Android, **{stats['androidAttempted']}/{stats['applicable']}** đã phát request Android,2 chỉ thất bại,18 chưa phát được request. Host-only success thêm ngoài Android={stats['hostOnlySuccess']}. 12 adapter mới còn runtime-blocked, không tính thành công. Mẫu số không thu nhỏ khi lỗi. Query/page/scope/forwarding không đếm thành API mới.",'']+serviceRows+['',
'| Ngữ cảnh | Chức năng đã kiểm chứng | Chưa đầy đủ |','|---|---|---|',
'| Guest | public product/bakery/plans/payment options; mới đăng ký/login thật trong A | không có private operation |',
'| Customer | auth/me/refresh/logout, onboarding/subscription, catalog/options/cart, RFQ/offer/chat subset | address→Order→Review, Chat read/media, AI |',
'| Bakery Owner + membership OWNER | activate cùng user A; profile/operations/media/category/product/options/add-on/publish, availableRFQ/offer/chat, subscription/renewal, branch/members readonly | fulfill Order, full memberships discovery/management |',
'| Admin | approve bakery/payment/reject/resubmit, plan CRUD/archive, RFQ/Offer discovery cùng record readonly, Order list all | eligible Order transition/review, AI pending queue/moderation chưa native |',
'',
'Identity chỉ có CUSTOMER/BAKERY_OWNER/ADMIN; Guest không JWT, OWNER là membership. Không thấy human role bổ sung. [Role/function matrix](ROLE_FUNCTION_MATRIX_VI.md) đóng băng tiêu chí/prerequisite, không đánh đồng mọi dòng với PASS. Complete A resource chain có continuation cùng ID; B/C/D chưa trọn; E verified subset, F partial. [Kết quả chi tiết](END_TO_END_TEST_RESULTS_VI.md) tách mẫu số operation/case/complete journey.',
'',
'## Các capability còn chặn','',
'- Address: current Identity không public discovery/CRUD; không có cách lấy addressId được quyền từ UI. Direct và accept chặn trước mutation, không nhập UUID, gọi internal hoặc tạo Order thay thế. Chưa kết luận DTO/from-offer failure vì chưa được phép gọi vượt prerequisite.',
'- Chat: history403 thực tế, server SQL42P18. Customer/Owner send201 chỉ là server xác nhận tin gửi; không chứng minh bên kia nhận/lịch sử/read. Upload được Backend nhận nhưng URL Docker-only không rewrite; view/download blocked. Own delete204/close đã thật.',
'- RFQ images: POST503; delete chưa gọi do không có mediaID. Không tạo Firebase credential giả.',
'- CakeAI: không container; build copy source không sửa thất bại Google auth/storage và ApiResponse.accepted. UI source đầy đủ nhưng0AIHTTPattempt; không job/provider/output thật. Selected design không được dựng giả. Admin thiếu queuePENDING; approved selected-design oversight không thay discovery đầy đủ.',
'- Review: chỉ từ eligible COMPLETED Order qua Mobile. Chưa có Order đó;4adapter và conditional UI/contract tests không được gọi native successful Review. OrderSummary không review, detail mới có; không global reviewqueue.',
'',
'[Backend blockers và contract cần](BACKEND_BLOCKERS_AND_REQUIRED_CONTRACTS_VI.md) ghi đề xuất, không implementation Backend. Ưu tiên: public owned addresses và Order contract tương thích; sửa typed Chat query/public signed URL; Firebase/storage; CakeAI build/runtime/provider và Admin discovery. Sau đó chạy B/C/D và các conditional Review/AI branch, reevaluate gate rồi quay full master mới.',
'',
'## Thiết kế, live transport và bảo toàn state','',
'Đã đọc/ap dụng installed design-taste-frontend và Impeccable trước UI. Đây là mở rộng hệ thống hiện có; giữ Wine/Pink/PlusJakartaSans, operational slate Owner/Admin, shared components/native date parsing. Không sửa installed skill/root state. Reviewer Impeccable độc lập yêu cầu sửa PRODUCT scope và AdminOffer ground; đã fix/chụp lại, finalship cho exactAndroidcaptures; dedicatedAdminOffer discovery cũng được reviewship. Không mở rộng verdict sang AI/Reviewblocked/iOS/tablet. [Review evidence]('+prefix+'design-finish-review.json).',
'',
'Phone720×1280 và font1.3/night=yes đã kiểm tra, sau đó phục hồi font1.0/night=no. Fixed-light được giữ; không claim darktheme/TalkBack/performance. HTML/CSS detector không áp dụng Flutter native, ghi SKIPPED với lý do. Web design reference chỉ đọc, không đưa thiết kế mới trái SweetCake vào báo cáo như đã được phê duyệt.',
'',
'Default lib/main.dart tạo LiveWorkspace khi không inject DemoWorkspace; full driver cũng dùng BakeryApp+NativeTransport. Demo riêng trước đây không bị xóa để phá history, nhưng live không fallback dữ liệu demo khi service lỗi. Actual events cho thấy HTTP theo definedorigins; driver chỉ đọc trạng thái/sanitizedevents và thao tác visibleUI, không gọi repos thay UI hoặc role override. Nội dung AI/mock/metrics không được dùng làm live evidence.',
'',
'Session dùng secure storage, refresh-cookie rotation/actor fence/single-flight trong source và tests; genuine refresh/me/role activation và cold restart có evidence. Không forward bearer tới media, không rewrite signedhost, không disableTLS. Logical key/payload giữ theo mutation trong phiên; uncertain không autoretry. PendingChat RAM mất sau processdeath, không có durable journal; đã đánh giá safeencryptedrecovery nhưng chưa triển khai/kiểm chứng khi history vẫn lỗi. Các nhánh fault/expiry/conflict native chưa đủ mọioperation; không claim toàn bộPASS.',
'',
'## Kiểm tra, video và runbook','',
f"Analyzeexit0;109unit/widgetPASS,0fail; normalmain và fulldriverAPK buildthật. Unit/testdouble, hostprobe và AndroidUI được tách. Coldprocessrestore/logout và baBackendcontainerrestartPASS cùng resourceID, khôngDBrestart. `{len(screens)}` PNGnative gồm lỗi/splash/superseded được index, không phải `{len(screens)}` successfulcases. [Evidence index](EVIDENCE_INDEX_VI.md).",
'',
f"[Master partial](videos/SWEETCAKE_PARTIAL_BLOCKED_WALKTHROUGH.mp4): {video['master']['durationSeconds']:.2f}s, MP4/H264,720×1280,8chương từ cùng raw, khôngaudio/masteredits. Source fingerprint `{build['sourceFingerprint']}`, APK `{build['sha256']}`. Full decode/sample/lastaction và hashes trong [video manifest](videos/video_manifest.json), [timecode index](VIDEO_INDEX_VI.md). Bản gốc vượt180s, khôngtruncate finalGuest. Không quay lại Aregistration/onboarding và không claim allfunctions/FULLPASS.",
'',
'README canonical đã diễn tập freshPowerShell với deployment/secrets/imagescó sẵn, normalentrypoint/liveorigins, boundedADB/PackageManager/reverse. Splash đầu giữNOTREADY; coldopenHome mớiPASS. Không claim cleanclone/GUIcoldboot/iOS/fullDockerbootstrap. [Biên bản](LOCAL_RUNBOOK_VERIFICATION_VI.md).',
'',
'## Toàn vẹn, secrets và bàn giao','',
('Kết quả guard **'+boundary['result']+'**; protected hashes/size/mtime, directory listings,30externalconfig,HEAD/branch/staging và outsideGitstatus được so với baseline chính nhiệm vụ. Không xóa fileMobilebanđầu, không đổi historicalevidence. Known-secret/patternscan trênMobiletext/log/artifacts và haiAPK archiveentries; không in value. [Final verification]('+prefix+'final-verification.json), [artifactmanifest]('+prefix+'artifact-manifest.json).' if boundary else 'Final integrity/secret scan đang chờ chạy; chưa đánh dấu toàn vẹnPASS.'),
'',
'“Không thấy known secrets qua checks đã cấu hình” có giới hạn: không universal detection/OCRtoànmedia/toolhistory/cache. Media dùng syntheticaccount/passwordmasked và representativevisualreview; khôngsecretpayloadtrongevents. APK/cache/logbịignoređượcgiữtrênđĩa; PNG/video/reportdeliverableskhôngtựcommit/LFS/upload. Chủprojectquyếtđịnhversionlargeartifacts. Khôngcommit/push/deploy/stage.',
'',
'Công việc Mobile khả thi đã được thực hiện và ghi nhận; phần chưa đạt gồm20operationchưathànhcông,fullbusinessjourneys/videofullsuccess,conditionalAI/Reviewnative và các giới hạnplatform/recovery đã nêu. Sau khi Backend/environment được xử lý trong nhiệm vụ có quyền riêng, tiếp tục từ fixture/matrix/evidence hiện tại, không reset dự án.']+['']+environment
write('FULL_MOBILE_API_INTEGRATION_E2E_REPORT_VI.md',report)
print({'reportsGenerated':4,'coverage':stats,'screenshots':len(screens),'boundary':boundary['result'] if boundary else 'PENDING'})
