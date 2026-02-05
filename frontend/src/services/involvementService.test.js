/**
 * Unit tests for involvementService (mocked axios).
 */
jest.mock("axios", () => ({ get: jest.fn() }));
const axios = require("axios");
const { fetchInvolvements, fetchInvolvementByLink } = require("./involvementService");

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore();
});

describe("involvementService", () => {
  it("fetchInvolvements calls GET getinvolvements and returns data", async () => {
    const mockData = [{ involvementTitle: "MakeUC" }];
    axios.get.mockResolvedValueOnce({ data: mockData });
    const result = await fetchInvolvements();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/getinvolvements"));
    expect(result).toEqual(mockData);
  });

  it("fetchInvolvements throws when axios rejects", async () => {
    axios.get.mockRejectedValueOnce(new Error("Error"));
    await expect(fetchInvolvements()).rejects.toThrow("Error");
  });

  it("fetchInvolvementByLink calls GET getinvolvements/:link and returns data", async () => {
    const mockInv = { involvementTitle: "RevUC", involvementLink: "revuc" };
    axios.get.mockResolvedValueOnce({ data: mockInv });
    const result = await fetchInvolvementByLink("revuc");
    expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/getinvolvements\/revuc$/));
    expect(result).toEqual(mockInv);
  });
});
