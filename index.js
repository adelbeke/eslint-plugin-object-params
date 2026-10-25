import packageJson from "./package.json" with { type: "json" };

const isCallback = node =>
  (node.parent?.type === "CallExpression" || node.parent?.type === "NewExpression") && node.parent.arguments.includes(node);

const isThisParam = param => param.type === "Identifier" && param.name === "this";

function check(context, node) {
  if (node.params.filter(param => !isThisParam(param)).length > 1 && !isCallback(node)) {
    context.report({ node, messageId: "useObjectParam" });
  }
}

const plugin = {
  meta: { name: packageJson.name, version: packageJson.version },
  rules: {
    "object-params": {
      meta: {
        type: "suggestion",
        docs: {
          description: "Require a single object parameter instead of positional parameters, except for callbacks",
          url: "https://github.com/adelbeke/eslint-plugin-object-params#readme",
        },
        schema: [],
        messages: { useObjectParam: "Use a single object parameter instead of positional parameters." },
      },
      create: context => ({
        FunctionDeclaration: node => check(context, node),
        FunctionExpression: node => check(context, node),
        ArrowFunctionExpression: node => check(context, node),
      }),
    },
  },
  configs: {},
};

plugin.configs.recommended = {
  plugins: { "object-params": plugin },
  rules: { "object-params/object-params": "error" },
};

export default plugin;
