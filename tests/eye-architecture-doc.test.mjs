import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const src = path.join(root, "src");
const document = fs.readFileSync(path.join(root, "docs/ARCHITECTURE.md"), "utf8");

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    if (!entry.isFile() || !/\.(?:js|mjs)$/.test(entry.name)) return [];
    return [path.relative(src, file).split(path.sep).join("/")];
  });
}

// Only the module-map section counts; mentions elsewhere cannot hide an omitted row.
const section = document.split(/^## 模組地圖\s*$/m)[1];
assert.notEqual(section, undefined, "docs/ARCHITECTURE.md is missing the 模組地圖 section");
const moduleMap = section.split(/^##\s+/m)[0];
const documented = new Set(
  [...moduleMap.matchAll(/^\|\s*([^|]+?)\s*\|/gm)].map((match) =>
    match[1].trim().replace(/^`(.+)`$/, "$1"),
  ),
);
const files = sourceFiles(src).sort();
assert.ok(files.length > 0, "src contains no JavaScript modules");
const missing = files.filter((file) => !documented.has(file));
assert.equal(
  missing.length,
  0,
  `docs/ARCHITECTURE.md 模組地圖漏寫以下檔案：\n${missing.map((file) => `- src/${file}`).join("\n")}`,
);
console.log(
  `PASS architecture documentation: all ${files.length} src modules have exact map entries`,
);
