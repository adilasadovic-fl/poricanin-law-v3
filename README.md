# Poricanin Law: homepage (V3)

Static homepage for Poricanin Law. There is no framework and no build step on Vercel; it serves the files as they are.

- `index.html`: the page Vercel serves. Images load from `src/assets/` and are lazy-loaded below the fold.
- `standalone.html`: the same page with every image built in, for sharing as one file. It is heavier, so use it for review only.
- `src/template.html`: the editable source. Images are written as `{{file.webp}}` placeholders.
- `src/assets/`: the images.
- `src/build.py`: turns the template into `index.html` and `standalone.html`.

## Edit and rebuild

Edit `src/template.html`, then run:

```bash
python3 src/build.py
```

Commit the template and both generated HTML files.

## Before launch

- **Contact form:** it is a preview and is not connected to email or a CRM. Submitting it checks the fields and then tells the visitor that nothing was sent, with the email, phone and online booking link.
- **Content for Emina's approval:** see the list in the pull request or review notes, covering the legal services taxonomy, the stats wording, the founder copy and the representative results.
