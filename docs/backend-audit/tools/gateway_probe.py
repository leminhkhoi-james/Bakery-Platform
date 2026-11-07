"""Chạy Gateway JAR hiện tại bằng image Java cache, container riêng không DB."""
from pathlib import Path
import json,subprocess,tempfile,time,requests
EV=Path(__file__).resolve().parents[1]/'evidence';WORK=Path(tempfile.gettempdir())/'bakery-backend-audit-20261107'
jar=WORK/'source/backend/api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar';assert jar.exists()
name='bakery-audit-20261107-gateway-probe'
old=subprocess.run(['docker','inspect',name],capture_output=True)
if old.returncode==0:raise SystemExit('Probe container đã tồn tại; dùng evidence đã ghi, không tạo lại.')
image=json.loads((WORK/'runtime-compose.json').read_text())['services']['identity-service']['image']
r=subprocess.run(['docker','run','-d','--name',name,'--label','com.docker.compose.project=bakery-audit-20261107','-p','127.0.0.1:18090:8080','--mount',f'type=bind,source={jar},target=/audit/gateway.jar,readonly','--entrypoint','java',image,'-Xmx128m','-jar','/audit/gateway.jar'],capture_output=True,text=True)
if r.returncode:raise RuntimeError('Gateway probe failed before startup: '+r.stderr[:150])
time.sleep(8);c=json.loads(subprocess.check_output(['docker','inspect',name]))[0]
try:response=requests.get('http://127.0.0.1:18090/actuator/health',timeout=3);status=response.status_code
except requests.RequestException:status='CONNECTION_REFUSED'
logs=subprocess.check_output(['docker','logs',name],stderr=subprocess.STDOUT).decode('utf-8',errors='replace')
out={'container':name,'state':c['State']['Status'],'exitCode':c['State']['ExitCode'],'healthHttp':status,'startedLog':any('Started ApiGatewayApplication' in x for x in logs.splitlines()),'webServerStarted':any(x in logs for x in ['Tomcat started','Netty started']),'conclusion':'Bootstrap non-web, không có route forwarding trong source/pom hiện tại.'}
(EV/'gateway-probe.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(out,ensure_ascii=True))
