let title = document.querySelector('.title');
let curs = document.querySelector('.cursor');

if (title && curs) {
  title.addEventListener('mouseenter', () => {
    curs.classList.add('cursor-scale');
    curs.style.mixBlendMode = 'difference';
  });
  title.addEventListener('mouseleave', () => {
    curs.classList.remove('cursor-scale');
    curs.style.mixBlendMode = 'exclusion'; // or 'normal'
  });
}
document.addEventListener('mousemove', (e) => {
  let x = e.pageX;
  let y = e.pageY;
  curs.style.left = (x - 22) + "px";
  curs.style.top = (y - 22) + "px";
});

document.addEventListener('mouseleave', (e) => {
  let x = e.pageX;
  let y = e.pageY;
  curs.style.left = (x - 22) + "px";
  curs.style.top = (y - 22) + "px";
});

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
  const trailFade = 0.2;
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
          const r = 64;
          const g = 224;
          const b = 208;
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

// --- Add this block at the end of script.js ---
const scrollBtn = document.getElementById('scroll-down-btn');
if (scrollBtn) {
  scrollBtn.addEventListener('click', function() {
    const nextSection = document.querySelector('section');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}
const arrowBtn = document.getElementById('scroll-down-btn');
const nav = document.querySelector('.nav-buttons');
const hero = document.querySelector('.hero');

function checkNavSticky() {
  if (!arrowBtn || !hero) return;
if (!nav || !arrowBtn) return;
  const navRect = nav.getBoundingClientRect();
  if (navRect.top <= 0) {
    arrowBtn.classList.add('flipped');
  } else {
    arrowBtn.classList.remove('flipped');
  }
}

window.addEventListener('scroll', checkNavSticky);
window.addEventListener('resize', checkNavSticky);
checkNavSticky();

if (arrowBtn) {
  arrowBtn.addEventListener('click', function() {
    if (arrowBtn.classList.contains('flipped')) {
      // Scroll to hero if arrow is flipped
      if (hero) {
        hero.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Scroll to next section if arrow is not flipped
      const nextSection = document.querySelector('section');
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
}
window.addEventListener('DOMContentLoaded', () => {
const bars = document.querySelectorAll('.skill-bar-fill');
bars.forEach(bar => {
  bar.style.width = '0px';
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const percent = bar.getAttribute('data-percent');
        bar.style.width = percent + '%';
        bar.classList.add('animated');
        observer.unobserve(bar); // only animate once
      }
    });
  },
  {
    threshold: 0.3, // fire when 30% visible
  }
);

document.querySelectorAll('.skill-bar-fill').forEach(bar => {
  bar.style.width = '0px'; // reset
  observer.observe(bar);
});

  window.addEventListener('scroll', animateSkills);
  window.addEventListener('load', animateSkills);
});

const scatteredProjects = [
  {
    name: "Metejoor",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80",
    link: "#",
    col: 1,
    row: 1,
    colSpan: 2,
    rowSpan: 2
  },
  {
    name: "IIII",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
    link: "#",
    col: 3,
    row: 1,
    colSpan: 2,
    rowSpan: 2
  },
  {
    name: "5napback",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    link: "#",
    col: 6,
    row: 1,
    colSpan: 2,
    rowSpan: 2
  },
  {
    name: "Red Veil",
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80",
    link: "#",
    col: 2,
    row: 4,
    colSpan: 2,
    rowSpan: 2
  },
  {
    name: "Silhouette",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80",
    link: "#",
    col: 5,
    row: 4,
    colSpan: 2,
    rowSpan: 2
  }
  // Add more projects and tweak col/row for randomness
];

function renderScatteredProjects() {
  const grid = document.getElementById('projects-grid-scatter');
  if (!grid) return;
  grid.innerHTML = scatteredProjects.map(project => `
    <a class="project-scatter-card"
      href="${project.link}"
      target="_blank"
      aria-label="View ${project.name}"
      style="
        grid-column: ${project.col} / span ${project.colSpan};
        grid-row: ${project.row} / span ${project.rowSpan};
      "
    >
      <div class="project-scatter-image">
        <img src="${project.image}" alt="${project.name}">
      </div>
      <div class="project-scatter-name">${project.name}</div>
    </a>
  `).join('');
}

window.addEventListener('DOMContentLoaded', renderScatteredProjects);