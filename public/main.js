import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Chess } from 'chess.js';

// ---------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------
const canvas = document.getElementById('board-canvas');
const roleEl = document.getElementById('role');
const turnEl = document.getElementById('turn');
const messageEl = document.getElementById('message');
const whiteStatusEl = document.getElementById('white-status');
const blackStatusEl = document.getElementById('black-status');
const spectatorCountEl = document.getElementById('spectator-count');
const moveListEl = document.getElementById('move-list');
const resetBtn = document.getElementById('reset-btn');
const flipBtn = document.getElementById('flip-btn');
const promotionModal = document.getElementById('promotion-modal');

// ---------------------------------------------------------------------
// Networking & game state
// ---------------------------------------------------------------------
const socket = io();
const localChess = new Chess();

let myColor = 'spectator'; // 'w' | 'b' | 'spectator'
let selectedSquare = null;
let legalTargets = []; // verbose moves from selectedSquare
let pendingPromotion = null; // { from, to }

socket.on('welcome', (state) => {
  myColor = state.color;
  applyState(state);
  updateRoleUI();
});

socket.on('state', (state) => {
  applyState(state);
});

socket.on('illegalMove', (state) => {
  // Resync silently if our local view drifted from the server.
  applyState(state);
  clearSelection();
});

socket.on('players', ({ white, black, spectators }) => {
  whiteStatusEl.textContent = white ? 'ocupado' : 'livre';
  blackStatusEl.textContent = black ? 'ocupado' : 'livre';
  spectatorCountEl.textContent = spectators;
});

function applyState(state) {
  localChess.load(state.fen);
  clearSelection();
  rebuildPieces();
  updateStatusUI(state);
}

function updateRoleUI() {
  if (myColor === 'w') roleEl.textContent = 'Você joga com as Brancas';
  else if (myColor === 'b') roleEl.textContent = 'Você joga com as Pretas';
  else roleEl.textContent = 'Você é Espectador';
}

function updateStatusUI(state) {
  turnEl.textContent = state.turn === 'w' ? 'Vez das Brancas' : 'Vez das Pretas';

  let message = '';
  switch (state.status) {
    case 'checkmate': {
      const winner = state.turn === 'w' ? 'Pretas' : 'Brancas';
      message = `Xeque-mate! ${winner} vencem.`;
      break;
    }
    case 'stalemate':
      message = 'Empate por afogamento (stalemate).';
      break;
    case 'threefold':
      message = 'Empate por repetição tripla.';
      break;
    case 'insufficient':
      message = 'Empate por material insuficiente.';
      break;
    case 'draw':
      message = 'Empate.';
      break;
    case 'check':
      message = 'Xeque!';
      break;
    default:
      message = '';
  }
  messageEl.textContent = message;

  moveListEl.innerHTML = '';
  state.history.forEach((move, i) => {
    if (i % 2 === 0) {
      const li = document.createElement('li');
      li.dataset.index = Math.floor(i / 2) + 1;
      li.textContent = move.san;
      moveListEl.appendChild(li);
    } else {
      const last = moveListEl.lastElementChild;
      if (last) last.textContent += `  ${move.san}`;
    }
  });
  moveListEl.scrollTop = moveListEl.scrollHeight;
}

// ---------------------------------------------------------------------
// Three.js scene setup
// ---------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 8.5, 8);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 5;
controls.maxDistance = 16;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.target.set(0, 0, 0);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting
scene.add(new THREE.HemisphereLight(0xffffff, 0x404060, 0.6));

const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
dirLight.position.set(6, 12, 6);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -8;
dirLight.shadow.camera.right = 8;
dirLight.shadow.camera.top = 8;
dirLight.shadow.camera.bottom = -8;
scene.add(dirLight);

// ---------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------
const LIGHT_COLOR = 0xf0d9b5;
const DARK_COLOR = 0xb58863;
const SELECT_COLOR = 0x4caf50;
const TARGET_COLOR = 0xffd166;
const CAPTURE_COLOR = 0xef476f;
const CHECK_COLOR = 0xff3b3b;

const boardGroup = new THREE.Group();
scene.add(boardGroup);

