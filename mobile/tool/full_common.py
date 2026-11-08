"""Shared paths for the full-integration run; no credentials in this module."""
from pathlib import Path
import json
MOBILE=Path(__file__).resolve().parents[1]
ROOT=MOBILE.parent
DOCS=MOBILE/'docs/full-integration'
STATE=json.loads((DOCS/'current-run.json').read_text(encoding='utf-8'))
RUN=STATE['runId']
OUT=MOBILE/STATE['evidence']
def save(name,value):
    p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
    return p
