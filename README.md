# Nectar Coffee House — website

A hand-built, single-page marketing site for **Nectar Coffee House**, 26 Parnell
Place, Cork. No frameworks, no build step — just clean HTML, CSS and a little
vanilla JavaScript, tuned to load fast on any device.

```
index.html              ← all the page content (edit copy & menu here)
assets/
  css/styles.css        ← design system + every style
  js/main.js            ← interactions & animations (no dependencies)
  img/                  ← brand SVGs + placeholder art (swap for real photos)
README.md
```

---

## Running it

It's a static site, so there's nothing to install.

- **Quickest:** double-click `index.html` to open it in your browser.
- **Recommended (so fonts/scripts behave exactly like production):** serve it
  locally —
  ```bash
  # Python
  python3 -m http.server 8000
  # or Node
  npx serve .
  ```
  then visit <http://localhost:8000>.

---

## Making it yours

### 1. Drop in your real photos
The site ships with on-brand placeholder artwork so it looks finished out of the
box. To use your own photography, just **replace the files in `assets/img/`**,
keeping the same filenames (or update the `src` in `index.html`):

| File | Where it appears | Best shape |
|------|------------------|-----------|
| `ph-latte.svg` | Hero (main) + gallery | Portrait (4:5) |
| `ph-storefront.svg` | Hero (inset) + gallery | Landscape (4:3) |
| `ph-counter.svg` | "Welcome" + gallery | Landscape (3:2) |
| `ph-seating.svg` | "Our Story" + gallery | Landscape (4:3) |
| `ph-smoothie.svg` | "Our Story" (inset) | Square |
| `ph-menu.svg` | Gallery | Portrait |
| `ph-softserve.svg` | Gallery | Portrait |

Tip: export real photos as `.jpg` (or `.webp` for best performance), then point
the `src` at e.g. `assets/img/latte.jpg`. Keep each image's `width`/`height`
attributes roughly matching the photo's ratio so nothing shifts while loading.

### 2. Add your prices
Prices were left blank (they weren't legible in the reference photos). Each menu
item has an empty price slot ready to fill — in `index.html` find lines like:

```html
<span class="menu__price"></span>
```
and pop the price inside: `<span class="menu__price">3.20</span>`. Empty slots
stay hidden automatically, so you can price as few or as many as you like.

### 3. Edit copy, hours & contact
Everything is plain text in `index.html`:
- **Menu** → the `#menu` section.
- **Story** → the `#story` section.
- **Hours** → the `<ul class="hours">` list **and** the `HOURS` table near the
  top of `assets/js/main.js` (this powers the live "Open now / Closed" badge —
  keep the two in sync).
- **Address / phone / Instagram** → search for them in `#visit` and the footer.
- **SEO + social preview** → the `<title>`, `<meta name="description">`, Open
  Graph tags and the `application/ld+json` block in `<head>`.

### 4. Newsletter
The footer signup is a front-end demo (it validates the email and shows a thank
-you, but doesn't send anywhere). To go live, point the `<form data-newsletter>`
at your provider (Mailchimp, Beehiiv, etc.) or wire up the handler in
`main.js → newsletter()`.

---

## What's built in

- **Elegant, performance-minded motion** — staggered scroll reveals, a parallax
  photo stack, an animated marquee, count-up stats, magnetic buttons, a rotating
  brand badge and a smooth mobile menu. All vanilla JS.
- **Live "Open now" badge** computed against Irish time (`Europe/Dublin`), with
  today's row highlighted in the hours list.
- **Accessible** — semantic landmarks, skip link, keyboard-friendly tabs and
  lightbox, focus styles, `aria` states, and full **`prefers-reduced-motion`**
  support (all animation is disabled for users who ask for it).
- **Fast** — three subset web-fonts with `display=swap`, lazy-loaded below-the-
  fold images, a click-to-load map (no third-party requests until asked), and no
  JS libraries. Works offline once loaded.
- **SEO-ready** — descriptive metadata, Open Graph/Twitter cards, and
  `CafeOrCoffeeShop` structured data for rich search results.

---

## Deploying

Drag-and-drop the whole folder onto **Netlify**, **Vercel**, **Cloudflare
Pages**, or **GitHub Pages** — no configuration required.

For the social share image, most platforms prefer a raster file: open
`assets/img/og-image.svg`, export it as a 1200×630 `og-image.png`, and update the
two `og:image` / `twitter:image` tags in `<head>`.

---

## Browser support

Latest Chrome, Edge, Firefox and Safari (desktop + mobile). Gracefully degrades
on older browsers — without JavaScript, all content remains visible and readable.
