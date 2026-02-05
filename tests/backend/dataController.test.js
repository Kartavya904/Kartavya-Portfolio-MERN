/**
 * Unit tests for dataController (getDB mocked).
 * Mocks backend/config/mongodb so no real DB is used.
 * Fake timers prevent load-time setInterval/setTimeout from keeping Jest alive.
 */
jest.useFakeTimers();

const mockGetDB = jest.fn();
const safeDb = {
  collection: () => ({
    find: () => ({ toArray: () => Promise.resolve([]) }),
    findOne: () => Promise.resolve(null),
    updateOne: () => Promise.resolve({ modifiedCount: 0 }),
  }),
};

jest.mock("../../backend/config/mongodb", () => ({
  getDB: (...args) => mockGetDB(...args),
}));

// dataController has internal clearCacheForCollection; we cannot mock it without
// changing implementation. So we test only logoutAdmin (no DB) and addLike by
// mocking getDB to return a db with updateOne that succeeds.
const dataController = require("../../backend/controllers/dataController");

describe("dataController (unit)", () => {
  let reply;
  let sendMock;
  let codeMock;

  beforeAll(() => {
    mockGetDB.mockReturnValue(safeDb);
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterAll(() => {
    jest.useRealTimers();
    console.log.mockRestore?.();
    console.error.mockRestore?.();
  });
  beforeEach(() => {
    sendMock = jest.fn();
    codeMock = jest.fn(function (status) {
      this.statusCode = status;
      return this;
    });
    reply = {
      code: codeMock,
      send: sendMock,
    };
    mockGetDB.mockReturnValue(safeDb);
  });

  describe("logoutAdmin", () => {
    it("clears cookie and sends success message", () => {
      const clearCookieMock = jest.fn();
      reply.clearCookie = clearCookieMock;

      dataController.logoutAdmin({}, reply);

      expect(clearCookieMock).toHaveBeenCalledWith("token", {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      expect(sendMock).toHaveBeenCalledWith({
        success: true,
        message: "Logged out successfully!",
      });
    });
  });

  describe("addLike", () => {
    it("returns 400 when type is missing", async () => {
      await dataController.addLike(
        { body: { title: "Some Title" } },
        reply
      );
      expect(codeMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({
        message: "Both 'type' and 'title' are required.",
      });
    });

    it("returns 400 when title is missing", async () => {
      await dataController.addLike(
        { body: { type: "Project" } },
        reply
      );
      expect(codeMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({
        message: "Both 'type' and 'title' are required.",
      });
    });

    it("returns 400 for invalid type", async () => {
      await dataController.addLike(
        { body: { type: "InvalidType", title: "T" } },
        reply
      );
      expect(codeMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith({
        message: "Invalid type provided.",
      });
    });

    it("returns 200 and success when updateOne modifies one document", async () => {
      const updateOneMock = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      mockGetDB.mockReturnValue({
        collection: () => ({
          updateOne: updateOneMock,
        }),
      });

      await dataController.addLike(
        { body: { type: "Project", title: "Real Project Title" } },
        reply
      );

      expect(updateOneMock).toHaveBeenCalledWith(
        { projectTitle: "Real Project Title", deleted: { $ne: true } },
        { $inc: { likesCount: 1 } }
      );
      expect(sendMock).toHaveBeenCalledWith({
        success: true,
        message: "Like added successfully.",
      });
    });

    it("returns 404 when updateOne modifies zero documents", async () => {
      mockGetDB.mockReturnValue({
        collection: () => ({
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
        }),
      });

      await dataController.addLike(
        { body: { type: "Project", title: "Nonexistent" } },
        reply
      );

      expect(codeMock).toHaveBeenCalledWith(404);
      expect(sendMock).toHaveBeenCalledWith({
        message: "Document not found or cannot be updated.",
      });
    });
  });
});
