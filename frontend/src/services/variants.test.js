/**
 * Unit tests for motion variants.
 */
import {
  AppLoad,
  fadeIn,
  slideIn,
  zoomIn,
  rotate,
  scale,
  staggerContainer,
  bounce,
  wave,
  pulse,
  float,
} from "./variants";

describe("variants (motion)", () => {
  describe("AppLoad", () => {
    it("returns object with initial and show", () => {
      const v = AppLoad("down");
      expect(v).toHaveProperty("initial");
      expect(v).toHaveProperty("show");
    });
    it("initial has opacity 0 and y offset for direction down", () => {
      const v = AppLoad("down");
      expect(v.initial.opacity).toBe(0);
      expect(v.initial.y).toBe(-40);
    });
    it("initial has y 40 for direction up", () => {
      const v = AppLoad("up");
      expect(v.initial.y).toBe(40);
    });
    it("initial has x 40 for direction left, x -40 for right", () => {
      expect(AppLoad("left").initial.x).toBe(40);
      expect(AppLoad("right").initial.x).toBe(-40);
    });
    it("show has opacity 1, y 0, x 0 and transition duration 1", () => {
      const v = AppLoad("up");
      expect(v.show.opacity).toBe(1);
      expect(v.show.y).toBe(0);
      expect(v.show.x).toBe(0);
      expect(v.show.transition).toEqual({ duration: 1 });
    });
  });

  describe("fadeIn", () => {
    it("returns hidden and show with transition", () => {
      const v = fadeIn("up", 20, 0);
      expect(v).toHaveProperty("hidden");
      expect(v).toHaveProperty("show");
      expect(v.show.transition).toBeDefined();
    });
    it("uses custom duration when provided", () => {
      const v = fadeIn("up", 10, 0.2, 0.8);
      expect(v.show.transition.duration).toBe(0.8);
      expect(v.show.transition.delay).toBe(0.2);
    });
  });

  describe("slideIn", () => {
    it("returns hidden and show", () => {
      const v = slideIn("left", 0);
      expect(v.hidden).toBeDefined();
      expect(v.show).toBeDefined();
    });
    it("hidden has -100vw x for left, 100vw for right", () => {
      expect(slideIn("left", 0).hidden.x).toBe("-100vw");
      expect(slideIn("right", 0).hidden.x).toBe("100vw");
    });
    it("show has spring transition", () => {
      expect(slideIn("left", 0.5).show.transition.type).toBe("spring");
    });
  });

  describe("zoomIn", () => {
    it("returns hidden (scale 0) and show (scale 1)", () => {
      const v = zoomIn(0);
      expect(v.hidden.scale).toBe(0);
      expect(v.show.scale).toBe(1);
    });
    it("show has delay in transition", () => {
      expect(zoomIn(0.3).show.transition.delay).toBe(0.3);
    });
  });

  describe("rotate", () => {
    it("returns hidden with rotate -180 and show with rotate 0", () => {
      const v = rotate(0);
      expect(v.hidden.rotate).toBe(-180);
      expect(v.show.rotate).toBe(0);
    });
  });

  describe("scale", () => {
    it("returns hidden scale 0.8 and show scale 1", () => {
      const v = scale(0);
      expect(v.hidden.scale).toBe(0.8);
      expect(v.show.scale).toBe(1);
    });
  });

  describe("staggerContainer", () => {
    it("returns show with staggerChildren and delayChildren", () => {
      const v = staggerContainer(0.1, 0.2);
      expect(v.show.transition.staggerChildren).toBe(0.1);
      expect(v.show.transition.delayChildren).toBe(0.2);
    });
    it("default delayChildren is 0", () => {
      expect(staggerContainer(0.5).show.transition.delayChildren).toBe(0);
    });
  });

  describe("bounce", () => {
    it("returns show with y array and spring transition", () => {
      const v = bounce(0);
      expect(v.show.y).toEqual([0, -30, 0]);
      expect(v.show.transition.type).toBe("spring");
    });
  });

  describe("wave", () => {
    it("returns hidden rotate -45 and show rotate array", () => {
      const v = wave(0);
      expect(v.hidden.rotate).toBe(-45);
      expect(v.show.rotate).toEqual([0, -15, 15, -15, 0]);
    });
  });

  describe("pulse", () => {
    it("returns show with scale array and repeat Infinity", () => {
      const v = pulse(0);
      expect(v.show.scale).toEqual([1, 1.05, 1]);
      expect(v.show.transition.repeat).toBe(Infinity);
    });
  });

  describe("float", () => {
    it("returns show with y array and repeat Infinity", () => {
      const v = float(0);
      expect(v.show.y).toEqual([0, -10, 0]);
      expect(v.show.transition.repeat).toBe(Infinity);
    });
  });
});
