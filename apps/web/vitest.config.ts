import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["lib/__tests__/**/*.test.ts"],
    exclude: [
      "lib/__tests__/business-flow.test.ts",
      "lib/__tests__/api-auth.test.ts",
      "lib/__tests__/api-workflows.test.ts",
      "lib/__tests__/api-leads.test.ts",
      "lib/__tests__/api-members.test.ts",
      "lib/__tests__/api-org-settings.test.ts",
      "lib/__tests__/api-audit-log.test.ts",
      "lib/__tests__/api-templates-export-import.test.ts",
      "lib/__tests__/api-api-keys.test.ts",
      "lib/__tests__/injection.test.ts",
    ],
    setupFiles: ["lib/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
