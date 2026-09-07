# DMHSPWD — Doherty Memorial HS Programming & Web Development

Static landing page for the class site. Currently an "under construction" holding page; will grow to link out to:

- Student project sites
- An in-classroom chat app
- Student-built games

## Local preview

Just open `index.html` in a browser, or serve it:

```
npx serve .
```

## Deploying to Render

1. Push this folder to a GitHub repo.
2. In Render: **New → Static Site**, connect the repo.
3. Build command: leave blank (or `echo "no build needed"`).
4. Publish directory: `.`
5. Deploy. Render will give you a `*.onrender.com` URL (or attach a custom domain later).

`render.yaml` in this repo already describes this config if you use Render's Blueprint deploy instead.

## Structure

- `index.html` — page markup
- `styles.css` — dark/techy theme
- `script.js` — typing status line + background grid animation

When you're ready to add real links (student sites, chat, games), replace the disabled `.link-card` entries in `index.html` with real `<a>` tags.
