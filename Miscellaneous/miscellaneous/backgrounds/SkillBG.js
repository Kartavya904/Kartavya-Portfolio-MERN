import React, { useEffect, useRef } from "react";
import p5 from "p5";

const SkillBG = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let canvasElement = null;

    const sketch = (p) => {
      // Utility functions
      const deg = (a) => (Math.PI / 180) * a;
      const rand = (min, max) => Math.floor(min + Math.random() * (max - min));

      // Options for the particle system
      const opt = {
        particles: window.innerWidth > 500 ? 1000 : 500,
        noiseScale: 0.009,
        angle: deg(-90),
        h1: rand(0, 360),
        h2: rand(0, 360),
        s1: rand(20, 90),
        s2: rand(20, 90),
        l1: rand(30, 80),
        l2: rand(30, 80),
        strokeWeight: 1.7,
        tail: 82,
      };

      const particles = [];
      let time = 0;
      let bg; // p5.Graphics buffer for the gradient background

      // Function to draw the gradient on the bg graphics buffer
      const drawGradient = () => {
        bg.background(0, 0); // Clear the buffer
        let ctx = bg.drawingContext;
        const w = bg.width;
        const h = bg.height;
        // CSS linear-gradient(145deg, #212529, #181a1d) explanation:
        // In CSS, 0deg points up so 145deg means 55deg in standard math (0deg is right)
        const angle = p.radians(55);
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.sqrt(w * w + h * h) / 2;
        const x0 = cx - r * Math.cos(angle);
        const y0 = cy - r * Math.sin(angle);
        const x1 = cx + r * Math.cos(angle);
        const y1 = cy + r * Math.sin(angle);
        let gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        gradient.addColorStop(0, "#212529");
        gradient.addColorStop(1, "#181a1d");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      };

      // Particle class with improved variable naming and methods
      class Particle {
        constructor(x, y) {
          this.x = x;
          this.y = y;
          this.lx = x;
          this.ly = y;
          this.vx = 0;
          this.vy = 0;
          this.ax = 0;
          this.ay = 0;
          this.colorSeed = Math.random();
          this.hue = this.colorSeed > 0.5 ? 20 + opt.h1 : 20 + opt.h2;
          this.sat = this.colorSeed > 0.5 ? opt.s1 : opt.s2;
          this.light = this.colorSeed > 0.5 ? opt.l1 : opt.l2;
          this.maxSpeed = this.colorSeed > 0.5 ? 3 : 2;
        }

        randomize() {
          this.colorSeed = Math.random();
          this.hue = this.colorSeed > 0.5 ? 20 + opt.h1 : 20 + opt.h2;
          this.sat = this.colorSeed > 0.5 ? opt.s1 : opt.s2;
          this.light = this.colorSeed > 0.5 ? opt.l1 : opt.l2;
          this.maxSpeed = this.colorSeed > 0.5 ? 3 : 2;
        }

        update() {
          this.follow();

          this.vx += this.ax;
          this.vy += this.ay;

          const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
          const angle = Math.atan2(this.vy, this.vx);
          const m = Math.min(this.maxSpeed, speed);
          this.vx = Math.cos(angle) * m;
          this.vy = Math.sin(angle) * m;

          this.x += this.vx;
          this.y += this.vy;
          this.ax = 0;
          this.ay = 0;

          this.edges();
        }

        follow() {
          const angle =
            p.noise(
              this.x * opt.noiseScale,
              this.y * opt.noiseScale,
              time * opt.noiseScale
            ) *
              Math.PI *
              0.5 +
            opt.angle;
          this.ax += Math.cos(angle);
          this.ay += Math.sin(angle);
        }

        updatePrev() {
          this.lx = this.x;
          this.ly = this.y;
        }

        edges() {
          if (this.x < 0) {
            this.x = p.width;
            this.updatePrev();
          }
          if (this.x > p.width) {
            this.x = 0;
            this.updatePrev();
          }
          if (this.y < 0) {
            this.y = p.height;
            this.updatePrev();
          }
          if (this.y > p.height) {
            this.y = 0;
            this.updatePrev();
          }
        }

        render() {
          p.stroke(`hsla(${this.hue}, ${this.sat}%, ${this.light}%, 0.5)`);
          p.line(this.x, this.y, this.lx, this.ly);
          this.updatePrev();
        }
      }

      p.setup = () => {
        // Create canvas and store a reference to its element
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvasElement = canvas.canvas;
        p.strokeWeight(opt.strokeWeight);

        // Initialize the gradient background graphics buffer
        bg = p.createGraphics(p.width, p.height);
        drawGradient();

        // Initialize particles
        for (let i = 0; i < opt.particles; i++) {
          particles.push(
            new Particle(Math.random() * p.width, Math.random() * p.height)
          );
        }

        // Attach click event listener to document.body
        document.body.addEventListener("click", handleBodyClick);
      };

      p.draw = () => {
        time++;

        // Draw the gradient background with a trailing fade effect
        p.push();
        // Tint the gradient image with low alpha (18 out of 255) to simulate fading
        p.tint(255, 18);
        p.image(bg, 0, 0, p.width, p.height);
        p.pop();

        // Update and render particles
        for (let i = 0; i < particles.length; i++) {
          particles[i].update();
          particles[i].render();
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        bg.resizeCanvas(p.width, p.height);
        drawGradient();
      };

      // Handle clicks anywhere in the document
      const handleBodyClick = (e) => {
        if (!canvasElement) return;

        const rect = canvasElement.getBoundingClientRect();
        const isInsideCanvas =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (isInsideCanvas) {
          opt.h1 = rand(0, 360);
          opt.h2 = rand(0, 360);
          opt.s1 = rand(20, 90);
          opt.s2 = rand(20, 90);
          opt.l1 = rand(30, 80);
          opt.l2 = rand(30, 80);
          opt.angle += deg(Math.random() * 60) * (Math.random() > 0.5 ? 1 : -1);

          for (let i = 0; i < particles.length; i++) {
            particles[i].randomize();
          }
        }
      };

      // Custom cleanup function to remove the document.body event listener
      p.myCustomCleanup = () => {
        document.body.removeEventListener("click", handleBodyClick);
      };
    };

    const p5Instance = new p5(sketch, containerRef.current);
    return () => {
      if (p5Instance.myCustomCleanup) {
        p5Instance.myCustomCleanup();
      }
      p5Instance.remove();
    };
  }, []);

  return <div ref={containerRef} className="skill-bg-canvas" />;
};

export default SkillBG;
