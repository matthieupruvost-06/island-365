import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// base: './' makes the build use relative asset paths, so the same dist/
// works whether it's served from a domain root (Vercel/Netlify) or from a
// GitHub Pages project subpath (https://user.github.io/repo-name/).
export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      // Le service worker se met à jour tout seul en arrière-plan et prend
      // effet au prochain lancement du jeu : pas besoin d'action de la part
      // du joueur pour récupérer les mises à jour.
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        id: '.',
        lang: 'fr',
        name: 'Island 365',
        short_name: 'Island 365',
        description: "Une mission par jour, toute l'année — explore une île procédurale en solo ou en duo.",
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0E7C86',
        theme_color: '#0E7C86',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Précache tout le jeu (JS/CSS/HTML/icônes) pour qu'il se lance
        // aussi hors connexion une fois installé.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
      },
    }),
  ],
});
