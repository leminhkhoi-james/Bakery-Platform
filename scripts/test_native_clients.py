import os
import unittest
from unittest.mock import patch

import native_clients as native


class PublicNativeConfigurationTest(unittest.TestCase):
    def test_no_root_or_parent_backend_secrets_reach_client_processes(self):
        settings = {'VITE_API_BASE_URL':'/api/v1','VITE_ENABLE_MOCK_FALLBACK':'false',
                    'VITE_ENABLE_BUSINESS_SIMULATION':'false','VITE_DEMO_EMPTY_DATA':'false',
                    'NATIVE_WEB_GATEWAY_ORIGIN':'http://127.0.0.1:8080',
                    'NATIVE_ANDROID_API_ORIGIN':'http://127.0.0.1:8080',
                    'CAKE_AI_API_KEY':'secret','FIREBASE_CREDENTIALS_BASE64':'private',
                    'VITE_SECRET_KEY':'never-export'}
        with patch.dict(os.environ,{'VITE_SECRET_KEY':'inherited','CAKE_AI_API_KEY':'parent'}):
            child=native.environment(settings)
        self.assertNotIn('CAKE_AI_API_KEY',child)
        self.assertNotIn('FIREBASE_CREDENTIALS_BASE64',child)
        self.assertNotIn('VITE_SECRET_KEY',child)
        self.assertEqual(len(native.mobile_defines(settings)),8)
        self.assertTrue(all('secret' not in value for value in native.mobile_defines(settings)))

    def test_public_origin_rejects_embedded_credentials_queries_and_remote_hosts(self):
        for value in ('http://user:pass@localhost:8080','http://localhost:8080?token=x',
                      'http://example.test:8080','http://localhost:8081','http://localhost:8080/api'):
            with self.assertRaises(ValueError): native.validate_origin(value)


if __name__=='__main__': unittest.main()
