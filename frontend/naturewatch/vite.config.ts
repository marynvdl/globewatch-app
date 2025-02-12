import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs';
import { defineConfig, type UserConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { checker } from 'vite-plugin-checker';
import vue from '@vitejs/plugin-vue';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import path from 'path';

/**
 * Vite Configure
 * @see {@link https://vitejs.dev/config/}
 */
export default defineConfig(async ({ command, mode }): Promise<UserConfig> => {
  const config: UserConfig = {
    // https://vitejs.dev/config/shared-options.html#base
    base: './',
    // https://vitejs.dev/config/shared-options.html#define
    define: { 'process.env': {} },
    plugins: [
      // Vue3
      vue({
        template: {
          // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin#image-loading
          transformAssetUrls,
        },
      }),
      // Vuetify Loader
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin#vite-plugin-vuetify
      vuetify({
        autoImport: true,
        styles: { configFile: 'src/styles/settings.scss' },
      }),
      // vite-plugin-checker
      // https://github.com/fi3ework/vite-plugin-checker
      checker({
        typescript: true,
        vueTsc: true,
        eslint: {
          lintCommand:
            'eslint . --cache --cache-location ./node_modules/.vite/vite-plugin-eslint', // for example, lint .ts & .tsx
        },
      }),
    ],
    // https://vitejs.dev/config/server-options.html
    server: {
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..'],
      },
    },
    // Resolver
    resolve: {
      // https://vitejs.dev/config/shared-options.html#resolve-alias
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '~': fileURLToPath(new URL('./node_modules', import.meta.url)),
      },
      extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
    },
    // Build Options
    // https://vitejs.dev/config/build-options.html
    build: {
      // Build Target
      // https://vitejs.dev/config/build-options.html#build-target
      target: 'esnext',
      // Minify option
      // https://vitejs.dev/config/build-options.html#build-minify
      minify: 'esbuild',
      // Rollup Options
      // https://vitejs.dev/config/build-options.html#build-rollupoptions
      rollupOptions: {
        output: {
          manualChunks: {
            // Split external library from transpiled code.
            vue: ['vue', 'vue-router', 'pinia', 'pinia-plugin-persistedstate'],
            vuetify: [
              'vuetify',
              'vuetify/components',
              'vuetify/directives',
              'webfontloader',
            ],
            materialdesignicons: ['@mdi/font/css/materialdesignicons.css'],
          },
          plugins: [
            mode === 'analyze'
              ? // rollup-plugin-visualizer
                // https://github.com/btd/rollup-plugin-visualizer
                visualizer({
                  open: true,
                  filename: 'dist/stats.html',
                })
              : undefined,
          ],
        },
      },
    },
    esbuild: {
      // Drop console when production build.
      drop: command === 'serve' ? [] : ['console'],
    },
  };

  // Read and parse `package.json` to get the version
  const packageJsonPath = path.resolve(__dirname, './package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  // Write meta data.
  fs.writeFileSync(
    fileURLToPath(new URL('./src/Meta.ts', import.meta.url)),
    `import type MetaInterface from '@/interfaces/MetaInterface';

const meta: MetaInterface = {
  version: '${packageJson.version}',
  date: '${new Date().toISOString()}',
};

export default meta;
`
  );

  return config;
});
