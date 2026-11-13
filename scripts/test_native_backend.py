import argparse
import io
import os
import pathlib
import tempfile
import unittest
from unittest.mock import patch

import native_backend as native

class NativeEnvironmentTest(unittest.TestCase):
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
