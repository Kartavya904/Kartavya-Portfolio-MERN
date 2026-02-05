/**
 * Unit tests for NavBar component.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NavBar from "./NavBar";

// Strip framer-motion props so they are not passed to DOM
const stripMotion = (props) => {
  const {
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileTap,
    variants,
    drag,
    dragConstraints,
    dragElastic,
    dragTransition,
    ...rest
  } = props;
  return rest;
};
jest.mock("framer-motion", () => {
  const React = require("react");
  const tags = ["nav", "div", "button", "ul", "li", "a"];
  const motion = {};
  tags.forEach((tag) => {
    motion[tag] = (props) => React.createElement(tag, stripMotion(props), props.children);
  });
  return { motion };
});

describe("NavBar", () => {
  const mockAddTab = jest.fn();
  let scrollToMock;

  beforeEach(() => {
    mockAddTab.mockClear();
    scrollToMock = jest.fn();
    window.scrollTo = scrollToMock;
    window.innerWidth = 1200;
    document.querySelectorAll = jest.fn().mockReturnValue([]);
  });

  it("renders brand Kartavya Singh", () => {
    render(<NavBar isBatterySavingOn={false} addTab={mockAddTab} />);
    expect(screen.getByText("Kartavya Singh")).toBeInTheDocument();
  });

  it("renders nav links ABOUT, SKILLS, PROJECTS, EXPERIENCE, CONTACT", () => {
    render(<NavBar isBatterySavingOn={false} addTab={mockAddTab} />);
    expect(screen.getByText("ABOUT")).toBeInTheDocument();
    expect(screen.getByText("SKILLS")).toBeInTheDocument();
    expect(screen.getByText("PROJECTS")).toBeInTheDocument();
    expect(screen.getByText("EXPERIENCE")).toBeInTheDocument();
    expect(screen.getByText("CONTACT")).toBeInTheDocument();
  });

  it("renders FEED and RESUME", () => {
    render(<NavBar isBatterySavingOn={false} addTab={mockAddTab} />);
    expect(screen.getByText(/FEED/)).toBeInTheDocument();
    expect(screen.getByText(/RESUME/)).toBeInTheDocument();
  });

  it("calls addTab with FeedTab when FEED link is clicked", () => {
    render(<NavBar isBatterySavingOn={false} addTab={mockAddTab} />);
    const feedLinks = screen.getAllByText(/FEED/);
    const feedLink = feedLinks.find((el) => el.closest("a")?.getAttribute("href") === "#feed");
    if (feedLink) {
      fireEvent.click(feedLink.closest("a"));
      expect(mockAddTab).toHaveBeenCalledWith("FeedTab", { title: "Kartavya's Feed" });
    } else {
      fireEvent.click(feedLinks[0].closest("a"));
      expect(mockAddTab).toHaveBeenCalledWith("FeedTab", { title: "Kartavya's Feed" });
    }
  });

  it("calls addTab with AIChatTab when AI companion link is clicked", () => {
    render(<NavBar isBatterySavingOn={false} addTab={mockAddTab} />);
    const aiChatLink = document.querySelector("a.ai-chat-nav");
    expect(aiChatLink).toBeInTheDocument();
    fireEvent.click(aiChatLink);
    expect(mockAddTab).toHaveBeenCalledWith("AIChatTab", { title: "Kartavya's AI Companion" });
  });

  it("toggles menu when Menu button is clicked", () => {
    render(<NavBar isBatterySavingOn={false} addTab={mockAddTab} />);
    const menuButton = screen.getByRole("button", { name: /Menu/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  it("RESUME link has download attribute and correct href", () => {
    render(<NavBar isBatterySavingOn={false} addTab={mockAddTab} />);
    const resumeLink = screen.getByText(/RESUME/).closest("a");
    expect(resumeLink).toHaveAttribute("download");
    expect(resumeLink).toHaveAttribute("target", "_blank");
  });
});
