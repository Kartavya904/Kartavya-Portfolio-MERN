/**
 * Unit tests for ping service (mocked axios).
 */
jest.mock("axios", () => ({
  get: jest.fn(),
}));

const axios = require("axios");
const { pingBackend, pingDatabase } = require("./ping");

describe("ping service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    console.error.mockRestore();
  });

  it("pingBackend returns true when axios get resolves", async () => {
    axios.get.mockResolvedValueOnce({ status: 200 });
    const result = await pingBackend();
    expect(result).toBe(true);
  });

  it("pingBackend returns false when axios get rejects", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));
    const result = await pingBackend();
    expect(result).toBe(false);
  });

  it("pingDatabase returns true when axios get resolves", async () => {
    axios.get.mockResolvedValueOnce({ status: 200 });
    const result = await pingDatabase();
    expect(result).toBe(true);
  });

  it("pingDatabase returns false when axios get rejects", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));
    const result = await pingDatabase();
    expect(result).toBe(false);
  });
});
