import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.test.ts"],
    passWithNoTests: true,
    benchmark: {
      include: ["tests/**/*.bench.ts"],
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/events/index.ts"],
      reporter: ["text", "html", "lcov"],
    },
  },
});
