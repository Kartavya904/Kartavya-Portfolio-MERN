/**
 * Unit tests for skillComponentService (mocked axios).
 */
jest.mock("axios", () => ({ get: jest.fn() }));
const axios = require("axios");
const { fetchSkillsComponents } = require("./skillComponentService");

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore();
});

describe("skillComponentService", () => {
  it("fetchSkillsComponents calls GET getskillcomponents and returns data", async () => {
    const mockData = [{ componentName: "React", level: "Proficient" }];
    axios.get.mockResolvedValueOnce({ data: mockData });
    const result = await fetchSkillsComponents();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/getskillcomponents"));
    expect(result).toEqual(mockData);
  });

  it("fetchSkillsComponents throws when axios rejects", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));
    await expect(fetchSkillsComponents()).rejects.toThrow("Network error");
  });
});
