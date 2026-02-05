/**
 * Unit tests for FeedTab component (axios and motion mocked).
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import FeedTab from "./FeedTab";

const stripMotion = (props) => {
  const {
    initial,
    animate,
    exit,
    transition,
    whileInView,
    whileHover,
    whileTap,
    drag,
    dragConstraints,
    dragElastic,
    dragTransition,
    ...rest
  } = props;
  return rest;
};

const mockFeeds = [
  {
    _id: { $oid: "abc123" },
    feedTitle: "Test Feed",
    feedCreatedAt: new Date().toISOString(),
    feedContent: ["Content"],
    likesCount: 0,
  },
];

jest.mock("axios", () => ({
  get: jest.fn(),
}));

jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: (props) => React.createElement("div", stripMotion(props), props.children),
      a: (props) => React.createElement("a", stripMotion(props), props.children),
    },
  };
});

jest.mock("@react-spring/web", () => ({
  animated: { img: (props) => <img {...props} alt={props.alt} /> },
}));

jest.mock("../SpecialComponents/LikeButton", () => {
  const React = require("react");
  return function LikeButton() {
    return React.createElement("div", { "data-testid": "like-button" });
  };
});

jest.mock("../../styles/FeedTab.css", () => ({}));

describe("FeedTab", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockFeeds });
  });

  it("renders title Kartavya's Feed", async () => {
    render(<FeedTab />);
    expect(screen.getByRole("heading", { name: /Kartavya's Feed/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Test Feed")).toBeInTheDocument());
  });

  it("renders feed tab description", async () => {
    render(<FeedTab />);
    expect(
      screen.getByText(/Welcome to your personalized Feed Tab/i)
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Test Feed")).toBeInTheDocument());
  });

  it("renders feed items after axios resolves", async () => {
    render(<FeedTab />);
    await waitFor(
      () => expect(screen.getByText("Test Feed")).toBeInTheDocument(),
      { timeout: 2000 }
    );
  });

  it("calls axios get with getFeeds URL", async () => {
    render(<FeedTab />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/getFeeds")
      );
    });
  });
});
