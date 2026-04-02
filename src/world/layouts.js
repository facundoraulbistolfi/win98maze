export const CELL = 10;
export const ROWS = 12;
export const COLS = 12;

export const SIDE_ORDER = ["north", "east", "south", "west"];

export const SIDE_VECTORS = {
  north: { dr: -1, dc: 0 },
  east: { dr: 0, dc: 1 },
  south: { dr: 1, dc: 0 },
  west: { dr: 0, dc: -1 },
};

export const OPPOSITE_SIDE = {
  north: "south",
  east: "west",
  south: "north",
  west: "east",
};

export const LAYOUT_LABELS = {
  classic_maze: "Maze clasico",
  loop_maze: "Maze con loops",
  dense_maze: "Maze denso",
  room_maze: "Maze con salas",
  ring_maze: "Maze con anillo",
  sanctuary_maze: "Maze con santuario",
};

function stringHash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function hash32(...values) {
  let h = 2166136261;
  values.forEach((value) => {
    const numeric = typeof value === "string" ? stringHash(value) : value >>> 0;
    h ^= numeric;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
  });
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeSeededRand(sessionSeed, cr = 0, cc = 0, salt = 0) {
  const seed = hash32(sessionSeed, cr + 1024, cc + 2048, salt, 0x9e3779b9) || 1;
  return mulberry32(seed);
}

export function randInt(rand, min, max) {
  return min + Math.floor(rand() * (max - min));
}

export function pickWeighted(rand, items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let remaining = rand() * total;
  for (const item of items) {
    remaining -= item.weight;
    if (remaining <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

export function shuffle(list, rand) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCenters(rows, cols) {
  return {
    centerR: Math.floor(rows / 2),
    centerC: Math.floor(cols / 2),
  };
}

export function createWalls(rows = ROWS, cols = COLS) {
  return {
    h: Array.from({ length: rows + 1 }, () => Array(cols).fill(true)),
    v: Array.from({ length: rows }, () => Array(cols + 1).fill(true)),
  };
}

export function openBetween(walls, r1, c1, r2, c2) {
  if (r1 === r2) {
    walls.v[r1][Math.max(c1, c2)] = false;
    return;
  }
  walls.h[Math.max(r1, r2)][c1] = false;
}

export function carvePath(walls, points) {
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    let r = start.r;
    let c = start.c;
    while (c !== end.c) {
      const next = c + Math.sign(end.c - c);
      openBetween(walls, r, c, r, next);
      c = next;
    }
    while (r !== end.r) {
      const next = r + Math.sign(end.r - r);
      openBetween(walls, r, c, next, c);
      r = next;
    }
  }
}

export function carveRow(walls, row, from, to) {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  for (let c = start; c < end; c += 1) {
    openBetween(walls, row, c, row, c + 1);
  }
}

export function carveCol(walls, col, from, to) {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  for (let r = start; r < end; r += 1) {
    openBetween(walls, r, col, r + 1, col);
  }
}

export function openBorder(walls, side, index, rows = ROWS, cols = COLS) {
  if (side === "east") {
    walls.v[index][cols] = false;
    return { r: index, c: cols - 1 };
  }
  if (side === "west") {
    walls.v[index][0] = false;
    return { r: index, c: 0 };
  }
  if (side === "south") {
    walls.h[rows][index] = false;
    return { r: rows - 1, c: index };
  }
  walls.h[0][index] = false;
  return { r: 0, c: index };
}

function neighborsOf(walls, rows, cols, r, c) {
  const neighbors = [];
  if (r > 0 && !walls.h[r][c]) neighbors.push({ r: r - 1, c });
  if (r < rows - 1 && !walls.h[r + 1][c]) neighbors.push({ r: r + 1, c });
  if (c > 0 && !walls.v[r][c]) neighbors.push({ r, c: c - 1 });
  if (c < cols - 1 && !walls.v[r][c + 1]) neighbors.push({ r, c: c + 1 });
  return neighbors;
}

function areConnected(walls, rows, cols, start, target) {
  const queue = [start];
  const visited = new Set([`${start.r}_${start.c}`]);
  while (queue.length) {
    const current = queue.shift();
    if (current.r === target.r && current.c === target.c) return true;
    for (const next of neighborsOf(walls, rows, cols, current.r, current.c)) {
      const key = `${next.r}_${next.c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  return false;
}

function uniqueCells(cells, rows, cols) {
  const seen = new Set();
  return cells.filter((cell) => {
    if (!cell) return false;
    if (cell.r < 0 || cell.r >= rows || cell.c < 0 || cell.c >= cols) return false;
    const key = `${cell.r}_${cell.c}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function connectCells(walls, rows, cols, cells) {
  const list = uniqueCells(cells, rows, cols);
  if (list.length < 2) return;
  const anchor = list[0];
  for (let i = 1; i < list.length; i += 1) {
    if (!areConnected(walls, rows, cols, anchor, list[i])) {
      carvePath(walls, [list[i], anchor]);
    }
  }
}

function generateBaseMaze(rows, cols, rand) {
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const walls = createWalls(rows, cols);
  const stack = [[0, 0]];
  visited[0][0] = true;
  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const next = shuffle(dirs, rand)
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]);
    if (!next.length) {
      stack.pop();
      continue;
    }
    const [nr, nc] = next[0];
    openBetween(walls, r, c, nr, nc);
    visited[nr][nc] = true;
    stack.push([nr, nc]);
  }
  return walls;
}

function openRandomInteriorWall(walls, rows, cols, rand, attempts = 18) {
  for (let i = 0; i < attempts; i += 1) {
    if (rand() < 0.5) {
      const r = randInt(rand, 0, rows);
      const c = randInt(rand, 0, cols - 1);
      if (r <= 0 || r >= rows) continue;
      walls.h[r][c] = false;
      return;
    }
    const r = randInt(rand, 0, rows - 1);
    const c = randInt(rand, 0, cols);
    if (c <= 0 || c >= cols) continue;
    walls.v[r][c] = false;
    return;
  }
}

function addRandomLoops(walls, rows, cols, rand, count) {
  for (let i = 0; i < count; i += 1) {
    openRandomInteriorWall(walls, rows, cols, rand);
  }
}

function carvePocketRoom(walls, top, left, height, width) {
  const bottom = top + height - 1;
  const right = left + width - 1;
  for (let r = top; r <= bottom; r += 1) {
    for (let c = left; c < right; c += 1) {
      openBetween(walls, r, c, r, c + 1);
    }
  }
  for (let r = top; r < bottom; r += 1) {
    for (let c = left; c <= right; c += 1) {
      openBetween(walls, r, c, r + 1, c);
    }
  }
}

function addPocketRooms(walls, rows, cols, rand, roomCount) {
  for (let i = 0; i < roomCount; i += 1) {
    const height = rand() < 0.55 ? 2 : 3;
    const width = rand() < 0.55 ? 2 : 3;
    const top = randInt(rand, 1, rows - height - 1);
    const left = randInt(rand, 1, cols - width - 1);
    carvePocketRoom(walls, top, left, height, width);
    addRandomLoops(walls, rows, cols, rand, 1);
  }
}

function addPartialRing(walls, rows, cols, centerR, centerC, rand) {
  const radius = rand() < 0.5 ? 2 : 3;
  const top = clamp(centerR - radius, 1, rows - 2);
  const bottom = clamp(centerR + radius, 1, rows - 2);
  const left = clamp(centerC - radius, 1, cols - 2);
  const right = clamp(centerC + radius, 1, cols - 2);
  const gapSide = SIDE_ORDER[randInt(rand, 0, SIDE_ORDER.length)];
  if (gapSide !== "north") carveRow(walls, top, left, right);
  else carveRow(walls, top, left + 1, right - 1);
  if (gapSide !== "south") carveRow(walls, bottom, left, right);
  else carveRow(walls, bottom, left + 1, right - 1);
  if (gapSide !== "west") carveCol(walls, left, top, bottom);
  else carveCol(walls, left, top + 1, bottom - 1);
  if (gapSide !== "east") carveCol(walls, right, top, bottom);
  else carveCol(walls, right, top + 1, bottom - 1);
  const spokeOptions = [
    [{ r: centerR, c: centerC }, { r: top, c: centerC }],
    [{ r: centerR, c: centerC }, { r: bottom, c: centerC }],
    [{ r: centerR, c: centerC }, { r: centerR, c: left }],
    [{ r: centerR, c: centerC }, { r: centerR, c: right }],
  ];
  carvePath(walls, spokeOptions[randInt(rand, 0, spokeOptions.length)]);
}

function addSanctuary(walls, centerR, centerC, rand) {
  carvePocketRoom(walls, centerR - 1, centerC - 1, 3, 3);
  const doors = shuffle([
    [{ r: centerR - 1, c: centerC }, { r: centerR - 2, c: centerC }],
    [{ r: centerR + 1, c: centerC }, { r: centerR + 2, c: centerC }],
    [{ r: centerR, c: centerC - 1 }, { r: centerR, c: centerC - 2 }],
    [{ r: centerR, c: centerC + 1 }, { r: centerR, c: centerC + 2 }],
  ], rand).slice(0, 2);
  doors.forEach(([a, b]) => openBetween(walls, a.r, a.c, b.r, b.c));
}

function mutateClassicMaze() {}

function mutateLoopMaze(ctx, walls) {
  addRandomLoops(walls, ctx.rows, ctx.cols, ctx.rand, 8 + Math.floor(ctx.dist * 0.4));
}

function mutateDenseMaze(ctx, walls) {
  addRandomLoops(walls, ctx.rows, ctx.cols, ctx.rand, 12 + Math.floor(ctx.dist * 0.6));
  if (ctx.rand() < 0.7) addPocketRooms(walls, ctx.rows, ctx.cols, ctx.rand, 1);
}

function mutateRoomMaze(ctx, walls) {
  addRandomLoops(walls, ctx.rows, ctx.cols, ctx.rand, 4 + Math.floor(ctx.dist * 0.25));
  addPocketRooms(walls, ctx.rows, ctx.cols, ctx.rand, ctx.rand() < 0.45 ? 1 : 2);
}

function mutateRingMaze(ctx, walls) {
  addRandomLoops(walls, ctx.rows, ctx.cols, ctx.rand, 4 + Math.floor(ctx.dist * 0.25));
  addPartialRing(walls, ctx.rows, ctx.cols, ctx.centerR, ctx.centerC, ctx.rand);
}

function mutateSanctuaryMaze(ctx, walls) {
  addRandomLoops(walls, ctx.rows, ctx.cols, ctx.rand, 5 + Math.floor(ctx.dist * 0.25));
  addSanctuary(walls, ctx.centerR, ctx.centerC, ctx.rand);
}

export const LAYOUTS = {
  classic_maze: { family: "core", mutate: mutateClassicMaze },
  loop_maze: { family: "loop", mutate: mutateLoopMaze },
  dense_maze: { family: "dense", mutate: mutateDenseMaze },
  room_maze: { family: "room", mutate: mutateRoomMaze },
  ring_maze: { family: "ring", mutate: mutateRingMaze },
  sanctuary_maze: { family: "sanctuary", mutate: mutateSanctuaryMaze },
};

export function generateLayout({
  layoutType,
  rows = ROWS,
  cols = COLS,
  rand,
  requiredOpenings = [],
  anchors = [],
  dist = 0,
}) {
  const { centerR, centerC } = getCenters(rows, cols);
  const descriptor = LAYOUTS[layoutType] || LAYOUTS.classic_maze;
  const walls = generateBaseMaze(rows, cols, rand);
  descriptor.mutate?.({ rows, cols, centerR, centerC, rand, dist }, walls);
  const openedCells = requiredOpenings.map(({ side, index }) => {
    if (side === "east" || side === "west") {
      return openBorder(walls, side, clamp(index, 1, rows - 2), rows, cols);
    }
    return openBorder(walls, side, clamp(index, 1, cols - 2), rows, cols);
  });
  const anchorCells = anchors.length ? anchors : [{ r: centerR, c: centerC }];
  connectCells(walls, rows, cols, [...openedCells, ...anchorCells, { r: centerR, c: centerC }]);
  return { walls, openingCells: openedCells };
}
