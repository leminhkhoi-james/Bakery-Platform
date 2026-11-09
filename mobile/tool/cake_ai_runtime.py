"""Prepare/reuse an isolated Cake AI development runtime; never edits Backend.

Requires the current-run external Maven package. No external AI/cloud calls are
enabled. Existing database credentials are read in memory and scoped to the new
Cake AI database only. Run with prepare, up, status or restart.
"""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import subprocess
import time
import urllib.request

MOBILE = Path(__file__).resolve().parents[1]
ROOT = MOBILE.parent
STATE = json.loads((MOBILE / 'docs/cake-ai/current-run.json').read_text())
WORK = Path(STATE['runtimeDirectory'])
OUT = MOBILE / STATE['evidenceDirectory']
COMPOSE = WORK / 'compose.cake-ai.yaml'
PROJECT = 'bakery-cake-ai-' + STATE['runId'].lower()
ORIGIN = 'http://127.0.0.1:18105'


def save(name, value):
    (OUT / name).write_text(json.dumps(value, indent=2), encoding='utf-8')


def compose(*args):
    return ['docker', 'compose', '-p', PROJECT, '-f', str(COMPOSE), *args]


def prepare():
    if not WORK.is_dir() or WORK.is_relative_to(ROOT):
        raise RuntimeError('An existing external build workspace is required')
    jar = WORK / 'backend/cake-ai-service/target/cake-ai-service-0.0.1-SNAPSHOT-exec.jar'
    provenance = json.loads((OUT / 'artifact-provenance.json').read_text())
    if hashlib.sha256(jar.read_bytes()).hexdigest() != provenance['sha256']:
        raise RuntimeError('Executable JAR differs from the verified artifact')
    config = {}
    source = ROOT.parent / '.secrets/bakery-platform/local-runtime.env'
    for line in source.read_text(encoding='utf-8-sig').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            k, v = line.split('=', 1)
            config[k.strip()] = v.strip().strip('"').strip("'")
    required = ['CAKE_AI_DB_USERNAME', 'CAKE_AI_DB_PASSWORD']
    if any(not config.get(k) for k in required):
        raise RuntimeError('Missing ' + ', '.join(k for k in required if not config.get(k)))
    private = WORK / 'cake-runtime.env'
    if not private.exists():
        private.write_text(''.join(k + '=' + config[k] + '\n' for k in required), encoding='utf-8')
        account = subprocess.check_output(['whoami'], text=True).strip()
        subprocess.run(['icacls', str(private), '/inheritance:r', '/grant:r',
                        account + ':(R,W)', '*S-1-5-18:(F)'], check=True, capture_output=True)
    context = WORK / 'docker-context'
    context.mkdir(exist_ok=True)
    shutil.copy2(jar, context / 'application.jar')
    (context / 'Dockerfile').write_text(
        'FROM eclipse-temurin:21-jre\nWORKDIR /app\n'
        'RUN groupadd --system app && useradd --system --gid app --home-dir /app app\n'
        'COPY --chown=app:app application.jar /app/application.jar\n'
        'USER app:app\nEXPOSE 8080\nENTRYPOINT ["java","-jar","/app/application.jar"]\n',
        encoding='utf-8')
    COMPOSE.write_text('''services:
  cake-ai-db:
    image: postgres:17-alpine
    restart: unless-stopped
    env_file: [cake-runtime.env]
    environment:
      POSTGRES_DB: cake_ai_db
      POSTGRES_USER: ${CAKE_AI_DB_USERNAME}
      POSTGRES_PASSWORD: ${CAKE_AI_DB_PASSWORD}
    volumes: [cake-ai-data:/var/lib/postgresql/data]
    healthcheck:
      test: [CMD-SHELL, 'pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB']
      interval: 5s
      timeout: 3s
      retries: 20
  cake-ai-service:
    build: ./docker-context
    image: bakery-cake-ai:''' + STATE['runId'].lower() + '''
    restart: unless-stopped
    depends_on:
      cake-ai-db:
        condition: service_healthy
    env_file: [cake-runtime.env]
    environment:
      SERVER_PORT: '8080'
      CAKE_AI_DB_URL: jdbc:postgresql://cake-ai-db:5432/cake_ai_db
      IDENTITY_JWK_SET_URI: http://mobile-identity:8080/.well-known/jwks.json
      IDENTITY_SERVICE_BASE_URL: http://mobile-identity:8080
      MARKETPLACE_SERVICE_BASE_URL: http://phase5-marketplace:8080
      CAKE_AI_PUBLIC_URL: http://127.0.0.1:18105
      CAKE_AI_API_KEY: ''
      CAKE_AI_FIREBASE_PROJECT_ID: ''
      CAKE_AI_FIREBASE_BUCKET: ''
      CAKE_AI_POLL_DELAY_MS: '5000'
    ports: ['127.0.0.1:18105:8080']
    networks:
      default: {}
      mobile:
        aliases: [cake-ai-service]
    healthcheck:
      test: [CMD, curl, -fsS, http://localhost:8080/actuator/health/readiness]
      interval: 5s
      timeout: 3s
      retries: 30
      start_period: 30s
networks:
  mobile:
    external: true
    name: bakery-mobile-20261107_runtime
volumes:
  cake-ai-data:
''', encoding='utf-8')
    save('runtime-configuration.json', {
        'project': PROJECT, 'compose': str(COMPOSE), 'origin': ORIGIN,
        'database': 'new isolated named volume; no database host port',
        'credentials': {'CAKE_AI_DB_USERNAME': str(source), 'CAKE_AI_DB_PASSWORD': str(source)},
        'generatedSecrets': [], 'providerMode': 'LOCAL_FALLBACK',
        'storageMode': 'IN_MEMORY_FALLBACK',
        'serviceCredential': 'unresolved: Cake AI client not registered in current Identity mount',
        'pollDelayMs': 5000,
        'pollDelayReason': 'bounded local polling; permits observation/cancellation of queued jobs',
    })


def readiness():
    results = {}
    for path in ['/actuator/health', '/actuator/health/readiness', '/actuator/health/liveness']:
        try:
            with urllib.request.urlopen(ORIGIN + path, timeout=5) as r:
                results[path] = {'http': r.status, 'body': json.load(r)}
        except Exception as error:
            results[path] = {'errorType': type(error).__name__}
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['prepare', 'up', 'status', 'restart'])
    action = parser.parse_args().action
    if action == 'prepare':
        prepare()
        print('Prepared external runtime with existing scoped database credentials.')
    else:
        # Interpolation reads the external file; its contents never enter arguments/output.
        cmd = compose('--env-file', str(WORK / 'cake-runtime.env'))
        if action == 'up':
            subprocess.run([*cmd, 'up', '-d', '--build'], check=True)
        elif action == 'restart':
            subprocess.run([*cmd, 'restart', 'cake-ai-service'], check=True)
        if action in ['up', 'restart']:
            for _ in range(60):
                if readiness().get('/actuator/health/readiness', {}).get('body', {}).get('status') == 'UP':
                    break
                time.sleep(2)
        status = readiness()
        save('runtime-health.json', status)
        print(json.dumps(status))
