# Poricanin Law: homepage (V3)

Static, self-contained homepage prototype for Poricanin Law.

- `index.html`: the built page, with all images inlined. Vercel serves it as is; there is no build step.
- `src/template.html`: editable source; images are referenced as `{{file}}` placeholders.
- `src/assets/`: the source images.
- `src/build.py`: inlines `src/assets/` into `src/template.html` and writes `index.html`.

## Edit and rebuild

```bash
python3 src/build.py
```

## Before launch

- The event in News & Insights is a sample; replace it with a real event.
- Emina's bio is a draft; replace it with the approved text.
- The award badges and logos need licences or permission from each issuer.
