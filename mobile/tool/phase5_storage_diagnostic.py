"""Read-only metadata + idempotent replay of the exact synthetic attachment send.

Host-only connect override verifies stored bytes while preserving the signed Host.
This is never a Flutter workaround or evidence of a usable public download URL.
"""
from phase5_http import LocalApi,OUT
import base64,hashlib,http.client,json,subprocess,urllib.parse,uuid
api=LocalApi();fixture=json.loads((OUT/'compatible-live-flows.json').read_text())['fixture'];result={}
try:
    api.login('owner');assert api.private['owner']['id']==fixture['ownerId']
    c=json.loads(subprocess.check_output(['docker','inspect','bakery-local-chat-db-1']))[0];env=dict(v.split('=',1) for v in c['Config']['Env'] if '=' in v)
    mid=str(uuid.UUID(fixture['imageMessageId']));sql="SELECT client_message_id FROM messages WHERE id='"+mid+"' AND conversation_id='"+str(uuid.UUID(fixture['conversationId']))+"'"
    p=subprocess.run(['docker','exec',c['Id'],'psql','-U',env['POSTGRES_USER'],'-d',env['POSTGRES_DB'],'-At','-c',sql],capture_output=True,text=True,check=True)
    logicalId=str(uuid.UUID(p.stdout.strip()));result['existingLogicalMessageFound']=True
    boundary='phase5-'+uuid.uuid4().hex;metadata={'clientMessageId':logicalId,'messageType':'IMAGE','content':'Synthetic local attachment'}
    png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=')
    raw=(f'--{boundary}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n'+json.dumps(metadata)+f'\r\n--{boundary}\r\nContent-Disposition: form-data; name="files"; filename="phase5.png"\r\nContent-Type: image/png\r\n\r\n').encode()+png+(f'\r\n--{boundary}--\r\n').encode()
    status,value,_=api.call('owner','chat','POST','/api/v1/conversations/'+fixture['conversationId']+'/messages',headers={'Content-Type':'multipart/form-data; boundary='+boundary},raw=raw)
    result['replayStatus']=status;assert status==200 and value['data']['id']==mid
    url=urllib.parse.urlsplit(value['data']['attachments'][0]['url']);result['returnedHost']=url.hostname;result['returnedPort']=url.port;result['publicClientDownloadUsable']=url.hostname in ['localhost','127.0.0.1','10.0.2.2'] or url.scheme=='https'
    actual=json.loads((OUT/'runtime-start.json').read_text());storage=urllib.parse.urlsplit(actual['services']['chat-storage']['origin']);assert storage.hostname=='127.0.0.1'
    conn=http.client.HTTPConnection(storage.hostname,storage.port,timeout=15)
    conn.request('GET',urllib.parse.urlunsplit(('','',url.path,url.query,'')),headers={'Host':url.netloc});response=conn.getresponse();content=response.read();conn.close()
    result['hostDiagnosticConnectOverrideStatus']=response.status;result['storedBytesSha256Matches']=hashlib.sha256(content).digest()==hashlib.sha256(png).digest();result['bytesSha256']=hashlib.sha256(png).hexdigest()
    logs=subprocess.run(['docker','logs','--tail','5000','bakery-mobile-phase5-chat'],capture_output=True,text=True,encoding='utf-8',errors='replace');safe=logs.stdout+logs.stderr
    result['serverLogSignals']={name:safe.count(name) for name in ['PSQLException','could not determine data type','SQLState: 42P18'] if name in safe}
except Exception as e:result['errorType']=type(e).__name__
api.save('storage-history-diagnostic.json',{'result':result,'signedUrlPersisted':False,'sqlWritesPerformed':False,'hostOverrideIsNotMobileDownload':True});print(json.dumps(result),flush=True)
