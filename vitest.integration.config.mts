import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: "integration",
    include: ["src/**/*.integration.test.ts"],
    setupFiles: ["dotenv/config"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
