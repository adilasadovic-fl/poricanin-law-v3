"""Build a single self-contained index.html from template.html by inlining assets/ as data URIs."""
import base64, re, pathlib
here = pathlib.Path(__file__).parent
mime = {'.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'}
def inline(m):
    f = here/'assets'/m.group(1)
    return f'data:{mime[f.suffix]};base64,' + base64.b64encode(f.read_bytes()).decode()
html = re.sub(r'\{\{([\w.-]+)\}\}', inline, (here/'template.html').read_text())
(here.parent/'index.html').write_text(html); print('index.html', len(html)//1024, 'KB')
