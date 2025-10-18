import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      serverBuildFile: "index.js",
    }),
  ],
  server: {
    port: 3000,
  },
  ssr: {
    noExternal: ["@shopify/polaris", "@shopify/shopify-app-remix"],
    target: "node",
  },
  build: {
    target: "node18",
  },
  esbuild: {
    jsx: "automatic",
    jsxDev: false,
  },
});
