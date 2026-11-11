"""Run resumable real HTTP workflows on the bakery-gateway development stack."""
import argparse
from gateway_e2e_core import Runner
from gateway_e2e_business import bootstrap, bakery, catalog
from gateway_e2e_ai import ai, cancel_ai
from gateway_e2e_commerce import marketplace, chat, orders
from gateway_e2e_branches import branches, ai_order, final_config

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('phase', choices=['bootstrap', 'bakery', 'catalog', 'ai', 'marketplace', 'chat', 'orders', 'branches', 'ai-order', 'cancel-ai', 'final-config', 'all'])
args = parser.parse_args()
runner = Runner()
phases = {'bootstrap': bootstrap, 'bakery': bakery, 'catalog': catalog, 'ai': ai,
          'marketplace': marketplace, 'chat': chat, 'orders': orders, 'branches': branches, 'ai-order': ai_order}
if args.phase == 'cancel-ai':
    phases = {'cancel-ai': cancel_ai}
elif args.phase == 'final-config':
    phases = {'final-config': final_config}
if args.phase != 'bootstrap':
    runner.phase = 'session'
    for actor in runner.state['actors']:
        runner.login(actor)
for name, function in phases.items():
    if args.phase in [name, 'all']:
        runner.run(name, function)
