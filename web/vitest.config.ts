import { defineConfig } from 'vitest/config';

// Standalone Vitest config for unit-testing the plain TS lib modules.
// We intentionally don't load the SvelteKit plugin here: the modules under
// test (src/lib/*.ts) have no Svelte/SvelteKit dependencies, so a minimal
// Node environment keeps the suite fast and avoids needing `svelte-kit sync`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts']
  }
});
