/* ═══════════════════════════════════════════════
   PRANAV ARORA — PORTFOLIO JS v4
   ONE gunshot on tap · No ambient sounds
   ═══════════════════════════════════════════════ */

// ──────────────────────────────────────────────
// 1. AUDIO — single proper gunshot, nothing else
// ──────────────────────────────────────────────
let audioCtx = null;
let soundEnabled = false;   // ← OFF by default

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playGunshot(x, y) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const sr  = ctx.sampleRate;

    // Master compressor — big punch without clipping
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -6;
    comp.knee.value      = 4;
    comp.ratio.value     = 10;
    comp.attack.value    = 0.001;
    comp.release.value   = 0.2;
    comp.connect(ctx.destination);

    // ── LAYER 1: CRACK — sharp initial bang transient
    const crackLen = Math.floor(sr * 0.09);
    const crackBuf = ctx.createBuffer(1, crackLen, sr);
    const cd = crackBuf.getChannelData(0);
    for (let i = 0; i < crackLen; i++) {
      const t = i / crackLen;
      cd[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.6);
    }
    const crackSrc = ctx.createBufferSource();
    crackSrc.buffer = crackBuf;
    const crackHP = ctx.createBiquadFilter();
    crackHP.type = 'highpass';
    crackHP.frequency.value = 500;
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(5.0, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    crackSrc.connect(crackHP);
    crackHP.connect(crackGain);
    crackGain.connect(comp);
    crackSrc.start(now);
    crackSrc.stop(now + 0.09);

    // ── LAYER 2: BODY — mid-band noise sustain (the meaty "boom")
    const bodyLen = Math.floor(sr * 0.65);
    const bodyBuf = ctx.createBuffer(1, bodyLen, sr);
    const bd = bodyBuf.getChannelData(0);
    for (let i = 0; i < bodyLen; i++) {
      const t = i / bodyLen;
      const env = Math.pow(1 - t, 2.0) * (1 + 0.4 * Math.exp(-t * 10));
      bd[i] = (Math.random() * 2 - 1) * env;
    }
    const bodySrc = ctx.createBufferSource();
    bodySrc.buffer = bodyBuf;
    const bodyBP = ctx.createBiquadFilter();
    bodyBP.type = 'bandpass';
    bodyBP.frequency.setValueAtTime(350, now);
    bodyBP.frequency.exponentialRampToValueAtTime(70, now + 0.5);
    bodyBP.Q.value = 1.0;
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(3.5, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    bodySrc.connect(bodyBP);
    bodyBP.connect(bodyGain);
    bodyGain.connect(comp);
    bodySrc.start(now);
    bodySrc.stop(now + 0.66);

    // ── LAYER 3: SUB THUD — deep sine drop (chest-punch bass)
    const thudOsc = ctx.createOscillator();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(120, now);
    thudOsc.frequency.exponentialRampToValueAtTime(22, now + 0.45);
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(6.0, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    thudOsc.connect(thudGain);
    thudGain.connect(comp);
    thudOsc.start(now);
    thudOsc.stop(now + 0.5);

    // ── LAYER 4: TAIL — long room decay / echo reverb feel
    const tailLen = Math.floor(sr * 1.0);
    const tailBuf = ctx.createBuffer(1, tailLen, sr);
    const td = tailBuf.getChannelData(0);
    for (let i = 0; i < tailLen; i++) {
      const t = i / tailLen;
      td[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 4.0) * 0.5;
    }
    const tailSrc = ctx.createBufferSource();
    tailSrc.buffer = tailBuf;
    const tailLP = ctx.createBiquadFilter();
    tailLP.type = 'lowpass';
    tailLP.frequency.setValueAtTime(1400, now);
    tailLP.frequency.exponentialRampToValueAtTime(180, now + 0.9);
    const tailGain = ctx.createGain();
    tailGain.gain.setValueAtTime(1.4, now + 0.04);
    tailGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    tailSrc.connect(tailLP);
    tailLP.connect(tailGain);
    tailGain.connect(comp);
    tailSrc.start(now + 0.02);
    tailSrc.stop(now + 1.05);

    // Visual effects
    triggerMuzzleFlash(x, y);
  } catch(e) {}
}

// Sound toggle — starts OFF
const soundBtn = document.getElementById('soundToggle');
function updateSoundBtn() {
  soundBtn.innerHTML = soundEnabled
    ? '🔊 <span>SOUND ON</span>'
    : '🔇 <span>SOUND OFF</span>';
  soundBtn.classList.toggle('sound-on', soundEnabled);
}
updateSoundBtn();
soundBtn.addEventListener('click', e => {
  e.stopPropagation();
  soundEnabled = !soundEnabled;
  updateSoundBtn();
});

// Attach gunshot ONLY to explicit clickable elements
function attachSounds() {
  document.querySelectorAll('[data-snd]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation(); // prevent double-firing from global click handler
      playGunshot(e.clientX, e.clientY);
      spawnParticles(e.clientX, e.clientY, 18);
    });
  });
}

// ──────────────────────────────────────────────
// 2. MUZZLE FLASH
// ──────────────────────────────────────────────
const muzzle = document.getElementById('muzzle-flash');

