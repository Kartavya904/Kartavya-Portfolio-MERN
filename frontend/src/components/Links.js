import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { zoomIn } from "../variants";
import "../styles/Links.css";

const Links = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const linksData = [
    {
      href: "https://github.com/Kartavya904",
      icon: require("../assets/img/icons/github.png"),
      label: "GitHub",
    },
    {
      href: "https://devpost.com/Kartavya904",
      icon: require("../assets/img/icons/devpost.png"),
      label: "DevPost",
    },
    {
      href: "https://www.linkedin.com/in/kartavya-singh-singhk6",
      icon: require("../assets/img/icons/linkedin.png"),
      label: "LinkedIn",
    },
    {
      href: "https://www.instagram.com/kartavya1710/",
      icon: require("../assets/img/icons/instagram.png"),
      label: "Instagram",
    },
    {
      href: "https://discordapp.com/users/439541365580365835",
      icon: require("../assets/img/icons/discord.png"),
      label: "Discord",
    },
    {
      href: "https://calendly.com/singhk6/book-time-with-kartavya",
      icon: require("../assets/img/icons/calender.png"),
      label: "Book Time with Kartavya",
    },
    {
      href: "mailto:singhk6@mail.uc.edu",
      icon: require("../assets/img/icons/email.png"),
      label: "Email",
    },
  ];

  const handleOutsideClick = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  const handleScroll = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      });
      window.addEventListener("scroll", handleScroll);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleScroll);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef}>
      {/* Parent Button */}
      <motion.div
        className={`link-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Links"
        variants={zoomIn(1)}
        initial="hidden"
        drag
        dragConstraints={{ left: 2, right: 2, top: 2, bottom: 2 }}
        animate="show"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9, rotate: 360 }}
        transition={{ duration: 1, type: "spring" }}
      >
        <img
          src={require("../assets/img/icons/links.png")}
          alt="Links"
          className="icon-img"
        />
      </motion.div>

      {/* Child Links */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="links-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {linksData.map((link, index) => (
              <motion.a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-item"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.5 }}
              >
                <motion.img
                  src={link.icon}
                  alt={link.label}
                  className="icon-img"
                />
                <motion.span
                  className="link-label"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {link.label}
                </motion.span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Links;