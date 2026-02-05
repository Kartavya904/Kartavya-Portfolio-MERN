/**
 * Unit tests for experienceService (mocked axios).
 */
jest.mock("axios", () => ({ get: jest.fn() }));
const axios = require("axios");
const { fetchExperiences, fetchExperienceByLink } = require("./experienceService");

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore();
});

describe("experienceService", () => {
  it("fetchExperiences calls GET getexperiences and returns data", async () => {
    const mockData = [{ experienceTitle: "Co-op" }];
    axios.get.mockResolvedValueOnce({ data: mockData });
    const result = await fetchExperiences();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/getexperiences"));
    expect(result).toEqual(mockData);
  });

  it("fetchExperiences throws when axios rejects", async () => {
    axios.get.mockRejectedValueOnce(new Error("Error"));
    await expect(fetchExperiences()).rejects.toThrow("Error");
  });

  it("fetchExperienceByLink calls GET getexperiences/:link and returns data", async () => {
    const mockExp = { experienceTitle: "P&G", experienceLink: "pg-coop" };
    axios.get.mockResolvedValueOnce({ data: mockExp });
    const result = await fetchExperienceByLink("pg-coop");
    expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/getexperiences\/pg-coop$/));
    expect(result).toEqual(mockExp);
  });

  it("fetchExperienceByLink throws when axios rejects", async () => {
    axios.get.mockRejectedValueOnce(new Error("Not found"));
    await expect(fetchExperienceByLink("missing")).rejects.toThrow("Not found");
  });
});
