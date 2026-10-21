import { configDefaults, defineConfig } from "vitest/config";
import base, { dictionaryAuditTest } from "./vitest.config.ts";

// Runs only the dictionary audit, which vitest.config.ts excludes from `npm test`.
export default defineConfig({
  test: {
    ...base.test,
    include: [dictionaryAuditTest],
    exclude: configDefaults.exclude,
  },
});
