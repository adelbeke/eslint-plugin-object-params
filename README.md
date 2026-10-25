# eslint-plugin-object-params

ESLint and oxlint rule that makes functions take a single object parameter instead of positional ones.

```ts
// ❌ What is `true`? What comes second?
createUser("Ada", "ada@example.com", true);

// ✅ Self-describing, order-independent, easy to extend
createUser({ name: "Ada", email: "ada@example.com", isAdmin: true });
```

## Why not `max-params: 1`?

`max-params` also flags callbacks, whose signature you do not control:

```ts
items.sort((left, right) => left.rank - right.rank); // max-params: 1 reports this
```

ESLint [declined an option to skip callbacks](https://github.com/eslint/eslint/issues/17727) because core stylistic rules are frozen. This plugin does exactly that: it reports any function with more than one parameter, **except** a function passed directly as an argument (`sort`, `reduce`, `new Promise`, event handlers, and so on).

## Install

```sh
pnpm add -D eslint-plugin-object-params
# or: npm install -D eslint-plugin-object-params
```

## Usage

### ESLint (flat config, v9+)

```js
// eslint.config.js
import objectParams from "eslint-plugin-object-params";

export default [objectParams.configs.recommended];
```

Or scope it, for example to pure domain code:

```js
import objectParams from "eslint-plugin-object-params";

export default [
  {
    files: ["src/core/**/*.ts"],
    plugins: { "object-params": objectParams },
    rules: { "object-params/object-params": "error" },
  },
];
```

### oxlint

Oxlint loads it as a [JS plugin](https://oxc.rs/docs/guide/usage/linter/js-plugins):

```json
{
  "jsPlugins": ["eslint-plugin-object-params"],
  "overrides": [
    {
      "files": ["src/core/**/*.ts"],
      "rules": { "object-params/object-params": "error" }
    }
  ]
}
```

## Rule details

Reported (more than one parameter):

```ts
function rename(first, last) {}
const rename = (first, last) => {};
class User { rename(first, last) {} }
```

Allowed:

```ts
function rename({ first, last }) {}
function log(...messages) {}
function bound(this: Window, { id }) {} // TypeScript `this` is not a parameter
[3, 1, 2].sort((left, right) => left - right); // callback
new Promise((resolve, reject) => {}); // callback
```

The rule has no options.

## Related

[eslint-plugin-prefer-object-params](https://github.com/jagreehal/eslint-plugin-prefer-object-params) covers the same idea with a configurable threshold and ignore lists, but does not skip callbacks.

## License

MIT
