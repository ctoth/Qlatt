import { execFileSync } from "node:child_process";
import path from "node:path";
import { it } from "vitest";

it("NVDA driver suppresses canceled utterance playback and notifications", () => {
  execFileSync(
    process.platform === "win32" ? "python" : "python3",
    ["-B", "-m", "unittest", "discover", "-s", "hosts/nvda", "-p", "test_driver.py"],
    {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10_000,
    },
  );
});
