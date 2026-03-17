// ── Win98 Maze ──────────────────────────────────────────────────────────────
// Recursive-backtracker maze generator + canvas renderer

const canvas  = document.getElementById('maze-canvas');
const ctx     = canvas.getContext('2d');
const levelEl = document.getElementById('level-num');
const stepEl  = document.getElementById('step-count');
const timerEl = document.getElementById('timer');
const statusEl= document.getElementById('status-msg');
const dialog  = document.getElementById('dialog');
const dialogMsg = document.getElementById('dialog-msg');

// ── State ────────────────────────────────────────────────────────────────────
let level = 1;
let grid, cols, rows, cellSize;
let player, exit;
let steps = 0;
let startTime, timerInterval;
let gameActive = false;

// ── Cell flags (bitmask) ─────────────────────────────────────────────────────
const N = 1, S = 2, E = 4, W = 8, VISITED = 16;
const OPPOSITE = { [N]: S, [S]: N, [E]: W, [W]: E };
const DX = { [N]: 0, [S]: 0, [E]: 1, [W]: -1 };
const DY = { [N]: -1, [S]: 1, [E]: 0, [W]: 0 };

// ── Maze generation (recursive backtracker) ───────────────────────────────────
function generateMaze(c, r) {
  const g = new Uint8Array(c * r);
  const stack = [];
  const idx = (x, y) => y * c + x;

  function carve(x, y) {
    g[idx(x, y)] |= VISITED;
    const dirs = shuffle([N, S, E, W]);
    for (const d of dirs) {
      const nx = x + DX[d], ny = y + DY[d];
      if (nx >= 0 && nx < c && ny >= 0 && ny < r && !(g[idx(nx, ny)] & VISITED)) {
        g[idx(x, y)]  |= d;
        g[idx(nx, ny)] |= OPPOSITE[d];
        carve(nx, ny);
      }
    }
  }

  carve(0, 0);
  return g;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Start a new game ─────────────────────────────────────────────────────────
function newGame(lvl) {
  level = lvl;
  levelEl.textContent = level;

  // Scale maze size with level
  const base = 7 + (level - 1) * 2;
  cols = Math.min(base, 21);
  rows = Math.min(base, 21);
  cellSize = Math.floor(canvas.width / cols);

  // Resize canvas to fit grid exactly
  canvas.width  = cols * cellSize;
  canvas.height = rows * cellSize;

  grid = generateMaze(cols, rows);
  player = { x: 0, y: 0 };
  exit   = { x: cols - 1, y: rows - 1 };

  steps = 0;
  stepEl.textContent = 0;
  startTime = Date.now();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  gameActive = true;

  dialog.classList.add('hidden');
  statusEl.textContent = 'Use arrow keys or WASD to navigate the maze. Find the exit!';

  draw();
}

function updateTimer() {
  const secs = Math.floor((Date.now() - startTime) / 1000);
  timerEl.textContent = secs + 's';
}

// ── Drawing ──────────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cs = cellSize;
  const wallColor   = '#000080';
  const exitColor   = '#00aa00';
  const playerColor = '#ff0000';
  const visitedColor = '#ddeeff';

  // Draw cells
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = grid[y * cols + x];
      const px = x * cs, py = y * cs;

      ctx.strokeStyle = wallColor;
      ctx.lineWidth = 2;

      // North wall
      if (!(cell & N)) {
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + cs, py); ctx.stroke();
      }
      // South wall
      if (!(cell & S)) {
        ctx.beginPath(); ctx.moveTo(px, py + cs); ctx.lineTo(px + cs, py + cs); ctx.stroke();
      }
      // West wall
      if (!(cell & W)) {
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + cs); ctx.stroke();
      }
      // East wall
      if (!(cell & E)) {
        ctx.beginPath(); ctx.moveTo(px + cs, py); ctx.lineTo(px + cs, py + cs); ctx.stroke();
      }
    }
  }

  // Exit marker
  ctx.fillStyle = exitColor;
  const margin = Math.max(2, cs * 0.15);
  ctx.fillRect(exit.x * cs + margin, exit.y * cs + margin, cs - margin * 2, cs - margin * 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.floor(cs * 0.55)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('E', exit.x * cs + cs / 2, exit.y * cs + cs / 2);

  // Player
  ctx.fillStyle = playerColor;
  const r = cs * 0.35;
  ctx.beginPath();
  ctx.arc(player.x * cs + cs / 2, player.y * cs + cs / 2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#800000';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ── Movement ─────────────────────────────────────────────────────────────────
function move(dir) {
  if (!gameActive) return;

  const cell = grid[player.y * cols + player.x];
  if (!(cell & dir)) return; // wall blocks

  player.x += DX[dir];
  player.y += DY[dir];
  steps++;
  stepEl.textContent = steps;

  draw();

  if (player.x === exit.x && player.y === exit.y) {
    gameActive = false;
    clearInterval(timerInterval);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    dialogMsg.textContent =
      `Level ${level} complete in ${steps} steps and ${elapsed}s!`;
    dialog.classList.remove('hidden');
    statusEl.textContent = 'You found the exit!';
  }
}

// ── Keyboard input ────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W': e.preventDefault(); move(N); break;
    case 'ArrowDown':  case 's': case 'S': e.preventDefault(); move(S); break;
    case 'ArrowRight': case 'd': case 'D': e.preventDefault(); move(E); break;
    case 'ArrowLeft':  case 'a': case 'A': e.preventDefault(); move(W); break;
  }
});

// ── Touch / swipe support ────────────────────────────────────────────────────
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    move(dx > 0 ? E : W);
  } else {
    move(dy > 0 ? S : N);
  }
  e.preventDefault();
}, { passive: false });

// ── UI buttons ────────────────────────────────────────────────────────────────
document.getElementById('btn-new').addEventListener('click', () => newGame(1));
document.getElementById('btn-next').addEventListener('click', () => newGame(level + 1));
document.getElementById('btn-quit').addEventListener('click', () => newGame(1));
document.getElementById('btn-close').addEventListener('click', () => {
  document.getElementById('window').style.display = 'none';
});

// ── Taskbar clock ─────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('taskbar-clock').textContent = `${h}:${m}`;
}
updateClock();
setInterval(updateClock, 10000);

// ── Draggable window ──────────────────────────────────────────────────────────
(function makeDraggable() {
  const win = document.getElementById('window');
  const bar = document.getElementById('title-bar');
  let dragging = false, offX = 0, offY = 0;

  bar.addEventListener('mousedown', e => {
    dragging = true;
    const rect = win.getBoundingClientRect();
    offX = e.clientX - rect.left;
    offY = e.clientY - rect.top;
    win.style.transform = 'none';
    win.style.left = rect.left + 'px';
    win.style.top  = rect.top  + 'px';
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    win.style.left = (e.clientX - offX) + 'px';
    win.style.top  = (e.clientY - offY) + 'px';
  });

  document.addEventListener('mouseup', () => { dragging = false; });
})();

// ── Init ─────────────────────────────────────────────────────────────────────
newGame(1);
