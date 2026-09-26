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
| `compare-chore-apps/` | Price and feature chart against other App Store chore apps, built only from the fact sheet below |
| `privacy/`, `terms/`, `refunds/` | Legal pages. `privacy.html` etc. redirect here so old links keep working |
| `404.html` | Branded not-found page |
| `sitemap.xml`, `robots.txt` | Update `sitemap.xml` whenever a page is added or removed |
| `assets/og/` | 1200x630 social cards, one per page. Regenerate with `NODE_PATH=$(npm root -g) node tools/make_og_images.js` after editing `tools/og-pages.json` |
| `printable-chore-charts/` | Free printable chore charts: a hub plus one page per age (`ages-2-3/`, `ages-4-5/`, `ages-6-8/`, `ages-9-12/`, `teens/`) |
| `chore-chart-maker/` | In-browser chart maker. Logic in `assets/js/chart-maker.js`; prints with print CSS and `window.print()` |
| `allowance-calculator/` | Allowance calculator. Logic in `assets/js/allowance-calculator.js` |
| `assets/printables/` | The generated chore chart PDFs (see "Printable chore charts" below) |
| `styles.css` | Everything visual |
| `assets/penny.svg` | Penny, the mascot |

Pages use clean URLs (`folder/index.html`) and root-relative paths (`/styles.css`), so preview with a local server from the repo root (`python3 -m http.server`), not by opening files directly.

Competitor names appear only on the three comparison pages (`greenlight-alternative/`, `busykid-alternative/`, `compare-chore-apps/`) and their meta tags. Keep them out of every other page, the footer link text, and anything used for App Store metadata.

## Printable chore charts

The PDFs in `assets/printables/` are generated, never edited by hand. Chores live in one file, `tools/printables/chores.json`: each age's chores grouped by area (shown on the age pages), its `top` chores (the pre-filled PDF and the chart maker's suggestions) and `rows` (how many rows its weekly chart has). Keep chores safe for the age: no knives, stove, cleaning chemicals or power tools below the teen chart.

To regenerate all 20 PDFs (5 ages × filled/blank × US Letter/A4) after changing `chores.json` or the chart design in `tools/printables/generate.js`:

```
cd tools/printables
npm install
npx playwright install chromium   # first time only
npm run build
```

The script stops with an error if any chart would spill onto a second page. The age pages and the chart maker carry a copy of the chore lists, so after changing `chores.json`, update those pages to match (the chart maker's suggestions are in the `cm-data` JSON block in `chore-chart-maker/index.html`).

## Analytics

Every page loads `/analytics.js` in its `<head>`. It holds the official PostHog snippet, the `posthog.init` config and the click listener, so this is the one file to edit.

- **Project:** "Pocket Piggy" in PostHog (project 605032), the same project the iOS and Apple TV apps send to.
- **Host:** `https://us.i.posthog.com`, matching `Kids Budget/Services/Analytics.swift` in the app. The SDK itself loads from `us-assets.i.posthog.com`.
- **Cookieless:** `cookieless_mode: 'always'`, so no cookies, no localStorage or sessionStorage, and no cookie banner. Session recording is off. This depends on **Cookieless server hash mode** staying enabled in Project settings > Web analytics; if it's turned off, PostHog silently drops every web event.
- **IP addresses:** cookieless events are ingested with `$ip` removed, which is what the privacy page's website section relies on. Re-check with `properties.$ip` on recent web events if PostHog changes this behaviour.
- **`platform = web`:** every web event carries the super properties `platform: "web"` and `site: "pocketpiggy.app"`. Filter on `platform` to separate the website from the apps.
- **`app_store_click`:** fired by one delegated listener on any click on a link to Pocket Piggy's App Store listing (`id6757681260`). Properties: `page` (the path) and `placement` (the link's `data-placement`, else the nearest `section` id, else `nav`, `footer` or `hero`). Current placements: `hero`, `cta-band`, `pricing-free`, `pricing-family`. Links to other apps' App Store listings (the comparison page's sources) are deliberately not counted. The event is sent with `sendBeacon`, so it never delays navigation.
- **Free tool events:** `printable_download` (`age`, `paper`: letter or a4, `kind`: filled or blank), fired by the same delegated listener on any `a[data-printable]`; `chart_maker_print` (`age`, `layout`, `paper`, `chore_count`), fired when Print is clicked; `allowance_calculated` (`approach`, `kids`, `period`), fired once per browser session after the visitor changes an input. None of them ever include a child's name or chore text.
- **Testing locally:** events from a local server land in the real project with `$host` set to `127.0.0.1:…`. Filter them out with `$host = pocketpiggy.app`. PostHog ignores automated browsers (headless Chrome, `navigator.webdriver`), so test in a normal browser.

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
      For `compare-chore-apps/`, re-read each app's US App Store listing, specifically the **In-App Purchases** and **Compatibility** sections (plus the Homey FAQ and S'moresUp pricing page for H2 and S3), update the fact sheet below, then every table cell and the 2-year cost math. Use App Store prices only, never website prices. Never show star ratings or rating counts on the page.
