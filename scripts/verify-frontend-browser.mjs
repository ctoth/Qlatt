import { chromium } from "playwright-core";

const url = process.env.QLATT_BROWSER_URL ?? "http://127.0.0.1:8000/";
const executablePath = process.env.CHROME_PATH
  ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const cases = [
  { frontend: "qlatt-english", experiment: "klatt80-baseline", phrase: "hello world." },
  { frontend: "dectalk-english", experiment: "dectalk-english", phrase: "hello world." },
];

async function waitForRun(page, phrase, priorSessionId) {
  await page.waitForFunction(
    async ({ expectedPhrase, priorSession }) => {
      const { state } = await import("/test/harness/state.js");
      return state.lastRun?.phrase === expectedPhrase
        && state.lastRun.sessionId > priorSession
        && Array.isArray(state.lastRun.track)
        && state.lastRun.track.length > 0;
    },
    { expectedPhrase: phrase, priorSession: priorSessionId },
    { timeout: 30_000 },
  );
  return page.evaluate(async () => {
    const { state } = await import("/test/harness/state.js");
    const { textToKlattTrackDetailed } = await import("/src/tts-frontend.ts");
    const track = state.lastRun.track;
    const frontend = document.querySelector("#frontendSelect")?.value;
    const direct = textToKlattTrackDetailed(state.lastRun.phrase, state.lastRun.baseF0, 30, {
      frontendId: frontend,
    });
    const inventoryDecision = direct.utterance.provenance.getDecisions().find(
      (decision) => decision.type === "inventory_selected",
    );
    return {
      frontend,
      experiment: document.querySelector("#experimentSelect")?.value,
      frames: track.length,
      directFrames: direct.track.length,
      inventorySubject: inventoryDecision?.subject,
      durationSeconds: track.at(-1)?.time ?? 0,
      finite: track.every((frame) =>
        Number.isFinite(frame.time)
        && Object.values(frame.params).every((value) => Number.isFinite(value))),
    };
  });
}

const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"],
});

try {
  const failures = [];

  for (const testCase of cases) {
    const page = await browser.newPage();
    page.on("pageerror", (error) => failures.push(`${testCase.frontend} pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") failures.push(`${testCase.frontend} console: ${message.text()}`);
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.selectOption("#frontendSelect", testCase.frontend);
    await page.waitForFunction(
      (expected) => document.querySelector("#experimentSelect")?.value === expected,
      testCase.experiment,
      { timeout: 10_000 },
    );
    await page.click("#startBtn");
    await page.waitForFunction(
      () => {
        const status = document.querySelector("#status")?.textContent ?? "";
        return status === "Status: running" || status.includes("initialized");
      },
      undefined,
      { timeout: 30_000 },
    );
    await page.fill("#phrase", testCase.phrase);
    const priorSessionId = await page.evaluate(async () => {
      const { state } = await import("/test/harness/state.js");
      return state.sessionId;
    });
    await page.click("#speakBtn");
    const run = await waitForRun(page, testCase.phrase, priorSessionId);
    if (
      run.frontend !== testCase.frontend
      || run.experiment !== testCase.experiment
      || run.directFrames !== run.frames
      || run.inventorySubject !== `inventory:${testCase.frontend}`
      || !run.finite
      || run.frames === 0
      || run.durationSeconds <= 0
    ) {
      failures.push(`${testCase.frontend}: invalid scheduled track ${JSON.stringify(run)}`);
    }
    process.stdout.write(`${run.frontend}/${run.experiment}: ${run.frames} frames, ${run.durationSeconds.toFixed(3)}s, finite=${run.finite}, ${run.inventorySubject}\n`);
    await page.close();
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }
} finally {
  await browser.close();
}
