const fs = require("node:fs");
const path = require("node:path");
const { transformFileSync } = require("@swc/core");
const { loadEnv } = require("@medusajs/utils");
loadEnv("test", process.cwd());

// clipper2-js ships only an ES module (.mjs), and Jest always loads .mjs as ESM, while the
// Medusa route loader requires modules. Node 22 runs it as is; for Jest it is compiled once
// to CommonJS here and mapped by moduleNameMapper below.
const CLIPPER_SOURCE = require.resolve("clipper2-js");
const CLIPPER_CJS = path.join(__dirname, "node_modules", ".cache", "jest", "clipper2-js.cjs");
if (!fs.existsSync(CLIPPER_CJS) || fs.statSync(CLIPPER_CJS).mtimeMs < fs.statSync(CLIPPER_SOURCE).mtimeMs) {
  const { code } = transformFileSync(CLIPPER_SOURCE, { jsc: { target: "es2021" }, module: { type: "commonjs" }, sourceMaps: false });
  fs.mkdirSync(path.dirname(CLIPPER_CJS), { recursive: true });
  fs.writeFileSync(CLIPPER_CJS, code);
}

module.exports = {
  transform: {
    "^.+\\.[jt]s$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true },
          // Set explicitly: @swc/jest would pick the Node version (es2023), which this @swc/core does not know.
          target: "es2021",
        },
      },
    ],
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts", "json"],
  moduleNameMapper: { "^clipper2-js$": CLIPPER_CJS },
  modulePathIgnorePatterns: ["dist/", "<rootDir>/.medusa/"],
  setupFiles: ["./integration-tests/setup.js"],
};

if (process.env.TEST_TYPE === "integration:http") {
  module.exports.testMatch = ["**/integration-tests/http/*.spec.[jt]s"];
} else if (process.env.TEST_TYPE === "integration:modules") {
  module.exports.testMatch = ["**/src/modules/*/__tests__/**/*.[jt]s"];
} else if (process.env.TEST_TYPE === "unit") {
  module.exports.testMatch = ["**/src/**/__tests__/**/*.unit.spec.[jt]s"];
}
