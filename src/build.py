"""Build the Poricanin Law site from src/.

    python3 src/build.py

Every file in src/pages/ becomes a page in the repository root (src/pages/about.html -> about.html).
A page starts with one line of settings, for example:

    <!--page {"title": "About us | Poricanin Law", "description": "...", "nav": "about"} -->

Settings: title, description, nav (which header link is marked as current), preload (an image in
src/assets to preload, for pages whose first screen is that image), bodyclass, cta (false to leave
out the shared closing call-to-action).

Each page is wrapped as: partials/head.html, partials/header.html, <main> page </main>,
partials/cta.html, partials/footer.html, then the scheduler dialog (partials/scheduler.html) before </body>.

Placeholders:
    {{> name}}       insert src/partials/name.html (for example {{> contact-form}})
    {{image.webp}}   a file in src/assets/  ->  src/assets/image.webp
    {{=name}}        a page setting (title, description, ...)
    {{nav:key}}      becomes aria-current="page" on the link for the current page

The build stops with an error if a page refers to a missing image or to a page that does not exist.
"""
import json
import pathlib
import re
import sys

src = pathlib.Path(__file__).parent
root = src.parent
assets = src / 'assets'
partial = {p.stem: p.read_text() for p in (src / 'partials').glob('*.html')}
pages = sorted((src / 'pages').glob('*.html'))
page_names = {p.name for p in pages}

IMAGE = re.compile(r'\{\{([\w./-]+\.(?:webp|png|jpg|svg))\}\}')
problems = []
total = 0

for page in pages:
    text = page.read_text()
    first, _, body = text.partition('\n')
    m = re.fullmatch(r'<!--page (\{.*\}) -->', first.strip())
    if not m:
        sys.exit(f'{page.name}: first line must be <!--page {{...}} -->')
    meta = {'bodyclass': '', 'preload': '', 'cta': True, 'nav': ''}
    meta.update(json.loads(m.group(1)))
    meta['path'] = '' if page.stem == 'index' else page.stem
    if meta['preload']:
        meta['preload'] = f'<link rel="preload" as="image" href="src/assets/{meta["preload"]}" fetchpriority="high">'

    body = re.sub(r'\{\{> ([\w-]+)\}\}', lambda n: partial[n.group(1)], body)
    html = (partial['head'] + partial['header'] + '<main id="top">\n<span id="main"></span>\n' + body.strip() + '\n'
            + (partial['cta'] if meta['cta'] else '') + '</main>\n\n' + partial['footer'].replace('</body>', partial['scheduler'] + '</body>'))

    html = re.sub(r'\{\{nav:(\w+)\}\}', lambda n: ' aria-current="page"' if n.group(1) == meta['nav'] else '', html)
    html = re.sub(r'\{\{=(\w+)\}\}', lambda n: str(meta.get(n.group(1), '')), html)

    for name in set(IMAGE.findall(html)):
        if not (assets / name).is_file():
            problems.append(f'{page.name}: missing image {name}')
    html = IMAGE.sub(lambda n: f'src/assets/{n.group(1)}', html)

    for href in set(re.findall(r'href="([\w-]+\.html)(?:#[\w-]+)?"', html)):
        if href not in page_names:
            problems.append(f'{page.name}: link to missing page {href}')
    leftover = re.findall(r'\{\{[^}]*\}\}', html)
    if leftover:
        problems.append(f'{page.name}: unreplaced placeholders {sorted(set(leftover))}')

    (root / page.name).write_text(html)
    total += len(html)
    print(f'{page.name:22} {len(html) // 1024:4} KB')

if problems:
    sys.exit('\n'.join(['Build problems:'] + problems))
print(f'{len(pages)} pages, {total // 1024} KB of HTML')
