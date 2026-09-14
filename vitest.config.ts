import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    pool: "threads",
    maxWorkers: 2,
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "json-summary"],
      include: [
        "src/domains/valuation/**/*.ts",
        "src/domains/investment/engine/**/*.ts",
        "src/domains/financing/**/*.ts",
        "src/domains/renovation/offer/**/*.ts",
        "src/domains/properties/service/**/*.ts",
        "src/domains/property-sources/service/**/*.ts",
        "src/lib/properties/**/*.ts",
        "src/lib/observability/**/*.ts",
      ],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/__fixtures__/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
