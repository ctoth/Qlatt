import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "vite";

// Execute from the checkout being measured. Capture master first, then compare
// the candidate before updating the full-track tone-association snapshots.
const [mode, file] = process.argv.slice(2);
assert(["--capture", "--compare"].includes(mode) && file, "Use --capture/--compare <capture.json>");
const server = await createServer({ server: { middlewareMode: true } });
try {
  const { textToKlattTrackDetailed } = await server.ssrLoadModule("/src/tts-frontend.ts");
  const rows = [];
  for (const frontendId of ["qlatt-english", "qlatt-beauty", "dectalk-english"]) {
    for (const phrase of [
      "The cat sat.",
      "Did Bob buy a blue balloon?",
      "Gag, gang; go!",
      "sip sip.",
    ]) {
      const { track } = textToKlattTrackDetailed(phrase, 110, 30, { frontendId });
      rows.push({ frontendId, phrase, track: track.map(({ provenance, ...frame }) => frame) });
    }
  }
  if (mode === "--capture") {
    writeFileSync(file, JSON.stringify(rows, null, 2));
  } else {
    const before = JSON.parse(readFileSync(file, "utf8"));
    assert.equal(before.length, rows.length);
    const report = [];
    for (let i = 0; i < rows.length; i++) {
      const old = before[i];
      const current = rows[i];
      assert.equal(old.frontendId, current.frontendId);
      assert.equal(old.phrase, current.phrase);
      assert.equal(old.track.length, current.track.length, `${current.phrase}: frame count`);
      const hasNasal = current.track.some((frame) => ["M", "N", "NG"].includes(frame.phoneme));
      const changes = new Set();
      for (let j = 0; j < old.track.length; j++) {
        const { params: prior, ...oldMetadata } = old.track[j];
        const { params: now, ...metadata } = current.track[j];
        assert.deepEqual(metadata, oldMetadata, `${current.phrase}: frame ${j} metadata/timing`);
        const migrated = { ...prior };
        if (current.frontendId !== "dectalk-english") {
          migrated.nasalCouplingArea = migrated.nasalCoupling * 2.5;
          delete migrated.nasalCoupling;
          if (current.frontendId === "qlatt-english") {
            delete migrated.nasalPoleBaseHz;
            migrated.nasalPlaceNFnzHz = 1780;
            migrated.nasalPlaceNgFnzHz = 3700;
          }
        }
        assert.deepEqual(Object.keys(migrated).sort(), Object.keys(now).sort());
        for (const key of Object.keys(now)) {
          if (Math.abs(now[key] - migrated[key]) <= 1e-9) continue;
          assert(
            hasNasal && ["F1", "F2", "F3", "F4", "B1"].includes(key),
            `${current.frontendId} ${current.phrase}: unexpected ${key} change`,
          );
          changes.add(key);
        }
      }
      const hash = (track) => createHash("sha256").update(JSON.stringify(track)).digest("hex");
      report.push({
        frontend: current.frontendId,
        phrase: current.phrase,
        oldHash: hash(old.track),
        newHash: hash(current.track),
        acousticChanges: [...changes].sort(),
      });
    }
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
} finally {
  await server.close();
}
