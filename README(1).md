# PoC: pwabuilder-sw.js swRootUrl Service Worker Hijack (play.bingoblitz.com)

## Files
- `sw.js`      — payload imported into the target's SW scope. Non-destructive; beacons install/activate/fetch events.
- `index.html` — page that registers the hijacked SW against play.bingoblitz.com.
- `_headers`   — forces correct Content-Type on Cloudflare Pages / Netlify.

## Before deploying
1. In `sw.js`, replace `BEACON_URL` with a real webhook you control
   (e.g. create one at https://webhook.site and copy the unique URL).
2. In `index.html`, replace `YOUR-POC-HOST.example` with the domain
   you'll deploy this to (see below) — must be the *directory* URL
   ending in `/`, since pwabuilder-sw.js appends `sw.js` itself.

## Deploy — Cloudflare Pages (recommended, free)
1. Push this folder to a new GitHub repo (or upload directly in the
   Cloudflare dashboard — no repo required for a quick static deploy).
2. Cloudflare dashboard → Workers & Pages → Create → Pages →
   Connect to Git (or "Upload assets" for a no-git direct upload).
3. Build settings: none needed, it's static — just point it at this
   folder as the output/root directory.
4. Deploy. You'll get `https://<project>.pages.dev`.
5. Confirm `https://<project>.pages.dev/sw.js` serves with
   `Content-Type: application/javascript` (curl -I it).
6. Update `index.html`'s `YOUR-POC-HOST.example` to
   `<project>.pages.dev/`, redeploy.

## Deploy — GitHub Pages (alternative)
1. Push this folder to a repo, enable Pages (Settings → Pages →
   Deploy from branch → root).
2. URL will be `https://<user>.github.io/<repo>/`.
3. GitHub Pages doesn't support a `_headers` file — it serves `.js`
   as `application/javascript` by default already, so this should be
   fine without it. Verify with curl -I anyway.
4. Update `index.html` accordingly and push again.

## Running the PoC
1. Open the deployed `index.html` in a browser where you're logged
   into BingoBlitz with your own test/HackerOne-provided account
   (never against another user's session).
2. Open DevTools → Console and → Application → Service Workers tab.
3. Click "Register hijacked service worker".
4. Confirm in Application tab that a service worker is now
   registered under the `play.bingoblitz.com` origin/scope, with
   script URL still showing `pwabuilder-sw.js` (expected — the
   *registration* URL stays same-origin; the imported code is what's
   attacker-controlled).
5. Check your webhook.site dashboard for `install`/`activate` beacons,
   confirming your payload executed inside that scope.
6. Navigate around play.bingoblitz.com (or trigger a fetch) and watch
   `fetch` event beacons arrive, proving the hijacked worker is now
   intercepting same-origin traffic.

## Escalation (only after confirming the above, and only for your
## own report — do not test against other users)
- To demonstrate concrete impact for the report, consider showing the
  service worker can rewrite a response body (e.g. inject a banner
  into an HTML response) rather than capturing real tokens — this
  keeps the PoC ethical/minimal while still proving impact severity.
- Note in the report that this persists across reloads until the SW
  is unregistered/updated, and that `Access-Control-Allow-Origin: *`
  observed on the original response doesn't matter here since the
  vulnerable step is `importScripts`, not a CORS-gated fetch.