// Base slab beneath the squares
const baseGeo = new THREE.BoxGeometry(8.6, 0.3, 8.6);
const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 });
const baseMesh = new THREE.Mesh(baseGeo, baseMat);
baseMesh.position.y = -0.18;
baseMesh.receiveShadow = true;
boardGroup.add(baseMesh);

const squareMeshes = new Map(); // square name -> mesh
const squareGeo = new THREE.BoxGeometry(1, 0.05, 1);
const lightMat = new THREE.MeshStandardMaterial({ color: LIGHT_COLOR, roughness: 0.6 });
const darkMat = new THREE.MeshStandardMaterial({ color: DARK_COLOR, roughness: 0.6 });

function squareToPosition(square) {
  const file = square.charCodeAt(0) - 97; // 0-7 (a-h)
  const rank = parseInt(square[1], 10) - 1; // 0-7 (1-8)
  return { x: file - 3.5, z: 3.5 - rank };
}

for (let file = 0; file < 8; file++) {
  for (let rank = 0; rank < 8; rank++) {
    const square = String.fromCharCode(97 + file) + (rank + 1);
    const isLight = (file + rank) % 2 === 1;
    const mesh = new THREE.Mesh(squareGeo, isLight ? lightMat : darkMat);
    const { x, z } = squareToPosition(square);
    mesh.position.set(x, 0, z);
    mesh.receiveShadow = true;
    mesh.userData.square = square;
    boardGroup.add(mesh);
    squareMeshes.set(square, mesh);
  }
}

// ---------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.35, metalness: 0.05 });
const blackMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.35, metalness: 0.1 });

function materialFor(color) {
  return color === 'w' ? whiteMat : blackMat;
}

function addMesh(group, geometry, material, position, rotation) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, position.z);
  if (rotation) mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function createPawn(mat) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.28, 0.32, 0.12, 24), mat, { x: 0, y: 0.06, z: 0 });
  addMesh(g, new THREE.CylinderGeometry(0.14, 0.2, 0.32, 24), mat, { x: 0, y: 0.28, z: 0 });
  addMesh(g, new THREE.SphereGeometry(0.18, 20, 16), mat, { x: 0, y: 0.55, z: 0 });
  return g;
}

function createRook(mat) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.32, 0.36, 0.12, 24), mat, { x: 0, y: 0.06, z: 0 });
  addMesh(g, new THREE.CylinderGeometry(0.26, 0.3, 0.5, 24), mat, { x: 0, y: 0.37, z: 0 });
  addMesh(g, new THREE.CylinderGeometry(0.34, 0.3, 0.12, 24), mat, { x: 0, y: 0.68, z: 0 });
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    addMesh(g, new THREE.BoxGeometry(0.12, 0.14, 0.12), mat, {
      x: Math.cos(angle) * 0.2,
      y: 0.81,
      z: Math.sin(angle) * 0.2,
    });
  }
  return g;
}

function createKnight(mat) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.3, 0.34, 0.12, 24), mat, { x: 0, y: 0.06, z: 0 });
  addMesh(g, new THREE.CylinderGeometry(0.22, 0.28, 0.35, 24), mat, { x: 0, y: 0.295, z: 0 });
  addMesh(g, new THREE.BoxGeometry(0.22, 0.4, 0.3), mat, { x: 0, y: 0.57, z: -0.02 }, { x: -0.45 });
  addMesh(g, new THREE.BoxGeometry(0.2, 0.2, 0.46), mat, { x: 0, y: 0.79, z: 0.18 });
  addMesh(g, new THREE.ConeGeometry(0.06, 0.18, 8), mat, { x: 0, y: 0.92, z: -0.05 }, { x: -0.3 });
  return g;
}

function createBishop(mat) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.3, 0.34, 0.12, 24), mat, { x: 0, y: 0.06, z: 0 });
  addMesh(g, new THREE.ConeGeometry(0.26, 0.55, 24), mat, { x: 0, y: 0.395, z: 0 });
  addMesh(g, new THREE.TorusGeometry(0.16, 0.04, 12, 24), mat, { x: 0, y: 0.62, z: 0 }, { x: Math.PI / 2 });
  addMesh(g, new THREE.SphereGeometry(0.13, 16, 16), mat, { x: 0, y: 0.78, z: 0 });
  addMesh(g, new THREE.SphereGeometry(0.04, 8, 8), mat, { x: 0, y: 0.92, z: 0 });
  return g;
}

