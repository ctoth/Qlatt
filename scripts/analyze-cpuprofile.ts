#!/usr/bin/env node
/**
 * Analyze a V8 .cpuprofile file and print top functions by self time.
 */
import fs from "node:fs";

const profilePath = process.argv[2];
if (!profilePath) {
  // Find the latest .cpuprofile file
  const files = fs.readdirSync(".").filter(f => f.endsWith(".cpuprofile")).sort();
  if (files.length === 0) {
    console.error("No .cpuprofile files found");
    process.exit(1);
  }
  console.log(`Found profiles: ${files.join(", ")}`);
  analyzeProfile(files[files.length - 1]);
} else {
  analyzeProfile(profilePath);
}

function analyzeProfile(filePath: string) {
  console.log(`\nAnalyzing: ${filePath}\n`);
  const raw = fs.readFileSync(filePath, "utf8");
  const profile = JSON.parse(raw);

  const nodes = profile.nodes as Array<{
    id: number;
    callFrame: {
      functionName: string;
      url: string;
      lineNumber: number;
      columnNumber: number;
    };
    hitCount: number;
    children?: number[];
  }>;

  // Build node map
  const nodeMap = new Map<number, typeof nodes[0]>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Calculate self time from samples and timeDeltas
  const samples = profile.samples as number[];
  const timeDeltas = profile.timeDeltas as number[];

  const selfTimeByNode = new Map<number, number>();
  for (let i = 0; i < samples.length; i++) {
    const nodeId = samples[i];
    const delta = timeDeltas[i] || 0;
    selfTimeByNode.set(nodeId, (selfTimeByNode.get(nodeId) || 0) + delta);
  }

  // Aggregate by function name + URL
  const funcTimes = new Map<string, { name: string; url: string; line: number; selfTime: number; hitCount: number }>();

  for (const [nodeId, selfTime] of selfTimeByNode) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    const cf = node.callFrame;
    const key = `${cf.functionName}|${cf.url}:${cf.lineNumber}`;
    const existing = funcTimes.get(key);
    if (existing) {
      existing.selfTime += selfTime;
      existing.hitCount += node.hitCount;
    } else {
      funcTimes.set(key, {
        name: cf.functionName || "(anonymous)",
        url: cf.url,
        line: cf.lineNumber,
        selfTime,
        hitCount: node.hitCount,
      });
    }
  }

  // Sort by self time descending
  const sorted = [...funcTimes.values()].sort((a, b) => b.selfTime - a.selfTime);
  const totalSelfTime = sorted.reduce((sum, f) => sum + f.selfTime, 0);

  console.log(`Total sampled time: ${(totalSelfTime / 1000).toFixed(0)}ms`);
  console.log(`Total samples: ${samples.length}\n`);

  // Print top 30 functions
  console.log("Top 30 functions by self time:\n");
  console.log(`${"Rank".padStart(4)}  ${"Self (ms)".padStart(10)}  ${"Self %".padStart(7)}  ${"Cumul %".padStart(8)}  Function`);
  console.log("-".repeat(100));

  let cumulPct = 0;
  for (let i = 0; i < Math.min(30, sorted.length); i++) {
    const f = sorted[i];
    const selfMs = f.selfTime / 1000;
    const selfPct = (f.selfTime / totalSelfTime) * 100;
    cumulPct += selfPct;

    // Shorten URL for display
    let shortUrl = f.url;
    const srcIdx = shortUrl.indexOf("/src/");
    if (srcIdx >= 0) shortUrl = shortUrl.slice(srcIdx);
    const nodeIdx = shortUrl.indexOf("/node_modules/");
    if (nodeIdx >= 0) shortUrl = shortUrl.slice(nodeIdx);

    console.log(
      `${String(i + 1).padStart(4)}  ${selfMs.toFixed(1).padStart(10)}  ${selfPct.toFixed(1).padStart(6)}%  ${cumulPct.toFixed(1).padStart(7)}%  ${f.name} (${shortUrl}:${f.line + 1})`
    );
  }

  // Group by file
  console.log("\n\nTop files by self time:\n");
  const fileTimings = new Map<string, number>();
  for (const f of sorted) {
    let shortUrl = f.url;
    const srcIdx = shortUrl.indexOf("/src/");
    if (srcIdx >= 0) shortUrl = shortUrl.slice(srcIdx);
    const nodeIdx = shortUrl.indexOf("/node_modules/");
    if (nodeIdx >= 0) shortUrl = shortUrl.slice(nodeIdx);
    fileTimings.set(shortUrl, (fileTimings.get(shortUrl) || 0) + f.selfTime);
  }

  const sortedFiles = [...fileTimings.entries()].sort((a, b) => b[1] - a[1]);
  for (const [file, time] of sortedFiles.slice(0, 15)) {
    const ms = time / 1000;
    const pct = (time / totalSelfTime) * 100;
    console.log(`  ${ms.toFixed(0).padStart(7)}ms  ${pct.toFixed(1).padStart(6)}%  ${file}`);
  }
}
