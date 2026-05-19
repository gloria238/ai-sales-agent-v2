import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "lib/__tests__/api-auth.test.ts",
      "lib/__tests__/business-flow.test.ts",
      "lib/__tests__/api-leads.test.ts",
      "lib/__tests__/api-members.test.ts",
      "lib/__tests__/api-org-settings.test.ts",
      "lib/__tests__/api-audit-log.test.ts",
      "lib/__tests__/api-templates-export-import.test.ts",
      "lib/__tests__/api-api-keys.test.ts",
      "lib/__tests__/injection.test.ts",
    ],
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false, // files share the same org — run sequentially
  },
});
