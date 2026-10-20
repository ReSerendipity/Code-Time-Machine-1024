const fs = require("fs");
const path = require("path");

const root = __dirname;
const htmlPath = path.join(root, "index.html");
const cssPath = path.join(root, "styles.css");
const jsDir = path.join(root, "js");

const jsFiles = [
  "core.js",
  "audio.js",
  "era1-punch.js",
  "era2-register.js",
  "era3-unix.js",
  "era4-web.js",
  "era5-cloud.js",
  "era6-ai.js",
  "result.js",
  "main.js",
];

let html = fs.readFileSync(htmlPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");
const js = jsFiles.map((file) => fs.readFileSync(path.join(jsDir, file), "utf8")).join("\n\n");

html = html.replace(
  '<link rel="stylesheet" href="styles.css">',
  () => `<style>\n${css}\n</style>`
);

const scriptPattern = /  <script src="js\/[\s\S]*?<\/script>\n?/g;
if (!scriptPattern.test(html)) {
  throw new Error("Could not find the script block in index.html");
}
html = html.replace(scriptPattern, "");
html = html.replace("</body>", () => `  <script>\n${js}\n  </script>\n</body>`);

const outputPath = path.join(root, "code-time-machine.html");
fs.writeFileSync(outputPath, html, "utf8");

const size = fs.statSync(outputPath).size;
console.log(`Built ${path.basename(outputPath)} (${(size / 1024).toFixed(1)} KB)`);
