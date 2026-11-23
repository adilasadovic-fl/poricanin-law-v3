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
    {{insights:topic}}  the three newest insights with data-topic="topic" in src/pages/insights.html, as cards
    {{insights:topic:title start}}  the same, leaving out the insight whose data-title starts with the given text
    {{latest:page.html}}  the four newest insights in src/pages/insights.html as a list for the article left column,
                          leaving out the insight that links to page.html

The build stops with an error if a page refers to a missing image or to a page that does not exist.
"""
import hashlib
import json
import pathlib
import re
import sys

src = pathlib.Path(__file__).parent
root = src.parent
assets = src / 'assets'
partial = {p.stem: p.read_text() for p in (src / 'partials').glob('*.html')}
# version the stylesheet and script by content so browsers fetch them again after every change
for name in ('styles.css', 'site.js'):
    version = hashlib.md5((src / name).read_bytes()).hexdigest()[:8]
    partial['head'] = partial['head'].replace(f'"src/{name}"', f'"src/{name}?v={version}"')
partial['cta'] = partial['cta'].replace('{{> contact-form}}', partial['contact-form'])
pages = sorted((src / 'pages').glob('*.html'))
page_names = {p.name for p in pages}

INSIGHT = re.compile(r'<article class="ins-row"[^>]*data-topic="([\w-]+)"[^>]*data-title="([^"]*)"[^>]*>(.*?)</article>', re.S)
insight_rows = INSIGHT.findall((src / 'pages' / 'insights.html').read_text())


def insight_cards(topic, skip='', n=3):
    rows = [body for t, title, body in insight_rows if t == topic and not (skip and title.startswith(skip))][:n]
    if not rows:
        sys.exit(f'no insights with topic {topic}')
    return ''.join(f'<article class="rel-card reveal">{body}</article>' for body in rows)


def latest_list(skip, n=4):
    out = []
    for _, _, body in insight_rows:
        link = re.search(r'<h3><a href="([^"]+)">(.*?)</a>', body, re.S)
        date = re.search(r'<time[^>]*>(.*?)</time>', body).group(1)
        if link.group(1) != skip:
            out.append(f'<li><a class="ch" href="{link.group(1)}"><span class="ch-t">{date.rsplit(",", 1)[0]}</span><span>{link.group(2)}</span></a></li>')
    return ''.join(out[:n])


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

    html = re.sub(r'\{\{insights:([\w-]+)(?::([^}]+))?\}\}', lambda n: insight_cards(n.group(1), n.group(2) or ''), html)
    html = re.sub(r'\{\{latest:([\w.-]+)\}\}', lambda n: latest_list(n.group(1)), html)
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
