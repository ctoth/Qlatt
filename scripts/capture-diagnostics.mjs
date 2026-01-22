import puppeteer from "puppeteer-core";

const CHROME_PATH = process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });

  const page = await browser.newPage();
  const consoleLogs = [];

  page.on("console", (msg) => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
  });

  page.on("pageerror", (err) => {
    consoleLogs.push(`[PAGE ERROR] ${err.message}`);
  });

  await page.goto("http://localhost:8000/test/test-harness.html", {
    waitUntil: "networkidle2",
  });

  console.log("Page loaded, waiting for worklets to initialize...");
  await sleep(2000);

  // Click Start Audio to resume AudioContext
  await page.click("#startBtn");
  console.log("Clicked Start Audio");
  await sleep(500);

  // Clear the phrase input and type our test phrase
  await page.evaluate(() => {
    document.getElementById("phrase").value = "";
  });
  const testPhrase = process.argv[2] || "hello world";
  await page.type("#phrase", testPhrase);
  console.log("Typed phrase: " + testPhrase);

  // First play
  console.log("\n=== FIRST PLAY ===");
  await page.click("#speakBtn");
  await sleep(6000); // Longer for extended phrases

  // Get diagnostics after first play
  let diagnostics = await page.evaluate(() => {
    return document.getElementById("diagnostics").value;
  });
  console.log("Diagnostics after first play:\n" + diagnostics);

  // Second play
  console.log("\n=== SECOND PLAY ===");
  await page.click("#speakBtn");
  await sleep(6000);

  // Get diagnostics after second play
  diagnostics = await page.evaluate(() => {
    return document.getElementById("diagnostics").value;
  });
  console.log("Diagnostics after second play:\n" + diagnostics);

  // Third play
  console.log("\n=== THIRD PLAY ===");
  await page.click("#speakBtn");
  await sleep(6000);

  // Get diagnostics after third play
  diagnostics = await page.evaluate(() => {
    return document.getElementById("diagnostics").value;
  });
  console.log("Diagnostics after third play:\n" + diagnostics);

  console.log("\n=== CONSOLE LOGS ===");
  for (const log of consoleLogs) {
    console.log(log);
  }

  // Keep browser open so user can inspect
  console.log("\nBrowser left open for manual inspection. Press Ctrl+C to exit.");
  await new Promise(() => {}); // Wait forever
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