function triggerMuzzleFlash(x, y) {
  muzzle.style.setProperty('--mx', ((x / window.innerWidth) * 100).toFixed(1) + '%');
  muzzle.style.setProperty('--my', ((y / window.innerHeight) * 100).toFixed(1) + '%');
  muzzle.classList.add('flash');
  setTimeout(() => muzzle.classList.remove('flash'), 90);
}

// ──────────────────────────────────────────────
// 3. PARTICLE BURST
// ──────────────────────────────────────────────
const particleBurst = document.getElementById('particleBurst');

function spawnParticles(x, y, count = 16) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.8;
    const speed = 40 + Math.random() * 90;
    const dur   = 0.4 + Math.random() * 0.45;
    const hue = Math.random() > 0.6 ? '#cc0000' : Math.random() > 0.5 ? '#ff4444' : '#880000';
    p.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(angle)*speed}px;--dy:${Math.sin(angle)*speed}px;--dur:${dur}s;background:${hue};box-shadow:0 0 4px ${hue}`;
    particleBurst.appendChild(p);
    setTimeout(() => p.remove(), dur * 1000 + 60);
  }
}

// ──────────────────────────────────────────────
// 4. CURSOR
// ──────────────────────────────────────────────
const cur = document.getElementById('cursor');
document.addEventListener('mousemove', e => {
  cur.style.left = e.clientX + 'px';
  cur.style.top  = e.clientY + 'px';
});

// ──────────────────────────────────────────────
// 5. BACKGROUND CANVAS — matrix rain + grid
// ──────────────────────────────────────────────
const bgCanvas = document.getElementById('bgCanvas');
const bgCtx    = bgCanvas.getContext('2d');
let drops = [], gridPts = [];

function resizeBg() {
  bgCanvas.width  = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  initGrid();
}

function initGrid() {
  gridPts = [];
  const sp = 60;
  for (let x = 0; x < bgCanvas.width + sp; x += sp)
    for (let y = 0; y < bgCanvas.height + sp; y += sp)
      gridPts.push({ x, y, r: Math.random() * 1.2 });

  drops = Array.from({ length: 60 }, () => ({
    x: Math.random() * bgCanvas.width,
    y: Math.random() * bgCanvas.height,
    spd: 1.5 + Math.random() * 3,
    len: 10 + Math.random() * 22,
    a: Math.random() * 0.1 + 0.03,
  }));
}

function drawBg(t) {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  // Grid dots — subtle red on white
  gridPts.forEach(p => {
    const pulse = 0.04 + 0.03 * Math.sin(t * 0.001 + p.x * 0.01 + p.y * 0.01);
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(204,0,0,${pulse})`;
    bgCtx.fill();
  });

  // Subtle grid lines
  bgCtx.strokeStyle = 'rgba(204,0,0,0.04)';
  bgCtx.lineWidth = 0.5;
  const sp = 60;
  for (let x = 0; x < bgCanvas.width; x += sp) {
    bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, bgCanvas.height); bgCtx.stroke();
  }
  for (let y = 0; y < bgCanvas.height; y += sp) {
    bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(bgCanvas.width, y); bgCtx.stroke();
  }

  // Rain — subtle red streaks
  drops.forEach(d => {
    bgCtx.beginPath();
    bgCtx.moveTo(d.x, d.y);
    bgCtx.lineTo(d.x, d.y + d.len);
    bgCtx.strokeStyle = `rgba(204,0,0,${d.a * 0.4})`;
    bgCtx.lineWidth = 0.7;
    bgCtx.stroke();
    d.y += d.spd;
    if (d.y > bgCanvas.height) { d.y = -d.len; d.x = Math.random() * bgCanvas.width; }
  });
}

window.addEventListener('resize', resizeBg);
resizeBg();

// ──────────────────────────────────────────────
// 6. FLOATING ORB CANVAS
// ──────────────────────────────────────────────
const orbCanvas = document.getElementById('orbCanvas');
const orbCtx    = orbCanvas ? orbCanvas.getContext('2d') : null;
let orbs = [];

function resizeOrbs() {
  if (!orbCanvas) return;
  orbCanvas.width  = window.innerWidth;
  orbCanvas.height = window.innerHeight;
  orbs = Array.from({ length: 10 }, (_, i) => ({
    x:    Math.random() * orbCanvas.width,
    y:    Math.random() * orbCanvas.height,
    r:    40 + Math.random() * 100,
    vx:   (Math.random() - 0.5) * 0.25,
    vy:   (Math.random() - 0.5) * 0.25,
    hue:  i < 4 ? 'rgba(204,0,0,' : i < 7 ? 'rgba(180,0,80,' : 'rgba(100,0,0,',
    a:    0.015 + Math.random() * 0.025,
  }));
}

function drawOrbs() {
  if (!orbCtx) return;
  orbCtx.clearRect(0, 0, orbCanvas.width, orbCanvas.height);
  orbs.forEach(o => {
    const g = orbCtx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
    g.addColorStop(0, o.hue + o.a + ')');
    g.addColorStop(1, o.hue + '0)');
    orbCtx.beginPath();
    orbCtx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    orbCtx.fillStyle = g;
    orbCtx.fill();
    o.x += o.vx; o.y += o.vy;
    if (o.x < -o.r) o.x = orbCanvas.width + o.r;
    if (o.x > orbCanvas.width + o.r) o.x = -o.r;
    if (o.y < -o.r) o.y = orbCanvas.height + o.r;
    if (o.y > orbCanvas.height + o.r) o.y = -o.r;
  });
}

