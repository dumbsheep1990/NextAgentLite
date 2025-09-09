import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte({ emitCss: false }), dts({ rollupTypes: true })],
  build: {
    target: "esnext",
    lib: {
      entry: {
        index: "./src/lib/index.ts",
      },
      fileName: (_, entryName) => `${entryName}.js`,
      formats: ["es"],
    },
    rollupOptions: {
      external: ["@uwdata/mosaic-core", "@uwdata/mosaic-sql"],
    },
    copyPublicDir: false,
  },
  optimizeDeps: {
    exclude: ["svelte"],
  },
});
