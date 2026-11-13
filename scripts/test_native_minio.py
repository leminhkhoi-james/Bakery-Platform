import pathlib
import tempfile
import unittest
from native_minio import loopback,topology

class NativeStorageConfigurationTest(unittest.TestCase):
    def test_origins_reject_remote_or_embedded_credentials(self):
        for origin in ('https://example.com:9000','http://user:secret@localhost:9000','http://127.0.0.1:9000/path','http://localhost:9000?key=value'):
            with self.assertRaises(ValueError):loopback(origin)
        self.assertEqual(loopback('http://localhost:9000').port,9000)

    def test_shared_instance_requires_matching_ports_and_distinct_consoles(self):
        with tempfile.TemporaryDirectory() as folder:
            env={}
            for label,port in [('BAKERY',9002),('SHARED',9000)]:
                env.update({f'NATIVE_MINIO_{label}_ENDPOINT':f'http://127.0.0.1:{port}',
                            f'NATIVE_MINIO_{label}_CONSOLE_PORT':str(port+1),
                            f'NATIVE_MINIO_{label}_DATA_DIR':str(pathlib.Path(folder)/label)})
            for prefix,port in [('BAKERY_MINIO',9002),('SUBSCRIPTION_MINIO',9000),('CHAT_STORAGE',9000)]:
                env.update({prefix+'_ENDPOINT':f'http://localhost:{port}',prefix+'_PUBLIC_ENDPOINT':f'http://127.0.0.1:{port}',prefix+'_ACCESS_KEY':'unit-user',prefix+'_SECRET_KEY':'unit-secret'})
            self.assertEqual(len(topology(env)[0]),2)
            env['CHAT_STORAGE_ENDPOINT']='http://127.0.0.1:9004'
            with self.assertRaises(ValueError):topology(env)
            env['CHAT_STORAGE_ENDPOINT']='http://127.0.0.1:9000'
            env['NATIVE_MINIO_SHARED_CONSOLE_PORT']='9002'
            with self.assertRaises(ValueError):topology(env)

if __name__=='__main__':unittest.main()
