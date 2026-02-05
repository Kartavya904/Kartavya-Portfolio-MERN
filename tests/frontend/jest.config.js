/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/*.test.js"],
  testTimeout: 10000,
  verbose: true,
  // setupFilesAfterEnv: ["<rootDir>/setup.js"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/styleMock.js",
  },
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@testing-library)/)",
  ],
  moduleDirectories: ["node_modules", "<rootDir>/../../frontend/node_modules", "<rootDir>/node_modules"],
  testPathIgnorePatterns: ["/node_modules/", "/../../frontend/node_modules/"],
  rootDir: __dirname,
};
