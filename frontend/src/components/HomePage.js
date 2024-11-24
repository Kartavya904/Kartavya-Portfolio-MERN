import React, { useState, useEffect, useRef } from "react";
import { styled } from "@stitches/react";
import { TypeAnimation } from "react-type-animation";
import { Parallax } from "react-parallax";
import { useSpring, animated } from "@react-spring/web";
import { motion } from "framer-motion";
import { zoomIn } from "../variants";
import "../styles/HomePage.css";
import ProfilePhotoHover from "../assets/img/media/Kartavya.jpg";
import ProfilePhoto from "../assets/img/media/KartavyaSketch.jpg";
import HomeBG from "../assets/img/background/home-bg.jpg";

function HomePage() {
  const [clicked, setClicked] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // Hover state
  const [isCooldown, setIsCooldown] = useState(false);
  const clickCount = useRef(0); // Use useRef to keep track of click count across renders
  const [key, setKey] = useState(0); // State to reset the animation on click
  const [frameIndex, setFrameIndex] = useState(0); // Track current frame index
  const frames = ["", " frame1", " frame2", " frame3"]; // Define frame styles

  const handleProfileClick = () => {
    setFrameIndex((prevIndex) => (prevIndex + 1) % frames.length); // Cycle frames
  };

  const keywords = [
    "Developing with Curiosity and Expertise | Always Learning & Innovating",
    "Innovating AI-Powered Solutions | Experienced Full Stack Developer",
  ];

  const { transform, boxShadow } = useSpring({
    transform: clicked
      ? "scale(1.4) translateY(0px) rotate(2deg)"
      : "scale(1) translateY(0px) rotate(0deg)",
    boxShadow: clicked
      ? "0px 15px 30px rgba(0, 0, 0, 0.3)"
      : "0px 8px 15px rgba(0, 0, 0, 0.1)",
    config: { duration: 100, tension: 300, friction: 10 },
    onRest: () => setClicked(false),
  });

  const handleClick = () => {
    if (isCooldown) return; // Prevent clicks during cooldown

    setClicked(true); // Trigger animation
    clickCount.current += 1;

    if (clickCount.current >= 5) {
      setIsCooldown(true);
      clickCount.current = 0; // Reset click count after reaching the limit

      // End cooldown after 2 seconds
      setTimeout(() => {
        setIsCooldown(false);
      }, 1000);
    }
  };

  // Effect to reset click count if no further clicks are registered within 5 seconds
  useEffect(() => {
    if (clickCount.current > 0 && !isCooldown) {
      const resetTimeout = setTimeout(() => {
        clickCount.current = 0;
      }, 5000);

      return () => clearTimeout(resetTimeout); // Clean up timeout
    }
  }, [isCooldown]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    const offset = 52; // Adjust based on your navbar height
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  };

  return (
    <Parallax
      strength={0}
      blur={{ min: -15, max: 15 }}
      // bgClassName="home-background"
      bgImage={HomeBG}
    >
      <section className="homepage-container" id="home">
        <div className="container">
          <motion.div
            className={`profile-picture-container`}
            variants={zoomIn(1)}
            initial="hidden"
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.3}
            dragTransition={{
              bounceStiffness: 250,
              bounceDamping: 15,
            }}
            whileInView={"show"}
            viewport={{ once: false, amount: 0.7 }}
          >
            <animated.img
              src={ProfilePhoto} // Use hover state
              alt="Profile"
              className={`profile-picture normal-img  ${
                isHovered ? "hidden" : "visible"
              }${frames[frameIndex]}`}
              draggable="false"
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              style={{ transform, boxShadow }}
              onMouseEnter={() => {
                // setClicked(true);
                setIsHovered(true);
              }}
              onMouseLeave={() => {
                // setClicked(false);
                setIsHovered(false);
              }}
              onClick={() => {
                handleClick();
                handleProfileClick();
              }}
            />
            <animated.img
              src={ProfilePhotoHover} // Use hover state
              alt="Profile"
              className={`profile-picture hover-img  ${
                isHovered ? "visible" : "hidden"
              }${frames[frameIndex]}`}
              draggable="false"
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              style={{ transform, boxShadow }}
              onMouseEnter={() => {
                // setClicked(true);
                setIsHovered(true);
              }}
              onMouseLeave={() => {
                // setClicked(false);
                setIsHovered(false);
              }}
              onClick={() => {
                handleClick();
                handleProfileClick();
              }}
            />
          </motion.div>
          <motion.h1
            className="name"
            variants={zoomIn(1)}
            initial="hidden"
            animate="show"
          >
            Kartavya Singh
          </motion.h1>

          {/* Changing Text Animation */}
          <motion.div
            className="changing-text-container"
            onClick={() => setKey((prevKey) => prevKey + 1)}
            variants={zoomIn(1)}
            initial="hidden"
            animate="show"
          >
            <em>
              <span className="changing-text">
                <TypeAnimation
                  key={key} // Forces the component to re-render on click
                  className="changing-text-animation"
                  sequence={[
                    1500,
                    ...keywords.map((text) => [text, 4000]), // Typing each keyword with a pause
                    keywords[keywords.length - 1], // Ensures the last phrase displays permanently
                  ].flat()}
                  speed={50} // Typing speed for smooth effect
                  deletionSpeed={50} // Faster deletion for a smoother experience
                  delay={1000}
                  repeat={0} // No repeat
                  cursor={true}
                />
              </span>
            </em>
          </motion.div>

          {/* Styled "Enter Portfolio" Button */}
          <motion.div
            className="enter-button-motioned"
            variants={zoomIn(1)}
            initial="hidden"
            animate="show"
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.3}
            dragTransition={{
              bounceStiffness: 250,
              bounceDamping: 15,
            }}
          >
            <StyledButton
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("about");
              }}
            >
              <ButtonShadow />
              <ButtonEdge />
              <ButtonLabel>Enter Portfolio</ButtonLabel>
            </StyledButton>
          </motion.div>
        </div>
      </section>
    </Parallax>
  );
}

export default HomePage;

// Styled Components for Button
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
  background: "transparent",
  position: "relative",
  padding: 0,
  transition: "filter 250ms ease-out",

  "&:hover": {
    filter: "brightness(110%)",

    [`& ${ButtonLabel}`]: {
      transform: "translateY(-8px)",
    },

    [`& ${ButtonShadow}`]: {
      transform: "translateY(6px)",
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