window.addEventListener('resize', resizeOrbs);
resizeOrbs();
// Avatar canvas removed — replaced with profile card
function drawAvatar(t) { /* no-op */ }

function drawAvatar(t) {
  if (!avCtx) return;
  avCtx.clearRect(0, 0, 300, 300);
  const cx = 150, cy = 150;

  for (let i = 0; i < 3; i++) {
    const r   = 120 - i * 18;
    const seg = 8 + i * 4;
    const rot = t * (0.0008 + i * 0.0003) * (i % 2 === 0 ? 1 : -1);
    for (let s = 0; s < seg; s++) {
      const a0 = (Math.PI * 2 / seg) * s + rot;
      const a1 = a0 + (Math.PI * 2 / seg) * 0.6;
      avCtx.beginPath();
      avCtx.arc(cx, cy, r, a0, a1);
      avCtx.strokeStyle = `rgba(204,0,0,${0.2 + 0.25 * (1 - i * 0.2)})`;
      avCtx.lineWidth = 1.5 - i * 0.3;
      avCtx.stroke();
    }
  }

  const pulse = 0.04 + 0.03 * Math.sin(t * 0.003);
  const grad  = avCtx.createRadialGradient(cx, cy, 40, cx, cy, 130);
  grad.addColorStop(0, `rgba(204,0,0,${pulse})`);
  grad.addColorStop(1, 'rgba(204,0,0,0)');
  avCtx.beginPath(); avCtx.arc(cx, cy, 130, 0, Math.PI * 2);
  avCtx.fillStyle = grad; avCtx.fill();

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i + t * 0.002;
    avCtx.beginPath();
    avCtx.arc(cx + Math.cos(angle) * 100, cy + Math.sin(angle) * 100, 2.5, 0, Math.PI * 2);
    avCtx.fillStyle = 'rgba(204,0,0,0.5)';
    avCtx.fill();
  }
}

// ──────────────────────────────────────────────
// 7. LOADER CANVAS
// ──────────────────────────────────────────────
const lCanvas = document.getElementById('loaderCanvas');
const lCtx    = lCanvas.getContext('2d');
lCanvas.width = window.innerWidth;
lCanvas.height = window.innerHeight;
const lParticles = Array.from({ length: 80 }, () => ({
  x: Math.random() * lCanvas.width,
  y: Math.random() * lCanvas.height,
  r: Math.random() * 1.4,
  a: Math.random() * Math.PI * 2,
  spd: 0.2 + Math.random() * 0.4,
}));

function drawLoader() {
  lCtx.clearRect(0, 0, lCanvas.width, lCanvas.height);
  lParticles.forEach(p => {
    p.x += Math.cos(p.a) * p.spd;
    p.y += Math.sin(p.a) * p.spd;
    if (p.x < 0) p.x = lCanvas.width;
    if (p.x > lCanvas.width) p.x = 0;
    if (p.y < 0) p.y = lCanvas.height;
    if (p.y > lCanvas.height) p.y = 0;
    lCtx.beginPath();
    lCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    lCtx.fillStyle = 'rgba(204,0,0,0.08)';
    lCtx.fill();
  });
}

// ──────────────────────────────────────────────
// 8. MAIN RAF LOOP
// ──────────────────────────────────────────────
let loaderDone = false;

function loop(t) {
  if (!loaderDone) drawLoader();
  drawBg(t);
  drawOrbs();
  drawAvatar(t);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ──────────────────────────────────────────────
// 9. LOADER BOOT SEQUENCE (no sounds — silent)
// ──────────────────────────────────────────────
const loaderLog = document.getElementById('loaderLog');
const loaderBar = document.getElementById('loaderBar');
const loaderPct = document.getElementById('loaderPct');

const bootLines = [
  '> INITIALIZING SYSTEM CORE...',
  '> LOADING PLAYER_DATA: PRANAV_ARORA.dat',
  '> MOUNTING SKILLS DATABASE...',
  '> CONNECTING TO GITHUB API...',
  '> CALIBRATING HUD COMPONENTS...',
  '> RUNNING SECURITY PROTOCOLS...',
  '> SYSTEM READY — WELCOME OPERATOR',
];

let bIdx = 0;
function bootStep() {
  if (bIdx > 0 && loaderLog.lastChild) loaderLog.lastChild.className = 'll-done';
  if (bIdx < bootLines.length) {
    const el = document.createElement('div');
    el.className = 'll-cur';
    el.textContent = bootLines[bIdx];
    loaderLog.appendChild(el);
    bIdx++;
    const pct = Math.round((bIdx / bootLines.length) * 100);
    loaderBar.style.width = pct + '%';
    loaderPct.textContent = pct + '%';
    setTimeout(bootStep, bIdx === 1 ? 300 : 220);
  } else {
    // Fire ONE gunshot when boot completes
    playGunshot(window.innerWidth / 2, window.innerHeight / 2);
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 30);
    setTimeout(() => {
      document.getElementById('loader').classList.add('out');
      loaderDone = true;
      initPage();
    }, 600);
  }
}
bootStep();