function createQueen(mat) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.34, 0.38, 0.12, 24), mat, { x: 0, y: 0.06, z: 0 });
  addMesh(g, new THREE.CylinderGeometry(0.16, 0.3, 0.6, 24), mat, { x: 0, y: 0.42, z: 0 });
  addMesh(g, new THREE.TorusGeometry(0.2, 0.05, 12, 24), mat, { x: 0, y: 0.72, z: 0 }, { x: Math.PI / 2 });
  addMesh(g, new THREE.SphereGeometry(0.18, 20, 16), mat, { x: 0, y: 0.84, z: 0 });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    addMesh(g, new THREE.ConeGeometry(0.045, 0.16, 8), mat, {
      x: Math.cos(angle) * 0.15,
      y: 0.96,
      z: Math.sin(angle) * 0.15,
    });
  }
  addMesh(g, new THREE.SphereGeometry(0.06, 12, 12), mat, { x: 0, y: 1.06, z: 0 });
  return g;
}

function createKing(mat) {
  const g = new THREE.Group();
  addMesh(g, new THREE.CylinderGeometry(0.34, 0.38, 0.12, 24), mat, { x: 0, y: 0.06, z: 0 });
  addMesh(g, new THREE.CylinderGeometry(0.18, 0.3, 0.65, 24), mat, { x: 0, y: 0.445, z: 0 });
  addMesh(g, new THREE.TorusGeometry(0.22, 0.05, 12, 24), mat, { x: 0, y: 0.77, z: 0 }, { x: Math.PI / 2 });
  addMesh(g, new THREE.SphereGeometry(0.15, 20, 16), mat, { x: 0, y: 0.9, z: 0 });
  addMesh(g, new THREE.BoxGeometry(0.08, 0.32, 0.08), mat, { x: 0, y: 1.16, z: 0 });
  addMesh(g, new THREE.BoxGeometry(0.22, 0.08, 0.08), mat, { x: 0, y: 1.2, z: 0 });
  return g;
}

const PIECE_BUILDERS = {
  p: createPawn,
  r: createRook,
  n: createKnight,
  b: createBishop,
  q: createQueen,
  k: createKing,
};

const piecesGroup = new THREE.Group();
scene.add(piecesGroup);

function rebuildPieces() {
  while (piecesGroup.children.length) {
    piecesGroup.remove(piecesGroup.children[0]);
  }

  const board = localChess.board();
  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue;
      const builder = PIECE_BUILDERS[cell.type];
      const mesh = builder(materialFor(cell.color));
      const { x, z } = squareToPosition(cell.square);
      mesh.position.set(x, 0.025, z);
      mesh.userData.square = cell.square;
      mesh.userData.pieceType = cell.type;
      mesh.userData.pieceColor = cell.color;
      piecesGroup.add(mesh);
    }
  }

  refreshKingCheckHighlight();
}

// ---------------------------------------------------------------------
// Highlights (selection / legal moves / check)
// ---------------------------------------------------------------------
const highlightGroup = new THREE.Group();
scene.add(highlightGroup);

const selectMat = new THREE.MeshBasicMaterial({ color: SELECT_COLOR, transparent: true, opacity: 0.55 });
const targetMat = new THREE.MeshBasicMaterial({ color: TARGET_COLOR, transparent: true, opacity: 0.6 });
const captureMat = new THREE.MeshBasicMaterial({ color: CAPTURE_COLOR, transparent: true, opacity: 0.5 });
const checkMat = new THREE.MeshBasicMaterial({ color: CHECK_COLOR, transparent: true, opacity: 0.55 });

const highlightDisc = new THREE.CylinderGeometry(0.46, 0.46, 0.06, 32);
const highlightDot = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 24);
const highlightRing = new THREE.TorusGeometry(0.42, 0.06, 12, 32);

function clearHighlights() {
  while (highlightGroup.children.length) {
    highlightGroup.remove(highlightGroup.children[0]);
  }
}

