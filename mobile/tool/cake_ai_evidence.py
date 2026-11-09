"""Index genuine evidence without rendering or changing any screenshot pixels."""
import datetime
import hashlib
import json
from PIL import Image
from cake_ai_runtime import ROOT, MOBILE, OUT, STATE, save

docs = MOBILE / 'docs/cake-ai'
inventory = json.loads((OUT / 'api-inventory.json').read_text())
patterns = ['@PostMapping(consumes', '@GetMapping\n', '@GetMapping("/{id}")',
            '@PostMapping("/{id}/prompt-revisions")', '@PostMapping("/{id}/cancel")',
            '@GetMapping("/generated-designs/{id}")', '@PatchMapping("/admin/generated-designs/{id}/moderation")',
            '@GetMapping("/generated-designs/{id}/validation")', '@GetMapping("/cake-requests/{id}/generation-context")',
            '@GetMapping("/storage/**")']
for row, pattern in zip(inventory['endpoints'], patterns):
    text = (ROOT / row['source']).read_text()
    at = text.index(pattern)
    row['sourceLine'] = text[:at].count('\n') + 1
save('api-inventory.json', inventory)
results = json.loads((OUT / 'api-final-results.json').read_text())
lines = [
    '# Ma trận API Cake AI và kết quả xác minh', '',
    'Run `' + STATE['runId'] + '`. API thật của Docker; không phải test double. Kết quả provider thật vẫn BLOCKED.', '',
    '## Inventory và Flutter', '',
    '| Method/path | Quyền/consumer | Flutter | Source | Contract |',
    '|---|---|---|---|---|',
]
for row in inventory['endpoints']:
    lines.append('| `' + row['method'] + ' ' + row['path'] + '` | ' + row['role'] + ' | ' +
                 (row['mobileAdapter'] or 'Host/internal/storage; không đưa service credential vào Flutter') +
                 ' | `' + row['source'] + ':' + str(row['sourceLine']) + '` | ' + row['contract'] + ' |')
lines.extend(['', '## Từng kiểm tra runtime', '',
              'Có 40 kiểm tra ban đầu; sau đối chiếu kỳ vọng 39 PASS, 1 FAIL thật. Bốn invalid-value trả422 đúng source; Admin có thêm CUSTOMER nên được list chính job của mình. Raw evidence được giữ nguyên, không chỉnh status thực tế.', '',
              '| Trường hợp | Actor | HTTP thật | Kỳ vọng cuối | Kết quả |', '|---|---|---|---|---|'])
adjudication = {r['label']: r for r in json.loads((OUT / 'host-expectation-adjudication.json').read_text())['corrections']}
for row in results['checks']:
    expected = adjudication.get(row['label'], {}).get('correctExpected', row['expected'])
    lines.append('| ' + row['label'] + ' | ' + row['actor'] + ' | ' + str(row['http']) +
                 ' | ' + '/'.join(map(str, expected)) + ' | ' + row['adjudicatedResult'] + ' |')
lines.extend(['', '## Giới hạn và bằng chứng bổ sung', '',
              'Foreign RFQ được nhận202 là lỗi quyền/context thật, đã hủy job qua API. Không có pending design hợp lệ để PATCH moderation thành công trong runtime; 409 của design đã APPROVED không phải bằng chứng approve/reject thành công.', '',
              'Internal validation trả ownerMatches/requestMatches theo ID thật; human internal403. Kiểm tra này ở host với token service hợp lệ, không phải Mobile integration. Xem [internal-contract-verification.json](evidence/' + STATE['runId'] + '/internal-contract-verification.json).', '',
              'Không xác minh live rate-limit/timeout/refusal của provider khi không có key. Unit test có test double cho các nhánh đó; không nhập vào kết quả live.', '',
              '[Raw results](evidence/' + STATE['runId'] + '/host-api-results.json) · [Adjudication](evidence/' + STATE['runId'] + '/host-expectation-adjudication.json) · [Android reconciliation](evidence/' + STATE['runId'] + '/android-server-reconciliation.json).', ''])
(docs / 'API_VERIFICATION_MATRIX_VI.md').write_text('\n'.join(lines), encoding='utf-8')

