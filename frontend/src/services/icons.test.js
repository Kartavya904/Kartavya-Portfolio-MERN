/**
 * Unit tests for icons (default export keys and shape).
 * Asset imports are resolved by Jest (moduleNameMapper or default).
 */
import icons from "./icons";

describe("icons", () => {
  it("exports an object", () => {
    expect(icons).toBeDefined();
    expect(typeof icons).toBe("object");
  });

  it("has expected technology keys", () => {
    expect(icons).toHaveProperty("javascript");
    expect(icons).toHaveProperty("python");
    expect(icons).toHaveProperty("react");
    expect(icons).toHaveProperty("nodejs");
    expect(icons).toHaveProperty("mongodb");
    expect(icons).toHaveProperty("express");
    expect(icons).toHaveProperty("css");
    expect(icons).toHaveProperty("typescript");
  });

  it("has expected language keys", () => {
    expect(icons).toHaveProperty("english");
    expect(icons).toHaveProperty("hindi");
    expect(icons).toHaveProperty("japanese");
    expect(icons).toHaveProperty("french");
    expect(icons).toHaveProperty("arabic");
  });

  it("has expected platform/tool keys", () => {
    expect(icons).toHaveProperty("windows");
    expect(icons).toHaveProperty("macos");
    expect(icons).toHaveProperty("powerbi");
    expect(icons).toHaveProperty("tableau");
  });
});
