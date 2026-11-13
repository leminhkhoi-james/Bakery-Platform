"""Compatibility entrypoint: native Gateway uses the canonical root .env.

No generated credentials, secondary env file, container startup or implicit
provider calls. Paid provider execution belongs to the explicit application flow.
"""
import sys
from native_backend import ROOT, dotenv, main

if __name__ == '__main__':
    action = sys.argv[1] if len(sys.argv) > 1 else 'status'
    if action == 'prepare':
        dotenv(ROOT / '.env')
        print('Root .env syntax validated; no credentials changed or exported.')
    elif action in ('up','start','verify','status','stop','build'):
        sys.argv[1:] = [('start' if action == 'up' else action), *sys.argv[2:]]
        main()
    else:
        raise SystemExit('Retired action. Configure the authorized native policy in root .env; use native_backend.py.')
