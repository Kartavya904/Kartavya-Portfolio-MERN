/**
 * Unit tests for verifyJWT middleware (mocked jwt and request/reply).
 * jsonwebtoken is replaced by __mocks__/jsonwebtoken.js via jest.config moduleNameMapper.
 */
const jwt = require("jsonwebtoken");

// Load middleware (will use mocked jsonwebtoken)
const verifyJWT = require("../../backend/controllers/middlewareController");

describe("middlewareController verifyJWT", () => {
  let request;
  let reply;
  let sendMock;

  beforeEach(() => {
    sendMock = jest.fn();
    request = { cookies: {} };
    reply = {
      code: jest.fn(function (status) {
        this.statusCode = status;
        return this;
      }),
      send: sendMock,
    };
    reply.code(200);
    jwt.verify.mockReset();
  });

  it("sends 401 when no token in cookies", async () => {
    request.cookies = {};
    await verifyJWT(request, reply);
    expect(reply.code).toHaveBeenCalledWith(401);
    expect(sendMock).toHaveBeenCalledWith({ message: "No token provided" });
  });

  it("sends 403 when token is invalid", async () => {
    request.cookies = { token: "bad-token" };
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid");
    });
    await verifyJWT(request, reply);
    expect(reply.code).toHaveBeenCalledWith(403);
    expect(sendMock).toHaveBeenCalledWith({ message: "Failed to authenticate token" });
  });

  it("sets request.user and does not send when token is valid", async () => {
    request.cookies = { token: "valid-token" };
    const decoded = { user: "admin" };
    jwt.verify.mockReturnValue(decoded);
    await verifyJWT(request, reply);
    expect(request.user).toEqual(decoded);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
