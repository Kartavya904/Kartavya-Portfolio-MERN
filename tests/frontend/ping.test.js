/**
 * Unit tests for frontend ping service.
 * Mocks fetch so no real network is required.
 */
const path = require("path");

// Mock fetch before requiring ping
global.fetch = jest.fn();

const ping = require(path.resolve(__dirname, "../../frontend/src/services/ping"));

describe("ping service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("pingBackend resolves to true when response is ok", async () => {
    global.fetch.mockResolvedValueOnce({ ok: true });
    const base = "http://localhost:5000";
    const result = await ping.pingBackend(base);
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/ping"), expect.any(Object));
  });

  it("pingBackend resolves to false when response is not ok", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });
    const result = await ping.pingBackend("http://localhost:5000");
    expect(result).toBe(false);
  });

  it("pingDatabase resolves to true when db-ping is ok", async () => {
    global.fetch.mockResolvedValueOnce({ ok: true });
    const result = await ping.pingDatabase("http://localhost:5000");
    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/db-ping"), expect.any(Object));
  });

  it("pingDatabase resolves to false when fetch rejects", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await ping.pingDatabase("http://localhost:5000");
    expect(result).toBe(false);
  });
});