// ──────────────────────────────────────────────
// 10. PAGE INIT
// ──────────────────────────────────────────────
function initPage() {
  attachSounds();
  startTerminal();
  revealAttrBars();
  buildSkillsGrid();
  setupScrollSpy();
  setupFadeIns();
  fetchRepos();
  updateClock();
  setInterval(updateClock, 1000);
  initTimeline();
  initPlayground();
  initTypewriterBio();
  initStatCounters();
  init3DTilt();
  initRipple();
  initSectionWipes();
}

// ──────────────────────────────────────────────
// 11. CLOCK
// ──────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const str = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  ['termClock','navClock'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = str; });
}

// ──────────────────────────────────────────────
// 12. TERMINAL (no sounds)
// ──────────────────────────────────────────────
const cmds = [
  {
    cmd: 'whoami',
    out: [
      '<span class="tk">name</span>      <span class="tv">"Pranav Arora"</span>',
      '<span class="tk">role</span>      <span class="tv">"Backend Developer"</span>',
      '<span class="tk">status</span>    <span class="tv">"Available for hire ✓"</span>',
      '<span class="tk">gpa</span>       <span class="tv">"9.05 / 10.0"</span>',
    ]
  },
  {
    cmd: 'cat skills.json | head',
    out: [
      '<span class="tk">java</span>      <span class="tv">{ level: 95, type: "Language" }</span>',
      '<span class="tk">springBoot</span> <span class="tv">{ level: 88, type: "Framework" }</span>',
      '<span class="tk">mysql</span>     <span class="tv">{ level: 90, type: "Database" }</span>',
      '<span class="tk">restAPIs</span>  <span class="tv">{ level: 92, type: "Architecture" }</span>',
    ]
  },
  {
    cmd: 'ls ./projects',
    out: [
      '<span class="tv">AdaptIQ/</span>',
      '<span class="tv">deepfake-detector-ext/</span>',
      '<span class="tv">...more → github.com/pranavarora17</span>',
    ]
  },
  {
    cmd: 'cat experience.log',
    out: [
      '<span class="tk">company</span>   <span class="tv">"Indian Cyber Coordination Centre"</span>',
      '<span class="tk">role</span>      <span class="tv">"SDE Intern"</span>',
      '<span class="tk">period</span>    <span class="tv">"Jun–Jul 2025, New Delhi"</span>',
    ]
  },
  {
    cmd: 'echo $STATUS',
    out: ['<span class="tv">AVAILABLE_FOR_HIRE=true</span>']
  }
];

let cIdx = 0;
function startTerminal() {
  const termCmd = document.getElementById('termCmd');
  const termOut  = document.getElementById('termOut');
  const termBl   = document.getElementById('termBl');
  if (!termCmd) return;

  function typeCmd(text, done) {
    termCmd.textContent = '';
    termBl.style.display = 'inline';
    let i = 0;
    const iv = setInterval(() => {
      termCmd.textContent += text[i++];
      if (i >= text.length) { clearInterval(iv); setTimeout(done, 350); }
    }, 42);
  }

  function showOut(lines, done) {
    termBl.style.display = 'none';
    let i = 0;
    function next() {
      if (i >= lines.length) { setTimeout(done, 2000); return; }
      const d = document.createElement('div');
      d.className = 'tol'; d.innerHTML = lines[i++];
      termOut.appendChild(d);
      while (termOut.children.length > 14) termOut.removeChild(termOut.firstChild);
      setTimeout(next, 140);
    }
    next();
  }

  function runNext() {
    const c = cmds[cIdx++ % cmds.length];
    typeCmd(c.cmd, () => showOut(c.out, () => { termCmd.textContent = ''; runNext(); }));
  }
  runNext();
}

// ──────────────────────────────────────────────
// 13. ATTR BARS
// ──────────────────────────────────────────────
function revealAttrBars() {
  document.querySelectorAll('.hb div[data-w]').forEach((el, i) => {
    setTimeout(() => { el.style.width = el.dataset.w + '%'; }, i * 120 + 200);
  });
}

