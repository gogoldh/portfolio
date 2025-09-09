const c = document.querySelector('#c');
const ctx = c.getContext('2d');

const dpr = Math.min(2, window.devicePixelRatio);
c.style.imageRendering = 'pixelated';
c.style.width = '100vw';
c.style.height = '100vh';

const setup = () => {
  c.width = window.innerWidth * dpr;
  c.height = window.innerHeight * dpr;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, c.width, c.height);
};

setup();

const centerX = c.width / 2;
const centerY = c.height / 2;

const points = [];
const spacing = 40;
const size = 5;

const createPoint = (x, y, i) => {
  return {
    px: x,
    py: y,
    x,
    y,
    magnitude: 20 + Math.random() * 40,
    phase: Math.random() * Math.PI * 2,
    offsetX: Math.random() * 2 - 1,
    offsetY: Math.random() * 2 - 1,
    index: i
  };
};

// Create points with random distribution, but less dense in the middle
let i = 0;
const radius = 200;  // Controls the maximum radius of the distribution
for (let j = 0; j < 150; j++) { // Generate a set number of points
  const angle = Math.random() * Math.PI * 2;

  // Generate a random distance from the center, but reduce density near the middle
  const distance = Math.sqrt(Math.random()) * radius; // Reduce density near the center

  const x = centerX + Math.cos(angle) * distance;
  const y = centerY + Math.sin(angle) * distance;

  points.push(createPoint(x, y, i++));
}

let mouse = { x: -9999, y: -9999 };

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX * dpr;
  mouse.y = e.clientY * dpr;
});

const animate = (time) => {
  requestAnimationFrame(animate);

  // 🌀 Trail effect
  const trailFade = 0.06;
  ctx.fillStyle = `rgba(0, 0, 0, ${trailFade})`;
  ctx.fillRect(0, 0, c.width, c.height);

  const t = time / 1000;

  points.forEach((p) => {
    p.x = p.px + Math.cos(p.index + t + p.phase) * p.magnitude * p.offsetX;
    p.y = p.py + Math.sin(p.index + t + p.phase) * p.magnitude * p.offsetY;
  });

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p1 = points[i];
      const p2 = points[j];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

      if (dist < spacing * 2.2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const mouseDist = Math.hypot(midX - mouse.x, midY - mouse.y);

        const baseGray = 80 + Math.sin((p1.index + t) * 0.5) * 40;
        let strokeColor = `rgb(${baseGray}, ${baseGray}, ${baseGray})`;

        const hoverRange = 60; // Smaller radius
        if (mouseDist < hoverRange) {
          const intensity = 1 - mouseDist / hoverRange;
          const r = 100;
          const g = 80;
          const b = 130;
          const a = 0.4 + 0.6 * intensity;
          strokeColor = `rgba(${r}, ${g}, ${b}, ${a})`;
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 0.3;
        ctx.stroke();
      }
    }
  }
};

window.addEventListener('resize', () => {
  setup();
});

requestAnimationFrame(animate);