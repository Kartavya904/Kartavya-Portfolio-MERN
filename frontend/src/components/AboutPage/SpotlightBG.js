import React, { useEffect, useRef, useState } from "react";

export const SpotlightBG = () => {
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -100, y: -100 });
  const paintedHexagons = useRef([]); // Stores painted hexagons with timestamps
  const breathingProgress = useRef(0); // Breathing animation progress (0 to 1)
  const direction = useRef(1); // 1 for expanding, -1 for contracting
  const breathingSpeed = 0.005; // Breathing animation speed
  const gridPointsRef = useRef([]); // Precomputed hexagon grid points

  // Track total clicks using useState and mirror to a ref for use inside the canvas render loop.
  const [clickCount, setClickCount] = useState(0);
  const clickCountRef = useRef(clickCount);
  useEffect(() => {
    clickCountRef.current = clickCount;
  }, [clickCount]);

  // Global gradient stops
  const gradientStops = [
    { offset: 0, color: [255, 111, 97] }, // Coral
    { offset: 0.2, color: [244, 208, 63] }, // Yellow
    { offset: 0.4, color: [142, 68, 173] }, // Purple
    { offset: 0.6, color: [26, 188, 156] }, // Aqua
    { offset: 0.8, color: [52, 152, 219] }, // Blue
    { offset: 1, color: [255, 111, 97] }, // Loop back to Coral
  ];

  // Compute global gradient color at normalized position t with the given opacity.
  const getGlobalGradientColor = (t, opacity) => {
    t = Math.min(Math.max(t, 0), 1);
    let startStop, endStop;
    for (let i = 0; i < gradientStops.length - 1; i++) {
      if (t >= gradientStops[i].offset && t <= gradientStops[i + 1].offset) {
        startStop = gradientStops[i];
        endStop = gradientStops[i + 1];
        break;
      }
    }
    if (!startStop || !endStop) {
      const col = gradientStops[gradientStops.length - 1].color;
      return `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${opacity})`;
    }
    const range = endStop.offset - startStop.offset;
    const localT = range === 0 ? 0 : (t - startStop.offset) / range;
    const r = Math.round(
      startStop.color[0] + localT * (endStop.color[0] - startStop.color[0]),
    );
    const g = Math.round(
      startStop.color[1] + localT * (endStop.color[1] - startStop.color[1]),
    );
    const b = Math.round(
      startStop.color[2] + localT * (endStop.color[2] - startStop.color[2]),
    );
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    const hexSize = 30; // Hexagon size
    const lightRadius = 100; // Radius of light effect around the cursor
    const clickRadius = 50; // Radius for click painting effect

    // Precompute grid points and their normalized gradient parameter (t)
    const computeGridPoints = () => {
      const points = [];
      const cols = Math.ceil(canvas.width / (hexSize * 1.5));
      const rows = Math.ceil(canvas.height / (hexSize * Math.sqrt(3)));
      const denom = canvas.width * canvas.width + canvas.height * canvas.height;
      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
          const x = col * hexSize * 1.5;
          const y =
            row * hexSize * Math.sqrt(3) +
            (col % 2 === 0 ? 0 : (hexSize * Math.sqrt(3)) / 2);
          const t = (x * canvas.width + y * canvas.height) / denom;
          points.push({ x, y, t });
        }
      }
      gridPointsRef.current = points;
    };

    // Resize canvas and recompute grid points.
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      computeGridPoints();
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Precompute a Path2D for a hexagon centered at (0,0).
    const hexagonPath = new Path2D();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const xOffset = hexSize * Math.cos(angle);
      const yOffset = hexSize * Math.sin(angle);
      if (i === 0) hexagonPath.moveTo(xOffset, yOffset);
      else hexagonPath.lineTo(xOffset, yOffset);
    }
    hexagonPath.closePath();

    // Draw a hexagon at (x, y) with the color sampled from the global gradient using t.
    // If the hexagon is painted, fill it; otherwise, draw only the stroke.
    const drawHexagon = (x, y, t, opacity, isPainted) => {
      ctx.save();
      ctx.translate(x, y);
      if (isPainted) {
        ctx.fillStyle = getGlobalGradientColor(t, 0.7);
        ctx.fill(hexagonPath);
        ctx.strokeStyle = "#212529";
      } else {
        ctx.strokeStyle = getGlobalGradientColor(t, opacity);
        ctx.lineWidth = opacity > 0 ? 2 : 1;
      }
      ctx.stroke(hexagonPath);
      ctx.restore();
    };

    // Draw a dark background.
    const drawBackground = () => {
      ctx.fillStyle = "#212529";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Draw the grid of hexagons.
    const drawGrid = () => {
      const now = Date.now();
      paintedHexagons.current = paintedHexagons.current.filter(
        (hex) => now - hex.timestamp < 2000,
      );
      gridPointsRef.current.forEach(({ x, y, t }) => {
        const dx = x - mouse.current.x;
        const dy = y - mouse.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let opacity =
          distance <= lightRadius ? 1 - distance / lightRadius : 0.075;
        const animationLine = canvas.height * breathingProgress.current;
        if (y <= animationLine) opacity += 0.15;
        opacity = Math.min(Math.max(opacity, 0), 1);
        const isPainted = paintedHexagons.current.some(
          (hex) => hex.x === x && hex.y === y,
        );
        drawHexagon(x, y, t, opacity, isPainted);
      });
    };

    // Draw the instruction text. It fades in/out subtly and is removed after 5 clicks.
    const drawInstructionText = () => {
      if (clickCountRef.current >= 3) return;
      const time = Date.now();
      const textAlpha = 0.4 + 0.4 * Math.sin(time / 500);
      ctx.save();
      ctx.font = "12px Montserrat, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
      ctx.textBaseline = "top";
      ctx.fillText("Click anywhere to interact", canvas.width / 2, 52);
      ctx.restore();
    };

    const render = () => {
      drawBackground();
      drawGrid();
      !isTouchDevice && drawInstructionText();
      breathingProgress.current += breathingSpeed * direction.current;
      if (breathingProgress.current >= 1 || breathingProgress.current <= 0)
        direction.current *= -1;
      animationFrameId = requestAnimationFrame(render);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const insideCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (insideCanvas) {
        mouse.current.x = e.clientX - rect.left;
        mouse.current.y = e.clientY - rect.top;
      } else {
        mouse.current.x = -100;
        mouse.current.y = -100;
      }
    };

    const handleMouseClick = (e) => {
      if (isTouchDevice) return;
      const rect = canvas.getBoundingClientRect();
      const insideCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (insideCanvas) {
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        gridPointsRef.current.forEach(({ x, y }) => {
          const dx = x - clickX;
          const dy = y - clickY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= clickRadius) {
            paintedHexagons.current.push({ x, y, timestamp: Date.now() });
          }
        });
        setClickCount((prev) => prev + 1);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    if (!isTouchDevice) {
      window.addEventListener("click", handleMouseClick);
    }
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      if (!isTouchDevice) {
        window.removeEventListener("click", handleMouseClick);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      // style={{
      //   position: "absolute",
      //   top: 0,
      //   left: 0,
      //   width: "100%",
      //   height: "100%",
      //   zIndex: -1,
      // }}

      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        zIndex: 0,
        transform: "translateZ(0)", // Hardware acceleration hint
        willChange: "transform",
      }}
    />
  );
};
