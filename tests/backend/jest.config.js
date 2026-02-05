/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/*.test.js"],
  testTimeout: 10000,
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/setup.js"],
  moduleNameMapper: {
    "^jsonwebtoken$": "<rootDir>/__mocks__/jsonwebtoken.js",
  },
};
