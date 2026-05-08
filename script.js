// ── Lego tile animation ───────────────────────────────────────────
// Single Three.js canvas handles the full background + tiles.
// No p5.js, no alpha transparency, no async font waits.
(function () {
  const canvas   = document.getElementById('main-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a2340); // navy — no transparent canvas needed

  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1000);
  camera.position.z = 8;

  const group = new THREE.Group();
  scene.add(group);

  // ── Content ──────────────────────────────────────────────────────
  const LINES = [
    "Hi! I'm Vaishnavi —",
    "I like tech,",
    "I like painting,",
    "and I like whimsical",
    "photography."
  ];

  // Classic Lego colours: face (bright) + side (darker shade)
  const LEGO = [
    { face: '#C91A09', side: 0x8B1207 },  // red
    { face: '#F2CD37', side: 0xB89C2A },  // yellow
    { face: '#0055BF', side: 0x003D8F },  // blue
    { face: '#257A3E', side: 0x1A5429 },  // green
    { face: '#FF7722', side: 0xC05818 },  // orange
  ];

  const FPX  = 58;    // canvas font px — Arial bold
  const TH   = 0.62;  // tile height in scene units
  const TD   = 0.18;  // tile depth — chunky so edges show clearly when tilted
  const WGAP = 0.05;  // gap between word tiles
  const LGAP = 0.09;  // gap between lines

  function buildTile(word, li) {
    const col = LEGO[li % LEGO.length];

    // Draw word onto an offscreen canvas for the face texture
    const tc  = document.createElement('canvas');
    const ctx = tc.getContext('2d');
    const fnt = `bold ${FPX}px Arial, Helvetica, sans-serif`;

    ctx.font = fnt;
    const tw = Math.ceil(ctx.measureText(word).width) + 28;
    const th = FPX + 24;
    tc.width = tw;  tc.height = th;

    // Solid Lego colour — fully opaque
    ctx.fillStyle = col.face;
    ctx.fillRect(0, 0, tw, th);

    // Plastic sheen: white gradient on top half
    const sheen = ctx.createLinearGradient(0, 0, 0, th * 0.5);
    sheen.addColorStop(0, 'rgba(255,255,255,0.30)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, tw, th * 0.5);

    // White bold text
    ctx.font = fnt;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur  = 4;
    ctx.fillText(word, 14, th / 2);

    const tex   = new THREE.CanvasTexture(tc);
    const tileW = TH * (tw / th);

    const geo     = new THREE.BoxGeometry(tileW, TH, TD);
    const sideMat = new THREE.MeshBasicMaterial({ color: col.side });
    const faceMat = new THREE.MeshBasicMaterial({ map: tex });

    // BoxGeometry face order: +X, -X, +Y, -Y, +Z(front facing cam), -Z(back)
    const mesh = new THREE.Mesh(geo, [sideMat, sideMat, sideMat, sideMat, faceMat, sideMat]);
    return { mesh, tileW };
  }

  // ── Layout: position every word tile in its line ─────────────────
  const lineGroups = LINES.map((lineText, li) => {
    const words = lineText.split(' ').filter(Boolean);
    const tiles = words.map(w => buildTile(w, li));

    const lineW = tiles.reduce((s, t) => s + t.tileW, 0) + WGAP * (tiles.length - 1);
    let x = -lineW / 2;
    tiles.forEach(t => {
      t.baseX = x + t.tileW / 2;
      t.mesh.position.x = t.baseX;
      x += t.tileW + WGAP;
      group.add(t.mesh);
    });
    return { tiles };
  });

  // Stack lines top-to-bottom, centred vertically
  const blockH = LINES.length * TH + (LINES.length - 1) * LGAP;
  lineGroups.forEach((lg, i) => {
    const y = blockH / 2 - TH / 2 - i * (TH + LGAP);
    lg.tiles.forEach(t => { t.mesh.position.y = y; });
  });

  // ── Animation constants ──────────────────────────────────────────
  const BR_X = 26 * Math.PI / 180;   // base tilt X — leans block toward viewer
  const BR_Y = -18 * Math.PI / 180;  // base tilt Y — shows right side edge
  const DA   =  6 * Math.PI / 180;   // breathing amplitude
  const DS   = 0.07;                 // breathing speed
  const SA   = 0.50;                 // line-slide amplitude (scene units)
  const SS   = 0.30;                 // line-slide speed

  renderer.setAnimationLoop(() => {
    const t = performance.now() / 1000;

    // Whole block breathes slowly in 3D
    group.rotation.x = BR_X + Math.sin(t * DS)               * DA;
    group.rotation.y = BR_Y + Math.sin(t * DS * 0.71 + 1.3)  * DA;

    // Each line slides at a unique phase → continuous staircase shift
    lineGroups.forEach((lg, i) => {
      const phase = (i / lineGroups.length) * Math.PI * 2;
      const dx    = Math.sin(t * SS + phase) * SA;
      lg.tiles.forEach(tile => { tile.mesh.position.x = tile.baseX + dx; });
    });

    renderer.render(scene, camera);
  });

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}());

// ── Cursor ────────────────────────────────────────────────────────
const cursorRing = document.getElementById('cursorRing');
const cursorDot  = document.getElementById('cursorDot');
let mX = innerWidth / 2, mY = innerHeight / 2;
let rX = mX, rY = mY;

document.addEventListener('mousemove', e => {
  mX = e.clientX; mY = e.clientY;
  cursorDot.style.left = mX + 'px';
  cursorDot.style.top  = mY + 'px';
});

(function tickCursor() {
  rX += (mX - rX) * 0.12;
  rY += (mY - rY) * 0.12;
  cursorRing.style.left = rX + 'px';
  cursorRing.style.top  = rY + 'px';
  requestAnimationFrame(tickCursor);
}());

// ── About panel ───────────────────────────────────────────────────
const aboutBtn      = document.getElementById('aboutBtn');
const aboutPanel    = document.getElementById('aboutPanel');
const panelClose    = document.getElementById('panelClose');
const panelBackdrop = document.getElementById('panelBackdrop');

function openPanel()  { aboutPanel.classList.add('open');    panelBackdrop.classList.add('active');    }
function closePanel() { aboutPanel.classList.remove('open'); panelBackdrop.classList.remove('active'); }

aboutBtn.addEventListener('click', openPanel);
panelClose.addEventListener('click', closePanel);
panelBackdrop.addEventListener('click', closePanel);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

// ── Lucide icons ──────────────────────────────────────────────────
lucide.createIcons();