// ──────────────────────────────────────────────
// 14. SKILLS GRID (no hover sounds)
// ──────────────────────────────────────────────
const skillData = [
  { name:'Java',         icon:'☕', lvl:95, tier:'PROFICIENT', cat:'Language',    desc:'Primary language — OOP, Collections, Streams, Multithreading.', tags:['OOP','Collections','Streams'] },
  { name:'Spring Boot',  icon:'🌱', lvl:88, tier:'PROFICIENT', cat:'Framework',   desc:'REST APIs, dependency injection, Spring MVC, microservices.', tags:['REST','DI','MVC'] },
  { name:'Hibernate',    icon:'🗃️', lvl:80, tier:'PROFICIENT', cat:'ORM',        desc:'Entity mapping, lazy/eager loading, HQL, transactions.', tags:['ORM','HQL','JPA'] },
  { name:'MySQL',        icon:'🐬', lvl:90, tier:'PROFICIENT', cat:'Database',    desc:'Complex queries, indexing, joins, schema design, optimization.', tags:['Joins','Indexing','Transactions'] },
  { name:'REST APIs',    icon:'🔌', lvl:92, tier:'PROFICIENT', cat:'Architecture',desc:'API design, HTTP methods, JSON, authentication, integration.', tags:['HTTP','JSON','Auth'] },
  { name:'C++',          icon:'⚡', lvl:78, tier:'FAMILIAR',   cat:'Language',    desc:'DSA, competitive programming, memory management, STL.', tags:['DSA','STL','Pointers'] },
  { name:'Git',          icon:'🐙', lvl:85, tier:'PROFICIENT', cat:'DevOps',      desc:'Version control, branching, pull requests, CI basics.', tags:['Branching','PR','VCS'] },
  { name:'HTML/CSS',     icon:'🎨', lvl:75, tier:'FAMILIAR',   cat:'Frontend',    desc:'Semantic HTML5, CSS3 Flexbox/Grid, responsive design, animations.', tags:['Flexbox','Grid','Responsive'] },
  { name:'JavaScript',   icon:'🟨', lvl:70, tier:'FAMILIAR',   cat:'Frontend',    desc:'DOM manipulation, Fetch API, ES6+, async/await.', tags:['ES6+','Fetch','DOM'] },
  { name:'DSA',          icon:'🧮', lvl:85, tier:'PROFICIENT', cat:'Core CS',     desc:'Trees, graphs, DP, sorting, searching algorithms.', tags:['Trees','DP','Graphs'] },
  { name:'OOP',          icon:'🧱', lvl:93, tier:'PROFICIENT', cat:'Core CS',     desc:'Inheritance, polymorphism, encapsulation, SOLID principles.', tags:['SOLID','Patterns','Design'] },
  { name:'Problem Solve',icon:'🎯', lvl:88, tier:'PROFICIENT', cat:'Core',        desc:'Systematic debugging, algorithmic thinking, iterative refinement.', tags:['Debug','Analysis','Logic'] },
];

function buildSkillsGrid() {
  const grid = document.getElementById('skillsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  skillData.forEach((sk, i) => {
    const card = document.createElement('div');
    card.className = 'sk-card fade-in';
    card.innerHTML = `
      <span class="sk-icon">${sk.icon}</span>
      <span class="sk-name">${sk.name}</span>
      <div class="sk-bar"><div class="sk-fill" data-lvl="${sk.lvl}"></div></div>
    `;
    card.addEventListener('click', e => {
      // Gunshot + particles on skill click
      playGunshot(e.clientX, e.clientY);
      spawnParticles(e.clientX, e.clientY, 14);
      e.stopPropagation();
      card.classList.add('hit');
      setTimeout(() => card.classList.remove('hit'), 400);
      inspectSkill(sk, card);
    });
    grid.appendChild(card);
    setTimeout(() => {
      card.classList.add('in');
      card.querySelector('.sk-fill').style.width = sk.lvl + '%';
    }, i * 50 + 100);
  });
}

function inspectSkill(sk, cardEl) {
  document.querySelectorAll('.sk-card').forEach(c => c.classList.remove('active'));
  cardEl.classList.add('active');
  document.getElementById('inspStatus').textContent = 'LOCKED';
  document.getElementById('inspIdle').classList.add('hidden');
  const data = document.getElementById('inspData');
  data.classList.remove('hidden');
  document.getElementById('iName').textContent = sk.name;
  document.getElementById('iCat').textContent  = sk.cat;
  document.getElementById('iPct').textContent  = sk.tier;
  document.getElementById('iDesc').textContent = sk.desc;
  const fill = document.getElementById('iBarFill');
  fill.style.width = '0';
  requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = sk.lvl + '%'; }));
  document.getElementById('iTags').innerHTML = sk.tags.map(t => `<span>${t}</span>`).join('');
}

// ──────────────────────────────────────────────
// 15. SCROLL SPY
// ──────────────────────────────────────────────
function setupScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nl');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active-link'));
        const active = document.querySelector(`.nl[href="#${e.target.id}"]`);
        if (active) active.classList.add('active-link');
      }
    });
  }, { threshold: 0.3 });
  sections.forEach(s => io.observe(s));
}