function addHighlight(square, geometry, material, rotateFlat = false) {
  const mesh = new THREE.Mesh(geometry, material);
  const { x, z } = squareToPosition(square);
  mesh.position.set(x, 0.07, z);
  // CylinderGeometry already lies flat on the XZ plane; TorusGeometry needs
  // a 90deg tilt around X to lie flat instead of standing up.
  if (rotateFlat) mesh.rotation.x = Math.PI / 2;
  highlightGroup.add(mesh);
}

function refreshKingCheckHighlight() {
  if (localChess.isCheck()) {
    const turnColor = localChess.turn();
    const board = localChess.board();
    for (const row of board) {
      for (const cell of row) {
        if (cell && cell.type === 'k' && cell.color === turnColor) {
          addHighlight(cell.square, highlightDisc, checkMat);
        }
      }
    }
  }
}

function renderSelectionHighlights() {
  clearHighlights();
  if (selectedSquare) {
    addHighlight(selectedSquare, highlightDisc, selectMat);
    const seen = new Set();
    for (const move of legalTargets) {
      if (seen.has(move.to)) continue;
      seen.add(move.to);
      if (move.flags.includes('c') || move.flags.includes('e')) {
        addHighlight(move.to, highlightRing, captureMat, true);
      } else {
        addHighlight(move.to, highlightDot, targetMat);
      }
    }
  }
  refreshKingCheckHighlight();
}

// ---------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function clearSelection() {
  selectedSquare = null;
  legalTargets = [];
  renderSelectionHighlights();
}

function trySelect(square) {
  const piece = localChess.get(square);
  if (!piece) return false;
  if (piece.color !== myColor) return false;
  if (localChess.turn() !== myColor) return false;

  const moves = localChess.moves({ square, verbose: true });
  if (moves.length === 0) return false;

  selectedSquare = square;
  legalTargets = moves;
  renderSelectionHighlights();
  return true;
}

function attemptMove(from, to) {
  const move = legalTargets.find((m) => m.to === to);
  if (!move) return;

  const isPromotion = move.flags.includes('p');
  if (isPromotion) {
    pendingPromotion = { from, to };
    promotionModal.classList.remove('hidden');
    return;
  }

  socket.emit('move', { from, to });
  clearSelection();
}

promotionModal.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-piece]');
  if (!btn || !pendingPromotion) return;
  socket.emit('move', {
    from: pendingPromotion.from,
    to: pendingPromotion.to,
    promotion: btn.dataset.piece,
  });
  pendingPromotion = null;
  promotionModal.classList.add('hidden');
  clearSelection();
});

function onCanvasClick(event) {
  if (!promotionModal.classList.contains('hidden')) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(
    [...piecesGroup.children, ...squareMeshes.values()],
    true
  );

  let square = null;
  for (const hit of intersects) {
    let obj = hit.object;
    while (obj && !obj.userData.square) obj = obj.parent;
    if (obj && obj.userData.square) {
      square = obj.userData.square;
      break;
    }
  }

  if (!square) {
    clearSelection();
    return;
  }

  if (selectedSquare) {
    if (square === selectedSquare) {
      clearSelection();
      return;
    }
    const isTarget = legalTargets.some((m) => m.to === square);
    if (isTarget) {
      attemptMove(selectedSquare, square);
      return;
    }
    if (!trySelect(square)) {
      clearSelection();
    }
  } else {
    trySelect(square);
  }
}

// Ignore clicks that are actually the end of a camera-drag gesture.
let pointerDownPos = null;
renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerDownPos = { x: event.clientX, y: event.clientY };
});
renderer.domElement.addEventListener('click', (event) => {
  if (pointerDownPos) {
    const dx = event.clientX - pointerDownPos.x;
    const dy = event.clientY - pointerDownPos.y;
    if (Math.hypot(dx, dy) > 5) return;
  }
  onCanvasClick(event);
});

// ---------------------------------------------------------------------
// UI buttons
// ---------------------------------------------------------------------
resetBtn.addEventListener('click', () => {
  socket.emit('reset');
});

let flipped = false;
flipBtn.addEventListener('click', () => {
  flipped = !flipped;
  const z = flipped ? -8 : 8;
  camera.position.set(0, 8.5, z);
  controls.target.set(0, 0, 0);
});

// ---------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
