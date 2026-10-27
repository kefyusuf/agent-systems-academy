import { defineConfig } from 'astro/config';

// Local development stays at /; project Pages deployments require the repository subpath.
export default defineConfig({
  output: 'static',
  site: process.env.GITHUB_PAGES === 'true' ? 'https://kefyusuf.github.io' : 'http://localhost:4321',
  base: process.env.GITHUB_PAGES === 'true' ? '/agent-systems-academy/' : '/',
});