// ──────────────────────────────────────────────
// 16. FADE IN ON SCROLL (no sounds)
// ──────────────────────────────────────────────
function setupFadeIns() {
  document.querySelectorAll('.proj-card, .exp-card, .cert-row, .as-item, .contact-card, .csg-item').forEach((el, i) => {
    el.classList.add('fade-in');
    el.style.transitionDelay = (i * 0.04) + 's';
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
}

// ──────────────────────────────────────────────
// 17. GITHUB REPOS (no hover sounds)
// ──────────────────────────────────────────────
async function fetchRepos() {
  const grid = document.getElementById('reposGrid');
  if (!grid) return;
  try {
    const res = await fetch('https://api.github.com/users/pranavarora17/repos?sort=updated&per_page=9');
    if (!res.ok) throw new Error();
    const repos = await res.json();
    const filtered = repos.filter(r => !r.fork).slice(0, 6);
    if (!filtered.length) throw new Error();
    grid.innerHTML = '';
    filtered.forEach((repo, i) => {
      const a = document.createElement('a');
      a.href = repo.html_url; a.target = '_blank'; a.className = 'repo-card fade-in';
      a.innerHTML = `
        <div class="repo-name">📁 ${repo.name}</div>
        <div class="repo-desc">${repo.description || 'No description provided.'}</div>
        <div class="repo-meta">
          ${repo.language ? `<span class="repo-lang">${repo.language}</span>` : ''}
          <span>⭐ ${repo.stargazers_count}</span>
          <span>🍴 ${repo.forks_count}</span>
        </div>
      `;
      // Gunshot when clicking a repo link
      a.addEventListener('click', e => {
        playGunshot(e.clientX, e.clientY);
        spawnParticles(e.clientX, e.clientY, 12);
      });
      grid.appendChild(a);
      setTimeout(() => a.classList.add('in'), i * 80);
    });
  } catch {
    grid.innerHTML = `<div class="repo-loader mono">⚠ RATE LIMIT — <a href="https://github.com/pranavarora17" target="_blank" style="color:var(--acc)">VISIT GITHUB ↗</a></div>`;
  }
}

// ──────────────────────────────────────────────
// 18. SMOOTH NAV SCROLL
// ──────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); window.scrollTo({ top: target.offsetTop - 52, behavior: 'smooth' }); }
  });
});

// ──────────────────────────────────────────────
// TIMELINE — hover/click to expand nodes
// ──────────────────────────────────────────────
function initTimeline() {
  document.querySelectorAll('.tl-node').forEach(node => {
    node.addEventListener('click', e => {
      const wasExpanded = node.classList.contains('expanded');
      document.querySelectorAll('.tl-node').forEach(n => n.classList.remove('expanded'));
      if (!wasExpanded) {
        node.classList.add('expanded');
        playGunshot(e.clientX, e.clientY);
        spawnParticles(e.clientX, e.clientY, 10);
      }
    });
  });
}


// ──────────────────────────────────────────────
// BALL BLASTER — Shooting Game
// ──────────────────────────────────────────────

