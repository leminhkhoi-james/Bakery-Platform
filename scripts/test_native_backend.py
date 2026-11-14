import argparse
import io
import os
import pathlib
import tempfile
import unittest
from unittest.mock import patch

import native_backend as native

class NativeEnvironmentTest(unittest.TestCase):
    def test_explicit_bounded_root_ai_settings_are_honored(self):
        env={'CAKE_AI_DB_URL':'jdbc:postgresql://localhost:5432/cake_ai','FIREBASE_CREDENTIALS_BASE64':'encoded-fixture',
             'CAKE_AI_ENABLED':'true','CAKE_AI_SCHEDULER_ENABLED':'true',
             'CAKE_AI_REQUIRE_ADMIN_REVIEW':'true','CAKE_AI_MAX_DESIGNS_PER_EXECUTION':'1',
             'CAKE_AI_DAILY_EXECUTIONS_PER_CUSTOMER':'2','CAKE_AI_DAILY_PROVIDER_REQUESTS':'6',
             'CAKE_AI_IMAGE_OUTPUT_TOKENS':'4096','CAKE_AI_MODERATION_OUTPUT_TOKENS':'1024',
             'CAKE_AI_WORKERS':'1'}
        args=argparse.Namespace(database_map=None,allow_existing_local_databases=True,firebase_sandbox=True)
        actual,_=native.process_env('cake-ai-service',args,env,{key:'ROOT_ENV' for key in env})
        self.assertEqual(actual['CAKE_AI_ENABLED'],'true')
        self.assertEqual(actual['CAKE_AI_SCHEDULER_ENABLED'],'true')
        self.assertEqual(actual['CAKE_AI_CLEANUP_ENABLED'],'false')
        for key,value in [('CAKE_AI_DAILY_PROVIDER_REQUESTS','7'),('CAKE_AI_REQUIRE_ADMIN_REVIEW','false'),
                          ('CAKE_AI_IMAGE_OUTPUT_TOKENS','0'),('CAKE_AI_WORKERS','')]:
            with self.subTest(key=key),self.assertRaises(ValueError):
                native.process_env('cake-ai-service',args,env | {key:value},{key:'ROOT_ENV' for key in env})

    def test_dual_stack_preflight_covers_both_loopback_families(self):
        self.assertEqual(native.native_listeners('api-gateway', {
            'SERVER_ADDRESS':'127.0.0.1','SERVER_PORT':'8080','GATEWAY_NATIVE_DUAL_LOOPBACK':'true'}),
            [('127.0.0.1',8080),('::1',8080)])
        for address in ('0.0.0.0','::','localhost'):
            with self.assertRaises(ValueError):
                native.native_listeners('api-gateway', {'SERVER_ADDRESS':address,'SERVER_PORT':'8080'})

    def test_dotenv_accepts_quotes_comments_and_literal_bcrypt(self):
        with tempfile.TemporaryDirectory() as directory:
            path=pathlib.Path(directory)/'settings.env'
            path.write_text('NAME="native value" # comment\nHASH=$2a$12$literal\nEMPTY=\n')
            self.assertEqual(native.dotenv(path),{'NAME':'native value','HASH':'$2a$12$literal','EMPTY':''})

    def test_dotenv_rejects_duplicates_and_invalid_names(self):
        for content in ('KEY=one\nKEY=two\n','CHAT_DB_URL:jdbc:postgresql://localhost/chat\n'):
            with tempfile.TemporaryDirectory() as directory:
                path=pathlib.Path(directory)/'settings.env'; path.write_text(content)
                with self.assertRaises(ValueError): native.dotenv(path)

    def test_dotenv_preserves_structured_round_trip_and_does_not_expand_shell(self):
        with tempfile.TemporaryDirectory() as directory:
            path=pathlib.Path(directory)/'settings.env'
            path.write_text("UNICODE='Bánh kem'\nHASH='$2a$12$literal'\nPATH='C:\\cake\\keys'\n"
                    "PEM=\"line1\\nline2\"\nBASE64='YWJjZA=='\nQUOTED='a\"b'\nSHELL='$(not-executed)'\nEMPTY=\n",encoding='utf-8')
            parsed=native.dotenv(path)
            self.assertEqual(parsed,{'UNICODE':'Bánh kem','HASH':'$2a$12$literal','PATH':r'C:\cake\keys',
                    'PEM':'line1\nline2','BASE64':'YWJjZA==','QUOTED':'a"b','SHELL':'$(not-executed)','EMPTY':''})

    def test_consolidated_credentials_do_not_use_external_files(self):
        env={'IDENTITY_DB_URL':'jdbc:postgresql://localhost:5432/identity','IDENTITY_JWT_PRIVATE_KEY_BASE64':'encoded',
             'IDENTITY_JWT_PUBLIC_KEY_BASE64':'encoded','IDENTITY_JWT_PRIVATE_KEY_PATH':'missing-private.pem',
             'IDENTITY_JWT_PUBLIC_KEY_PATH':'missing-public.pem','FIREBASE_CREDENTIALS_BASE64':'encoded-json',
             'MARKETPLACE_DB_URL':'jdbc:postgresql://localhost:5432/marketplace'}
        args=argparse.Namespace(database_map=None,allow_existing_local_databases=True,firebase_sandbox=True)
        sources={name:'ROOT_ENV' for name in env}
        identity,_=native.process_env('identity-service',args,env,sources)
        marketplace,_=native.process_env('marketplace-service',args,env,sources)
        self.assertNotIn('IDENTITY_JWT_PRIVATE_KEY_PATH',identity)
        self.assertNotIn('FIREBASE_CREDENTIALS_BASE64',identity)
        self.assertNotIn('IDENTITY_JWT_PRIVATE_KEY_BASE64',marketplace)
        self.assertNotIn('GOOGLE_APPLICATION_CREDENTIALS',marketplace)
        self.assertEqual(marketplace['FIREBASE_CREDENTIALS_BASE64'],'encoded-json')

    def test_client_aliases_are_scoped_and_parent_secrets_not_inherited(self):
        env={'MARKETPLACE_CLIENT_SECRET':'marketplace-only','CAKE_AI_CLIENT_SECRET':'cake-only',
             'BAKERY_CLIENT_SECRET':'bakery-only','BAKERY_CLIENT_SECRET_HASH':'hash-only',
             'BACKEND_CORS_ALLOWED_ORIGINS':'http://localhost:5173'}
        sources={name:'ROOT_ENV' for name in env}
        args=argparse.Namespace(database_map=None,allow_existing_local_databases=True,firebase_sandbox=False)
        env.update({'MARKETPLACE_DB_URL':'jdbc:postgresql://localhost:5432/marketplace',
                    'CAKE_AI_DB_URL':'jdbc:postgresql://localhost:5432/cake_ai',
                    'IDENTITY_DB_URL':'jdbc:postgresql://localhost:5432/identity'})
        sources.update({name:'ROOT_ENV' for name in env})
        with patch.dict(os.environ,{'SERVICE_CLIENT_SECRET':'untrusted-parent'},clear=False):
            market,_=native.process_env('marketplace-service',args,env,sources)
            cake,_=native.process_env('cake-ai-service',args,env,sources)
            identity,_=native.process_env('identity-service',args,env,sources)
        self.assertEqual(market['SERVICE_CLIENT_SECRET'],'marketplace-only')
        self.assertEqual(cake['SERVICE_CLIENT_SECRET'],'cake-only')
        self.assertNotIn('CAKE_AI_CLIENT_SECRET',market)
        self.assertNotIn('SERVICE_CLIENT_SECRET',identity)
        self.assertNotIn('BAKERY_CLIENT_SECRET',identity)
        self.assertEqual(identity['BAKERY_CLIENT_SECRET_HASH'],'hash-only')
        self.assertEqual(cake['BACKEND_CORS_ALLOWED_ORIGINS'],'http://localhost:5173')

    def test_existing_remote_database_is_rejected(self):
        args=argparse.Namespace(database_map=None,allow_existing_local_databases=True,firebase_sandbox=False)
        with self.assertRaises(ValueError):
            native.process_env('cake-ai-service',args,{'CAKE_AI_DB_URL':'jdbc:postgresql://untrusted.example/db'},
                    {'CAKE_AI_DB_URL':'ROOT_ENV'})

if __name__=='__main__': unittest.main()
