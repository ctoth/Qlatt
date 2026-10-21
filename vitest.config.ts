import { configDefaults, defineConfig } from "vitest/config";

// The dictionary audit runs from vitest.audit.config.ts (`npm run test:audit`).
export const dictionaryAuditTest = "test/audit-dictionary.test.ts";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: [...configDefaults.exclude, dictionaryAuditTest],
    globals: true,
    maxWorkers: 4,
    testTimeout: 30_000,
  },
});
