import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';

/* ===== Constantes ===== */

const STICKER_COLORS = {
  U: 0xffffff, // branco
  D: 0xffd500, // amarelo
  F: 0x009b48, // verde
  B: 0x0046ad, // azul
  R: 0xb71234, // vermelho
  L: 0xff5800, // laranja
};
const INNER_COLOR = 0x11141b;

// Eixo, camada e sentido (horário visto de fora da face) de cada giro
const MOVES = {
  U: { axis: 'y', layer: 1, dir: -1 },
  D: { axis: 'y', layer: -1, dir: 1 },
  R: { axis: 'x', layer: 1, dir: -1 },
  L: { axis: 'x', layer: -1, dir: 1 },
  F: { axis: 'z', layer: 1, dir: -1 },
  B: { axis: 'z', layer: -1, dir: 1 },
};

const MOVE_RE = /^[URFDLB](2|')?$/;

/* ===== Cena 3D ===== */

const canvas = document.getElementById('cube-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10131a);

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(4.5, 4.2, 6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 16;

scene.add(new THREE.AmbientLight(0xffffff, 1.1));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(5, 8, 6);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
fillLight.position.set(-6, -4, -5);
scene.add(fillLight);

const pivot = new THREE.Group();
scene.add(pivot);

let cubies = [];

function createCubie(x, y, z) {
  const geometry = new THREE.BoxGeometry(0.92, 0.92, 0.92);
  // Ordem dos materiais no BoxGeometry: +x, -x, +y, -y, +z, -z
  const faceOfSlot = [
    x === 1 ? 'R' : null,
    x === -1 ? 'L' : null,
    y === 1 ? 'U' : null,
    y === -1 ? 'D' : null,
    z === 1 ? 'F' : null,
    z === -1 ? 'B' : null,
  ];
  const materials = faceOfSlot.map((face) =>
    new THREE.MeshLambertMaterial({
      color: face ? STICKER_COLORS[face] : INNER_COLOR,
    })
  );
  const mesh = new THREE.Mesh(geometry, materials);
  mesh.position.set(x, y, z);
  return mesh;
}

function buildCube() {
  for (const cubie of cubies) {
    scene.remove(cubie);
    cubie.geometry.dispose();
    cubie.material.forEach((m) => m.dispose());
  }
  cubies = [];
  for (const x of [-1, 0, 1]) {
    for (const y of [-1, 0, 1]) {
      for (const z of [-1, 0, 1]) {
        if (x === 0 && y === 0 && z === 0) continue;
        const cubie = createCubie(x, y, z);
        cubies.push(cubie);
        scene.add(cubie);
      }
    }
  }
}

function resize() {
  const { clientWidth: w, clientHeight: h } = canvas;
  if (canvas.width !== w * devicePixelRatio || canvas.height !== h * devicePixelRatio) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}
window.addEventListener('resize', resize);

/* ===== Estado lógico e animação ===== */

const cubeState = new Cube(); // estado lógico (cubejs)
let history = [];

const queue = [];
let animating = false;
let currentAnim = null;

const speedInput = document.getElementById('speed');
const animDuration = () => 660 - Number(speedInput.value); // slider maior = mais rápido

function parseSequence(text) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const moves = tokens.map((t) => t[0].toUpperCase() + t.slice(1));
  if (!moves.length || !moves.every((m) => MOVE_RE.test(m))) return null;
  return moves;
}

function enqueueMoves(moves, ctx = {}) {
  for (let i = 0; i < moves.length; i++) {
    queue.push({ move: moves[i], ctx: { ...ctx, index: i, total: moves.length } });
  }
  updateControlsState();
  processQueue();
}

function processQueue() {
  if (animating || !queue.length) return;
  const item = queue.shift();
  startMoveAnimation(item);
}

function startMoveAnimation(item) {
  animating = true;
  const face = item.move[0];
  const suffix = item.move.slice(1);
  const turns = suffix === '2' ? 2 : 1;
  const sign = suffix === "'" ? -1 : 1;
  const def = MOVES[face];
  const targetAngle = def.dir * sign * turns * (Math.PI / 2);

  pivot.rotation.set(0, 0, 0);
  pivot.updateMatrixWorld();
  for (const cubie of cubies) {
    if (Math.round(cubie.position[def.axis]) === def.layer) {
      pivot.attach(cubie);
    }
  }

  if (item.ctx.type === 'solve') highlightSolutionMove(item.ctx.index);

  currentAnim = {
    item,
    axis: def.axis,
    targetAngle,
    startTime: performance.now(),
    duration: animDuration() * turns,
  };
}

function finishMoveAnimation() {
  const { item, axis, targetAngle } = currentAnim;
  pivot.rotation[axis] = targetAngle;
  pivot.updateMatrixWorld();

  // Devolve os cubies à cena e alinha posições/rotações à grade
  for (const cubie of [...pivot.children]) {
    scene.attach(cubie);
    cubie.position.round();
    const e = cubie.rotation;
    const step = Math.PI / 2;
    e.set(
      Math.round(e.x / step) * step,
      Math.round(e.y / step) * step,
      Math.round(e.z / step) * step
    );
  }
  pivot.rotation.set(0, 0, 0);

  cubeState.move(item.move);
  history.push(item.move);
  renderHistory();

  if (item.ctx.type === 'solve') {
    markSolutionMoveDone(item.ctx.index);
    if (item.ctx.index === item.ctx.total - 1) playbackActive = false;
  }

  currentAnim = null;
  animating = false;

  if (queue.length) {
    processQueue();
  } else {
    updateControlsState();
    updateSolution();
  }
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function animate(now) {
  requestAnimationFrame(animate);
  resize();
  controls.update();

  if (currentAnim) {
    const t = Math.min((now - currentAnim.startTime) / currentAnim.duration, 1);
    pivot.rotation[currentAnim.axis] = currentAnim.targetAngle * easeInOut(t);
    if (t >= 1) finishMoveAnimation();
  }

  renderer.render(scene, camera);
}

/* ===== Solver (em tempo real) ===== */

const statusEl = document.getElementById('status');
const solutionEl = document.getElementById('solution');
const historyEl = document.getElementById('history');
const solveBtn = document.getElementById('solve-btn');

let solverReady = false;
let solveRequestId = 0;
let currentSolution = [];
let playbackActive = false;

function updateSolution() {
  if (playbackActive) return;
  if (cubeState.isSolved()) {
    currentSolution = [];
    solutionEl.classList.add('solved');
    solutionEl.textContent = 'Cubo resolvido! 🎉';
    updateControlsState();
    return;
  }
  solutionEl.classList.remove('solved');
  if (!solverReady) {
    solutionEl.textContent = 'Aguardando o solver carregar…';
    return;
  }
  solutionEl.textContent = 'Calculando solução…';
  const id = ++solveRequestId;
  cubeState.asyncSolve((algorithm) => {
    if (id !== solveRequestId || playbackActive) return;
    currentSolution = algorithm.trim().split(/\s+/).filter(Boolean);
    renderSolution();
    updateControlsState();
  });
}

function renderSolution() {
  solutionEl.classList.remove('solved');
  solutionEl.innerHTML = currentSolution
    .map((m, i) => `<span class="tok" data-i="${i}">${m}</span>`)
    .join(' ');
}

function highlightSolutionMove(i) {
  const tok = solutionEl.querySelector(`.tok[data-i="${i}"]`);
  if (tok) tok.classList.add('current');
}

function markSolutionMoveDone(i) {
  const tok = solutionEl.querySelector(`.tok[data-i="${i}"]`);
  if (tok) tok.classList.replace('current', 'done');
}

function renderHistory() {
  historyEl.textContent = history.length ? history.join(' ') : '—';
  historyEl.scrollTop = historyEl.scrollHeight;
}

function updateControlsState() {
  const busy = playbackActive || queue.length > 0 || animating;
  for (const btn of document.querySelectorAll('.move')) btn.disabled = playbackActive;
  document.getElementById('scramble-btn').disabled = playbackActive;
  document.getElementById('reset-btn').disabled = playbackActive;
  solveBtn.disabled =
    busy || !solverReady || cubeState.isSolved() || currentSolution.length === 0;
}

Cube.asyncInit('vendor/worker.js', () => {
  solverReady = true;
  statusEl.textContent = 'Solver pronto. Embaralhe o cubo!';
  setTimeout(() => statusEl.remove(), 4000);
  updateSolution();
});

/* ===== Interações ===== */

for (const btn of document.querySelectorAll('.move')) {
  btn.addEventListener('click', () => {
    if (playbackActive) return;
    enqueueMoves([btn.dataset.move], { type: 'user' });
  });
}

document.getElementById('sequence-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (playbackActive) return;
  const input = document.getElementById('sequence-input');
  const moves = parseSequence(input.value);
  if (!moves) {
    input.setCustomValidity("Use movimentos como R, U', F2 separados por espaço.");
    input.reportValidity();
    return;
  }
  input.setCustomValidity('');
  input.value = '';
  enqueueMoves(moves, { type: 'user' });
});

document.getElementById('sequence-input').addEventListener('input', (e) => {
  e.target.setCustomValidity('');
});

document.getElementById('scramble-btn').addEventListener('click', () => {
  if (playbackActive) return;
  const faces = Object.keys(MOVES);
  const suffixes = ['', "'", '2'];
  const moves = [];
  let lastFace = null;
  while (moves.length < 25) {
    const face = faces[Math.floor(Math.random() * faces.length)];
    if (face === lastFace) continue;
    lastFace = face;
    moves.push(face + suffixes[Math.floor(Math.random() * suffixes.length)]);
  }
  enqueueMoves(moves, { type: 'scramble' });
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (playbackActive) return;
  queue.length = 0;
  currentAnim = null;
  animating = false;
  pivot.rotation.set(0, 0, 0);
  for (const cubie of [...pivot.children]) scene.attach(cubie);
  cubeState.identity();
  history = [];
  buildCube();
  renderHistory();
  updateSolution();
});

solveBtn.addEventListener('click', () => {
  if (playbackActive || !currentSolution.length) return;
  playbackActive = true;
  renderSolution();
  enqueueMoves(currentSolution, { type: 'solve' });
});

/* ===== Início ===== */

buildCube();
renderHistory();
updateSolution();
resize();
requestAnimationFrame(animate);
