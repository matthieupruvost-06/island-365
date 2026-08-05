import { defineConfig } from 'vite';

// base: './' makes the build use relative asset paths, so the same dist/
// works whether it's served from a domain root (Vercel/Netlify) or from a
// GitHub Pages project subpath (https://user.github.io/repo-name/).
export default defineConfig({
  base: './',
});
