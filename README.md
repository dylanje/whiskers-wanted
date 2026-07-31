# Whisker Wanted 🐾

A static, single-page cat adoption site. Features one adoptable cat at a
time with a funny, dating-profile-style listing, plus **The Purr-manent
Record** — an archive of past cats who've found their forever homes.

No backend, no build step. Just HTML, CSS, and vanilla JS reading from a
JSON file.

## Running it locally

Because the page loads `cats.json` via `fetch()`, opening `index.html`
directly from the filesystem (`file://`) will fail in most browsers due to
CORS restrictions. Serve the folder locally instead, e.g.:

```
python -m http.server 8000
```

or

```
npx serve .
```

Then open `http://localhost:8000`.

## How to swap in a new cat

All content lives in `cats.json`, which has two parts: `current` (the
featured cat) and `archive` (past adopted cats).

### When the current cat gets adopted

1. In `cats.json`, set the current cat's `"status"` to `"adopted"` and fill
   in `"adoptedDate"` (format: `"YYYY-MM-DD"`). Deploy this and the page
   will immediately show the "ADOPTED!" banner and disable the email
   button — same URL, no page changes needed.
2. When you're ready to feature a new cat, move the old cat into the
   `archive` array as a short entry:
   ```json
   {
     "name": "Brisket",
     "tagline": "...",
     "photo": "images/brisket-1.svg",
     "adoptedDate": "2026-07-29",
     "blurb": "A short, happy one-liner about their new life."
   }
   ```
3. Replace the `current` object entirely with the new cat's full profile:
   `name`, `tagline`, `status` (`"available"`), `bio`, `traits`,
   `redFlags`, and `photos` (an array of image paths). Set `adoptedDate`
   back to `null`.
4. Drop the new cat's photos into `images/` and reference them in
   `photos`.

That's it — no HTML or JS changes are required for a normal cat swap.

## Deploying

This is a fully static site. Push the folder as-is to GitHub Pages,
Netlify, or Vercel — no build command, no framework, no dependencies.

## Updating the adoption email

The placeholder address `adopt@example.com` lives in `script.js` as the
`ADOPTION_EMAIL` constant. Update it once you have a real inbox to point
adopters to.
