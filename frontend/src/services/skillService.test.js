/**
 * Unit tests for skillService (mocked axios).
 */
jest.mock("axios", () => ({ get: jest.fn() }));
const axios = require("axios");
const { fetchSkills } = require("./skillService");

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore();
});

describe("skillService", () => {
  it("fetchSkills calls GET getskills and returns data", async () => {
    const mockData = [{ skillName: "JavaScript" }];
    axios.get.mockResolvedValueOnce({ data: mockData });
    const result = await fetchSkills();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/getskills"));
    expect(result).toEqual(mockData);
  });

  it("fetchSkills throws when axios rejects", async () => {
    axios.get.mockRejectedValueOnce(new Error("Server error"));
    await expect(fetchSkills()).rejects.toThrow("Server error");
  });
});
