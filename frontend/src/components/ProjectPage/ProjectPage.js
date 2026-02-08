import React, { useState, memo } from "react";
import { motion } from "framer-motion";
import { zoomIn } from "../../services/variants";
import { styled, keyframes } from "@stitches/react";
import "../../styles/ProjectPage.css";
import ProjectsListView from "./ProjectsListView";

function ProjectPage({
  addTab,
  isBatterySavingOn,
  isWindowModalVisible,
  initialProjectLink = null,
}) {
  const [showFeatured, setShowFeatured] = useState(false);
  return (
    <motion.section className="project-page-container" id="projects">
      <motion.div
        className="project-page-div"
        style={
          isWindowModalVisible
            ? { opacity: 0, transition: "opacity 0.5s ease-in-out" }
            : { opacity: 1, transition: "opacity 0.5s ease-in-out" }
        }
        variants={isBatterySavingOn ? {} : zoomIn(0)}
        initial="show"
        whileInView="show"
        exit="hidden"
        viewport={{ once: true }}
      >
        <ProjectsListView
          addTab={addTab}
          isBatterySavingOn={isBatterySavingOn}
          showFeatured={showFeatured}
          initialProjectLink={initialProjectLink}
        />
      </motion.div>
    </motion.section>
  );
}

export default memo(ProjectPage);

// Styled Components for Button Parts
const ButtonPart = styled("span", {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  borderRadius: 8,
});

const ButtonShadow = styled(ButtonPart, {
  background: "hsl(0deg 0% 0% / 0.1)",
  transform: "translateY(2px)",
  transition: "transform 250ms ease-out",
});

const ButtonEdge = styled(ButtonPart, {
  background: `linear-gradient(
      to left,
      hsl(0deg 0% 69%) 0%,
      hsl(0deg 0% 85%) 8%,
      hsl(0deg 0% 85%) 92%,
      hsl(0deg 0% 69%) 100%
    )`,
});

// Label inside the button, with conditional background based on isSent state
const ButtonLabel = styled("span", {
  fontFamily: "Montserrat",
  fontSize: "14px",
  display: "block",
  position: "relative",
  borderRadius: 5,
  color: "#212529",
  padding: "1.25rem 2.5rem",
  background: "#f8f9fa",
  transform: "translateY(-4px)",
  width: "100%",
  userSelect: "none",
  transition:
    "transform 250ms ease-out, background-color 0.3s ease, color 0.3s ease",
  "&:hover": {
    backgroundColor: "#fcbc1d",
    color: "#212529",
    transform: "scale(1.05)",
  },
});

// Main Styled Button
const StyledButton = styled("button", {
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
  background: "transparent",
  position: "relative",
  padding: 0,
  transition: "filter 250ms ease-out",

  "&:hover": {
    filter: "brightness(110%)",

    [`& ${ButtonLabel}`]: {
      transform: "translateY(-6px)",
    },

    [`& ${ButtonShadow}`]: {
      transform: "translateY(4px)",
    },
  },

  "&:active": {
    [`& ${ButtonLabel}`]: {
      transform: "translateY(-2px)",
      transition: "transform 34ms",
    },

    [`& ${ButtonShadow}`]: {
      transform: "translateY(1px)",
      transition: "transform 34ms",
    },
  },
});

export { StyledButton, ButtonLabel, ButtonShadow, ButtonEdge };
