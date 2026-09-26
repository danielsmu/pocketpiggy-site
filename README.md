# Pocket Piggy — website

Static marketing and legal site for the Pocket Piggy iOS app. No build step,
no dependencies: plain HTML and one stylesheet.

## Pages

| Path | Purpose |
|---|---|
| `index.html` | Landing page: what it does, how kids use it, pricing, FAQ (with MobileApplication, Organization and FAQPage JSON-LD). The FAQ questions are fixed; answers come only from the product facts below |
| `about/` | About Daniel Milner and why Pocket Piggy exists, plus the full "How kids use it" section (`#how-kids-use-it`). Person, AboutPage and BreadcrumbList JSON-LD. Founder photo slot: see "Before it goes live" |
| `guides/` | Parent guides hub plus five guides (`guides/<slug>/`). Each has a byline linked to `/about/`, published and updated dates, Article and BreadcrumbList JSON-LD, and ends with a short app mention. No statistics, expert citations or invented stories |
| `chore-chart-app/` | Chore chart for kids and families |
| `allowance-app/` | Allowance tracking, spend/save/give, interest, Pay Day |
| `apple-tv-chore-chart/` | The family chore board on the TV you already own: what it shows, view-only, sample family, same-Apple-Account setup |
| `no-subscription-chore-app/` | Pricing: free for one kid, $9.99 once. Never names a competitor |
| `greenlight-alternative/`, `busykid-alternative/` | Comparison pages, built only from the verified fact sheet. Bylined with published and updated dates |
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
      Keep it true if the app changes. See F31 to F33 in the product facts.
- [ ] **Founder photo** — `/about/` shows Penny as a placeholder. Add a square
      photo of Daniel at `assets/about/daniel.jpg`, swap the `<img>` in
      `about/index.html` (the HTML comment there says what to change), and add
      `"image"` to the Person JSON-LD.
- [ ] **Real family examples** — each guide has one
      `<!-- DANIEL: optional real family example here -->` comment where a real
      anecdote would help. Replace or delete them; never invent one.
- [ ] **Kid's own device** — the app's "This is a kid's device" flow is left off
      the site because the 6-digit household code can't be entered on `main`
      (`PINEntryView.swift:90` caps input at 4 digits). Once fixed and checked,
      add it to the product facts and then to the site.

## Product facts (verified from code 2026-09-26)

Read from the app repo (`kids-budget`) on `main` at commit `616ee4a`. Every product claim on this site must map to one of these lines. If the app changes, re-verify and update this list before changing copy. Paths are relative to the app repo.

**Accounts and kids**
- F1. Kids need no account, email or sign-up. A parent adds a kid by name, avatar (emoji or animal) and colour; the `Kid` model has no email or credential field (`DataManager.addKid`, `Kid.swift`, `AddKidSheet.swift`).
- F2. There is no Pocket Piggy account for anyone. Parents use the app with their own Apple Account (iCloud).
- F3. Grown-ups can be added to the family as people who get chores and take turns in rotations, but they have no money, allowance or Kid Mode (`AddKidSheet.swift:30`, `Kid.swift:61-63`).

**Kid Mode**
- F4. Kid Mode runs on iPhone and iPad (the iOS app; there is no Kid Mode on Watch or Apple TV).
- F5. A parent chooses a 4-digit PIN. The PIN is needed to enter Kid Mode and to leave it. It is stored on that device only (`PINEntryView.swift`, `SettingsView.swift:697-719`, `KidModeRootView.swift:34`).
- F6. In Kid Mode a kid taps their own picture ("Who are you?"), then sees their balance, savings, goal progress, Pay Day countdown and today's chores. They can check off chores (with an optional photo) and cannot edit anything or add money. A checked-off chore waits for a grown-up to approve it (`KidModeDetailView.swift`, `MarkDoneSheet.swift`).

**Read-aloud**
- F7. Kid Mode has speaker buttons that read aloud with the device's built-in voice: the "Who are you?" names, a "read this screen" button (greeting, money to spend, savings, today's chores and whether each is done, waiting for a grown-up or forgotten, weekly progress and Pay Day, goal progress) and a button next to each chore that reads its name and status (`KidNarration.swift`, `SpeechReader.swift`).
- F8. Read-aloud is on by default and can be turned off in Settings ("Read-aloud buttons in Kid Mode"). It is only in Kid Mode, not on the TV, Watch or widgets. Chores have no picture icons.

**Chores**
- F9. A chore can belong to one person, take turns between several people, or be up for grabs ("Anyone") (`ChoreEditorSheet.swift:538-542`, `Chore.swift`).
- F10. Rotation hands the chore to the next person each week or each month, in the order the parent picked. Grown-ups can be in a rotation. Every device agrees whose turn it is (`Chore.swift:129-131, 199-208`).
- F11. Up-for-grabs chores show for every kid on the days they are due. In Kid Mode, once one kid has checked one off that day, it disappears from the other kids' lists. The kid who did it is paid that chore's amount when a parent approves. Up-for-grabs chores always pay per chore (`KidModeDetailView.swift:315-320`, `Kid.swift:38-39`).
- F12. Every chore needs a parent's approval before money moves (pending, approved, rejected).
- F13. Chores repeat daily, on picked weekdays, every other week, monthly, or once.
- F14. Parents can print a chore chart: a monthly family sheet or a weekly tick sheet per person (`Views/Print/`).

