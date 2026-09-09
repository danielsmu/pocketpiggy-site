# Pocket Piggy — website

Static marketing and legal site for the Pocket Piggy iOS app. No build step,
no dependencies: plain HTML and one stylesheet.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Landing page: what it does, pricing, FAQ |
| `privacy.html` | Privacy policy (App Store requires a public URL) |
| `terms.html` | Terms of use |
| `refunds.html` | How Apple refunds work |
| `styles.css` | Everything visual |
| `assets/penny.svg` | Penny, the mascot |

## Publishing on GitHub Pages

1. Create a repository and push this folder to it.
2. Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. For a custom domain, add it under Settings → Pages and create a `CNAME`
   file here containing just the domain. Point the domain's DNS at GitHub
   Pages (an `ALIAS`/`ANAME` at the apex, or a `CNAME` for `www`).

`.nojekyll` is included so GitHub serves the files as-is.

## Before it goes live

- [ ] **App Store links** — every button is `href="#"` with a `data-appstore`
      marker. Replace with the real App Store URL once the app is approved.
- [ ] **Support email** — currently `support@pocketpiggy.app` throughout.
      Change it, or set up that mailbox, before publishing.
- [ ] **Screenshots** — the landing page has no screenshots yet. Drop them in
      `assets/` and add a strip like Walk-Up Hype's "See it in action".
- [ ] **Price** — the pricing card deliberately says "one-time purchase"
      rather than a number, so it can't go stale. Add the figure if you want it.
- [ ] **Privacy claims** — the policy states there are no ads, no accounts, and
      no data sent to us except anonymous analytics and any feedback text.
      Keep it true if the app changes.
