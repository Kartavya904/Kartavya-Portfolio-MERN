/**
 * Unit tests for Links component.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Links from "./Links";

const stripMotion = (props) => {
  const {
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileTap,
    whileInView,
    drag,
    dragConstraints,
    dragElastic,
    dragTransition,
    style,
    ...rest
  } = props;
  return style ? { ...rest, style } : rest;
};
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: (props) => React.createElement("div", stripMotion(props), props.children),
      a: (props) => React.createElement("a", stripMotion(props), props.children),
      span: (props) => React.createElement("span", stripMotion(props), props.children),
    },
    AnimatePresence: (props) => React.createElement("div", null, props.children),
  };
});

jest.mock("@react-spring/web", () => ({
  animated: {
    img: (props) => <img {...props} />,
  },
}));

describe("Links", () => {
  beforeEach(() => {
    window.innerWidth = 1200;
    window.innerHeight = 900;
  });

  it("renders the Links button with title Links", () => {
    render(<Links isBatterySavingOn={false} isWindowModalVisible={false} />);
    const btn = document.querySelector(".link-btn");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("title", "Links");
  });

  it("opens menu and shows link labels when button is clicked", () => {
    render(<Links isBatterySavingOn={false} isWindowModalVisible={false} />);
    const btn = document.querySelector(".link-btn");
    fireEvent.click(btn);
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("hides button when isWindowModalVisible is true", () => {
    render(<Links isBatterySavingOn={false} isWindowModalVisible={true} />);
    const btn = document.querySelector(".link-btn");
    expect(btn).toHaveStyle({ display: "none" });
  });

  it("GitHub link has correct href", () => {
    render(<Links isBatterySavingOn={false} isWindowModalVisible={false} />);
    fireEvent.click(document.querySelector(".link-btn"));
    const githubLink = screen.getByText("GitHub").closest("a");
    expect(githubLink).toHaveAttribute("href", "https://github.com/Kartavya904");
    expect(githubLink).toHaveAttribute("target", "_blank");
  });
});