screenshots = []
for p in sorted(OUT.rglob('*.png')):
    with Image.open(p) as img:
        size = img.size
    screenshots.append({
        'path': p.relative_to(OUT).as_posix(), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(),
        'bytes': p.stat().st_size, 'width': size[0], 'height': size[1],
        'fileWrittenAtUtc': datetime.datetime.fromtimestamp(p.stat().st_mtime, datetime.timezone.utc).isoformat(),
        'capture': 'ADB framebuffer' if 'readme-' in p.name or p.name.startswith('diagnostic') else 'FlutterDriver screenshot on real Android Emulator',
        'retainedEarlierVisualPass': 'previous-visual-' in str(p),
    })
save('screenshot-index.json', {'screenshots': screenshots, 'count': len(screenshots),
                              'pixelsEdited': False, 'timestampMeaning': 'filesystem write time at capture; archived file mtime preserved'})
lines = ['# Chỉ mục bằng chứng Cake AI', '', 'Run `' + STATE['runId'] + '`. Screenshot thật từ emulator, không chỉnh pixel. Timestamp là thời điểm ghi file capture (UTC); file archive giữ mtime cũ. Không có video full-pass.', '',
         '| Ảnh | Kích thước | Thời điểm UTC | Nguồn |', '|---|---|---|---|']
for row in screenshots:
    rel = 'evidence/' + STATE['runId'] + '/' + row['path']
    lines.append('| [' + row['path'] + '](' + rel + ') | ' + str(row['width']) + '×' + str(row['height']) +
                 ' | ' + row['fileWrittenAtUtc'] + ' | ' + row['capture'] + ('; bản trước được giữ lại' if row['retainedEarlierVisualPass'] else '') + ' |')
lines.extend(['', 'Ảnh `readme-main-cold-restart.png` còn splash, không được tính ready. `readme-main-cold-ready.png` là Home đã quan sát. `final-*` thuộc UI cuối; `previous-visual-*` giữ các lần framing trước.', '',
              'Checksum đầy đủ, byte length và metadata trong [screenshot-index.json](evidence/' + STATE['runId'] + '/screenshot-index.json).', '',
              '## Hồ sơ chính', '',
              '- [Baseline](evidence/' + STATE['runId'] + '/baseline.json).',
              '- [Artifact provenance](evidence/' + STATE['runId'] + '/artifact-provenance.json) và [class resolution](evidence/' + STATE['runId'] + '/packaged-class-resolution.json).',
              '- [API cuối](evidence/' + STATE['runId'] + '/api-final-results.json); raw evidence/kỳ vọng đầu vẫn giữ.',
              '- [Android journey](evidence/' + STATE['runId'] + '/android-results.json) và [events](evidence/' + STATE['runId'] + '/android-events.json).',
              '- [Visual cuối](evidence/' + STATE['runId'] + '/android-visual-results.json).',
              '- [Provider mode](evidence/' + STATE['runId'] + '/provider-mode.json) và [restart persistence](evidence/' + STATE['runId'] + '/restart-persistence.json).',
              '- [README rehearsal](evidence/' + STATE['runId'] + '/readme-rehearsal-acceptance.json).',
              '- [Final integrity](evidence/' + STATE['runId'] + '/final-integrity.json).', ''])
(docs / 'EVIDENCE_INDEX_VI.md').write_text('\n'.join(lines), encoding='utf-8')
save('completion-matrix.json', {'overall': 'PARTIAL_BLOCKED', 'stages': {
    'maven': 'PASS_BUILD_ALREADY_SUCCESSFUL', 'docker': 'RUNNING_WITH_LIMITATIONS',
    'api': 'PARTIAL_BLOCKED_FOREIGN_RFQ_ACCEPTED', 'provider': 'LOCAL_FALLBACK_VERIFIED_REAL_PROVIDER_BLOCKED',
    'flutterAndroid': 'VERIFIED_WITH_LIMITATIONS_PENDING_MODERATION_NOT_REACHED'},
    'screenshots': len(screenshots), 'providerChargeableRequests': 0})
print(json.dumps({'indexedScreenshots': len(screenshots), 'apiChecks': len(results['checks']), 'overall': 'PARTIAL_BLOCKED'}))
