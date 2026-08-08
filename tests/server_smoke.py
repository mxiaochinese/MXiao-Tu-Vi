from html.parser import HTMLParser
from pathlib import Path
import socket
import subprocess
import time
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]


class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.assets = []

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == 'script' and data.get('src'):
            self.assets.append(data['src'])
        if tag == 'link' and data.get('href'):
            self.assets.append(data['href'])


def free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


port = free_port()
server = subprocess.Popen(
    ['python3', '-m', 'http.server', str(port), '--bind', '127.0.0.1'],
    cwd=ROOT.parent,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
base = f'http://127.0.0.1:{port}/{ROOT.name}/'
try:
    deadline = time.time() + 15
    while True:
        try:
            with urlopen(urljoin(base, 'index.html'), timeout=1) as response:
                html = response.read().decode('utf-8')
                assert response.status == 200
            break
        except Exception:
            if time.time() >= deadline:
                raise RuntimeError('Static server did not start in time.')
            time.sleep(0.1)

    parser = AssetParser()
    parser.feed(html)
    assert parser.assets
    for reference in parser.assets:
        parsed = urlparse(reference)
        assert not parsed.scheme and not parsed.netloc, f'External asset found: {reference}'
        with urlopen(urljoin(base, reference), timeout=5) as response:
            body = response.read()
            assert response.status == 200, reference
            assert body, reference
    with urlopen(urljoin(base, 'manifest.webmanifest'), timeout=5) as response:
        assert 'application/manifest+json' in response.headers.get_content_type() or response.headers.get_content_type() == 'application/octet-stream'
    print(f'Static server smoke passed at a repository subpath: {len(parser.assets)} linked assets.')
finally:
    server.terminate()
    try:
        server.wait(timeout=5)
    except subprocess.TimeoutExpired:
        server.kill()
