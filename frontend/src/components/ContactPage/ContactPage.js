import React, { useState, useRef, useEffect } from "react";
import { zoomIn, fadeIn } from "../../services/variants";
import { motion, AnimatePresence } from "framer-motion";
import { styled, keyframes } from "@stitches/react";
import Footer from "../SpecialComponents/Footer";
import emailjs from "@emailjs/browser";
import "../../styles/ContactPage.css";

function ContactPage({ isBatterySavingOn, addTab }) {
  const form = useRef();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isSent, setIsSent] = useState(null); // null for no status, true for success, false for error
  const containerRef = useRef(null);
  const sendEmail = (e) => {
    e.preventDefault();
    const formData = new FormData(form.current);
    const data = Object.fromEntries(formData.entries());

    // console.log("Form Data Object:", data); // Debug: Check the generated object

    // Log all key-value pairs
    // for (let [key, value] of formData.entries()) {
    //   console.log(`Name: ${key}, Value: ${value}`);
    // }
    // console.log(form.current.elements.from_name.value);
    // console.log(form.current.elements.from_email.value);
    // console.log(form.current.elements.from_phone.value);
    // console.log(form.current.elements.message.value);

    setTimeout(() => {
      emailjs
        .send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID,
          process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
          data,
          process.env.REACT_APP_EMAILJS_USER_ID
        )
        .then(
          (result) => {
            // console.log(result);
            setIsSent(true); // Set success status
            setTimeout(() => setIsSent(null), 3000); // Reset status after 2 seconds
          },
          (error) => {
            console.log(error.text);
            setIsSent(false); // Set error status
            setTimeout(() => setIsSent(null), 3000); // Reset status after 2 seconds
          }
        );

      e.target.reset(); // Clear the form fields after submission
    }, 200);

    e.target.reset();
  };

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const contactContainer = document.querySelector(".contact-container");
      if (!contactContainer) return;
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      let scaleValue = 1;
      if (screenHeight < 826 && screenWidth > 576) {
        scaleValue = screenHeight / 826;
      }
      contactContainer.style.zoom = `${scaleValue}`;
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <>
      <AnimatePresence>
        <motion.section
          id="contact"
          className="contact-page"
          ref={containerRef}
        >
          <div className="contact-container">
            <div className="contact-div">
              <motion.h2
                className="section-header"
                initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
                whileInView={isBatterySavingOn ? {} : { opacity: 1, scale: 1 }}
                transition={
                  isBatterySavingOn ? {} : { delay: 0, type: "spring" }
                }
              >
                Contact Me
              </motion.h2>
              <motion.h5
                className="contact-info"
                initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
                whileInView={isBatterySavingOn ? {} : { opacity: 1, scale: 1 }}
                transition={
                  isBatterySavingOn ? {} : { delay: 0, type: "spring" }
                }
              >
                Email:{" "}
                <a href="mailto:singhk6@mail.uc.edu" className="lead">
                  singhk6@mail.uc.edu
                </a>{" "}
                ||{" "}
                <a href="mailto:kartavya.singh17@yahoo.com" className="lead">
                  kartavya.singh17@yahoo.com
                </a>
              </motion.h5>
              <motion.h5
                className="contact-info"
                initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
                whileInView={isBatterySavingOn ? {} : { opacity: 1, scale: 1 }}
                transition={
                  isBatterySavingOn ? {} : { delay: 0, type: "spring" }
                }
              >
                Phone:{" "}
                <a href="tel:5138377683" className="lead">
                  513-837-7683
                </a>
              </motion.h5>
              <br />
              <motion.h5
                className="form-subheading"
                initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
                whileInView={isBatterySavingOn ? {} : { opacity: 1, scale: 1 }}
                transition={
                  isBatterySavingOn ? {} : { delay: 0, type: "spring" }
                }
              >
                ...or feel free to get in touch with me by filling the form.
              </motion.h5>
            </div>
            <motion.div className="contact-form-container">
              <form ref={form} onSubmit={sendEmail} className="contact-form">
                <motion.div
                  className="input-group"
                  variants={isBatterySavingOn ? {} : fadeIn("right", 200, 0)}
                  initial="hidden"
                  whileInView="show"
                >
                  <motion.input
                    type="text"
                    name="from_name"
                    placeholder="Your Name *"
                    required
                    initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
                    drag={isTouchDevice ? false : true}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.3}
                    dragTransition={{
                      bounceStiffness: 250,
                      bounceDamping: 15,
                    }}
                    whileInView={
                      isBatterySavingOn ? {} : { opacity: 1, scale: 1 }
                    }
                    whileHover={isBatterySavingOn ? {} : { scale: 1.01 }}
                    whileTap={isBatterySavingOn ? {} : { scale: 0.99 }}
                    transition={
                      isBatterySavingOn ? {} : { delay: 0, type: "spring" }
                    }
                  />
                  <motion.input
                    type="email"
                    name="from_email"
                    placeholder="Your Email *"
                    required
                    initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
                    drag={isTouchDevice ? false : true}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.3}
                    dragTransition={{
                      bounceStiffness: 250,
                      bounceDamping: 15,
                    }}
                    whileInView={
                      isBatterySavingOn ? {} : { opacity: 1, scale: 1 }
                    }
                    whileHover={isBatterySavingOn ? {} : { scale: 1.01 }}
                    whileTap={isBatterySavingOn ? {} : { scale: 0.99 }}
                    transition={
                      isBatterySavingOn ? {} : { delay: 0, type: "spring" }
                    }
                  />
                  <motion.input
                    type="tel"
                    name="from_phone"
                    placeholder="Your Phone"
                    initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
                    drag={isTouchDevice ? false : true}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.3}
                    dragTransition={{
                      bounceStiffness: 250,
                      bounceDamping: 15,
                    }}
                    whileInView={
                      isBatterySavingOn ? {} : { opacity: 1, scale: 1 }
                    }
                    whileHover={isBatterySavingOn ? {} : { scale: 1.01 }}
                    whileTap={isBatterySavingOn ? {} : { scale: 0.99 }}
                    transition={
                      isBatterySavingOn ? {} : { delay: 0, type: "spring" }
                    }
                  />
                </motion.div>
                <motion.div
                  className="textarea-group"
                  variants={isBatterySavingOn ? {} : fadeIn("left", 200, 0)}
                  whileHover={isBatterySavingOn ? {} : { scale: 1.01 }}
                  whileTap={isBatterySavingOn ? {} : { scale: 0.99 }}
                  initial="hidden"
                  whileInView="show"
                  exit="hidden"
                >
                  <motion.textarea
                    name="message"
                    placeholder="Your Message *"
                    required
                    initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
                    drag={isTouchDevice ? false : true}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.3}
                    dragTransition={{
                      bounceStiffness: 250,
                      bounceDamping: 15,
                    }}
                    whileInView={
                      isBatterySavingOn ? {} : { opacity: 1, scale: 1 }
                    }
                    whileHover={isBatterySavingOn ? {} : { scale: 1.01 }}
                    whileTap={isBatterySavingOn ? {} : { scale: 0.99 }}
                    transition={
                      isBatterySavingOn ? {} : { delay: 0, type: "spring" }
                    }
                  ></motion.textarea>
                </motion.div>
                <motion.div
                  className="button-group"
                  initial={isBatterySavingOn ? {} : { opacity: 0, scale: 0 }}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.3}
                  dragTransition={{
                    bounceStiffness: 250,
                    bounceDamping: 15,
                  }}
                  whileInView={
                    isBatterySavingOn ? {} : { opacity: 1, scale: 1 }
                  }
                  whileHover={isBatterySavingOn ? {} : { scale: 1.1 }}
                  whileTap={isBatterySavingOn ? {} : { scale: 0.9 }}
                  transition={
                    isBatterySavingOn ? {} : { delay: 0, type: "spring" }
                  }
                >
                  <StyledButton type="submit">
                    <ButtonShadow />
                    <ButtonEdge />
                    <ButtonLabel isSent={isSent}>
                      {isSent === true
                        ? "Message Sent ☑"
                        : isSent === false
                        ? "Failed to Send ☒"
                        : "Send Message"}
                    </ButtonLabel>
                  </StyledButton>
                </motion.div>
              </form>
            </motion.div>
          </div>
          <Footer isBatterySavingOn={isBatterySavingOn} addTab={addTab} />
        </motion.section>
      </AnimatePresence>
    </>
  );
}

export default ContactPage;

const fillGreen = keyframes({
  "0%": { backgroundColor: "#edeeef", color: "#212529" }, // Initial yellow color
  "50%": { backgroundColor: "lightseagreen", color: "#212529" }, // Success green with white text
  "100%": { backgroundColor: "#edeeef", color: "#212529" },
});

const fillRed = keyframes({
  "0%": { backgroundColor: "#edeeef", color: "#212529" }, // Initial yellow color
  "50%": { backgroundColor: "lightcoral", color: "#212529" }, // Error red with white text
  "100%": { backgroundColor: "#edeeef", color: "#212529" }, // Initial yellow color
});

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

  // Conditional animation based on isSent state
  variants: {
    isSent: {
      true: {
        animation: `${fillGreen}  3s ease-in-out forwards`, // Apply green fill on success
      },
      false: {
        animation: `${fillRed}  3s ease-in-out forwards`, // Apply red fill on error
      },
    },
  },

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
