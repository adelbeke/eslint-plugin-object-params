import { describe, it, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { RuleTester } from "eslint";
import typescriptParser from "@typescript-eslint/parser";
import plugin from "./index.js";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const rule = plugin.rules["object-params"];
const error = { messageId: "useObjectParam" };

new RuleTester().run("object-params", rule, {
  valid: [
    "function none() {}",
    "function single(value) {}",
    "function destructured({ name, email }) {}",
    "const arrow = ({ name, email }) => name + email;",
    "function rest(...values) {}",
    "[3, 1, 2].sort((left, right) => left - right);",
    "items.reduce(function (total, item) { return total + item; }, 0);",
    "new Promise((resolve, reject) => resolve());",
  ],
  invalid: [
    { code: "function positional(name, email) {}", errors: [error] },
    { code: "const arrow = (name, email) => name + email;", errors: [error] },
    { code: "const expression = function (name, email) {};", errors: [error] },
    { code: "class User { rename(first, last) {} }", errors: [error] },
    { code: "const user = { rename(first, last) {} };", errors: [error] },
    { code: "export default function (name, email) {}", errors: [error] },
    { code: "run(function outer() { return (name, email) => name; });", errors: [error] },
  ],
});

new RuleTester({ languageOptions: { parser: typescriptParser } }).run("object-params (TypeScript)", rule, {
  valid: [
    "function bound(this: Window, { id }: { id: string }) {}",
    "function overloaded(name: string): void;",
  ],
  invalid: [
    { code: "function typed(name: string, email: string) {}", errors: [error] },
    { code: "function bound(this: Window, name: string, email: string) {}", errors: [error] },
  ],
});

test("exposes a recommended flat config that enables the rule", () => {
  // GIVEN
  const expected = { "object-params/object-params": "error" };

  // WHEN
  const actual = plugin.configs.recommended;

  // THEN
  assert.deepEqual(actual.rules, expected);
  assert.equal(actual.plugins["object-params"], plugin);
});

test("runs as an oxlint JS plugin", () => {
  // GIVEN
  const directory = given_oxlint_project({
    "positional.ts": "export function positional(name: string, email: string) {}\n",
    "callback.ts": "export const sorted = [2, 1].sort((left, right) => left - right);\n",
  });

  // WHEN
  const actual = when_running_oxlint(directory);

  // THEN
  assert.match(actual, /positional\.ts.*object-params/);
  assert.doesNotMatch(actual, /callback\.ts/);
});

function given_oxlint_project(files) {
  const directory = mkdtempSync(join(tmpdir(), "object-params-"));
  const config = {
    jsPlugins: [fileURLToPath(new URL("./index.js", import.meta.url))],
    rules: { "object-params/object-params": "error" },
  };
  writeFileSync(join(directory, ".oxlintrc.json"), JSON.stringify(config));
  for (const [name, contents] of Object.entries(files)) writeFileSync(join(directory, name), contents);
  return directory;
}

function when_running_oxlint(directory) {
  const oxlint = fileURLToPath(new URL("./node_modules/.bin/oxlint", import.meta.url));
  try {
    return execFileSync(oxlint, ["--format", "unix"], { cwd: directory, encoding: "utf8" });
  } catch (failure) {
    return failure.stdout;
  }
}
