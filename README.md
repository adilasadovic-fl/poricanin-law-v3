# Poricanin Law: website (V3)

Static multi-page site for Poricanin Law. There is no framework, and Vercel serves the files as they are (no build step on Vercel).

## Pages

| Page | Source | Notes |
|---|---|---|
| Home | `src/pages/index.html` | Homepage; practice-area and sector rows link into the pages below |
| About us | `src/pages/about.html` | Founder, credentials, firm, team, values, working approach |
| Practice areas | `src/pages/practice-areas.html` | Six groups; each item opens in place. Generated content, see below |
| Sectors | `src/pages/sectors.html` | Who we serve and typical matters for each sector |
| Sector detail pages | `src/pages/sector-*.html` | Healthcare, Home Care, Education, Hospitality, Manufacturing. Content from the matching poricaninlaw.com industry pages, with light copy edits flagged for approval |
| Results | `src/pages/results.html` | Representative matters and every client testimonial, in full |
| Insights | `src/pages/insights.html` | Three highlights, then all articles with instant filters |
| Contact | `src/pages/contact.html` | Contact form (prototype) and the three offices |

## Structure

- `src/pages/`: one file per page. The first line holds the page settings (title, description, current nav item).
- `src/partials/`: shared head, header, closing call-to-action and footer.
- `src/styles.css`, `src/site.js`: shared styles and behaviour for every page.
- `src/assets/`: images (`team/` for staff photos, `insights/` for article thumbnails).
- `src/build.py`: assembles the pages into the root `.html` files and checks for missing images, links to missing pages and leftover placeholders.

## Edit and rebuild

Edit files in `src/`, then run:

```bash
python3 src/build.py
```

Commit both `src/` and the generated root `.html` files. Links use the form `about.html`; Vercel's `cleanUrls` serves them at `/about`.

## Before launch

- **Contact form:** it is a preview and is not connected to email or a CRM. On submit it checks the fields, then tells the visitor plainly that nothing was sent and gives the email, phone and booking link.
- **Links to poricaninlaw.com:** individual articles, premium subscription, Client Area and the Privacy Policy still link to poricaninlaw.com. Thrive hosting ends on Jan 1, 2027, so these need new destinations first.
- **Podcast:** the Home Care Forum card on Insights has no link yet; add the episode URL.
- **Content for Emina's approval:** see the review notes for the open questions.
