import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { zoomIn } from "../../services/variants";
import LeftArrow from "../../assets/img/icons/arrow1.svg";
import RightArrow from "../../assets/img/icons/arrow2.svg";
import LikeButton from "../SpecialComponents/LikeButton";
import { fetchInvolvements } from "../../services/involvementService";
import { styled } from "@stitches/react";

// ---------------- Slide Variants & Transition ----------------
const slideVariants = {
  hidden: { opacity: 0, scale: 0.6, x: 0, rotateY: 0, z: -400, zIndex: 7 },
  prev: { opacity: 0.8, scale: 0.8, x: -160, rotateY: 15, z: -200, zIndex: 9 },
  next: { opacity: 0.8, scale: 0.8, x: 160, rotateY: -15, z: -200, zIndex: 9 },
  active: { opacity: 1, scale: 1, x: 0, rotateY: 0, z: 0, zIndex: 10 },
};
const slideTransition = {
  duration: 0.8,
  ease: "easeInOut",
  zIndex: { duration: 0 },
};

// ---------------- Utility Function ----------------
const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (element) {
    const offset = 52;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - offset;
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};

// ---------------- Custom Arrow Component ----------------
const CustomArrow = ({ direction, onClick, imgSrc, label }) => {
  const handleClick = () => {
    if (onClick) onClick();
    scrollToSection("experience");
  };
  return (
    <button
      className={`custom-arrow custom-${direction}-arrow`}
      onClick={handleClick}
      aria-label={label}
    >
      <img src={imgSrc} alt={`${label} Arrow`} />
    </button>
  );
};

// ---------------- InvolvementTabPage Component ----------------
const InvolvementTabPage = ({ addTab, isBatterySavingOn }) => {
  const [involvements, setInvolvements] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const getInvolvements = async () => {
      try {
        const data = await fetchInvolvements();
        setInvolvements([...data.reverse()]);
      } catch (error) {
        console.error("Error fetching involvements:", error);
      }
    };
    getInvolvements();
  }, []);

  // Navigation functions
  const nextSlide = () =>
    setActiveSlide((prev) => (prev + 1) % involvements.length);
  const prevSlide = () =>
    setActiveSlide(
      (prev) => (prev - 1 + involvements.length) % involvements.length
    );

  const n = involvements.length;
  const prevIndex = (activeSlide - 1 + n) % n;
  const nextIndex = (activeSlide + 1) % n;
  const visibleIndices =
    n === 0
      ? []
      : n === 1
      ? [0]
      : n === 2
      ? [activeSlide, nextIndex]
      : [prevIndex, activeSlide, nextIndex];

  // Advanced swipe detection using swipe power (offset * velocity)
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offsetX, velocityX) => Math.abs(offsetX) * velocityX;
  const handleDragEnd = (event, info) => {
    const swipe = swipePower(info.offset.x, info.velocity.x);
    if (swipe < -swipeConfidenceThreshold) {
      nextSlide();
    } else if (swipe > swipeConfidenceThreshold) {
      prevSlide();
    }
  };

  return (
    <motion.div
      className="career-tab-page"
      variants={isBatterySavingOn ? {} : zoomIn(0)}
      initial="hidden"
      whileInView="show"
      exit="hidden"
      viewport={{ once: true }}
    >
      <h1 className="career-tab-header">My Involvements</h1>
      <div className="career-tabs-slider">
        {/* Slide container with advanced swipe support */}
        <motion.div
          className="slide-container"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence initial={false}>
            {visibleIndices.map((index) => {
              const involvement = involvements[index];
              const variant =
                index === activeSlide
                  ? "active"
                  : index === prevIndex
                  ? "prev"
                  : index === nextIndex
                  ? "next"
                  : "hidden";
              return (
                <motion.div
                  key={index}
                  className="slide"
                  variants={slideVariants}
                  initial="hidden"
                  animate={variant}
                  exit="hidden"
                  transition={slideTransition}
                >
                  <div className="slider-content">
                    {/* Like Button positioned at top-right */}
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        zIndex: 100,
                      }}
                    >
                      <LikeButton
                        type="Involvement"
                        title={involvement.involvementTitle}
                        onLikeSuccess={() =>
                          setInvolvements((prev) =>
                            prev.map((i) =>
                              i.involvementTitle ===
                              involvement.involvementTitle
                                ? { ...i, likesCount: (i.likesCount || 0) + 1 }
                                : i
                            )
                          )
                        }
                      />
                    </div>
                    <div className="career-container">
                      <div className="career-image">
                        <img
                          src={involvement.involvementImages[0]}
                          alt=""
                          className="career-image-content"
                          loading="lazy"
                        />
                      </div>
                      <div className="career-details">
                        <h2 className="career-title">
                          {involvement.involvementTitle}
                        </h2>
                        <div className="career-subtitle-area">
                          <h4 className="career-subtitle">
                            {involvement.involvementSubTitle &&
                            involvement.involvementSubTitle !== "NA"
                              ? involvement.involvementSubTitle
                              : null}
                          </h4>
                          <p className="career-timeline">
                            {involvement.involvementTimeline &&
                            involvement.involvementTimeline !== "NA"
                              ? involvement.involvementTimeline
                              : null}
                          </p>
                        </div>
                        <p className="career-tagline">
                          {involvement.involvementTagline &&
                          involvement.involvementTagline !== "NA"
                            ? involvement.involvementTagline
                            : null}
                        </p>
                        <motion.div
                          className="career-learn-button-motioned"
                          onClick={() => addTab("Involvement", involvement)}
                          variants={zoomIn(0)}
                          initial="hidden"
                          animate="show"
                          drag
                          dragConstraints={{
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                          }}
                          dragElastic={0.3}
                          dragTransition={{
                            bounceStiffness: 250,
                            bounceDamping: 15,
                          }}
                        >
                          <StyledButton onClick={(e) => e.preventDefault()}>
                            <ButtonShadow />
                            <ButtonEdge />
                            <ButtonLabel>Learn More →</ButtonLabel>
                          </StyledButton>
                        </motion.div>
                      </div>
                    </div>
                    {/* Display likes count at bottom-right if available */}
                    {involvement.likesCount > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "27.5px",
                          right: "10px",
                          color: "#edeeef",
                          fontSize: "0.8em",
                          zIndex: 150,
                        }}
                      >
                        Likes: {involvement.likesCount}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
        <div className="btns">
          <CustomArrow
            direction="left"
            onClick={prevSlide}
            imgSrc={LeftArrow}
            label="Previous"
          />
          <CustomArrow
            direction="right"
            onClick={nextSlide}
            imgSrc={RightArrow}
            label="Next"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default InvolvementTabPage;

// ---------------- Styled Components for "Learn More →" Button ----------------
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
  fontSize: "14px",
  display: "block",
  position: "relative",
  borderRadius: 5,
  color: "#212529",
  padding: "1rem 1.5rem",
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
  width: "fit-content",
  cursor: "pointer",
  background: "transparent",
  position: "relative",
  padding: 0,
  transition: "filter 250ms ease-out",
  "&:hover": {
    filter: "brightness(110%)",
    [`& ${ButtonLabel}`]: { transform: "translateY(-8px)" },
    [`& ${ButtonShadow}`]: { transform: "translateY(6px)" },
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
