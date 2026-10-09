import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { parse } from "espree";
const folders = ["core", "systems", "ui", "render", "scenes"];
assert.ok(fs.readFileSync("src/game.js", "utf8").trimEnd().split("\n").length <= 150);
for (const folder of folders) {
  for (const name of fs.readdirSync(`src/${folder}`)) {
    if (!name.endsWith(".mjs")) continue;
    const file = path.join("src", folder, name),
      source = fs.readFileSync(file, "utf8");
    assert.ok(source.trimEnd().split("\n").length <= 400, `${file}: module exceeds 400 lines`);
    const ast = parse(source, { ecmaVersion: "latest", sourceType: "module" });
    assert.ok(
      !ast.body.some((n) => n.type === "VariableDeclaration" && n.kind === "let"),
      `${file}: mutable module-global state`,
    );
    if (["core", "systems", "scenes"].includes(folder)) {
      assert.ok(
        !/\b(?:sfx|cues)\.play\s*\(/.test(source),
        `${file}: gameplay must emit presentation events`,
      );
    }
  }
}
console.log(
  "PASS architecture boundaries: entry/module budgets, instance state, event-only gameplay audio",
);
