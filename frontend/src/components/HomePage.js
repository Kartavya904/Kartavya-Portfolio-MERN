import React, { useState, useEffect, useRef } from 'react';
import { styled } from '@stitches/react';
import { TypeAnimation } from 'react-type-animation';
import { useSpring, animated } from '@react-spring/web';
import '../styles/HomePage.css';
import ProfilePhoto from '../assets/img/Kartavya.jpg';

function HomePage() {
  const [clicked, setClicked] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const clickCount = useRef(0); // Use useRef to keep track of click count across renders
  const [key, setKey] = useState(0); // State to reset the animation on click

  const keywords = [
    "Developing with Curiosity and Expertise | Always Learning & Innovating",
    "Innovating AI-Powered Solutions | Experienced Full Stack Developer"
  ];

  const { transform, boxShadow } = useSpring({
    transform: clicked ? 'scale(1.2) translateY(0px) rotate(2deg)' : 'scale(1) translateY(0px) rotate(0deg)',
    boxShadow: clicked ? '0px 15px 30px rgba(0, 0, 0, 0.3)' : '0px 8px 15px rgba(0, 0, 0, 0.1)',
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

  return (
    <section className="homepage-container" id="home">
      <div className="container">
        <div className="profile-picture-container">
          <animated.img
            id="profile-picture"
            src={ProfilePhoto}
            alt="Profile"
            className="img-responsive img-circle"
            draggable="false" 
            style={{ transform, boxShadow }}
            onMouseEnter={() => setClicked(true)}
            onMouseLeave={() => setClicked(false)}
            onClick={handleClick}
          />
        </div>
        <h1 className="name">Kartavya Singh</h1>
        
        {/* Changing Text Animation */}
        <div className="changing-text-container" onClick={() => setKey(prevKey => prevKey + 1)}>
          <em>
            <span className="changing-text">
              <TypeAnimation
                  key={key} // Forces the component to re-render on click
                  className="changing-text-animation"
                  sequence={[
                    ...keywords.map((text) => [text, 4000]), // Typing each keyword with a pause
                    keywords[keywords.length - 1], // Ensures the last phrase displays permanently
                  ].flat()}
                  speed={50} // Typing speed for smooth effect
                  deletionSpeed={50} // Faster deletion for a smoother experience
                  repeat={0} // No repeat
                  cursor={true}
              />
            </span>
          </em>
        </div>

        {/* Styled "Enter Portfolio" Button */}
        <StyledButton
          onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
        >
          <ButtonShadow />
          <ButtonEdge />
          <ButtonLabel>Enter Portfolio</ButtonLabel>
        </StyledButton>
      </div>
    </section>
  );
}

export default HomePage;

// Styled Components for Button
const ButtonPart = styled('span', {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  borderRadius: 8,
});

const ButtonShadow = styled(ButtonPart, {
  background: 'hsl(0deg 0% 0% / 0.1)',
  transform: 'translateY(2px)',
  transition: 'transform 250ms ease-out',
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

const ButtonLabel = styled('span', {
  fontFamily: 'Montserrat',
  fontSize: '18px',
  display: 'block',
  position: 'relative',
  borderRadius: 5,
  color: '#212529',
  padding: '1.25rem 2.5rem',
  background: '#f8f9fa',
  transform: 'translateY(-4px)',
  width: '100%',
  userSelect: 'none',
  transition: 'transform 250ms ease-out, background-color 0.3s ease, color 0.3s ease',

  '&:hover': {
    backgroundColor: '#fcbc1d',
    color: '#FFFFFF',
    transform: 'scale(1.05)',
  },
});

const StyledButton = styled('button', {
  border: 'none',
  fontWeight: 600,
  cursor: 'pointer',
  background: 'transparent',
  position: 'relative',
  padding: 0,
  transition: 'filter 250ms ease-out',

  '&:hover': {
    filter: 'brightness(110%)',

    [`& ${ButtonLabel}`]: {
      transform: 'translateY(-6px)',
    },

    [`& ${ButtonShadow}`]: {
      transform: 'translateY(4px)',
    },
  },

  '&:active': {
    [`& ${ButtonLabel}`]: {
      transform: 'translateY(-2px)',
      transition: 'transform 34ms',
    },

    [`& ${ButtonShadow}`]: {
      transform: 'translateY(1px)',
      transition: 'transform 34ms',
    },
  },
});
