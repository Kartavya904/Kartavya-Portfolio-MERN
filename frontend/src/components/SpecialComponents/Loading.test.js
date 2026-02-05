/**
 * Unit tests for Loading component.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import Loading from "./Loading";

const matchMediaMock = () => ({
  matches: false,
  media: "",
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

beforeAll(() => {
  window.matchMedia = window.matchMedia || jest.fn(matchMediaMock);
});
beforeEach(() => {
  window.matchMedia = jest.fn(matchMediaMock);
});

// Mock framer-motion (strip animation props so any motion.X renders as X)
const strip = (props) => {
  const { initial, animate, exit, transition, whileHover, whileTap, variants, ...rest } = props;
  return rest;
};
jest.mock("framer-motion", () => {
  const React = require("react");
  const create = (Tag) => (props) => React.createElement(Tag, strip(props), props.children);
  return {
    motion: {
      div: create("div"),
      h1: create("h1"),
      p: create("p"),
    },
  };
});

// Mock ping to avoid network
jest.mock("../../services/ping", () => ({
  pingBackend: jest.fn().mockResolvedValue(true),
  pingDatabase: jest.fn().mockResolvedValue(true),
}));

describe("Loading", () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
  });

  it("renders greeting text", () => {
    render(
      <Loading
        isBatterySavingOn={false}
        setIsBatterySavingOn={jest.fn()}
        onComplete={mockOnComplete}
      />
    );
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders Connecting to Backend or similar status", () => {
    render(
      <Loading
        isBatterySavingOn={false}
        setIsBatterySavingOn={jest.fn()}
        onComplete={mockOnComplete}
      />
    );
    const statusElements = screen.getAllByText(
      /Connecting to Backend|Connecting to Database|Loading Must-Load/i
    );
    expect(statusElements.length).toBeGreaterThan(0);
    expect(statusElements[0]).toBeInTheDocument();
  });
});
