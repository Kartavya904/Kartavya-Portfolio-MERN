/**
 * Unit tests for frontend motion variants (no React/DOM).
 * Resolves frontend/src/services/variants.js from repo.
 */
const path = require("path");
const variants = require(path.resolve(__dirname, "../../frontend/src/services/variants"));

describe("variants (motion)", () => {
  describe("AppLoad", () => {
    it("returns object with initial and show", () => {
      const v = variants.AppLoad("down");
      expect(v).toHaveProperty("initial");
      expect(v).toHaveProperty("show");
    });
    it("initial has opacity 0 and y offset for direction down", () => {
      const v = variants.AppLoad("down");
      expect(v.initial.opacity).toBe(0);
      expect(v.initial.y).toBe(-40);
    });
    it("show has opacity 1 and y 0", () => {
      const v = variants.AppLoad("up");
      expect(v.show.opacity).toBe(1);
      expect(v.show.y).toBe(0);
    });
  });

  describe("fadeIn", () => {
    it("returns hidden and show with transition", () => {
      const v = variants.fadeIn("up", 20, 0);
      expect(v).toHaveProperty("hidden");
      expect(v).toHaveProperty("show");
      expect(v.show.transition).toBeDefined();
    });
  });

  describe("slideIn", () => {
    it("returns hidden and show", () => {
      const v = variants.slideIn("left", 0);
      expect(v.hidden).toBeDefined();
      expect(v.show).toBeDefined();
    });
  });

  describe("zoomIn", () => {
    it("returns hidden (scale 0) and show (scale 1)", () => {
      const v = variants.zoomIn(0);
      expect(v.hidden.scale).toBe(0);
      expect(v.show.scale).toBe(1);
    });
  });
});
