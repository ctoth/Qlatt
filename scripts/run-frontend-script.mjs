import { resolve } from "node:path";
import { createServer } from "vite";

// Frontend modules use Vite's import.meta.env and bundled YAML loading.
// Keep offline reporting in the same module environment as frontend tests.
const script = process.argv.splice(2, 1)[0];
if (!script) throw new Error("Usage: node scripts/run-frontend-script.mjs SCRIPT [ARGS...]");
process.argv[1] = resolve(script);
const server = await createServer({
  server: { middlewareMode: true, ws: false },
  appType: "custom",
});
try {
  await server.ssrLoadModule(script);
} finally {
  await server.close();
}
