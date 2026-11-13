"""Prepare scoped local service credentials and inspect Gemini availability.

Secret material stays in ignored backend/target; no credentials are printed.
"""
from pathlib import Path
import argparse
import json
import os
import secrets
import shutil
import subprocess
import urllib.error
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'backend/target'
ENV = TARGET / 'gateway-e2e.env'
FILES = ['compose.yaml', 'docker-compose.bakery-subscription.yml', 'docker-compose.order-service.yml',
         'docker-compose.chat-service.yml', 'compose.services.yaml', 'compose.gateway.yaml', 'compose.gateway-e2e.yaml']


def read_env(path):
    result = {}
    if path.is_file():
        for line in path.read_text(encoding='utf-8-sig').splitlines():
            if '=' in line and not line.lstrip().startswith('#'):
                key, value = line.split('=', 1)
                result[key.strip()] = value.strip().strip('\"\'')
    return result


def compose(*arguments):
    command = ['docker', 'compose', '--env-file', str(ROOT / '.env'), '--env-file', str(ENV), '-p', 'bakery-gateway']
    for filename in FILES:
        command += ['-f', filename]
    return subprocess.run(command + list(arguments), cwd=ROOT, check=True)


def prepare():
    if all(read_env(ENV).get(key) for key in ['BAKERY_CLIENT_SECRET', 'SUBSCRIPTION_CLIENT_SECRET',
                                            'ORDER_SERVICE_CLIENT_SECRET', 'CHAT_SERVICE_CLIENT_SECRET']):
        print('Reusing scoped E2E service credentials.')
        return
    root = read_env(ROOT / '.env')
    secrets_by_name = {key: root.get(key) or secrets.token_urlsafe(32) for key in
                       ['BAKERY_CLIENT_SECRET', 'SUBSCRIPTION_CLIENT_SECRET',
                        'ORDER_SERVICE_CLIENT_SECRET', 'CHAT_SERVICE_CLIENT_SECRET']}
    work = TARGET / 'gateway-hash'
    work.mkdir(parents=True, exist_ok=True)
    libraries = []
    with zipfile.ZipFile(ROOT / 'backend/identity-service/target/identity-service-0.0.1-SNAPSHOT-exec.jar') as archive:
        for name in archive.namelist():
            if name.startswith('BOOT-INF/lib/') and any(term in name for term in ['spring-security-crypto-', 'commons-logging-']):
                target = work / Path(name).name
                target.write_bytes(archive.read(name))
                libraries.append(str(target))
    source = work / 'HashServiceClients.java'
    source.write_text('''import java.io.*;
import org.springframework.security.crypto.bcrypt.BCrypt;
class HashServiceClients {
 public static void main(String[] args) throws Exception {
  var reader = new BufferedReader(new InputStreamReader(System.in));
  for (String line; (line = reader.readLine()) != null;)
   System.out.println(BCrypt.hashpw(line, BCrypt.gensalt(12)));
 }
}
''', encoding='utf-8')
    hashed = subprocess.run(['java', '-cp', os.pathsep.join(libraries), str(source)],
                            input='\n'.join(secrets_by_name.values()) + '\n',
                            text=True, capture_output=True, check=True, timeout=30)
    hashes = [line for line in hashed.stdout.splitlines() if line.startswith('$2')]
    if len(hashes) != len(secrets_by_name):
        raise RuntimeError('Service credential hashing failed; output suppressed')
    result = {**read_env(ENV), **secrets_by_name}
    for (key, _), hashed_value in zip(secrets_by_name.items(), hashes):
        hash_key = {'ORDER_SERVICE_CLIENT_SECRET': 'ORDER_CLIENT_SECRET_HASH',
                    'CHAT_SERVICE_CLIENT_SECRET': 'CHAT_SERVICE_CLIENT_SECRET_HASH'}.get(key, key + '_HASH')
        result[hash_key] = hashed_value
    ENV.write_text(''.join(key + "='" + value + "'\n" for key, value in result.items()), encoding='utf-8')
    account = subprocess.check_output(['whoami'], text=True).strip()
    subprocess.run(['icacls', str(ENV), '/inheritance:r', '/grant:r', account + ':F',
                    '/grant:r', '*S-1-5-18:F'], capture_output=True, check=True)
    print('Prepared scoped E2E service credentials; root .env unchanged.')


def provider():
    values = read_env(ROOT / '.env')
    api_key = values.get('GEMINI_API_KEY')
    if not api_key:
        raise RuntimeError('GEMINI_API_KEY missing in root .env')
    client = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    request = urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
                                     headers={'x-goog-api-key': api_key})
    try:
        with client.open(request, timeout=30) as response:
            names = [model['name'].removeprefix('models/') for model in json.load(response).get('models', [])]
    except urllib.error.HTTPError as error:
        print('Gemini model discovery HTTP', error.code)
        raise SystemExit(1)
    image_candidates = ['gemini-3.1-flash-image', 'gemini-3.1-flash-image-preview',
                        'gemini-3-pro-image-preview', 'gemini-2.5-flash-image']
    moderation_candidates = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash']
    image = values.get('GEMINI_IMAGE_MODEL') or next((name for name in image_candidates if name in names), None)
    moderation = values.get('GEMINI_MODERATION_MODEL') or next((name for name in moderation_candidates if name in names), None)
    if not image or not moderation or image not in names or moderation not in names:
        print(json.dumps({'imageModels': [name for name in names if 'image' in name],
                          'moderationCandidates': [name for name in names if 'flash' in name and 'image' not in name]}))
        raise RuntimeError('Configured/suitable Gemini models unavailable')
    with ENV.open('a', encoding='utf-8') as output:
        output.write('GEMINI_IMAGE_MODEL=' + image + '\nGEMINI_MODERATION_MODEL=' + moderation + '\n')
    evidence = {'credentialAccepted': True, 'imageModel': image, 'moderationModel': moderation,
                'generationRequests': 0, 'discovery': 'Google model list, no generation call'}
    (TARGET / 'gateway-provider-preflight.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
    print(json.dumps(evidence))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'provider', 'up', 'enable-ai', 'disable-ai', 'pause-worker', 'refresh-core'])
    action = parser.parse_args().action
    if action == 'prepare': prepare()
    elif action == 'provider': provider()
    else:
        os.environ['GATEWAY_E2E_AI_ENABLED'] = 'true' if action in ['enable-ai', 'pause-worker', 'refresh-core'] else 'false'
        os.environ['GATEWAY_E2E_SCHEDULER_ENABLED'] = 'true' if action == 'enable-ai' else 'false'
        if action == 'refresh-core':
            for module in ['identity-service', 'order-service']:
                target = ROOT / 'backend' / module / 'target'
                shutil.copy2(target / (module + '-0.0.1-SNAPSHOT-exec.jar'), target / 'docker-runtime/application.jar')
            compose('up', '-d', '--build', '--wait', '--wait-timeout', '240', 'identity-service', 'order-service', 'cake-ai-service')
        else:
            compose('up', '-d', '--no-build', '--wait', '--wait-timeout', '240')
