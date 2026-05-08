// ─── Intro text — Three.js word tile blocks ───────────────────────
(function initIntro() {
  document.fonts.ready.then(() => {
    const cvs = document.getElementById('intro-canvas');

    const renderer = new THREE.WebGLRenderer({ canvas: cvs, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 9;

    const group = new THREE.Group();
    scene.add(group);

    // Text split into lines — each word becomes its own 3D tile mesh
    const LINES = [
      "Hi! I'm Vaishnavi —",
      "I like tech,",
      "I like painting,",
      "and I like whimsical",
      "photography."
    ];

    // Per-line colour palette (bg for canvas texture, side for box edges)
    const LINE_PAL = [
      { bg: 'rgba(212,160,181,0.18)', side: 0xc490a8 },
      { bg: 'rgba(249,228,212,0.13)', side: 0xd4a882 },
      { bg: 'rgba(92,140,90,0.14)',   side: 0x6aaa68 },
      { bg: 'rgba(240,180,41,0.12)',  side: 0xc8960a },
      { bg: 'rgba(45,58,110,0.22)',   side: 0x7788bb },
    ];

    const FPX  = 58;    // font size in canvas pixels
    const TH   = 0.60;  // tile height in Three.js units
    const TD   = 0.08;  // tile depth — visible edge when tilted
    const WGAP = 0.04;  // gap between words
    const LGAP = 0.07;  // gap between lines

    function makeWordMesh(word, li) {
      const col = LINE_PAL[li % LINE_PAL.length];
      const tc  = document.createElement('canvas');
      const ctx = tc.getContext('2d');
      const fnt = `400 ${FPX}px 'Cormorant Garamond', Georgia, serif`;

      // Measure then size the canvas
      ctx.font = fnt;
      const tw = Math.ceil(ctx.measureText(word).width) + 28;
      const th = FPX + 22;
      tc.width  = tw;
      tc.height = th;

      // Tile background
      ctx.fillStyle = col.bg;
      ctx.fillRect(0, 0, tw, th);

      // Thin gold top stripe
      ctx.fillStyle = 'rgba(240,180,41,0.45)';
      ctx.fillRect(0, 0, tw, 2);

      // Word text
      ctx.font = fnt;
      ctx.fillStyle = 'rgba(249,228,212,0.93)';
      ctx.textBaseline = 'middle';
      ctx.fillText(word, 14, th / 2);

      const tex   = new THREE.CanvasTexture(tc);
      const tileW = TH * (tw / th);

      const geo     = new THREE.BoxGeometry(tileW, TH, TD);
      const sideMat = new THREE.MeshBasicMaterial({ color: col.side, transparent: true, opacity: 0.45 });
      const faceMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });

      // Face order: right, left, top, bottom, front, back
      const mesh = new THREE.Mesh(geo, [sideMat, sideMat, sideMat, sideMat, faceMat, sideMat]);
      return { mesh, tileW };
    }

    // Build meshes grouped by line
    const lineGroups = LINES.map((lineText, li) => {
      const words = lineText.split(' ').filter(Boolean);
      const tiles = words.map(w => makeWordMesh(w, li));

      // Total width of this line for centering
      const lineW = tiles.reduce((s, t) => s + t.tileW, 0) + WGAP * (tiles.length - 1);

      // Position words along X
      let x = -lineW / 2;
      tiles.forEach(t => {
        t.baseX = x + t.tileW / 2;
        t.mesh.position.x = t.baseX;
        x += t.tileW + WGAP;
        group.add(t.mesh);
      });

      return { tiles, y: 0 };
    });

    // Stack lines vertically and centre the block
    const blockH = LINES.length * TH + (LINES.length - 1) * LGAP;
    lineGroups.forEach((lg, i) => {
      const y = blockH / 2 - TH / 2 - i * (TH + LGAP);
      lg.y = y;
      lg.tiles.forEach(t => { t.mesh.position.y = y; });
    });

    // Animation constants
    const BR_X = 25 * Math.PI / 180;   // base X rotation (tile tilt)
    const BR_Y = -16 * Math.PI / 180;  // base Y rotation
    const DA   =  5 * Math.PI / 180;   // drift amplitude (breathing)
    const DS   = 0.08;                 // drift speed
    const SA   = 0.42;                 // line slide amplitude (Three.js units)
    const SS   = 0.33;                 // line slide speed

    renderer.setAnimationLoop(() => {
      const t = performance.now() / 1000;

      // Gently breathe the entire tile block in 3D
      group.rotation.x = BR_X + Math.sin(t * DS)               * DA;
      group.rotation.y = BR_Y + Math.sin(t * DS * 0.71 + 1.3)  * DA;

      // Slide each line with its own phase — staircase effect
      lineGroups.forEach((lg, i) => {
        const phase = (i / lineGroups.length) * Math.PI * 2;
        const dx    = Math.sin(t * SS + phase) * SA;
        lg.tiles.forEach(t => { t.mesh.position.x = t.baseX + dx; });
      });

      renderer.render(scene, camera);
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  });
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
