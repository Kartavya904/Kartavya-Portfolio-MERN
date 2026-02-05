/**
 * Unit tests for yearInReviewService (mocked axios).
 */
jest.mock("axios", () => ({ get: jest.fn() }));
const axios = require("axios");
const {
  fetchYearInReviews,
  fetchYearInReviewByLink,
} = require("./yearInReviewService");

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore();
});

describe("yearInReviewService", () => {
  it("fetchYearInReviews calls GET getyearinreviews and returns data", async () => {
    const mockData = [{ yearInReviewTitle: "2023-2024" }];
    axios.get.mockResolvedValueOnce({ data: mockData });
    const result = await fetchYearInReviews();
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/getyearinreviews"));
    expect(result).toEqual(mockData);
  });

  it("fetchYearInReviews throws when axios rejects", async () => {
    axios.get.mockRejectedValueOnce(new Error("Error"));
    await expect(fetchYearInReviews()).rejects.toThrow("Error");
  });

  it("fetchYearInReviewByLink calls GET getyearinreviews/:link", async () => {
    const mockYIR = { yearInReviewTitle: "2023-24", yearInReviewLink: "2023-24" };
    axios.get.mockResolvedValueOnce({ data: mockYIR });
    const result = await fetchYearInReviewByLink("2023-24");
    expect(axios.get).toHaveBeenCalledWith(expect.stringMatching(/\/getyearinreviews\/2023-24$/));
    expect(result).toEqual(mockYIR);
  });
});
