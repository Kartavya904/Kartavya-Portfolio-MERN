import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { styled, keyframes } from "@stitches/react";
import { FaThumbsUp, FaRegThumbsUp } from "react-icons/fa";
import "../../styles/LikeButton.css";

// --- Animation Keyframes ---
// Define keyframes as an object.
const scaleUp = keyframes({
  "0%": { transform: "scale(1)" },
  "50%": { transform: "scale(1.3)" },
  "100%": { transform: "scale(1)" },
});

// --- Styled Components ---
// Base layer used for shadow, edge, etc.
const ButtonPart = styled("span", {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  borderRadius: "20px",
});

const ButtonShadow = styled(ButtonPart, {
  background: "rgba(0, 0, 0, 0.1)",
  transform: "translateY(2px)",
  transition: "transform 250ms ease-out",
});

const ButtonEdge = styled(ButtonPart, {
  background:
    "linear-gradient(to left, hsl(0deg 0% 69%) 0%, hsl(0deg 0% 85%) 8%, hsl(0deg 0% 85%) 92%, hsl(0deg 0% 69%) 100%)",
});

// The label that holds the icon.
const ButtonLabel = styled("span", {
  fontFamily: "Montserrat, sans-serif",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  borderRadius: "20px",
  color: "#212529",
  background: "#f8f9fa",
  width: "30px",
  height: "30px",
  transform: "translateY(-4px)",
  userSelect: "none",
  transition:
    "transform 250ms ease-out, background-color 0.3s ease, color 0.3s ease",
  "&:hover": {
    backgroundColor: "#fcbc1d",
    color: "#212529",
    transform: "scale(1.05)",
  },
});

// The outer button container with hover/active effects.
const StyledButton = styled("button", {
  border: "none",
  fontWeight: 600,
  width: "30px",
  height: "30px",
  cursor: "pointer",
  background: "transparent",
  position: "relative",
  padding: 0,
  borderRadius: "20px",
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

// IconWrapper applies the scale animation when liked using a variant.
const IconWrapper = styled("span", {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  variants: {
    liked: {
      true: {
        animation: `${scaleUp} 0.3s ease-out`,
      },
      false: {},
    },
  },
  defaultVariants: {
    liked: false,
  },
});

// --- Toast Component ---
// Renders a toast notification using a React Portal.
const Toast = ({ message, type }) => {
  return ReactDOM.createPortal(
    <div className={`toast-notification ${type === "error" ? "error" : ""}`}>
      {message}
    </div>,
    document.body,
  );
};

// --- LikeButton Component ---
// Props: 'type' and 'title' (used for the API call)
const LikeButton = ({ type, title, onLikeSuccess }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleLike = async () => {
    const storageKey = `liked_${title}`;

    if (localStorage.getItem(storageKey)) {
      setToast({ message: `Already Liked: ${title}`, type: "info" });
      setTimeout(() => {
        if (mountedRef.current) setToast(null);
      }, 3000);
      return;
    }

    setIsLiking(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URI}/addLike`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title }),
      });
      await response.json();
      if (mountedRef.current) setLiked(true);
      if (typeof onLikeSuccess === "function") {
        onLikeSuccess();
      }
      localStorage.setItem(storageKey, "true");
      if (mountedRef.current)
        setToast({ message: `Liked: ${title}`, type: "success" });
    } catch (error) {
      console.error("Error while adding like:", error);
      if (mountedRef.current)
        setToast({ message: `Error liking: ${title}`, type: "error" });
    } finally {
      if (mountedRef.current) setIsLiking(false);
      setTimeout(() => {
        if (mountedRef.current) setToast(null);
      }, 3000);
    }
  };

  useEffect(() => {
    const storageKey = `liked_${title}`;
    if (localStorage.getItem(storageKey)) {
      setLiked(true);
    }
  }, [title]);

  return (
    <>
      <StyledButton onClick={handleLike} disabled={isLiking}>
        <ButtonEdge />
        <ButtonShadow />
        <ButtonLabel>
          <IconWrapper liked={liked}>
            {liked ? <FaThumbsUp size={15} /> : <FaRegThumbsUp size={15} />}
          </IconWrapper>
        </ButtonLabel>
      </StyledButton>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
};

export default LikeButton;
