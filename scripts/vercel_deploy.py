from pathlib import Path
import json
import re
import urllib.request

keys = Path('/root/.openclaw/workspace/.secrets/keys.env').read_text()
match = re.search(r'^VERCEL_TOKEN=(.*)$', keys, re.M)
if not match:
    raise SystemExit('Missing VERCEL_TOKEN')

token = match.group(1).strip()
root = Path('/root/.openclaw/workspace/body-log/dist')
files = []
text_exts = {'.html', '.css', '.js', '.json', '.svg', '.txt'}

for path in root.rglob('*'):
    if path.is_file() and path.suffix in text_exts:
        files.append({
            'file': str(path.relative_to(root)).replace('\\', '/'),
            'data': path.read_text(),
        })

payload = {
    'name': 'wellness-app',
    'project': 'wellness-app',
    'target': 'production',
    'files': files,
}

req = urllib.request.Request(
    'https://api.vercel.com/v13/deployments',
    data=json.dumps(payload).encode(),
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    },
)

with urllib.request.urlopen(req) as resp:
    print(resp.status)
    print(resp.read().decode())
