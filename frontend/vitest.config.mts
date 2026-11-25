import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-query", "use-sync-external-store"],
  },
  test: {
    pool: "vmThreads",
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    server: {
      deps: {
        inline: [/react/, /react-dom/, /@base-ui/, /@tanstack/, /use-sync-external-store/],
      },
    },
  },
});