- [ ] **Support email** — currently `support@pocketpiggy.app` throughout.
      Change it, or set up that mailbox, before publishing.
- [ ] **Screenshots** — the landing page has no screenshots yet. Drop them in
      `assets/` and add a strip like Walk-Up Hype's "See it in action".
- [ ] **Price** — the pricing card deliberately says "one-time purchase"
      rather than a number, so it can't go stale. Add the figure if you want it.
- [ ] **Privacy claims** — the policy states there are no ads, no accounts, and
      no data sent to us except anonymous analytics and any feedback text.
      Keep it true if the app changes.

## Competitor fact sheet (verified September 2026)

US App Store listings read September 25, 2026. These are the only competitor claims the chore app comparison page may make. Do not add, infer or round, and do not pull facts from any other source.

**Pocket Piggy.** Free for one kid. One-time $9.99 Family Unlock for all kids and every family member's own devices. No subscription.
Chart: Pricing model "Free, or $9.99 once" · Lowest yearly price "None, no subscription" · Pay-once option "Yes, $9.99" · 2-year cost "$0 for one kid, $9.99 for the family" · Apple TV "Yes" · iPad "Yes" · Rotation "Yes" · Up-for-grabs "Yes" · Read-aloud "Yes".

**Chorsee.** Source: https://apps.apple.com/us/app/chorsee-chores-tracker/id1611068600
- C1. Free download with in-app purchases: Monthly $8.99, Chorsee Yearly $39.99, Chorsee Lifetime $119.99 (the listing also shows a $89.99 yearly and a $224.99 lifetime option).
- C2. Compatibility lists iPhone, iPad, iPod touch, Mac, and Apple Vision.
- C3. Listing describes chores that rotate between family members or are up for grabs, photo proof, a child mode for kids' devices, widgets, and an intentional no-gamification design.
- C4. 4.6 stars, 12K ratings. (Do not show on the site.)
- Chart: Pricing model "Free + subscription or lifetime" · Lowest yearly price "$39.99/year" · Pay-once option "Yes, from $119.99" · 2-year cost "$79.98 (yearly plan)" · Apple TV "Not listed" · iPad "Yes" · Rotation "Yes" · Up-for-grabs "Yes" · Read-aloud "Not listed".

**Chores & Allowance Bot.** Source: https://apps.apple.com/us/app/chores-allowance-bot/id629797415
- A1. Free download with in-app purchases: Premium Monthly $9.99, Premium Semiannual $17.99, Premium Annual $39.99.
- A2. Compatibility lists iPhone, iPad, iPod touch, Mac, and Apple Vision.
- A3. Listing describes rotating chores, up-for-grabs chores, read-aloud for pre-readers, automatic percentage transfers into accounts and goals, and support for English plus 10 more languages.
- A4. 4.5 stars, 11K ratings. (Do not show on the site.)
- Chart: Pricing model "Free + subscription" · Lowest yearly price "$39.99/year" · Pay-once option "Not listed" · 2-year cost "$79.98 (annual plan)" · Apple TV "Not listed" · iPad "Yes" · Rotation "Yes" · Up-for-grabs "Yes" · Read-aloud "Yes".

**Homey.** Sources: https://apps.apple.com/us/app/homey-chores-and-allowance/id1033286805 and https://www.homeyapp.net/homey-faq/
- H1. Free download with in-app purchases including Homey Monthly $6.99 and Homey Yearly $59.99.
- H2. Free for families using up to three accounts; subscription for more users and premium features (FAQ).
- H3. Compatibility lists iPhone, iPad, iPod touch, Mac, and Apple Vision.
- H4. Can transfer allowance to a bank account (US only) or mark it paid in cash.
- Chart: Pricing model "Free tier + subscription" · Lowest yearly price "$59.99/year" · Pay-once option "Not listed" · 2-year cost "$119.98 (yearly plan)" · Apple TV "Not listed" · iPad "Yes" · Rotation "Not listed" · Up-for-grabs "Not listed" · Read-aloud "Not listed".

**S'moresUp.** Sources: https://apps.apple.com/us/app/smoresup-best-chores-app/id1287367596 and https://www.smoresup.com/pricing
- S1. App Store listing shows in-app purchases Monthly $7.99 and Yearly $79.99. Use these App Store figures; do not use website prices.
- S2. App Store listing says "Only for iPhone"; compatibility lists iPhone, iPod touch, and Mac.
- S3. Free Intro Pack; Premium adds advanced chore types including Rotate (website).
- S4. Includes a collaborative family planner for appointments and events.
- Chart: Pricing model "Free tier + subscription" · Lowest yearly price "$79.99/year" · Pay-once option "Not listed" · 2-year cost "$159.98 (yearly plan)" · Apple TV "Not listed" · iPad "Not listed" · Rotation "Yes (Premium)" · Up-for-grabs "Not listed" · Read-aloud "Not listed".
