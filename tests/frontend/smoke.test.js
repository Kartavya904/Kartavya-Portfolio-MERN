/**
 * Smoke tests: ensure main frontend modules exist and export expected shape.
 */
const path = require("path");

describe("Frontend smoke", () => {
  it("App.js exports a function (default)", () => {
    const App = require(path.resolve(__dirname, "../../frontend/src/App.js"));
    expect(typeof App.default).toBe("function");
  });

  it("variants module exports AppLoad and fadeIn", () => {
    const v = require(path.resolve(__dirname, "../../frontend/src/services/variants.js"));
    expect(typeof v.AppLoad).toBe("function");
    expect(typeof v.fadeIn).toBe("function");
  });
});
