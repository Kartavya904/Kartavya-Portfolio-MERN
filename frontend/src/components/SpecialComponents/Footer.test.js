/**
 * Unit tests for Footer component.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Footer from "./Footer";

// Strip all framer-motion / animation props so they are not passed to DOM (prevents React warnings)
const stripMotion = (props) => {
  const {
    initial,
    animate,
    exit,
    transition,
    whileInView,
    whileHover,
    whileTap,
    onTap,
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
  const tags = ["footer", "div", "ul", "li", "button", "a", "img"];
  const motion = {};
  tags.forEach((tag) => {
    motion[tag] = (props) =>
      React.createElement(tag, stripMotion(props), props.children);
  });
  return { motion };
});

describe("Footer", () => {
  const mockAddTab = jest.fn();

  beforeEach(() => {
    mockAddTab.mockClear();
  });

  it("renders Kartavya Singh heading", () => {
    render(<Footer isBatterySavingOn={false} addTab={mockAddTab} />);
    expect(screen.getByRole("heading", { name: /Kartavya Singh/i })).toBeInTheDocument();
  });

  it("renders tagline Creating Impactful Solutions Through Code", () => {
    render(<Footer isBatterySavingOn={false} addTab={mockAddTab} />);
    expect(screen.getByText(/Creating Impactful Solutions Through Code/i)).toBeInTheDocument();
  });

  it("renders nav links About, Skills, Projects, Experience", () => {
    render(<Footer isBatterySavingOn={false} addTab={mockAddTab} />);
    expect(screen.getByRole("button", { name: /About/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Skills/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Projects/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Experience/i })).toBeInTheDocument();
  });

  it("renders Admin button", () => {
    render(<Footer isBatterySavingOn={false} addTab={mockAddTab} />);
    expect(screen.getByRole("button", { name: /Admin/i })).toBeInTheDocument();
  });

  it("calls addTab with Admin when Admin button clicked", () => {
    render(<Footer isBatterySavingOn={false} addTab={mockAddTab} />);
    fireEvent.click(screen.getByRole("button", { name: /Admin/i }));
    expect(mockAddTab).toHaveBeenCalledWith("Admin", { adminTitle: "Admin Page" });
  });

  it("renders copyright with current year", () => {
    render(<Footer isBatterySavingOn={false} addTab={mockAddTab} />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${year} Kartavya Singh`))).toBeInTheDocument();
  });
});
