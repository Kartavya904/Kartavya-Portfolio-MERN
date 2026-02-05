/**
 * Unit tests for projectService (mocked axios).
 */
jest.mock("axios", () => ({ get: jest.fn() }));
const axios = require("axios");
const { fetchProjects, fetchProjectByLink } = require("./projectService");

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore();
});

describe("projectService", () => {
  it("fetchProjects calls GET getprojects and returns data", async () => {
    const mockData = [{ projectTitle: "Test" }];
    axios.get.mockResolvedValueOnce({ data: mockData });
    const result = await fetchProjects();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/getprojects"));
    expect(result).toEqual(mockData);
  });

  it("fetchProjects throws when axios rejects", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));
    await expect(fetchProjects()).rejects.toThrow("Network error");
  });

  it("fetchProjectByLink calls GET getprojects/:link with encoded link", async () => {
    const mockProject = { projectTitle: "My Project", projectLink: "my-project" };
    axios.get.mockResolvedValueOnce({ data: mockProject });
    const result = await fetchProjectByLink("my-project");
    expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/getprojects\/my-project$/));
    expect(result).toEqual(mockProject);
  });

  it("fetchProjectByLink throws when axios rejects", async () => {
    axios.get.mockRejectedValueOnce(new Error("Not found"));
    await expect(fetchProjectByLink("missing")).rejects.toThrow("Not found");
  });
});
