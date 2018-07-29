const isDebuggingActive = location.hostname === "localhost" ? true : false;
/**
 * Credits: https://developers.google.com/web/tools/workbox/guides/get-started
 */
console.log("Hello from sw.js");

importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js"
);

if (workbox) {
  if (isDebuggingActive) console.log(`Yay! Workbox is loaded!`);
} else {
  if (isDebuggingActive) console.log(`Boo! Workbox didn't load!`);
}

/**
 * Enables the workbox debugging logs in the console
 */
workbox.setConfig({ debug: isDebuggingActive });

/**
 * See: https://developers.google.com/web/tools/workbox/modules/workbox-sw#skip_waiting_and_clients_claim
 */
workbox.skipWaiting();
workbox.clientsClaim();

/**
 * Precache the static assets matching the regex
 */
workbox.routing.registerRoute(
  /.*\.(?:js|html|css|json)/,
  workbox.strategies.cacheFirst({ cacheName: workbox.core.cacheNames.precache })
);

/**
 * Fetch the Javascript and CSS files from the cache first, while making sure they are updated in the background for the next use.
 */
workbox.routing.registerRoute(
  /\.(?:js|css)$/,
  workbox.strategies.staleWhileRevalidate()
);
/**
 * Precache the images
 */
workbox.routing.registerRoute(
  /.*\.(?:webp|png|jpe?g|svg|gif)/,
  workbox.strategies.cacheFirst({ cacheName: "img-cache" })
);

/**
 * Images are cached and used until it’s a week old, after which it’ll need updating
 */
const WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
const MAX_ENTRIES =
  5 * 10 + //restaurant images
  4 + //placeholder svg
  10; //icons

workbox.routing.registerRoute(
  // Cache image files
  /.*\.(?:webp|png|jpg|jpeg|svg|gif)/,
  // Use the cache if it's available
  workbox.strategies.cacheFirst({
    // Use a custom cache name
    cacheName: "image-cache",
    plugins: [
      new workbox.expiration.Plugin({
        // Cache only 20 images
        maxEntries: MAX_ENTRIES,
        // Cache for a maximum of a week
        maxAgeSeconds: WEEK_IN_SECONDS
      })
    ]
  })
);
/**
 * Cache the Google Static API images (to show them while offline)
 */
workbox.routing.registerRoute(
  /.*googleapis.com\/maps\/api\/staticmap.*$/,
  workbox.strategies.staleWhileRevalidate({ cacheName: "staticmaps-cache" })
);
workbox.routing.registerNavigationRoute("/index.html");

workbox.precaching.precacheAndRoute([]);