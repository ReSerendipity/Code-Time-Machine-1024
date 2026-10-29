const { chromium } = require("playwright-core");
const { pathToFileURL } = require("url");
const path = require("path");
const { runFlow, runMobileFlow } = require("./flow-lib");

const BASE = pathToFileURL(path.join(__dirname, "code-time-machine.html")).href;

async function main() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const errors = [];

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  await runFlow({
    base: BASE,
    shotsDir: path.join(__dirname, "shots-single"),
    label: "single-desktop",
    page,
    context,
    errors,
  });

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobile = await mobileContext.newPage();
  mobile.on("pageerror", (error) => errors.push(`mobile pageerror: ${error.message}`));
  await runMobileFlow({
    base: BASE,
    shotsDir: path.join(__dirname, "shots-single"),
    label: "single-mobile",
    page: mobile,
    errors,
  });

  console.log("ERRORS:", errors.length ? errors : "none");
  await browser.close();
  if (errors.length) process.exit(1);
}

main().catch((error) => {
  console.error("TEST FAILED:", error.message || error);
  process.exit(1);
});
