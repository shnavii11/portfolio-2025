// ─── Intro text — sliding lines (paragraph-transition style) ─────
(function animateIntro() {
  const lines = document.querySelectorAll('.intro-line');
  const total = lines.length;

  // Each line gets a unique phase so they slide at different offsets,
  // creating the cascading staircase motion from the reference.
  // Amplitude: how far each line travels px left/right.
  // Speed: oscillation frequency in radians/second.
  const amplitude = 38;
  const speed     = 0.38;

  function tick() {
    const t = performance.now() / 1000;
    lines.forEach((line, i) => {
      // Spread phases evenly across 2π so no two lines move in sync
      const phase = (i / total) * Math.PI * 2;
      const x = Math.sin(t * speed + phase) * amplitude;
      line.style.transform = `translateX(${x}px)`;
    });
    requestAnimationFrame(tick);
  }
  tick();
})();

// ─── Custom cursor ────────────────────────────────────────────────
const cursorRing = document.getElementById('cursorRing');
const cursorDot  = document.getElementById('cursorDot');

let mouseX = window.innerWidth  / 2;
let mouseY = window.innerHeight / 2;
let ringX  = mouseX;
let ringY  = mouseY;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top  = mouseY + 'px';
});

(function tickCursor() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(tickCursor);
})();

// ─── About panel ──────────────────────────────────────────────────
const aboutBtn      = document.getElementById('aboutBtn');
const aboutPanel    = document.getElementById('aboutPanel');
const panelClose    = document.getElementById('panelClose');
const panelBackdrop = document.getElementById('panelBackdrop');

function openPanel() {
  aboutPanel.classList.add('open');
  aboutPanel.setAttribute('aria-hidden', 'false');
  panelBackdrop.classList.add('active');
}

function closePanel() {
  aboutPanel.classList.remove('open');
  aboutPanel.setAttribute('aria-hidden', 'true');
  panelBackdrop.classList.remove('active');
}

aboutBtn.addEventListener('click', openPanel);
panelClose.addEventListener('click', closePanel);
panelBackdrop.addEventListener('click', closePanel);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

// ─── Lucide icons ─────────────────────────────────────────────────
lucide.createIcons();

// ─── p5.js canvas ─────────────────────────────────────────────────
const PALETTE = [
  [45,  58,  110],   // deep indigo
  [240, 180,  41],   // amber gold
  [232, 196, 160],   // warm blush
  [92,  140,  90],   // sage green
  [249, 228, 212],   // cream
  [212, 160, 181],   // dusty rose
];

new p5(p => {
  const orbs   = [];
  const bursts = [];
  const COUNT  = 100;

  class Orb {
    constructor(x, y, burst = false) {
      this.burst = burst;
      const c  = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      this.r   = c[0];  this.g = c[1];  this.b = c[2];
      this.x   = (x !== undefined) ? x : p.random(p.width);
      this.y   = (y !== undefined) ? y : p.random(p.height);
      this.sz  = burst ? p.random(3, 14)  : p.random(12, 58);
      this.vx  = p.random(-0.4, 0.4);
      this.vy  = p.random(-0.4, 0.4);
      this.a   = burst ? p.random(0.55, 0.85) : p.random(0.25, 0.55);
      this.life  = burst ? 1.0 : null;
      this.decay = burst ? p.random(0.009, 0.019) : null;
    }

    update() {
      if (this.burst) {
        this.life -= this.decay;
        this.x   += this.vx * 2.2;
        this.y   += this.vy * 2.2;
        return;
      }

      // Soft mouse repulsion
      const dx   = this.x - p.mouseX;
      const dy   = this.y - p.mouseY;
      const dist = Math.hypot(dx, dy);
      if (dist < 120 && dist > 1) {
        const f  = (120 - dist) / 120;
        this.vx += (dx / dist) * f * 0.055;
        this.vy += (dy / dist) * f * 0.055;
      }

      // Gentle drift
      this.vx = this.vx * 0.978 + p.random(-0.007, 0.007);
      this.vy = this.vy * 0.978 + p.random(-0.007, 0.007);
      this.vx = p.constrain(this.vx, -0.55, 0.55);
      this.vy = p.constrain(this.vy, -0.55, 0.55);

      this.x += this.vx;
      this.y += this.vy;

      // Wrap edges
      const pad = this.sz;
      if (this.x < -pad)           this.x = p.width  + pad;
      if (this.x > p.width  + pad) this.x = -pad;
      if (this.y < -pad)           this.y = p.height + pad;
      if (this.y > p.height + pad) this.y = -pad;
    }

    draw() {
      const alpha = this.burst ? this.a * this.life : this.a;
      p.noStroke();
      // Bokeh layers — concentric circles simulate soft glow
      p.fill(this.r, this.g, this.b, alpha * 255 * 0.06);
      p.circle(this.x, this.y, this.sz * 3.2);
      p.fill(this.r, this.g, this.b, alpha * 255 * 0.12);
      p.circle(this.x, this.y, this.sz * 2.1);
      p.fill(this.r, this.g, this.b, alpha * 255 * 0.32);
      p.circle(this.x, this.y, this.sz * 1.1);
      p.fill(this.r, this.g, this.b, alpha * 255 * 0.78);
      p.circle(this.x, this.y, this.sz * 0.45);
    }

    dead() { return this.burst && this.life <= 0; }
  }

  p.setup = () => {
    const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent('canvas-container');
    p.background(26, 35, 64);
    for (let i = 0; i < COUNT; i++) orbs.push(new Orb());
  };

  p.draw = () => {
    // Semi-transparent fill creates trailing motion blur
    p.fill(26, 35, 64, 18);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);

    orbs.forEach(o => { o.update(); o.draw(); });

    for (let i = bursts.length - 1; i >= 0; i--) {
      if (bursts[i].dead()) { bursts.splice(i, 1); continue; }
      bursts[i].update();
      bursts[i].draw();
    }
  };

  p.mousePressed = () => {
    if (aboutPanel.classList.contains('open')) return;
    const n = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      bursts.push(new Orb(p.mouseX, p.mouseY, true));
    }
  };

  p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
});
