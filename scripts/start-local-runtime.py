"""Compatibility entrypoint for the native root-.env runtime.

Container/external-bundle startup has been retired. See scripts/native_backend.py.
"""
import sys
import native_backend

if __name__ == '__main__':
    aliases = {'up':'start'}
    if len(sys.argv) > 1:
        sys.argv[1] = aliases.get(sys.argv[1], sys.argv[1])
    native_backend.main()