const GAME = (() => {
  let canvas, ctx, animId;
  let state = 'idle'; // idle | playing | dead
  let score = 0, hiScore = 0, lives = 3, level = 1;
  let balls = [], bullets = [], particles = [], explosions = [];
  let mouseX = 0, mouseY = 0;
  let spawnTimer = 0, levelTimer = 0;
  let turretAngle = 0;

  // Ball colours — bright & varied
  const BALL_COLORS = ['#c0392b','#2980b9','#27ae60','#8e44ad','#e67e22','#16a085','#f39c12','#2c3e50'];

  function init() {
    canvas  = document.getElementById('gameCanvas');
    ctx     = canvas.getContext('2d');

    document.getElementById('gameStartBtn').addEventListener('click', startGame);
    document.getElementById('goBtn').addEventListener('click', startGame);

    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouseX = (e.clientX - r.left) * (canvas.width  / r.width);
      mouseY = (e.clientY - r.top)  * (canvas.height / r.height);
    });

    canvas.addEventListener('click', e => {
      if (state !== 'playing') return;
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (canvas.width  / r.width);
      const y = (e.clientY - r.top)  * (canvas.height / r.height);
      shoot(x, y);
      if (soundEnabled) playGunshot(e.clientX, e.clientY);
    });

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    drawIdle();
  }

  function resizeCanvas() {
    const wrap = canvas.parentElement;
    const hud  = document.querySelector('.game-hud');
    canvas.width  = wrap.clientWidth;
    canvas.height = Math.max(wrap.clientHeight - hud.offsetHeight - 12, 350);
    if (state !== 'playing') drawIdle();
  }

  function startGame() {
    balls = []; bullets = []; particles = []; explosions = [];
    score = 0; lives = 3; level = 1; spawnTimer = 0; levelTimer = 0;
    state = 'playing';
    document.getElementById('gameOverlay').classList.add('hidden');
    updateHUD();
    cancelAnimationFrame(animId);
    loop();
  }

  function turretBase() {
    return { x: canvas.width / 2, y: canvas.height - 30 };
  }

  function shoot(tx, ty) {
    const tb = turretBase();
    const dx = tx - tb.x, dy = ty - tb.y;
    const len = Math.hypot(dx, dy) || 1;
    bullets.push({
      x: tb.x, y: tb.y,
      vx: (dx / len) * 14,
      vy: (dy / len) * 14,
      r: 5,
    });
    // Muzzle flash particles from turret
    for (let i = 0; i < 6; i++) {
      const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
      particles.push({ x: tb.x, y: tb.y, vx: Math.cos(a) * (4 + Math.random() * 6), vy: Math.sin(a) * (4 + Math.random() * 6), life: 1, maxLife: 1, color: '#ffcc00', r: 3 });
    }
  }

  function spawnBall() {
    const margin = 40;
    const side = Math.floor(Math.random() * 3); // 0=top 1=left 2=right
    let x, y, vx, vy;
    const spd = 1.2 + level * 0.25 + Math.random() * 0.8;
    const tb = turretBase();

    if (side === 0) { x = margin + Math.random() * (canvas.width - margin * 2); y = -30; }
    else if (side === 1) { x = -30; y = margin + Math.random() * (canvas.height * 0.7); }
    else { x = canvas.width + 30; y = margin + Math.random() * (canvas.height * 0.7); }

    const dx = tb.x - x, dy = tb.y - y, len = Math.hypot(dx, dy) || 1;
    // Slight random drift
    vx = (dx / len) * spd + (Math.random() - 0.5) * 0.4;
    vy = (dy / len) * spd + (Math.random() - 0.5) * 0.4;

    const radius = 14 + Math.floor(Math.random() * 14);
    const hp = Math.ceil(radius / 10); // bigger ball = more hits
    balls.push({
      x, y, vx, vy,
      r: radius,
      color: BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)],
      hp, maxHp: hp,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpd: 0.04 + Math.random() * 0.04,
    });
  }

  function explode(x, y, color, count = 18) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 / count) * i + Math.random() * 0.4;
      const spd = 2 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 1,
        life: 1, maxLife: 1,
        color,
        r: 2 + Math.random() * 4,
      });
    }
    // Flash ring
    explosions.push({ x, y, r: 0, maxR: 50, life: 1, color });
  }

  function loop() {
    if (state !== 'playing') return;
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function update() {
    const tb = turretBase();
    levelTimer++;

    // Spawn rate: faster each level
    spawnTimer++;
    const spawnRate = Math.max(55 - level * 6, 20);
    if (spawnTimer >= spawnRate) { spawnBall(); spawnTimer = 0; }

    // Level up every 15 seconds
    if (levelTimer >= 60 * 15) { level++; levelTimer = 0; updateHUD(); }

    // Turret aims at mouse
    turretAngle = Math.atan2(mouseY - tb.y, mouseX - tb.x);

    // Move bullets
    bullets = bullets.filter(b => {
      b.x += b.vx; b.y += b.vy;
      return b.x > -20 && b.x < canvas.width + 20 && b.y > -20 && b.y < canvas.height + 20;
    });

    // Move balls & check collisions
    balls = balls.filter(ball => {
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.wobble += ball.wobbleSpd;

      // Hit bullet?
      let hit = false;
      bullets = bullets.filter(b => {
        const d = Math.hypot(b.x - ball.x, b.y - ball.y);
        if (d < b.r + ball.r) {
          hit = true;
          ball.hp--;
          // Knockback
          ball.vx += b.vx * 0.15;
          ball.vy += b.vy * 0.15;
          // Hit sparks
          explode(b.x, b.y, ball.color, 8);
          return false; // bullet consumed
        }
        return true;
      });

      if (hit && ball.hp <= 0) {
        // Full destroy
        explode(ball.x, ball.y, ball.color, 22);
        score += 10 * ball.maxHp;
        if (score > hiScore) hiScore = score;
        updateHUD();
        spawnParticles(
          canvas.getBoundingClientRect().left + ball.x * (canvas.getBoundingClientRect().width / canvas.width),
          canvas.getBoundingClientRect().top  + ball.y * (canvas.getBoundingClientRect().height / canvas.height),
          14
        );
        return false;
      }

      // Reached base?
      const distBase = Math.hypot(ball.x - tb.x, ball.y - tb.y);
      if (distBase < 36) {
        explode(ball.x, ball.y, '#c0392b', 16);
        lives--;
        updateHUD();
        if (lives <= 0) { gameOver(); return false; }
        return false;
      }

      // Off screen
      if (ball.x < -60 || ball.x > canvas.width + 60 || ball.y < -60 || ball.y > canvas.height + 60) return false;
      return true;
    });

    // Particles
    particles = particles.filter(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.12; // gravity
      p.life -= 0.035;
      return p.life > 0;
    });

    // Explosion rings
    explosions = explosions.filter(e => {
      e.r += 3; e.life -= 0.07;
      return e.life > 0;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background grid
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }

    // Danger zone
    const tb = turretBase();
    ctx.beginPath();
    ctx.arc(tb.x, tb.y, 36, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(192,57,43,0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(192,57,43,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Explosion rings
    explosions.forEach(e => {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.strokeStyle = e.color + Math.floor(e.life * 255).toString(16).padStart(2,'0');
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Bullets
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = '#c0392b';
      ctx.shadowColor = '#c0392b';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Balls
    balls.forEach(ball => {
      const wobbleR = ball.r + Math.sin(ball.wobble) * 1.5;

      // Shadow
      ctx.beginPath();
      ctx.arc(ball.x + 3, ball.y + 3, wobbleR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fill();

      // Ball body
      const grad = ctx.createRadialGradient(ball.x - wobbleR * 0.3, ball.y - wobbleR * 0.3, wobbleR * 0.1, ball.x, ball.y, wobbleR);
      grad.addColorStop(0, lighten(ball.color, 40));
      grad.addColorStop(0.6, ball.color);
      grad.addColorStop(1, darken(ball.color, 30));
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, wobbleR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // HP ring
      if (ball.maxHp > 1) {
        const pct = ball.hp / ball.maxHp;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, wobbleR + 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Shine
      ctx.beginPath();
      ctx.arc(ball.x - wobbleR * 0.32, ball.y - wobbleR * 0.32, wobbleR * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fill();
    });

    // Particles
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Turret base
    ctx.beginPath();
    ctx.arc(tb.x, tb.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#2c3e50';
    ctx.fill();
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Turret barrel
    const barLen = 32;
    ctx.save();
    ctx.translate(tb.x, tb.y);
    ctx.rotate(turretAngle);
    ctx.beginPath();
    ctx.rect(0, -5, barLen, 10);
    ctx.fillStyle = '#c0392b';
    ctx.fill();
    ctx.restore();

    // Aim line (faint)
    ctx.beginPath();
    ctx.moveTo(tb.x + Math.cos(turretAngle) * 34, tb.y + Math.sin(turretAngle) * 34);
    ctx.lineTo(mouseX, mouseY);
    ctx.strokeStyle = 'rgba(192,57,43,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Crosshair at mouse
    drawCrosshair(mouseX, mouseY);
  }

  function drawCrosshair(x, y) {
    const s = 12;
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, s * 0.6, 0, Math.PI * 2); ctx.stroke();
  }

  function drawIdle() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function gameOver() {
    state = 'dead';
    cancelAnimationFrame(animId);
    const overlay = document.getElementById('gameOverlay');
    const title   = document.getElementById('goTitle');
    const sub     = document.getElementById('goSub');
    const sc      = document.getElementById('goScore');
    const btn     = document.getElementById('goBtn');
    overlay.classList.remove('hidden');
    title.textContent = 'GAME OVER';
    sub.textContent   = 'The balls got through your defences!';
    sc.textContent    = `SCORE: ${score}  ·  HI-SCORE: ${hiScore}`;
    sc.classList.remove('hidden');
    btn.textContent   = '↺ PLAY AGAIN';
  }

  function updateHUD() {
    document.getElementById('gameScore').textContent  = score;
    document.getElementById('gameLevel').textContent  = level;
    document.getElementById('gameLives').textContent  = '❤️'.repeat(Math.max(lives, 0));
    document.getElementById('gameHiscore').textContent = hiScore;
  }

  // Color helpers
  function lighten(hex, amt) {
    let [r,g,b] = hexToRgb(hex);
    return `rgb(${Math.min(r+amt,255)},${Math.min(g+amt,255)},${Math.min(b+amt,255)})`;
  }
  function darken(hex, amt) {
    let [r,g,b] = hexToRgb(hex);
    return `rgb(${Math.max(r-amt,0)},${Math.max(g-amt,0)},${Math.max(b-amt,0)})`;
  }
  function hexToRgb(hex) {
    const h = hex.replace('#','');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }

  return { init };
})();

function initPlayground() { GAME.init(); }


// ──────────────────────────────────────────────
// HERO BIO TYPEWRITER
// ──────────────────────────────────────────────
function initTypewriterBio() {
  const bio = document.querySelector('.hero-bio');
  if (!bio) return;
  const text = bio.textContent.trim();
  bio.innerHTML = '';
  const cursor = document.createElement('span');
  cursor.className = 'hero-bio-cursor';
  bio.appendChild(cursor);
  let i = 0;
  function typeChar() {
    if (i < text.length) {
      bio.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
      setTimeout(typeChar, 18 + Math.random() * 12);
    } else {
      // Remove cursor after done
      setTimeout(() => cursor.remove(), 2000);
    }
  }
  setTimeout(typeChar, 800);
}

// ──────────────────────────────────────────────
// STAT COUNTERS — animated count-up
// ──────────────────────────────────────────────
function initStatCounters() {
  document.querySelectorAll('.hs-n').forEach(el => {
    const raw = el.textContent.trim();
    const num = parseFloat(raw);
    if (isNaN(num)) return;
    const isFloat = raw.includes('.');
    const suffix  = raw.replace(/[\d.]/g, '');
    el.textContent = '0' + suffix;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.disconnect();
        let start = 0; const dur = 1200; const t0 = performance.now();
        function step(now) {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const cur = num * eased;
          el.textContent = (isFloat ? cur.toFixed(2) : Math.round(cur)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    io.observe(el);
  });
}

// ──────────────────────────────────────────────
// 3D CARD TILT on mousemove
// ──────────────────────────────────────────────
function init3DTilt() {
  document.querySelectorAll('.proj-card, .char-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ──────────────────────────────────────────────
// RIPPLE on contact cards
// ──────────────────────────────────────────────
function initRipple() {
  document.querySelectorAll('.contact-card').forEach(card => {
    card.addEventListener('click', e => {
      const rect = card.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const rip  = document.createElement('span');
      rip.className = 'ripple';
      rip.style.cssText = `
        width:${size}px; height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY  - rect.top  - size/2}px;
      `;
      card.appendChild(rip);
      setTimeout(() => rip.remove(), 700);
    });
  });
}

// ──────────────────────────────────────────────
// SECTION WIPE REVEAL
// ──────────────────────────────────────────────
function initSectionWipes() {
  // Only wipe top-level section titles — never card internals like pc-name/tl-title/ec-co
  // those are inside overflow:hidden containers and the observer fires unreliably
  const targets = document.querySelectorAll('.sec-title');
  targets.forEach(el => el.classList.add('sec-wipe'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('wiped');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  targets.forEach(el => io.observe(el));
}
