/**
 * Unit tests for honorsExperienceService (mocked axios).
 */
jest.mock("axios", () => ({ get: jest.fn() }));
const axios = require("axios");
const {
  fetchHonorsExperiences,
  fetchHonorsExperienceByLink,
} = require("./honorsExperienceService");

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore();
});

describe("honorsExperienceService", () => {
  it("fetchHonorsExperiences calls GET gethonorsexperiences and returns data", async () => {
    const mockData = [{ honorsExperienceTitle: "Award" }];
    axios.get.mockResolvedValueOnce({ data: mockData });
    const result = await fetchHonorsExperiences();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/gethonorsexperiences"));
    expect(result).toEqual(mockData);
  });

  it("fetchHonorsExperiences throws when axios rejects", async () => {
    axios.get.mockRejectedValueOnce(new Error("Error"));
    await expect(fetchHonorsExperiences()).rejects.toThrow("Error");
  });

  it("fetchHonorsExperienceByLink calls GET gethonorsexperiences/:link", async () => {
    const mockHonors = { honorsExperienceTitle: "COOP 1000", honorsExperienceLink: "coop1000" };
    axios.get.mockResolvedValueOnce({ data: mockHonors });
    const result = await fetchHonorsExperienceByLink("coop1000");
    expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/gethonorsexperiences\/coop1000$/));
    expect(result).toEqual(mockHonors);
  });
});
