// Lossless packaging of frozen #243 reports; does not recalculate their measurements.
import fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";

for (const file of process.argv.slice(2)) {
  const source = fs.readFileSync(file);
  const packed = gzipSync(source, { level: 9 });
  if (!gunzipSync(packed).equals(source)) throw new Error(`Compression round trip failed: ${file}`);
  fs.writeFileSync(`${file}.gz`, packed);
  console.log(`${file}: ${source.length} -> ${packed.length} bytes`);
}
