import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { zoomIn, fadeIn } from "../../services/variants";
import icons from "../../services/icons";
import Glide from "@glidejs/glide";
import { fetchSkills } from "../../services/skillService";
import "@glidejs/glide/dist/css/glide.core.min.css";
import "@glidejs/glide/dist/css/glide.theme.min.css";
import "../../styles/SkillSection.css";
import LeftArrow from "../../assets/img/icons/arrow1.svg";
import RightArrow from "../../assets/img/icons/arrow2.svg";

const CustomLeftArrow = ({ onClick }) => (
  <button className="custom-arrow custom-left-arrow" onClick={onClick}>
    <img src={LeftArrow} alt="Left Arrow" />
  </button>
);

const CustomRightArrow = ({ onClick }) => (
  <button className="custom-arrow custom-right-arrow" onClick={onClick}>
    <img src={RightArrow} alt="Right Arrow" />
  </button>
);

const PauseTimer = ({
  autoplay,
  setAutoplay,
  countdown,
  setCountdown,
  glideRef,
}) => {
  const [isSmallWidth, setIsSmallWidth] = useState(window.innerWidth <= 768);
  const [isVisible, setIsVisible] = useState(isSmallWidth ? true : false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallWidth(window.innerWidth <= 768);
    };

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    let startTime = performance.now();
    let interval;
    let hoverTimeout;
    let isHovered = false;

    const handleHover = () => {
      setIsVisible(true); // Show PauseTimer
      glideRef.current.pause(); // Pause Glide autoplay
      setCountdown(5.0); // Reset countdown to 5.00
      isHovered = true;

      // Clear auto-hide timeout if already running
      if (hoverTimeout) clearTimeout(hoverTimeout);

      // Set auto-hide timeout for 7 seconds
      hoverTimeout = setTimeout(() => {
        setIsVisible(false); // Hide PauseTimer
        isHovered = false;
        glideRef.current.play(); // Resume Glide autoplay
      }, 11000);
    };

    const handleUnhover = () => {
      isHovered = false;
      glideRef.current.play(); // Resume Glide autoplay
      startTime = performance.now(); // Reset start time
    };

    const glideElement = document.querySelector(".glide");

    if (autoplay) {
      glideElement.addEventListener("mouseenter", handleHover);
      glideElement.addEventListener("mouseleave", handleUnhover);

      interval = setInterval(() => {
        if (isHovered) {
          setCountdown(4.0); // Keep countdown at 5.00
        } else {
          const elapsed = performance.now() - startTime;
          const remaining = Math.max(4 - elapsed / 1000, 0);
          setCountdown(remaining.toFixed(1)); // Update countdown

          if (remaining <= 0) {
            startTime = performance.now(); // Reset start time
          }
        }
      }, 100);
    }

    return () => {
      clearInterval(interval); // Cleanup interval
      clearTimeout(hoverTimeout); // Cleanup timeout
      glideElement.removeEventListener("mouseenter", handleHover);
      glideElement.removeEventListener("mouseleave", handleUnhover);
    };
  }, [autoplay, glideRef, setCountdown]);

  return (
    <motion.div
      className="pause-timer"
      initial={{ scale: 0, opacity: 0 }}
      animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      whileHover={{ scale: 0.99, opacity: 1 }}
      whileTap={{ scale: 1.01, opacity: 0.5 }}
      onClick={() => setAutoplay((prev) => !prev)}
      drag={false}
      dragConstraints
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <button className="pause-button" style={{ opacity: 0.7 }}>
        {autoplay ? "||" : "▶"}
      </button>
      <span className="countdown" style={{ opacity: 0.7 }}>
        {countdown}s
      </span>
    </motion.div>
  );
};

const proficiencyColor = {
  proficient: "rgba(201, 176, 55, 0.6)", // Medium dark gold color
  intermediate: "rgba(176, 176, 176, 0.6)", // Medium dark silver color
  beginner: "rgba(169, 113, 66, 0.6)", // Medium dark bronze color
  default: "rgba(176, 176, 176, 0.6)", // Default to medium dark silver
};

