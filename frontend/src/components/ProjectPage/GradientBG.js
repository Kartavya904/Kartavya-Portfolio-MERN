import React, { useRef, useEffect, useState, useMemo } from "react";

/**
 * Helper to parse "r, g, b" or "r, g, b, a" strings into a numeric object { r, g, b, a }.
 */
function parseColorString(colorString) {
  const parts = colorString.split(",").map((val) => parseFloat(val.trim()));
  const [r, g, b, a = 1] = parts;
  return { r, g, b, a };
}

/**
 * Convert the color object { r, g, b, a } to a string "rgba(r, g, b, a)".
 */
function toRgbaString({ r, g, b, a }) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Darken a given color by subtracting a fixed amount from each channel.
 */
function darkenColor(color, amount) {
  let col = color;
  if (col.startsWith("rgb(") || col.startsWith("rgba(")) {
    col = col.replace(/rgba?\(/, "").replace(")", "");
  }
  const [r, g, b] = col.split(",").map((n) => parseInt(n.trim(), 10));
  const dr = Math.max(r - amount, 0);
  const dg = Math.max(g - amount, 0);
  const db = Math.max(b - amount, 0);
  return `rgb(${dr}, ${dg}, ${db})`;
}

/**
 * GradientBG component replicating the five moving radial gradients,
 * interactive pointer effect, parallax background, twinkle stars,
 * and chromatic glow effects.
 */
export default function GradientBG({
  gradientBackgroundStart = "rgb(108, 0, 162)",
  gradientBackgroundEnd = "rgb(0, 17, 82)",
  firstColor = "18, 113, 255",
  secondColor = "221, 74, 255",
  thirdColor = "100, 220, 255",
  fourthColor = "200, 50, 50",
  fifthColor = "180, 180, 50",
  pointerColor = "140, 100, 255",
  // Increase from "80%" → "120%"
  size = "160%",
  blendingValue = "hard-light",
  // Force interactive = true, as requested
  interactive = false,
  containerClassName = "",
  className = "",
}) {
  const canvasRef = useRef(null);

  // Track mouse position for interactive pointer effect.
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Convert "120%" (or any percentage) to a fraction for usage in canvas.
  const fractionSize = useMemo(() => {
    if (typeof size === "string" && size.includes("%")) {
      const val = parseFloat(size);
      return !isNaN(val) ? val / 100 : 0.8;
    }
    return 0.8;
  }, [size]);

  // Pre-generate random twinkle stars (they remain static, fading over time).
  const [twinkles] = useState(() => {
    const numStars = 50;
    const arr = [];
    for (let i = 0; i < numStars; i++) {
      arr.push({
        x: Math.random(),
        y: Math.random(),
        speed: 0.002 + Math.random() * 0.003, // fade speed
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  });

  // Cache darkened background colors.
  const darkenedStart = useMemo(
    () => darkenColor(gradientBackgroundStart, 20),
    [gradientBackgroundStart],
  );
  const darkenedEnd = useMemo(
    () => darkenColor(gradientBackgroundEnd, 20),
    [gradientBackgroundEnd],
  );

  // Define circle animations and properties.
  const circles = [
    // first: 30s → 22.5s
    { color: firstColor, anim: "vertical", durationMs: 22500 },
    // second: 20s → 15s
    { color: secondColor, anim: "circularReverse", durationMs: 15000 },
    // third: 40s → 30s
    { color: thirdColor, anim: "circular", durationMs: 30000 },
    // fourth: 40s → 30s
    { color: fourthColor, anim: "horizontal", durationMs: 30000 },
    // fifth: 20s → 15s
    { color: fifthColor, anim: "circular", durationMs: 15000 },
  ];

  // Utility: Check if a pointer is inside the canvas.
  const isPointerInsideCanvas = (x, y, canvas) => {
    const rect = canvas.getBoundingClientRect();
    return (
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    );
  };

  // Update mouse position on move if pointer is within the canvas.
  useEffect(() => {
    const handleMouse = (ev) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (isPointerInsideCanvas(ev.clientX, ev.clientY, canvas)) {
        setMousePos({ x: ev.clientX, y: ev.clientY });
      }
    };
    if (interactive) {
      window.addEventListener("mousemove", handleMouse);
    }
    return () => {
      if (interactive) {
        window.removeEventListener("mousemove", handleMouse);
      }
    };
  }, [interactive]);

  // Main animation loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let startTime = null;

    // Define computeGridPoints before it's used.
    const computeGridPoints = () => {
      // (Placeholder for further static grid computations if needed.)
    };

    // Resize canvas to fill the screen and precompute any static data.
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      computeGridPoints();
    };
    window.addEventListener("resize", resize);
    resize();

    const draw = (time) => {
      const now = time || 0;
      if (!startTime) startTime = now;
      const elapsed = now - startTime;

      // 1) Parallax background gradient based on mouse position.
      const parallaxX = (mousePos.x / window.innerWidth - 0.5) * 0.2;
      const parallaxY = (mousePos.y / window.innerHeight - 0.5) * 0.2;
      const shiftX = canvas.width * 0.5 * parallaxX;
      const shiftY = canvas.height * 0.5 * parallaxY;
      const bgGrad = ctx.createLinearGradient(
        0 - shiftX,
        0 - shiftY,
        canvas.width + shiftX,
        canvas.height + shiftY,
      );
      bgGrad.addColorStop(0, darkenedStart);
      bgGrad.addColorStop(1, darkenedEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2) Draw twinkle stars.
      twinkles.forEach((star) => {
        star.phase += star.speed;
        const alpha = Math.abs(Math.sin(star.phase));
        const tx = star.x * canvas.width;
        const ty = star.y * canvas.height;
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(tx, ty, 1.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      });

      ctx.save();
      ctx.globalCompositeOperation = blendingValue;
      const minDim = Math.min(canvas.width, canvas.height);
      const radius = fractionSize * minDim * 0.5;

      // 3) Draw moving radial gradient circles.
      circles.forEach((circle) => {
        const { r, g, b } = parseColorString(circle.color);
        let cx = canvas.width / 2;
        let cy = canvas.height / 2;
        const progress = (elapsed % circle.durationMs) / circle.durationMs;
        const angle = progress * 2 * Math.PI;
        switch (circle.anim) {
          case "vertical": {
            const offset = Math.sin(angle) * (canvas.height * 0.25);
            cy = canvas.height / 2 + offset;
            break;
          }
          case "horizontal": {
            const offset = Math.sin(angle) * (canvas.width * 0.25);
            cx = canvas.width / 2 + offset;
            break;
          }
          case "circular": {
            const offsetX = Math.cos(angle) * (canvas.width * 0.25);
            const offsetY = Math.sin(angle) * (canvas.height * 0.25);
            cx = canvas.width / 2 + offsetX;
            cy = canvas.height / 2 + offsetY;
            break;
          }
          case "circularReverse": {
            const offsetX = -Math.cos(angle) * (canvas.width * 0.25);
            const offsetY = -Math.sin(angle) * (canvas.height * 0.25);
            cx = canvas.width / 2 + offsetX;
            cy = canvas.height / 2 + offsetY;
            break;
          }
          default:
            break;
        }
        const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        radGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
        radGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.0)`);
        ctx.fillStyle = radGrad;
        ctx.save();
        ctx.filter = "blur(40px)";
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();

      // 4) If interactive, draw a pointer circle.
      if (interactive) {
        ctx.save();
        ctx.globalCompositeOperation = blendingValue;
        ctx.filter = "blur(40px)";
        const { r, g, b } = parseColorString(pointerColor);
        const pointerRad = minDim * 0.3;
        const pointerGrad = ctx.createRadialGradient(
          mousePos.x,
          mousePos.y,
          0,
          mousePos.x,
          mousePos.y,
          pointerRad,
        );
        pointerGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
        pointerGrad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = pointerGrad;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, pointerRad, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }

      // Request next animation frame.
      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    gradientBackgroundStart,
    gradientBackgroundEnd,
    firstColor,
    secondColor,
    thirdColor,
    fourthColor,
    fifthColor,
    pointerColor,
    blendingValue,
    fractionSize,
    interactive,
    twinkles,
    mousePos,
    darkenedStart,
    darkenedEnd,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        zIndex: -1,
        transform: "translateZ(0)", // Hardware acceleration hint
        willChange: "transform",
      }}
    />
  );
}
