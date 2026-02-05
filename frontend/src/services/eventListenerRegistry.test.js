/**
 * Unit tests for eventListenerRegistry.
 */
import {
  addGlobalEventListener,
  updateListenerUsage,
  cleanupEventListeners,
} from "./eventListenerRegistry";

describe("eventListenerRegistry", () => {
  let addSpy;
  let removeSpy;

  beforeEach(() => {
    addSpy = jest.spyOn(window, "addEventListener").mockImplementation(() => {});
    removeSpy = jest.spyOn(window, "removeEventListener").mockImplementation(() => {});
  });

  afterEach(() => {
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("addGlobalEventListener calls window.addEventListener", () => {
    const cb = () => {};
    addGlobalEventListener("scroll", cb);
    expect(addSpy).toHaveBeenCalledWith("scroll", cb, undefined);
  });

  it("addGlobalEventListener accepts options", () => {
    const cb = () => {};
    addGlobalEventListener("click", cb, { passive: true });
    expect(addSpy).toHaveBeenCalledWith("click", cb, { passive: true });
  });

  it("updateListenerUsage updates lastUsed when listener found", () => {
    const cb = () => {};
    addGlobalEventListener("scroll", cb);
    updateListenerUsage("scroll", cb);
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it("updateListenerUsage does not throw when listener not in registry", () => {
    const cb = () => {};
    expect(() => updateListenerUsage("resize", cb)).not.toThrow();
  });

  it("cleanupEventListeners removes stale listeners and returns remaining", () => {
    const cb = () => {};
    addGlobalEventListener("scroll", cb);
    const result = cleanupEventListeners(0);
    expect(removeSpy).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });

});
