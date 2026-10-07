/* Palestra — service worker generato da scripts/build-web.mjs. Non modificare a mano. */
const CACHE = 'palestra-20261007180858';
const BASE = '/app-palestra/';
const PRECACHE = [
  "/app-palestra/",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.3f78af31cca60105799838a1a7a59fbd.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Entypo.31b5ffea3daddc69dd01a1f3d6cf63c5.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/EvilIcons.140c53a7643ea949007aa9a282153849.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ca4b48e04dc1ce10bfbddb262c8b835f.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.b06871f281fee6b241d60582ae9369b9.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Brands.3b89dd103490708d19a95adcae52210e.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Regular.1f77739ca9ff2188b539c36f30ffa2be.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.605ed7926cf39a2ad5ec2d1f9d391d3d.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Brands.56c8d80832e37783f12c05db7c8849e2.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Regular.370dd5af19f8364907b6e2c41f45dbbf.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome6_Solid.adec7d6f310bc577f05e8fe06a5daccf.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Fontisto.b49ae8ab2dbccb02c4d11caaacf09eab.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Foundation.e20945d7c929279ef7a6f1db184a4470.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.b4eb097d35f44ed943676fd56f6bdc51.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.6e435534bd35da5fef04168860a9b8fa.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Octicons.871378c6eab492a3e689a9385dc45a12.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/SimpleLineIcons.d2285965fe34b05465047401b8595dd0.ttf",
  "/app-palestra/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Zocial.1681f34aaca71b8dfb70756bca331eb2.ttf",
  "/app-palestra/assets/node_modules/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png",
  "/app-palestra/assets/node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png",
  "/app-palestra/assets/node_modules/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png",
  "/app-palestra/assets/node_modules/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png",
  "/app-palestra/assets/node_modules/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png",
  "/app-palestra/assets/node_modules/expo-router/assets/react-navigation/elements/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png",
  "/app-palestra/assets/node_modules/expo-router/assets/react-navigation/elements/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png",
  "/app-palestra/assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png",
  "/app-palestra/assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png",
  "/app-palestra/assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png",
  "/app-palestra/assets/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png",
  "/app-palestra/assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png",
  "/app-palestra/assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png",
  "/app-palestra/assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png",
  "/app-palestra/assets/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png",
  "/app-palestra/assets/node_modules/expo-router/assets/react-navigation/elements/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png",
  "/app-palestra/assets/node_modules/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png",
  "/app-palestra/assets/node_modules/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png",
  "/app-palestra/favicon.ico",
  "/app-palestra/icona-app.png",
  "/app-palestra/index.html",
  "/app-palestra/manifest.webmanifest",
  "/app-palestra/metadata.json",
  "/app-palestra/_expo/static/css/global-87fd0564cfa78f37afcb8d7603e15d75.css",
  "/app-palestra/_expo/static/js/web/entry-1956b3c7fc4511f70aeff39a48db40c6.js"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // addAll fallisce in blocco al primo errore: meglio file per file.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((error) => {
            console.warn('[palestra] non in cache:', url, error);
          }),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigazione: una sola pagina serve tutte le schermate dell'app.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const fresh = await fetch(request);
          cache.put(BASE, fresh.clone());
          return fresh;
        } catch {
          return (await cache.match(BASE)) ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Tutto il resto ha un nome con impronta: la copia in cache è sempre valida.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') cache.put(request, response.clone());
      return response;
    })(),
  );
});
