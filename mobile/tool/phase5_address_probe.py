"""Read existing owned synthetic address metadata, then verify direct-order contract."""
from phase5_http import LocalApi,OUT
import datetime,json,subprocess,uuid
api=LocalApi();finding={}
try:
    api.login('customer')
    container=json.loads(subprocess.check_output(['docker','inspect','bakery-local-identity-db-1']))[0]
    env=dict(x.split('=',1) for x in container['Config']['Env'] if '=' in x)
    userId=str(uuid.UUID(api.private['customer']['id']))
    sql="SELECT id FROM user_addresses WHERE user_id='"+userId+"' ORDER BY created_at LIMIT 1"
    p=subprocess.run(['docker','exec',container['Id'],'psql','-U',env['POSTGRES_USER'],'-d',env['POSTGRES_DB'],'-A','-t','-c',sql],capture_output=True,text=True,timeout=20)
    finding['readOnlySyntheticAddressLookupExitCode']=p.returncode
    address=p.stdout.strip()
    if p.returncode==0 and address:
        address=str(uuid.UUID(address));finding['ownedExistingAddressFound']=True
        needed=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=25)).isoformat()
        r=api.call('customer','order','POST','/api/v1/orders/direct',{'bakeryId':api.private['bakeryId'],'productId':api.private['productId'],'quantity':1,'optionSelections':[],'addOns':[],'deliveryAddressId':address,'requestedDeliveryAt':needed,'customerNote':'Synthetic Phase5 direct contract probe'},headers={'Idempotency-Key':str(uuid.uuid4())})
        finding['directOrderStatus']=r[0]
        if isinstance(r[1],dict) and r[1].get('message')=='Delivery address is missing or incomplete':finding['verifiedError']='Delivery address is missing or incomplete'
        finding['publicAddressContractAvailable']=False
    else:finding['ownedExistingAddressFound']=False
except Exception as e:finding['errorType']=type(e).__name__
api.save('address-contract-probe.json',{'findings':finding,'addressIdentifierPersisted':False,'sqlWritesPerformed':False,'limitations':'The metadata lookup is host-side synthetic diagnosis, not a Mobile address source.'});print(json.dumps(finding))