**Money**
- F15. Pocket Piggy is a ledger, not a bank. No bank account, card or payment service is connected; there is no code for one. Balances are what the family owes each kid, and parents pay out however they like.
- F16. Pay Day falls on a day the parent picks. Spend, Save and Give jars with an automatic split, savings goals, giving to a named recipient, weekly or monthly allowance, pay per chore or a weekly amount, optional parent-paid interest on savings, and a Pay Day countdown and celebration.
- F17. If a chore from a week that already paid out is approved late, the app adjusts that Pay Day automatically (`DataManager.swift`, "Pay Day adjustment").

**Pricing**
- F18. There is one in-app purchase, the Family Unlock: a one-time, non-consumable $9.99 purchase. There are no subscriptions of any kind (`PocketPiggy.storekit`, `StoreManager.swift`).
- F19. The app is free to download and free with one kid. Adding a second kid shows the Family Unlock prompt. Inviting another person on their own Apple Account (a co-parent, for example) requires the Family Unlock. The in-app copy promises "as many kids as you like"; the product is "Unlimited Kids" in the StoreKit file. Once bought, the unlock applies to everyone in the shared family (`ContentView.swift:78-85`, `SettingsView.swift:780-785`, `FamilyUnlock.swift`).
- F20. Syncing a family across one parent's own devices on the same Apple Account is free and not gated (`setUpFamilySync` has no entitlement check; `SettingsView.swift:251-253`). The Apple TV app is free too.

**Family Sync**
- F21. Family Sync is on by default after setup. The family creator can invite another grown-up with a private, single-use link sent through the share sheet (Messages, Mail and so on). Unused links expire after 48 hours. Only the family creator can invite. Invited people see and edit the same family (`FamilyInvites.swift`, `CloudSyncManager.swift`).

**Apple TV**
- F22. The Apple TV gets the family from iCloud and must be signed in to the same Apple Account as the parent's iPhone or iPad. There is no way to show a family from a different Apple Account on the TV. Families are set up on iPhone or iPad first. Setup: sign the TV in to that Apple Account, choose "Connect this TV" on the TV, then in the app open Settings, Apple TV, and enter the six-digit code on the TV (`TVScreenState.swift:111-121`, `TVPairingView.swift`).
- F23. The TV board shows the week: one row per person, one column per day, with each day's chores and whether each is done, waiting for a grown-up, late or still to do. It shows each kid's total balance, a Pay Day countdown when anyone is paid weekly, and celebrations for Pay Day, goals reached and giving (`TVBoardView.swift`).
- F24. The TV is view-only. With the Siri Remote you can open a kid's screen (balance, Spend/Save/Give, goal progress, their week), but nobody can check off or change chores on the TV (`TVDataManager.swift:5`, `TVKidDetailView.swift`).
- F25. "Explore a sample family" on the TV's first screen shows a pretend family (labelled "Sample family") with no phone, no pairing and no account needed. It has two kids with a week of chores (one rotating weekly), money in all three jars and a savings goal each. Nothing is saved (`TVSetupView.swift`, `TVDemoFamily.swift`).

**Widgets, Watch and Siri**
- F26. Home Screen widget "Today's Chores" (small and medium): each kid's chores for today as progress, with how many are waiting for a parent's OK; medium also shows done and late counts.
- F27. "Pay Day" widget (Home Screen small and medium, Lock Screen rectangular and inline): countdown to Pay Day and how the week is going.
- F28. Apple Watch app (view-only): each kid's chores today, balances and Spend/Save/Give. Watch complication "Today's Chores" (circular, corner, inline, rectangular).
- F29. Widgets and the Watch are view-only; tapping a widget opens the app. There are no interactive widgets, Control Center controls or Live Activities.
- F30. Siri can answer questions about a kid's balance, savings, earnings this week, allowance and savings goal, and when Pay Day is (read-only App Intents).

