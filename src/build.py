"""Build the homepage from src/template.html.

Writes two files to the repository root:
  index.html       the page Vercel serves. Images are linked from src/assets/ so the
                   browser can lazy-load and cache them.
  standalone.html  the same page with every image inlined as a data URI, for sharing as a
                   single file (opens anywhere, including offline). Heavier: use for review only.

Placeholders in the template look like {{file.webp}} and refer to files in src/assets/.
Elements marked data-linked-only (e.g. the hero preload hint) are dropped from standalone.html.
"""
import base64
import pathlib
import re

here = pathlib.Path(__file__).parent
root = here.parent
assets = here / 'assets'
mime = {'.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'}
template = (here / 'template.html').read_text()
placeholder = re.compile(r'\{\{([\w.-]+)\}\}')

missing = sorted({m for m in placeholder.findall(template) if not (assets / m).is_file()})
if missing:
    raise SystemExit(f'Missing assets: {", ".join(missing)}')


def linked(m):
    return f'src/assets/{m.group(1)}'


def inline(m):
    f = assets / m.group(1)
    return f'data:{mime[f.suffix]};base64,' + base64.b64encode(f.read_bytes()).decode()


page = placeholder.sub(linked, template)
(root / 'index.html').write_text(page)

standalone = re.sub(r'^.*data-linked-only.*\n', '', template, flags=re.M)
standalone = placeholder.sub(inline, standalone)
(root / 'standalone.html').write_text(standalone)

used = set(placeholder.findall(template))
weight = sum((assets / f).stat().st_size for f in used)
print(f'index.html       {len(page) // 1024} KB (+ {len(used)} linked images, {weight // 1024} KB)')
print(f'standalone.html  {len(standalone) // 1024} KB')
unused = sorted(p.name for p in assets.iterdir() if p.name not in used)
if unused:
    print('Unused assets:', ', '.join(unused))
