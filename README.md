# Pocket Piggy — website

Static marketing and legal site for the Pocket Piggy iOS app. No build step,
no dependencies: plain HTML and one stylesheet.

## Pages

| Path | Purpose |
|---|---|
| `index.html` | Landing page: what it does, pricing, FAQ (with MobileApplication, Organization and FAQPage JSON-LD) |
| `chore-chart-app/` | Chore chart for kids and families |
| `allowance-app/` | Allowance tracking, spend/save/give, interest, Pay Day |
| `apple-tv-chore-chart/` | The family chore board on Apple TV |
| `no-subscription-chore-app/` | Pricing: free for one kid, $9.99 once. Never names a competitor |
| `greenlight-alternative/`, `busykid-alternative/` | Comparison pages, built only from the verified fact sheet |
| `privacy/`, `terms/`, `refunds/` | Legal pages. `privacy.html` etc. redirect here so old links keep working |
| `404.html` | Branded not-found page |
| `sitemap.xml`, `robots.txt` | Update `sitemap.xml` whenever a page is added or removed |
| `assets/og/` | 1200x630 social cards, one per page. Regenerate with `NODE_PATH=$(npm root -g) node tools/make_og_images.js` after editing `tools/og-pages.json` |
| `styles.css` | Everything visual |
| `assets/penny.svg` | Penny, the mascot |

Pages use clean URLs (`folder/index.html`) and root-relative paths (`/styles.css`), so preview with a local server from the repo root (`python3 -m http.server`), not by opening files directly.

Competitor names appear only on the two comparison pages and their meta tags. Keep them out of every other page, the footer link text, and anything used for App Store metadata.

## Publishing on GitHub Pages

1. Create a repository and push this folder to it.
2. Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. For a custom domain, add it under Settings → Pages and create a `CNAME`
   file here containing just the domain. Point the domain's DNS at GitHub
   Pages (an `ALIAS`/`ANAME` at the apex, or a `CNAME` for `www`).

`.nojekyll` is included so GitHub serves the files as-is.

## Before it goes live

- [ ] **App Store provider token** — every `data-appstore` link uses
      `https://apps.apple.com/app/apple-store/id6757681260?pt=REPLACE_PT&ct=site-<pageslug>&mt=8`.
      Replace `REPLACE_PT` with your provider ID (App Store Connect → App Analytics → Campaigns → generate a link, and copy the `pt=` value), across the whole site:
      `grep -rl REPLACE_PT --include=*.html . | xargs sed -i '' 's/REPLACE_PT/<your pt>/g'`
- [ ] **Comparison pages, every quarter** — Re-verify competitor pricing and features on comparison pages every quarter against the official source URLs; update dates.
      Update the "Last reviewed" line, every "as of" date, the cost math, and `lastmod` in `sitemap.xml`. Use only the official sources linked on each page, never third-party review sites.
- [ ] **Support email** — currently `support@pocketpiggy.app` throughout.
      Change it, or set up that mailbox, before publishing.
- [ ] **Screenshots** — the landing page has no screenshots yet. Drop them in
      `assets/` and add a strip like Walk-Up Hype's "See it in action".
- [ ] **Price** — the pricing card deliberately says "one-time purchase"
      rather than a number, so it can't go stale. Add the figure if you want it.
- [ ] **Privacy claims** — the policy states there are no ads, no accounts, and
      no data sent to us except anonymous analytics and any feedback text.
      Keep it true if the app changes.