**Data and privacy**
- F31. Family data is stored on the device and in the family's own iCloud through Apple's CloudKit (the creator's private database, shared with invited people through CloudKit sharing). Photos are stored the same way. The Apple TV copy travels through iCloud key-value storage on the same Apple Account. No Pocket Piggy server receives family data; the only non-Apple host the app contacts is PostHog.
- F32. The app sends anonymous usage analytics and crash and error reports to PostHog. Events carry no kid names, chore titles or contact details, and are grouped by a random household ID, not linked to identity. There is no tracking prompt, no advertising identifier and no ad SDK.
- F33. Some usage events include dollar amounts (for example an approved chore's amount), and feedback text a parent chooses to send from the "Enjoying Pocket Piggy?" prompt is sent as written. So site copy must not say analytics contain "no amounts".

**Not claimed on the site (could not be confirmed, or confirmed broken)**
- A kid's own iPhone or iPad joining the family (the "This is a kid's device" flow): the 6-digit household code can't be entered because `PINEntryView` caps input at 4 digits (`PINEntryView.swift:90`). Leave off the site until fixed.
- Apple Family Sharing for the Family Unlock: `familyShareable` is true in the local StoreKit file, but App Store Connect can't be checked from code.
- Mac support.
- Interactive widgets, per-kid PINs, per-kid read-aloud settings, picture icons on chores, daily or per-completion rotation.

## Competitor fact sheet (verified September 2026)

US App Store listings read September 25, 2026. These are the only competitor claims the chore app comparison page may make. Do not add, infer or round, and do not pull facts from any other source.

**Pocket Piggy.** Free for one kid. One-time $9.99 Family Unlock for more kids and for inviting other grown-ups on their own Apple Accounts (F18, F19 above). No subscription.
Chart: Pricing model "Free, or $9.99 once" · Lowest yearly price "None, no subscription" · Pay-once option "Yes, $9.99" · 2-year cost "$0 for one kid, $9.99 for the family" · Apple TV "Yes" · iPad "Yes" · Rotation "Yes" · Up-for-grabs "Yes" · Read-aloud "Yes" · Kids need an account "No" (F1) · Home screen widgets "Yes" (F26, F27).

**Chorsee.** Source: https://apps.apple.com/us/app/chorsee-chores-tracker/id1611068600
- C1. Free download with in-app purchases: Monthly $8.99, Chorsee Yearly $39.99, Chorsee Lifetime $119.99 (the listing also shows a $89.99 yearly and a $224.99 lifetime option).
- C2. Compatibility lists iPhone, iPad, iPod touch, Mac, and Apple Vision.
- C3. Listing describes chores that rotate between family members or are up for grabs, photo proof, a child mode for kids' devices, widgets, and an intentional no-gamification design.
- C4. 4.6 stars, 12K ratings. (Do not show on the site.)
- Chart: Pricing model "Free + subscription or lifetime" · Lowest yearly price "$39.99/year" · Pay-once option "Yes, from $119.99" · 2-year cost "$79.98 (yearly plan)" · Apple TV "Not listed" · iPad "Yes" · Rotation "Yes" · Up-for-grabs "Yes" · Read-aloud "Not listed" · Kids need an account "Not listed" · Home screen widgets "Yes" (C3).

**Chores & Allowance Bot.** Source: https://apps.apple.com/us/app/chores-allowance-bot/id629797415
- A1. Free download with in-app purchases: Premium Monthly $9.99, Premium Semiannual $17.99, Premium Annual $39.99.
- A2. Compatibility lists iPhone, iPad, iPod touch, Mac, and Apple Vision.
- A3. Listing describes rotating chores, up-for-grabs chores, read-aloud for pre-readers, automatic percentage transfers into accounts and goals, and support for English plus 10 more languages.
- A4. 4.5 stars, 11K ratings. (Do not show on the site.)
- Chart: Pricing model "Free + subscription" · Lowest yearly price "$39.99/year" · Pay-once option "Not listed" · 2-year cost "$79.98 (annual plan)" · Apple TV "Not listed" · iPad "Yes" · Rotation "Yes" · Up-for-grabs "Yes" · Read-aloud "Yes". · Kids need an account "Not listed" · Home screen widgets "Not listed".

**Homey.** Sources: https://apps.apple.com/us/app/homey-chores-and-allowance/id1033286805 and https://www.homeyapp.net/homey-faq/
- H1. Free download with in-app purchases including Homey Monthly $6.99 and Homey Yearly $59.99.
- H2. Free for families using up to three accounts; subscription for more users and premium features (FAQ).
- H3. Compatibility lists iPhone, iPad, iPod touch, Mac, and Apple Vision.
- H4. Can transfer allowance to a bank account (US only) or mark it paid in cash.
- Chart: Pricing model "Free tier + subscription" · Lowest yearly price "$59.99/year" · Pay-once option "Not listed" · 2-year cost "$119.98 (yearly plan)" · Apple TV "Not listed" · iPad "Yes" · Rotation "Not listed" · Up-for-grabs "Not listed" · Read-aloud "Not listed". · Kids need an account "Not listed" · Home screen widgets "Not listed".

**S'moresUp.** Sources: https://apps.apple.com/us/app/smoresup-best-chores-app/id1287367596 and https://www.smoresup.com/pricing
- S1. App Store listing shows in-app purchases Monthly $7.99 and Yearly $79.99. Use these App Store figures; do not use website prices.
- S2. App Store listing says "Only for iPhone"; compatibility lists iPhone, iPod touch, and Mac.
- S3. Free Intro Pack; Premium adds advanced chore types including Rotate (website).
- S4. Includes a collaborative family planner for appointments and events.
- Chart: Pricing model "Free tier + subscription" · Lowest yearly price "$79.99/year" · Pay-once option "Not listed" · 2-year cost "$159.98 (yearly plan)" · Apple TV "Not listed" · iPad "Not listed" · Rotation "Yes (Premium)" · Up-for-grabs "Not listed" · Read-aloud "Not listed". · Kids need an account "Not listed" · Home screen widgets "Not listed".