const SkillSection = ({ isBatterySavingOn }) => {
  const glideRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMediumWidth, setIsMediumWidth] = useState(
    window.innerWidth <= 992 && window.innerWidth > 768,
  );
  const [autoplay, setAutoplay] = useState(true); // Autoplay state
  const [countdown, setCountdown] = useState(4); // Countdown timer
  const [isSmallWidth, setIsSmallWidth] = useState(window.innerWidth <= 768);
  const [skillCategories, setSkillCategories] = useState([]);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const fetchedSkills = await fetchSkills();
        setSkillCategories(fetchedSkills);
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    };

    loadSkills();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMediumWidth(window.innerWidth <= 992 && window.innerWidth > 768);
      setIsSmallWidth(window.innerWidth <= 768);
    };

    // Add resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleLeftArrowClick = () => {
    glideRef.current?.go("<");
  };

  const handleRightArrowClick = () => {
    glideRef.current?.go(">");
  };

  useEffect(() => {
    if (skillCategories.length === 0) return; // Wait until data is loaded

    const glideElement = document.querySelector(".glide");
    if (!glideElement) return;

    glideRef.current = new Glide(".glide", {
      type: "carousel",
      startAt: 0,
      perView: 1,
      gap: 0,
      autoplay: autoplay ? 4000 : false,
      peek: isMediumWidth ? 50 : isSmallWidth ? 0 : 100,
      responsive: true,
      rewind: true,
    });

    glideRef.current.mount();

    return () => glideRef.current.destroy();
  }, [skillCategories, autoplay, isMediumWidth, isSmallWidth]);

  return (
    <>
      <div>
        <PauseTimer
          autoplay={autoplay}
          setAutoplay={setAutoplay}
          countdown={countdown}
          setCountdown={setCountdown}
          glideRef={glideRef}
        />
        <motion.div
          className="proficiency-table"
          initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
          animate={isBatterySavingOn ? {} : { opacity: 1, scale: 1 }}
          exit={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
          transition={isBatterySavingOn ? {} : { ease: "easeInOut", delay: 2 }}
        >
          <p className="proficient">Proficient</p>
          <p className="intermediate">Intermediate</p>
          <p className="beginner">Beginner</p>
        </motion.div>
      </div>
      <div className="skill-carousel">
        <div className="glide">
          <div className="glide__track" data-glide-el="track">
            <ul className="glide__slides">
              {skillCategories.map((category) => (
                <li className="glide__slide" key={`${category.title}-${1}`}>
                  <motion.div
                    className="skill-card"
                    viewport={{ amount: "all" }}
                  >
                    <motion.h2
                      className="skill-card-title"
                      variants={isBatterySavingOn ? {} : zoomIn(0.1)}
                      initial="hidden"
                      whileInView="show"
                      exit="hidden"
                    >
                      {category.title}
                    </motion.h2>
                    <motion.p
                      className="skill-card-description"
                      variants={isBatterySavingOn ? {} : zoomIn(0.1)}
                      initial="hidden"
                      whileInView="show"
                      exit="hidden"
                    >
                      {category.description}
                    </motion.p>
                    <div
                      className="skill-items"
                      style={
                        {
                          // gap: `${95 / category.skills.length}%`,
                        }
                      }
                    >
                      {category.skills.map((skill, skillIndex) => (
                        <motion.div
                          key={`${category.title}-${skillIndex}`}
                          className="skill-item"
                          variants={
                            isBatterySavingOn ? {} : zoomIn(skillIndex * 0.075)
                          } // Add consistent stagger effect
                          initial="hidden"
                          whileInView="show"
                          exit="hidden"
                        >
                          <motion.img
                            src={icons[skill.logo]}
                            alt=""
                            className={`skill-card-icon`}
                            style={{
                              boxShadow: `0 0 ${
                                window.innerWidth > 768 ? 7.5 : 2.5
                              }px ${
                                proficiencyColor[skill.proficiency] ||
                                proficiencyColor.default
                              }, 
                0 0 ${window.innerWidth > 768 ? 12.5 : 5}px ${
                  proficiencyColor[skill.proficiency] ||
                  proficiencyColor.default
                }`,
                            }}
                            variants={
                              isBatterySavingOn
                                ? {}
                                : fadeIn(
                                    "right",
                                    50, // Reduced size for a more subtle animation
                                    skillIndex * 0.075, // Stagger delay for each skill
                                    0.4, // Shorter duration for smoother animations
                                  )
                            }
                            initial="hidden"
                            whileInView="show"
                            exit="hidden"
                            animate={{
                              boxShadow: [
                                `0 0 ${window.innerWidth > 768 ? 7.5 : 2.5}px ${
                                  proficiencyColor[skill.proficiency] ||
                                  proficiencyColor.default
                                }`,
                                `0 0 ${window.innerWidth > 768 ? 12.5 : 5}px ${
                                  proficiencyColor[skill.proficiency] ||
                                  proficiencyColor.default
                                }`,
                                `0 0 ${window.innerWidth > 768 ? 7.5 : 2.5}px ${
                                  proficiencyColor[skill.proficiency] ||
                                  proficiencyColor.default
                                }`,
                              ],
                              transition: {
                                duration: 1, // Duration for the boxShadow animation
                                repeat: Infinity,
                                ease: "easeInOut",
                              },
                            }}
                          />

                          <motion.span
                            className={`skill-card-name ${skill.proficiency}`}
                            variants={
                              isBatterySavingOn
                                ? {}
                                : fadeIn(
                                    "left",
                                    50, // Reduced size for a more subtle animation
                                    skillIndex * 0.075, // Match stagger delay
                                    0.4, // Match duration for consistent animations
                                  )
                            }
                            initial="hidden"
                            whileInView="show"
                            exit="hidden"
                          >
                            {skill.name}
                          </motion.span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </li>
              ))}
            </ul>
          </div>
          <div className="glide__arrows">
            <CustomLeftArrow onClick={handleLeftArrowClick} />
            <CustomRightArrow onClick={handleRightArrowClick} />
          </div>
        </div>
      </div>
    </>
  );
};

export default SkillSection;
