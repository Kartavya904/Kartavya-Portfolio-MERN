import React from "react";
import { motion } from "framer-motion";
import { zoomIn, fadeIn } from "../../services/variants";
import { styled } from "@stitches/react";
import "../../styles/AboutPage.css";
import { SpotlightBG } from "./SpotlightBG";
import AboutImg from "../../assets/img/media/Kartavya-Profile-Photo.jpg";
import Resume from "../../assets/Singh_Kartavya_Resume2024.pdf";

const aboutData = [
  {
    icon: "bx bxs-hourglass about-icon",
    title: "Coding Hours",
    subtitle: "900+ Hours",
  },
  {
    icon: "bx bx-trophy about-icon",
    title: "Completed",
    subtitle: "42+ Projects",
  },
  {
    icon: "bx bx-support about-icon",
    title: "LeetCode",
    subtitle: "246+ Solutions",
  },
];

function AboutPage() {
  return (
    <section className="about-section-container" id="about">
      <SpotlightBG />
      <div className="about-div glass">
        <h2 className="section-title">ABOUT ME</h2>
        <div className="about-container grid">
          <img src={AboutImg} className="about-image" alt="Profile" />
          <div className="about-data">
            <div className="about-info grid">
              {aboutData.map((item, index) => (
                <motion.div
                  className="about-box"
                  whileHover={{ scale: 1.2 }}
                  key={index}
                >
                  <motion.i
                    className={item.icon}
                    variants={fadeIn(index * 0.2)} // Add slight stagger effect
                    initial="hidden"
                    animate="show"
                  ></motion.i>
                  <h3 className="about-title">{item.title}</h3>
                  <span className="about-subtitle">{item.subtitle}</span>
                </motion.div>
              ))}
            </div>
            <div className="about-box">
              <p className="about-description">
                I'm Kartavya Singh, a Computer Science student at the University
                of Cincinnati, passionate about creating impactful solutions
                with AI and experienced in Full Stack Development. My journey is
                driven by curiosity and a commitment to continuous learning
                through hackathons, personal projects, and real-world
                applications.
              </p>
            </div>
            <motion.div
              className="enter-button-motioned"
              variants={zoomIn(1)}
              initial="hidden"
              animate="show"
              drag="true"
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.3}
              dragTransition={{
                bounceStiffness: 250,
                bounceDamping: 15,
              }}
            >
              <motion.a
                href={Resume}
                download="Kartavya-Singh-Resume-2024.pdf"
                className="download-cv"
                drag="false"
              >
                <StyledButton>
                  <ButtonShadow />
                  <ButtonEdge />
                  <ButtonLabel>Download Resume</ButtonLabel>
                </StyledButton>
              </motion.a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutPage;

// Styled Components for Custom Button
const ButtonPart = styled("span", {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  borderRadius: 5,
});

const ButtonShadow = styled(ButtonPart, {
  background: "hsl(0deg 0% 0% / 0.1)",
  borderRadius: 5,
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
  borderRadius: 5,
});

const ButtonLabel = styled("span", {
  fontFamily: "Montserrat",
  fontSize: "18px",
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

const StyledButton = styled("button", {
  border: "none",
  fontWeight: 600,
  cursor: "pointer",
  borderRadius: 5,
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
