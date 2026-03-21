import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import windowsLogoUrl from "./windows_logo.png";
import officeChartBarQuarterlyUrl from "./assets/biomes/office_98/chart_bar_quarterly.svg";
import officeChartPieMarketshareUrl from "./assets/biomes/office_98/chart_pie_marketshare.svg";
import officeChartBarTargetsUrl from "./assets/biomes/office_98/chart_bar_targets.svg";
import officeChartPieBudgetUrl from "./assets/biomes/office_98/chart_pie_budget.svg";
import galleryPosterUrl from "./assets/biomes/gallery/gallery_poster.svg";
import galleryLabelUrl from "./assets/biomes/gallery/gallery_label.svg";
import industrialWarningPanelUrl from "./assets/biomes/industrial/warning_panel.svg";
import industrialStencilPlateUrl from "./assets/biomes/industrial/stencil_plate.svg";
import liminalNoticeBoardUrl from "./assets/biomes/liminal/notice_board.svg";
import liminalExitArrowUrl from "./assets/biomes/liminal/exit_arrow.svg";
import retroWoodPlaqueUrl from "./assets/biomes/retro_wood/wood_plaque.svg";
import labMonitorUrl from "./assets/biomes/lab/lab_monitor.svg";
import ceramicMedallionUrl from "./assets/biomes/tile/ceramic_medallion.svg";
import stoneTabletUrl from "./assets/biomes/stone/stone_tablet.svg";

const CELL = 10, ROWS = 12, COLS = 12;
const CENTER_R = Math.floor(ROWS / 2), CENTER_C = Math.floor(COLS / 2);

function createWalls(rows = ROWS, cols = COLS) {
  return {
    h: Array.from({ length: rows + 1 }, () => Array(cols).fill(true)),
    v: Array.from({ length: rows }, () => Array(cols + 1).fill(true)),
  };
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeChunkRand(cr, cc, salt = 0) {
  const seed = (((cr * 374761393) ^ (cc * 668265263) ^ salt ^ 0x9e3779b9) >>> 0) || 1;
  return mulberry32(seed);
}

function shuffle(list, rand) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function openBetween(walls, r1, c1, r2, c2) {
  if (r1 === r2) walls.v[r1][Math.max(c1, c2)] = false;
  else walls.h[Math.max(r1, r2)][c1] = false;
}

function carvePath(walls, points) {
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i], b = points[i + 1];
    let r = a.r, c = a.c;
    while (c !== b.c) {
      const nc = c + Math.sign(b.c - c);
      openBetween(walls, r, c, r, nc);
      c = nc;
    }
    while (r !== b.r) {
      const nr = r + Math.sign(b.r - r);
      openBetween(walls, r, c, nr, c);
      r = nr;
    }
  }
}

function carveRow(walls, row, from, to) {
  const start = Math.min(from, to), end = Math.max(from, to);
  for (let c = start; c < end; c += 1) openBetween(walls, row, c, row, c + 1);
}

function carveCol(walls, col, from, to) {
  const start = Math.min(from, to), end = Math.max(from, to);
  for (let r = start; r < end; r += 1) openBetween(walls, r, col, r + 1, col);
}

function generateMaze(rows, cols, rand) {
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const walls = createWalls(rows, cols);
  const stack = [[0, 0]];
  visited[0][0] = true;
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const nb = shuffle(dirs, rand)
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]);
    if (!nb.length) {
      stack.pop();
      continue;
    }
    const [nr, nc] = nb[0];
    openBetween(walls, r, c, nr, nc);
    visited[nr][nc] = true;
    stack.push([nr, nc]);
  }
  return walls;
}

function generateLoopMaze(rand) {
  const walls = generateMaze(ROWS, COLS, rand);
  for (let i = 0; i < 14; i += 1) {
    const r = Math.floor(rand() * ROWS);
    const c = Math.floor(rand() * COLS);
    if (rand() < 0.5 && c < COLS - 1) walls.v[r][c + 1] = false;
    else if (r < ROWS - 1) walls.h[r + 1][c] = false;
  }
  return walls;
}

function generateRingHall() {
  const walls = createWalls();
  carveRow(walls, 1, 1, COLS - 2);
  carveCol(walls, COLS - 2, 1, ROWS - 2);
  carveRow(walls, ROWS - 2, 1, COLS - 2);
  carveCol(walls, 1, 1, ROWS - 2);
  carveRow(walls, CENTER_R, 3, COLS - 4);
  carveCol(walls, CENTER_C, 3, ROWS - 4);
  carvePath(walls, [{ r: 1, c: CENTER_C }, { r: CENTER_R, c: CENTER_C }]);
  carvePath(walls, [{ r: ROWS - 2, c: CENTER_C }, { r: CENTER_R, c: CENTER_C }]);
  carvePath(walls, [{ r: CENTER_R, c: 1 }, { r: CENTER_R, c: CENTER_C }]);
  carvePath(walls, [{ r: CENTER_R, c: COLS - 2 }, { r: CENTER_R, c: CENTER_C }]);
  return walls;
}

function generateRoomGrid(rand) {
  const walls = createWalls();
  const rows = [2, CENTER_R, ROWS - 3];
  const cols = [2, CENTER_C, COLS - 3];
  rows.forEach((row) => carveRow(walls, row, 1, COLS - 2));
  cols.forEach((col) => carveCol(walls, col, 1, ROWS - 2));
  rows.forEach((row) => {
    cols.forEach((col) => {
      if (rand() < 0.75 && row < ROWS - 2) walls.h[row + 1][col] = false;
      if (rand() < 0.75 && col < COLS - 2) walls.v[row][col + 1] = false;
    });
  });
  carvePath(walls, [{ r: CENTER_R, c: 1 }, { r: CENTER_R, c: COLS - 2 }]);
  return walls;
}

function generateCrossHub() {
  const walls = createWalls();
  carveRow(walls, CENTER_R, 0, COLS - 1);
  carveCol(walls, CENTER_C, 0, ROWS - 1);
  for (let r = CENTER_R - 1; r <= CENTER_R + 1; r += 1) carveRow(walls, r, CENTER_C - 2, CENTER_C + 2);
  for (let c = CENTER_C - 1; c <= CENTER_C + 1; c += 1) carveCol(walls, c, CENTER_R - 2, CENTER_R + 2);
  carvePath(walls, [{ r: 2, c: 2 }, { r: 2, c: CENTER_C }, { r: CENTER_R, c: CENTER_C }]);
  carvePath(walls, [{ r: ROWS - 3, c: COLS - 3 }, { r: ROWS - 3, c: CENTER_C }, { r: CENTER_R, c: CENTER_C }]);
  return walls;
}

function generateSnakeCorridor() {
  const walls = createWalls();
  let leftToRight = true;
  for (let r = 1; r < ROWS - 1; r += 2) {
    carveRow(walls, r, 1, COLS - 2);
    if (r + 2 < ROWS - 1) {
      const edgeCol = leftToRight ? COLS - 2 : 1;
      carveCol(walls, edgeCol, r, r + 2);
    }
    leftToRight = !leftToRight;
  }
  carvePath(walls, [{ r: CENTER_R, c: CENTER_C }, { r: CENTER_R, c: COLS - 2 }]);
  return walls;
}

function generateLadder() {
  const walls = createWalls();
  for (let c = 1; c < COLS - 1; c += 3) carveCol(walls, c, 1, ROWS - 2);
  for (let r = 2; r < ROWS - 2; r += 3) carveRow(walls, r, 1, COLS - 2);
  carveRow(walls, CENTER_R, 1, COLS - 2);
  return walls;
}

function generateSpiral() {
  const walls = createWalls();
  let top = 1, left = 1, bottom = ROWS - 2, right = COLS - 2;
  while (top <= bottom && left <= right) {
    carveRow(walls, top, left, right);
    if (top < bottom) carveCol(walls, right, top, bottom);
    if (left < right && top < bottom) carveRow(walls, bottom, left, right);
    if (left < right && top + 1 < bottom) carveCol(walls, left, top + 1, bottom);
    top += 2; left += 2; bottom -= 2; right -= 2;
  }
  carvePath(walls, [{ r: 1, c: 1 }, { r: CENTER_R, c: CENTER_C }]);
  return walls;
}

function generateZigzagChambers() {
  const walls = createWalls();
  let left = 1, right = COLS - 2;
  for (let r = 1; r < ROWS - 1; r += 2) {
    carveRow(walls, r, left, right);
    if (r + 2 < ROWS - 1) carveCol(walls, r % 4 === 1 ? right : left, r, r + 2);
    left = left === 1 ? 2 : 1;
    right = right === COLS - 2 ? COLS - 3 : COLS - 2;
  }
  return walls;
}

function generateTwinCorridors() {
  const walls = createWalls();
  const topRow = 2, bottomRow = ROWS - 3;
  carveRow(walls, topRow, 1, COLS - 2);
  carveRow(walls, bottomRow, 1, COLS - 2);
  carveCol(walls, 2, topRow, bottomRow);
  carveCol(walls, COLS - 3, topRow, bottomRow);
  carveCol(walls, CENTER_C, topRow, bottomRow);
  return walls;
}

function generateOffsetRooms() {
  const walls = createWalls();
  carveRow(walls, 2, 1, COLS - 4);
  carveCol(walls, COLS - 4, 2, CENTER_R);
  carveRow(walls, CENTER_R, 3, COLS - 2);
  carveCol(walls, 3, CENTER_R, ROWS - 3);
  carveRow(walls, ROWS - 3, 1, COLS - 3);
  carvePath(walls, [{ r: 2, c: 2 }, { r: CENTER_R, c: CENTER_C }, { r: ROWS - 3, c: COLS - 3 }]);
  return walls;
}

function generatePerimeterCuts() {
  const walls = createWalls();
  carveRow(walls, 1, 1, COLS - 2);
  carveRow(walls, ROWS - 2, 1, COLS - 2);
  carveCol(walls, 1, 1, ROWS - 2);
  carveCol(walls, COLS - 2, 1, ROWS - 2);
  carveCol(walls, CENTER_C, 1, ROWS - 2);
  carveRow(walls, CENTER_R, 1, COLS - 2);
  return walls;
}

function generateDiamond() {
  const walls = createWalls();
  const points = [
    { r: 1, c: CENTER_C },
    { r: CENTER_R, c: COLS - 2 },
    { r: ROWS - 2, c: CENTER_C },
    { r: CENTER_R, c: 1 },
    { r: 1, c: CENTER_C },
  ];
  carvePath(walls, points);
  carvePath(walls, [{ r: CENTER_R, c: 1 }, { r: CENTER_R, c: COLS - 2 }]);
  carvePath(walls, [{ r: 1, c: CENTER_C }, { r: ROWS - 2, c: CENTER_C }]);
  return walls;
}

function generatePinwheel() {
  const walls = createWalls();
  carvePath(walls, [{ r: CENTER_R, c: CENTER_C }, { r: 1, c: CENTER_C }, { r: 1, c: COLS - 3 }]);
  carvePath(walls, [{ r: CENTER_R, c: CENTER_C }, { r: CENTER_R, c: COLS - 2 }, { r: ROWS - 3, c: COLS - 2 }]);
  carvePath(walls, [{ r: CENTER_R, c: CENTER_C }, { r: ROWS - 2, c: CENTER_C }, { r: ROWS - 2, c: 2 }]);
  carvePath(walls, [{ r: CENTER_R, c: CENTER_C }, { r: CENTER_R, c: 1 }, { r: 2, c: 1 }]);
  return walls;
}

function generateSwitchbacks() {
  const walls = createWalls();
  for (let r = 1; r < ROWS - 1; r += 2) {
    if ((r / 2) % 2 === 0) carveRow(walls, r, 1, COLS - 3);
    else carveRow(walls, r, 2, COLS - 2);
    if (r + 2 < ROWS - 1) carveCol(walls, (r / 2) % 2 === 0 ? COLS - 3 : 2, r, r + 2);
  }
  return walls;
}

function generateInnerSanctum() {
  const walls = createWalls();
  carveRow(walls, 1, 1, COLS - 2);
  carveRow(walls, ROWS - 2, 1, COLS - 2);
  carveCol(walls, 1, 1, ROWS - 2);
  carveCol(walls, COLS - 2, 1, ROWS - 2);
  carveRow(walls, CENTER_R - 1, CENTER_C - 2, CENTER_C + 2);
  carveRow(walls, CENTER_R + 1, CENTER_C - 2, CENTER_C + 2);
  carveCol(walls, CENTER_C - 2, CENTER_R - 1, CENTER_R + 1);
  carveCol(walls, CENTER_C + 2, CENTER_R - 1, CENTER_R + 1);
  carvePath(walls, [{ r: 1, c: CENTER_C }, { r: CENTER_R - 1, c: CENTER_C }]);
  carvePath(walls, [{ r: ROWS - 2, c: CENTER_C }, { r: CENTER_R + 1, c: CENTER_C }]);
  return walls;
}

function getChunkOpenings(cr, cc) {
  const ewRow = (((cr * 2654435761 + cc * 1234567891) >>> 0) % ROWS);
  if (cr !== 0 || cc < 0) return [];
  if (cc === 0) return [{ side: "east", index: 0 }];
  const westRow = (((cr * 2654435761 + (cc - 1) * 1234567891) >>> 0) % ROWS);
  return [{ side: "west", index: westRow }, { side: "east", index: ewRow }];
}

function openBorder(walls, side, index) {
  if (side === "east") {
    walls.v[index][COLS] = false;
    return { r: index, c: COLS - 1 };
  }
  if (side === "west") {
    walls.v[index][0] = false;
    return { r: index, c: 0 };
  }
  if (side === "south") {
    walls.h[ROWS][index] = false;
    return { r: ROWS - 1, c: index };
  }
  walls.h[0][index] = false;
  return { r: 0, c: index };
}

function ensureOpeningsReachInterior(walls, openings, layoutType) {
  if (layoutType === "classic_maze" || layoutType === "loop_maze") return;
  openings.forEach((cell) => carvePath(walls, [cell, { r: CENTER_R, c: CENTER_C }]));
}

function pickWeighted(rand, items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let value = rand() * total;
  for (const item of items) {
    value -= item.weight;
    if (value <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

function getLayoutCandidates(dist) {
  if (dist <= 2) return [
    { value: "classic_maze", weight: 5 },
    { value: "loop_maze", weight: 2 },
    { value: "ladder", weight: 1 },
    { value: "switchbacks", weight: 1 },
  ];
  if (dist <= 5) return [
    { value: "classic_maze", weight: 1 },
    { value: "loop_maze", weight: 2 },
    { value: "ring_hall", weight: 1 },
    { value: "room_grid", weight: 1 },
    { value: "cross_hub", weight: 1 },
    { value: "ladder", weight: 1 },
    { value: "spiral", weight: 1 },
    { value: "zigzag_chambers", weight: 1 },
    { value: "twin_corridors", weight: 1 },
    { value: "offset_rooms", weight: 1 },
  ];
  return [
    { value: "loop_maze", weight: 1 },
    { value: "ring_hall", weight: 1 },
    { value: "room_grid", weight: 1 },
    { value: "cross_hub", weight: 1 },
    { value: "snake_corridor", weight: 1 },
    { value: "ladder", weight: 1 },
    { value: "spiral", weight: 1 },
    { value: "zigzag_chambers", weight: 1 },
    { value: "twin_corridors", weight: 1 },
    { value: "offset_rooms", weight: 1 },
    { value: "perimeter_cuts", weight: 1 },
    { value: "diamond", weight: 1 },
    { value: "pinwheel", weight: 1 },
    { value: "switchbacks", weight: 1 },
    { value: "inner_sanctum", weight: 1 },
  ];
}

const layoutTypeCache = new Map();

function getLayoutTypeForChunk(cr, cc) {
  const key = cr + "_" + cc;
  if (layoutTypeCache.has(key)) return layoutTypeCache.get(key);
  let layoutType = "classic_maze";
  if (!(cr === 0 && cc === 0)) {
    const dist = Math.max(0, cc);
    const rand = makeChunkRand(cr, cc, 0);
    const previous = cc > 0 ? getLayoutTypeForChunk(cr, cc - 1) : null;
    const pool = getLayoutCandidates(dist);
    const filtered = previous ? pool.filter((item) => item.value !== previous) : pool;
    layoutType = pickWeighted(rand, filtered.length ? filtered : pool);
  }
  layoutTypeCache.set(key, layoutType);
  return layoutType;
}

function generateLayout(layoutType, rand) {
  if (layoutType === "classic_maze") return generateMaze(ROWS, COLS, rand);
  if (layoutType === "loop_maze") return generateLoopMaze(rand);
  if (layoutType === "ring_hall") return generateRingHall();
  if (layoutType === "room_grid") return generateRoomGrid(rand);
  if (layoutType === "cross_hub") return generateCrossHub();
  if (layoutType === "snake_corridor") return generateSnakeCorridor();
  if (layoutType === "ladder") return generateLadder();
  if (layoutType === "spiral") return generateSpiral();
  if (layoutType === "zigzag_chambers") return generateZigzagChambers();
  if (layoutType === "twin_corridors") return generateTwinCorridors();
  if (layoutType === "offset_rooms") return generateOffsetRooms();
  if (layoutType === "perimeter_cuts") return generatePerimeterCuts();
  if (layoutType === "diamond") return generateDiamond();
  if (layoutType === "pinwheel") return generatePinwheel();
  if (layoutType === "switchbacks") return generateSwitchbacks();
  return generateInnerSanctum();
}

function generateChunk(cr, cc) {
  const rand = makeChunkRand(cr, cc, 0);
  const layoutType = getLayoutTypeForChunk(cr, cc);
  const walls = generateLayout(layoutType, rand);
  const openings = getChunkOpenings(cr, cc).map(({ side, index }) => openBorder(walls, side, index));
  if (cr === 0 && cc === 0) {
    // Preserve a readable intro: sign in view and a guaranteed forward passage.
    carveRow(walls, 0, 0, 3);
    carvePath(walls, [{ r: 0, c: 3 }, { r: CENTER_R, c: CENTER_C }]);
  }
  ensureOpeningsReachInterior(walls, openings, layoutType);
  const themeType = getThemeTypeForChunk(cr, cc);
  return { walls, layoutType, themeType };
}

function mktex(c, rep = [1, 1]) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...rep);
  return t;
}

function makeBrickWall() {
  const W = 512, H = 512, BW = 118, BH = 52, M = 6, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#a09080"; ctx.fillRect(0, 0, W, H);
  const db = (x, y, w, h) => { const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, "#8b1010"); g.addColorStop(0.3, "#7a0e0e"); g.addColorStop(0.7, "#820f0f"); g.addColorStop(1, "#6e0c0c"); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.fillRect(x + w * .5, y, w * .5, h); ctx.fillStyle = "rgba(255,160,160,0.10)"; ctx.fillRect(x + 1, y + 1, w - 2, 4); ctx.fillStyle = "rgba(0,0,0,0.30)"; ctx.fillRect(x + 1, y + h - 4, w - 2, 4); };
  for (let row = 0; row <= Math.ceil(H / (BH + M)); row++) { const off = (row % 2) * (BW + M) / 2, y = row * (BH + M) + M; for (let col = -1; col <= Math.ceil(W / (BW + M)); col++) db(col * (BW + M) + off + M, y, BW, BH); }
  return mktex(c);
}

function makeStoneWall() {
  const W = 512, H = 512, BW = 120, BH = 60, M = 5, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#777"; ctx.fillRect(0, 0, W, H);
  const ds = (x, y, w, h) => { const b = 95 + Math.floor(Math.random() * 30); ctx.fillStyle = "rgb(" + b + "," + b + "," + b + ")"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(x + 1, y + 1, w - 2, 4); ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fillRect(x + 1, y + h - 4, w - 2, 4); };
  for (let row = 0; row <= Math.ceil(H / (BH + M)); row++) { const off = (row % 2) * (BW + M) / 2, y = row * (BH + M) + M; for (let col = -1; col <= Math.ceil(W / (BW + M)); col++) ds(col * (BW + M) + off + M, y, BW, BH); }
  return mktex(c);
}

function makeMetalWall() {
  const W = 256, H = 256, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#4a5560"; ctx.fillRect(0, 0, W, H);
  const PW = W / 2, PH = H / 3;
  for (let r = 0; r < 3; r++) for (let col = 0; col < 2; col++) { const x = col * PW + 4, y = r * PH + 4, w = PW - 8, h = PH - 8; const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, "#5a6575"); g.addColorStop(0.5, "#3e4a55"); g.addColorStop(1, "#4a5560"); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.strokeStyle = "rgba(120,150,170,0.6)"; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h); [[x + 5, y + 5], [x + w - 5, y + 5], [x + 5, y + h - 5], [x + w - 5, y + h - 5]].forEach(([rx, ry]) => { ctx.fillStyle = "#6a7a8a"; ctx.beginPath(); ctx.arc(rx, ry, 2.5, 0, Math.PI * 2); ctx.fill(); }); }
  return mktex(c);
}

function makeWoodWall() {
  const W = 256, H = 512, PL = 80, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); const sh = ["#6b3c10", "#7a4418", "#623610", "#724014"];
  for (let i = 0; i < Math.ceil(H / PL); i++) { ctx.fillStyle = sh[i % 4]; ctx.fillRect(0, i * PL, W, PL); ctx.strokeStyle = "rgba(30,10,0,0.4)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, i * PL); ctx.lineTo(W, i * PL); ctx.stroke(); }
  return mktex(c, [1, 2]);
}

function makeAzulejoWall() {
  const W = 512, H = 512, S = 128, G = 5, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#d4c890"; ctx.fillRect(0, 0, W, H); const B = "#1a2e8a";
  const dt = (ox, oy, sz) => { const p = G / 2, ts = sz - G, cx2 = ox + sz / 2, cy2 = oy + sz / 2, r = sz / 2 - G; ctx.fillStyle = "#f0ead0"; ctx.fillRect(ox + p, oy + p, ts, ts); ctx.strokeStyle = B; ctx.lineWidth = sz * 0.07; ctx.lineCap = "round"; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([fx, fy]) => { const ex = ox + p + fx * ts, ey = oy + p + fy * ts, ang = Math.atan2(cy2 - ey, cx2 - ex); ctx.beginPath(); ctx.arc(ex, ey, r * 0.72, ang - 0.55, ang + 0.55); ctx.stroke(); }); ctx.strokeStyle = B; ctx.lineWidth = sz * 0.05; ctx.beginPath(); ctx.arc(cx2, cy2, r * 0.28, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = B; ctx.beginPath(); ctx.arc(cx2, cy2, r * 0.07, 0, Math.PI * 2); ctx.fill(); };
  for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) dt(col * S, r * S, S);
  return mktex(c);
}

function makeBackroomsWall() {
  const W = 512, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#c8b86a"; ctx.fillRect(0, 0, W, H);
  const TW = 48, TH = 64; ctx.strokeStyle = "rgba(140,125,40,0.55)"; ctx.lineWidth = 1.5;
  for (let row = -1; row < H / TH + 2; row++) { for (let col = -1; col < W / TW + 2; col++) { const ox = col * TW + (row % 2) * TW / 2, oy = row * TH; ctx.beginPath(); ctx.moveTo(ox + TW / 2, oy + 4); ctx.lineTo(ox + TW - 4, oy + TH / 2); ctx.lineTo(ox + TW / 2, oy + TH - 4); ctx.lineTo(ox + 4, oy + TH / 2); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ox + TW / 2, oy + 12); ctx.lineTo(ox + TW / 2 - 10, oy + TH / 2); ctx.lineTo(ox + TW / 2, oy + TH - 12); ctx.lineTo(ox + TW / 2 + 10, oy + TH / 2); ctx.closePath(); ctx.stroke(); } }
  ctx.fillStyle = "rgba(180,155,60,0.18)"; ctx.fillRect(0, 0, W, H);
  return mktex(c);
}

function makePanelWall() {
  const W = 512, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#b8b8aa"); g.addColorStop(1, "#9f9f90");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let y = 0; y <= H; y += 96) { ctx.strokeStyle = "rgba(120,120,110,0.45)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let x = 0; x <= W; x += 128) { ctx.strokeStyle = "rgba(220,220,210,0.15)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  return mktex(c);
}

function makeGalleryWall() {
  const W = 512, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#f0eee8"); g.addColorStop(0.7, "#e3dfd7"); g.addColorStop(1, "#c7bfae");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#7c7568"; ctx.fillRect(0, H - 38, W, 38);
  for (let i = 0; i < 400; i++) { const x = Math.random() * W, y = Math.random() * (H - 42); const a = 0.02 + Math.random() * 0.04; ctx.fillStyle = `rgba(120,110,95,${a})`; ctx.fillRect(x, y, 2, 2); }
  return mktex(c);
}

function makeConcreteWall() {
  const W = 512, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#727679"; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * W, y = Math.random() * H, v = (Math.random() * 30 - 15) | 0;
    ctx.fillStyle = `rgba(${118 + v},${122 + v},${126 + v},0.22)`;
    ctx.fillRect(x, y, 2, 2);
  }
  for (let y = 96; y < H; y += 96) { ctx.strokeStyle = "rgba(50,55,60,0.28)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  return mktex(c);
}

function makeWoodFloor() {
  const W = 512, H = 512, PL = H / 8, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); const sh = ["#8c5a20", "#7e5018", "#8a5820", "#7a4c16", "#885620", "#805218", "#8e5c22", "#7c5018"];
  for (let i = 0; i < 8; i++) { ctx.fillStyle = sh[i]; ctx.fillRect(0, i * PL, W, PL); ctx.strokeStyle = "rgba(60,20,0,0.35)"; ctx.lineWidth = 2; ctx.strokeRect(0, i * PL, W, PL); const off = (i % 2) * (W / 2); [off, off + W / 2].forEach((x) => { ctx.strokeStyle = "rgba(60,20,0,0.3)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, i * PL); ctx.lineTo(x, (i + 1) * PL); ctx.stroke(); }); }
  return mktex(c, [2, 2]);
}

function makeMarbleFloor() {
  const W = 512, H = 512, S = 128, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) { ctx.fillStyle = (r + col) % 2 === 0 ? "#b8b0a8" : "#e0d8d0"; ctx.fillRect(col * S, r * S, S, S); }
  ctx.strokeStyle = "rgba(80,70,60,0.8)"; ctx.lineWidth = 3; for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * S, 0); ctx.lineTo(i * S, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * S); ctx.lineTo(W, i * S); ctx.stroke(); }
  return mktex(c);
}

function makeCarpetFloor() {
  const W = 256, H = 256, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#4a2060"; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 16) { ctx.strokeStyle = "rgba(180,100,220,0.15)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  return mktex(c, [2, 2]);
}

function makeOfficeCarpetFloor() {
  const W = 256, H = 256, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#2d4f6a"; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    ctx.fillStyle = `rgba(${110 + ((Math.random() * 30) | 0)},${140 + ((Math.random() * 30) | 0)},${155 + ((Math.random() * 30) | 0)},0.18)`;
    ctx.fillRect(x, y, 2, 2);
  }
  for (let y = 0; y < H; y += 32) { ctx.strokeStyle = "rgba(210,220,230,0.08)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  return mktex(c, [2, 2]);
}

function makeDirtFloor() {
  const W = 256, H = 256, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#5a4020"; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 3000; i++) { const x = Math.random() * W, y = Math.random() * H, v = Math.random() * 40 - 20; ctx.fillStyle = "rgba(" + (90 + v | 0) + "," + (60 + v | 0) + "," + (30 + v | 0) + ",0.35)"; ctx.fillRect(x, y, 2, 2); }
  return mktex(c);
}

function makeConcreteFloor() {
  const W = 512, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#666b70"; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * W, y = Math.random() * H, v = (Math.random() * 28 - 14) | 0;
    ctx.fillStyle = `rgba(${115 + v},${120 + v},${124 + v},0.16)`;
    ctx.fillRect(x, y, 2, 2);
  }
  for (let i = 0; i <= 4; i++) {
    ctx.strokeStyle = "rgba(40,45,50,0.28)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(i * 128, 0); ctx.lineTo(i * 128, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * 128); ctx.lineTo(W, i * 128); ctx.stroke();
  }
  return mktex(c);
}

function makeAzulejoFloor() {
  const W = 512, H = 512, S = 128, G = 5, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#c8b870"; ctx.fillRect(0, 0, W, H); const B = "#1a2e8a";
  const dt = (ox, oy, sz) => { const p = G / 2, ts = sz - G, cx2 = ox + sz / 2, cy2 = oy + sz / 2, r = sz / 2 - G; ctx.fillStyle = "#ede8d0"; ctx.fillRect(ox + p, oy + p, ts, ts); ctx.fillStyle = B; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 8, a2 = a + Math.PI / 8, ro = r * 0.82, ri = r * 0.38; if (i === 0) ctx.moveTo(cx2 + Math.cos(a) * ro, cy2 + Math.sin(a) * ro); else ctx.lineTo(cx2 + Math.cos(a) * ro, cy2 + Math.sin(a) * ro); ctx.lineTo(cx2 + Math.cos(a2) * ri, cy2 + Math.sin(a2) * ri); } ctx.closePath(); ctx.fill(); ctx.fillStyle = "#ede8d0"; ctx.beginPath(); ctx.arc(cx2, cy2, r * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = B; ctx.lineWidth = sz * 0.04; ctx.beginPath(); ctx.arc(cx2, cy2, r * 0.22, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = B; ctx.beginPath(); ctx.arc(cx2, cy2, r * 0.08, 0, Math.PI * 2); ctx.fill(); };
  for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) dt(col * S, r * S, S);
  return mktex(c);
}

function makeBackroomsFloor() {
  const W = 512, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#c49a52"; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 8000; i++) { const x = Math.random() * W, y = Math.random() * H, l = Math.random() * 6 + 2, a = Math.random() * Math.PI, v = Math.random() * 30 - 15 | 0; ctx.strokeStyle = "rgba(" + (180 + v) + "," + (140 + v) + "," + (70 + v) + ",0.18)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke(); }
  ctx.fillStyle = "rgba(200,160,80,0.12)"; ctx.fillRect(0, 0, W, H);
  return mktex(c, [3, 3]);
}

function makeStoneCeil() {
  const W = 512, H = 512, BW = 120, BH = 60, M = 5, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#666"; ctx.fillRect(0, 0, W, H);
  const ds = (x, y, w, h) => { const b = 95 + Math.floor(Math.random() * 25); ctx.fillStyle = "rgb(" + b + "," + b + "," + b + ")"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fillRect(x + 1, y + h - 4, w - 2, 4); };
  for (let row = 0; row <= Math.ceil(H / (BH + M)); row++) { const off = (row % 2) * (BW + M) / 2, y = row * (BH + M) + M; for (let col = -1; col <= Math.ceil(W / (BW + M)); col++) ds(col * (BW + M) + off + M, y, BW, BH); }
  return mktex(c);
}

function makeMetalCeil() {
  const W = 256, H = 256, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#5a6070"); g.addColorStop(0.5, "#484e58"); g.addColorStop(1, "#555c68"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 64) { ctx.strokeStyle = "rgba(100,120,140,0.5)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  return mktex(c);
}

function makeWoodCeil() {
  const W = 512, H = 256, PL = H / 4, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); const sh = ["#5a3010", "#4e2a0c", "#583012", "#4c280e"];
  for (let i = 0; i < 4; i++) { ctx.fillStyle = sh[i]; ctx.fillRect(0, i * PL, W, PL); ctx.strokeStyle = "rgba(20,5,0,0.5)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, i * PL); ctx.lineTo(W, i * PL); ctx.stroke(); }
  return mktex(c, [2, 1]);
}

function makeBrickCeil() {
  const W = 512, H = 512, BW = 118, BH = 52, M = 6, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#807060"; ctx.fillRect(0, 0, W, H);
  const db = (x, y, w, h) => { ctx.fillStyle = "#6a2a2a"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(x + 1, y + h - 4, w - 2, 4); };
  for (let row = 0; row <= Math.ceil(H / (BH + M)); row++) { const off = (row % 2) * (BW + M) / 2, y = row * (BH + M) + M; for (let col = -1; col <= Math.ceil(W / (BW + M)); col++) db(col * (BW + M) + off + M, y, BW, BH); }
  return mktex(c);
}

function makeAzulejoCeil() {
  const W = 512, H = 512, S = 128, G = 5, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#b8a860"; ctx.fillRect(0, 0, W, H); const B = "#1a2e8a";
  const dt = (ox, oy, sz) => { const p = G / 2, ts = sz - G, cx2 = ox + sz / 2, cy2 = oy + sz / 2, r = sz / 2 - G; ctx.fillStyle = "#f2ecda"; ctx.fillRect(ox + p, oy + p, ts, ts); ctx.strokeStyle = B; ctx.lineWidth = sz * 0.04; ctx.strokeRect(ox + p + 4, oy + p + 4, ts - 8, ts - 8); ctx.fillStyle = B; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, px = cx2 + Math.cos(a) * r * 0.3, py = cy2 + Math.sin(a) * r * 0.3; ctx.beginPath(); ctx.ellipse(px, py, r * 0.22, r * 0.1, a, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = "#f2ecda"; ctx.beginPath(); ctx.arc(cx2, cy2, r * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = B; ctx.lineWidth = sz * 0.035; ctx.beginPath(); ctx.arc(cx2, cy2, r * 0.18, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = B; ctx.beginPath(); ctx.arc(cx2, cy2, r * 0.07, 0, Math.PI * 2); ctx.fill(); };
  for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) dt(col * S, r * S, S);
  return mktex(c);
}

function makeBackroomsCeil() {
  const W = 512, H = 512, S = 128, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#ddd5a8"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(160,148,90,0.6)"; ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += S) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += S) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let i = 0; i < 2000; i++) { const x = Math.random() * W, y = Math.random() * H, v = Math.random() * 20 - 10 | 0; ctx.fillStyle = "rgba(" + (200 + v) + "," + (190 + v) + "," + (155 + v) + ",0.25)"; ctx.fillRect(x, y, 2, 2); }
  for (let row = 0; row < W / S; row++) { for (let col = 0; col < H / S; col++) { const lx = col * S + S * 0.2, ly = row * S + S * 0.35, lw = S * 0.6, lh = S * 0.3; const g = ctx.createRadialGradient(lx + lw / 2, ly + lh / 2, 0, lx + lw / 2, ly + lh / 2, S * 0.5); g.addColorStop(0, "rgba(255,250,220,0.6)"); g.addColorStop(1, "rgba(255,250,220,0)"); ctx.fillStyle = g; ctx.fillRect(col * S, row * S, S, S); ctx.fillStyle = "rgba(255,255,240,0.92)"; ctx.fillRect(lx, ly, lw, lh); ctx.strokeStyle = "rgba(180,170,120,0.5)"; ctx.lineWidth = 1; ctx.strokeRect(lx, ly, lw, lh); } }
  return mktex(c);
}

function makeCheckerFloor() {
  const W = 512, H = 512, S = 64, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  for (let r = 0; r < W / S; r++) for (let col = 0; col < H / S; col++) { ctx.fillStyle = (r + col) % 2 === 0 ? "#111111" : "#d8d8d8"; ctx.fillRect(col * S, r * S, S, S); }
  return mktex(c);
}

function makeWhiteCeil() {
  const W = 256, H = 256, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#dddad5"; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 300; i++) { const x = Math.random() * W, y = Math.random() * H, v = (Math.random() * 12 - 6) | 0; ctx.fillStyle = "rgba(" + (210 + v) + "," + (207 + v) + "," + (200 + v) + ",0.25)"; ctx.fillRect(x, y, 3, 3); }
  return mktex(c);
}

function makeAcousticCeil() {
  const W = 512, H = 512, S = 128, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#d9ddd6"; ctx.fillRect(0, 0, W, H);
  for (let x = 0; x <= W; x += S) { ctx.strokeStyle = "rgba(120,128,120,0.45)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += S) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    ctx.fillStyle = `rgba(${190 + ((Math.random() * 20) | 0)},${194 + ((Math.random() * 20) | 0)},${188 + ((Math.random() * 20) | 0)},0.15)`;
    ctx.fillRect(x, y, 2, 2);
  }
  return mktex(c);
}

function makePictureFrame(seed) {
  const W = 96, H = 72, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"), FW = 7, px = FW, py = FW, pw = W - FW * 2, ph = H - FW * 2;
  ctx.fillStyle = "#7a5210"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#b87830"; ctx.fillRect(1, 1, W - 2, 4); ctx.fillRect(1, 1, 4, H - 2);
  ctx.fillStyle = "#5a3a08"; ctx.fillRect(1, H - 5, W - 2, 4); ctx.fillRect(W - 5, 1, 4, H - 2);
  const t = seed % 5;
  if (t === 0) {
    const sky = ctx.createLinearGradient(px, py, px, py + ph * 0.55); sky.addColorStop(0, "#4a8fbf"); sky.addColorStop(1, "#8dc8e8"); ctx.fillStyle = sky; ctx.fillRect(px, py, pw, ph * 0.55);
    ctx.fillStyle = "#3a7a3a"; ctx.fillRect(px, py + ph * 0.55, pw, ph * 0.45); ctx.fillStyle = "#6ab560"; ctx.fillRect(px, py + ph * 0.65, pw, ph * 0.35);
    ctx.fillStyle = "#ffe050"; ctx.beginPath(); ctx.arc(px + pw * 0.78, py + ph * 0.18, ph * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1a4a1a"; ctx.beginPath(); ctx.moveTo(px + pw * 0.22, py + ph); ctx.lineTo(px + pw * 0.18, py + ph * 0.52); ctx.lineTo(px + pw * 0.26, py + ph * 0.52); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#2a5e2a"; ctx.beginPath(); ctx.moveTo(px + pw * 0.22, py + ph * 0.58); ctx.lineTo(px + pw * 0.15, py + ph * 0.3); ctx.lineTo(px + pw * 0.29, py + ph * 0.3); ctx.closePath(); ctx.fill();
  } else if (t === 1) {
    ctx.fillStyle = "#c0a878"; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = "#b09060"; ctx.beginPath(); ctx.ellipse(px + pw / 2, py + ph * 0.48, pw * 0.3, ph * 0.38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2a1808"; ctx.beginPath(); ctx.ellipse(px + pw / 2, py + ph * 0.22, pw * 0.2, ph * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2a1808"; ctx.beginPath(); ctx.arc(px + pw * 0.43, py + ph * 0.43, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(px + pw * 0.57, py + ph * 0.43, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8B4513"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px + pw / 2, py + ph * 0.52, pw * 0.07, 0.1, Math.PI - 0.1); ctx.stroke();
    ctx.fillStyle = "#e8e0d0"; ctx.fillRect(px + pw * 0.37, py + ph * 0.75, pw * 0.26, ph * 0.25);
  } else if (t === 2) {
    ctx.fillStyle = "#0a0a2a"; ctx.fillRect(px, py, pw, ph); ctx.fillStyle = "#1a2050"; ctx.fillRect(px, py + ph * 0.72, pw, ph * 0.28);
    for (let i = 0; i < 28; i++) { const sx = px + ((Math.sin(i * 127.1) * 0.5 + 0.5) * pw), sy = py + ((Math.cos(i * 311.7) * 0.4 + 0.22) * ph); ctx.fillStyle = "rgba(255,255,220," + (0.4 + Math.sin(i) * 0.4) + ")"; ctx.fillRect(sx, sy, 1.5, 1.5); }
    ctx.fillStyle = "#ffffaa"; ctx.beginPath(); ctx.arc(px + pw * 0.7, py + ph * 0.25, ph * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0a0a2a"; ctx.beginPath(); ctx.arc(px + pw * 0.73, py + ph * 0.22, ph * 0.085, 0, Math.PI * 2); ctx.fill();
  } else if (t === 3) {
    ctx.fillStyle = "#7a6a50"; ctx.fillRect(px, py, pw, ph); ctx.fillStyle = "#404030"; ctx.fillRect(px, py + ph * 0.72, pw, ph * 0.28);
    ctx.fillStyle = "#c03020"; ctx.beginPath(); ctx.ellipse(px + pw / 2, py + ph * 0.68, pw * 0.1, ph * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#a02010"; ctx.fillRect(px + pw * 0.4, py + ph * 0.72, pw * 0.2, ph * 0.04);
    [["#e84080", 0.42], ["#f0c000", 0.5], ["#e06020", 0.58]].forEach(([col, fx]) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px + pw * fx, py + ph * 0.36, pw * 0.06, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#2a6020"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px + pw * fx, py + ph * 0.42); ctx.lineTo(px + pw / 2, py + ph * 0.6); ctx.stroke(); });
  } else {
    ctx.fillStyle = "#f0ead8"; ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = "#8a7a5a"; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(px + Math.sin(i * 0.8) * pw * 0.4 + pw / 2, py + ph * 0.1); ctx.bezierCurveTo(px + pw * (0.2 + i * 0.08), py + ph * 0.5, px + pw * (0.8 - i * 0.05), py + ph * 0.5, px + pw / 2 + Math.cos(i * 1.2) * pw * 0.3, py + ph * 0.9); ctx.stroke(); }
    [["#c03030", 0.25], ["#3060c0", 0.42], ["#30a030", 0.59], ["#c0a000", 0.76]].forEach(([col, fx]) => { ctx.fillStyle = col + "88"; ctx.beginPath(); ctx.arc(px + pw * fx, py + ph * (0.3 + Math.sin(fx * 8) * 0.25), pw * 0.08, 0, Math.PI * 2); ctx.fill(); });
  }
  return new THREE.CanvasTexture(c);
}

function makeArtTextureFromUrl(imageUrl, accent = "#1f4e79") {
  const W = 96, H = 72, c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d"), FW = 7, px = FW, py = FW, pw = W - FW * 2, ph = H - FW * 2;
  ctx.fillStyle = "#6d6a64"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#efe8db"; ctx.fillRect(1, 1, W - 2, 4); ctx.fillRect(1, 1, 4, H - 2);
  ctx.fillStyle = "#4c4842"; ctx.fillRect(1, H - 5, W - 2, 4); ctx.fillRect(W - 5, 1, 4, H - 2);
  ctx.fillStyle = "#f8f6ef"; ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);
  const tex = new THREE.CanvasTexture(c);
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, px + 2, py + 2, pw - 4, ph - 4);
    tex.needsUpdate = true;
  };
  img.src = imageUrl;
  return tex;
}

const DECOR_GEOMETRIES = {
  frame: new THREE.PlaneGeometry(CELL * 0.46, CELL * 0.34),
  poster: new THREE.PlaneGeometry(CELL * 0.38, CELL * 0.6),
  wide: new THREE.PlaneGeometry(CELL * 0.6, CELL * 0.26),
  square: new THREE.PlaneGeometry(CELL * 0.42, CELL * 0.42),
  tablet: new THREE.PlaneGeometry(CELL * 0.38, CELL * 0.52),
  medallion: new THREE.CircleGeometry(CELL * 0.2, 24),
};

const THEMES = {
  classic_win98: {
    label: "Win98",
    wall: makeBrickWall,
    floor: makeCheckerFloor,
    ceil: makeWhiteCeil,
    background: 0x000000,
    fog: 0x000000,
    ambientColor: 0xffffff,
    ambientIntensity: 0.72,
    pointColor: 0xffffee,
    pointIntensity: 1.2,
  },
  office_98: {
    label: "Office 98",
    wall: makePanelWall,
    floor: makeOfficeCarpetFloor,
    ceil: makeAcousticCeil,
    background: 0x06090c,
    fog: 0x0a1117,
    ambientColor: 0xdde5ee,
    ambientIntensity: 0.68,
    pointColor: 0xcfe6ff,
    pointIntensity: 1.1,
    artUrls: [
      officeChartBarQuarterlyUrl,
      officeChartPieMarketshareUrl,
      officeChartBarTargetsUrl,
      officeChartPieBudgetUrl,
    ],
    decorKind: "wide",
    decorAccent: "#1f4e79",
  },
  gallery: {
    label: "Gallery",
    wall: makeGalleryWall,
    floor: makeMarbleFloor,
    ceil: makeWhiteCeil,
    background: 0x0b0b0b,
    fog: 0x101010,
    ambientColor: 0xf4eee3,
    ambientIntensity: 0.64,
    pointColor: 0xfff2cf,
    pointIntensity: 1.15,
    artUrls: [galleryPosterUrl, galleryLabelUrl],
    decorKind: "poster",
    decorAccent: "#7d7364",
  },
  service_industrial: {
    label: "Industrial",
    wall: makeConcreteWall,
    floor: makeConcreteFloor,
    ceil: makeMetalCeil,
    background: 0x060708,
    fog: 0x0b0d10,
    ambientColor: 0xd4dce2,
    ambientIntensity: 0.58,
    pointColor: 0xc8d8ff,
    pointIntensity: 1.05,
    artUrls: [industrialWarningPanelUrl, industrialStencilPlateUrl],
    decorKind: "square",
    decorAccent: "#707a84",
  },
  liminal_backrooms: {
    label: "Liminal",
    wall: makeBackroomsWall,
    floor: makeBackroomsFloor,
    ceil: makeBackroomsCeil,
    background: 0x080702,
    fog: 0x151108,
    ambientColor: 0xe7dfad,
    ambientIntensity: 0.56,
    pointColor: 0xfff2b8,
    pointIntensity: 1.0,
    artUrls: [liminalNoticeBoardUrl, liminalExitArrowUrl],
    decorKind: "wide",
    decorAccent: "#8f8863",
  },
  retro_wood: {
    label: "Retro Wood",
    wall: makeWoodWall,
    floor: makeWoodFloor,
    ceil: makeWoodCeil,
    background: 0x090603,
    fog: 0x140d07,
    ambientColor: 0xf0d7b8,
    ambientIntensity: 0.62,
    pointColor: 0xffd19a,
    pointIntensity: 1.08,
    artUrls: [retroWoodPlaqueUrl],
    decorKind: "wide",
    decorAccent: "#4d2c13",
  },
  tiled_palace: {
    label: "Tiled Palace",
    wall: makeAzulejoWall,
    floor: makeAzulejoFloor,
    ceil: makeAzulejoCeil,
    background: 0x080809,
    fog: 0x0f1014,
    ambientColor: 0xe8e0c8,
    ambientIntensity: 0.66,
    pointColor: 0xffefbf,
    pointIntensity: 1.12,
    artUrls: [ceramicMedallionUrl],
    decorKind: "medallion",
    decorAccent: "#1a2e8a",
  },
  brick_bunker: {
    label: "Brick Bunker",
    wall: makeBrickWall,
    floor: makeConcreteFloor,
    ceil: makeBrickCeil,
    background: 0x070505,
    fog: 0x110b0b,
    ambientColor: 0xdcc8c0,
    ambientIntensity: 0.58,
    pointColor: 0xffc7b0,
    pointIntensity: 1.0,
    artUrls: [industrialStencilPlateUrl],
    decorKind: "square",
    decorAccent: "#6a2a2a",
  },
  blue_lab: {
    label: "Blue Lab",
    wall: makeMetalWall,
    floor: makeOfficeCarpetFloor,
    ceil: makeAcousticCeil,
    background: 0x04070b,
    fog: 0x09111a,
    ambientColor: 0xd7e8ff,
    ambientIntensity: 0.64,
    pointColor: 0xbfe2ff,
    pointIntensity: 1.12,
    artUrls: [labMonitorUrl],
    decorKind: "wide",
    decorAccent: "#5f7280",
  },
  dusty_stone: {
    label: "Dusty Stone",
    wall: makeStoneWall,
    floor: makeDirtFloor,
    ceil: makeStoneCeil,
    background: 0x090806,
    fog: 0x15120d,
    ambientColor: 0xe0d4c0,
    ambientIntensity: 0.54,
    pointColor: 0xf7ddb0,
    pointIntensity: 0.96,
    artUrls: [stoneTabletUrl],
    decorKind: "tablet",
    decorAccent: "#59544f",
  },
  checker_hall: {
    label: "Checker Hall",
    wall: makeGalleryWall,
    floor: makeCheckerFloor,
    ceil: makeWhiteCeil,
    background: 0x080808,
    fog: 0x121212,
    ambientColor: 0xf6f2ea,
    ambientIntensity: 0.68,
    pointColor: 0xffffff,
    pointIntensity: 1.18,
    artUrls: [galleryLabelUrl],
    decorKind: "wide",
    decorAccent: "#333333",
  },
  copper_service: {
    label: "Copper Service",
    wall: makeWoodWall,
    floor: makeConcreteFloor,
    ceil: makeMetalCeil,
    background: 0x080706,
    fog: 0x12100d,
    ambientColor: 0xe3cfbf,
    ambientIntensity: 0.55,
    pointColor: 0xffd3b0,
    pointIntensity: 1.02,
    artUrls: [industrialWarningPanelUrl],
    decorKind: "wide",
    decorAccent: "#8a5b2d",
  },
  marble_office: {
    label: "Marble Office",
    wall: makePanelWall,
    floor: makeMarbleFloor,
    ceil: makeAcousticCeil,
    background: 0x09090a,
    fog: 0x101216,
    ambientColor: 0xe7edf0,
    ambientIntensity: 0.67,
    pointColor: 0xf2f8ff,
    pointIntensity: 1.14,
    artUrls: [
      officeChartBarQuarterlyUrl,
      officeChartPieMarketshareUrl,
      officeChartBarTargetsUrl,
      officeChartPieBudgetUrl,
    ],
    decorKind: "wide",
    decorAccent: "#5b2c83",
  },
  night_gallery: {
    label: "Night Gallery",
    wall: makeGalleryWall,
    floor: makeCarpetFloor,
    ceil: makeMetalCeil,
    background: 0x050509,
    fog: 0x0c0c14,
    ambientColor: 0xd7cde8,
    ambientIntensity: 0.5,
    pointColor: 0xe4ccff,
    pointIntensity: 0.98,
    artUrls: [galleryPosterUrl],
    decorKind: "poster",
    decorAccent: "#57466d",
  },
  false_sanctuary: {
    label: "False Sanctuary",
    wall: makeAzulejoWall,
    floor: makeMarbleFloor,
    ceil: makeBackroomsCeil,
    background: 0x080707,
    fog: 0x14110d,
    ambientColor: 0xe9dfc6,
    ambientIntensity: 0.57,
    pointColor: 0xffefb0,
    pointIntensity: 1.04,
    artUrls: [ceramicMedallionUrl, liminalExitArrowUrl],
    decorKind: "medallion",
    decorAccent: "#8f8863",
  },
};

function getThemeCandidates(dist) {
  if (dist <= 1) return [
    { value: "classic_win98", weight: 3 },
    { value: "office_98", weight: 2 },
    { value: "gallery", weight: 1 },
    { value: "retro_wood", weight: 1 },
    { value: "checker_hall", weight: 1 },
  ];
  if (dist <= 3) return [
    { value: "classic_win98", weight: 1 },
    { value: "office_98", weight: 1 },
    { value: "gallery", weight: 1 },
    { value: "service_industrial", weight: 1 },
    { value: "retro_wood", weight: 1 },
    { value: "tiled_palace", weight: 1 },
    { value: "blue_lab", weight: 1 },
    { value: "dusty_stone", weight: 1 },
    { value: "checker_hall", weight: 1 },
    { value: "marble_office", weight: 1 },
  ];
  return [
    { value: "office_98", weight: 1 },
    { value: "gallery", weight: 1 },
    { value: "service_industrial", weight: 1 },
    { value: "liminal_backrooms", weight: 1 },
    { value: "retro_wood", weight: 1 },
    { value: "tiled_palace", weight: 1 },
    { value: "brick_bunker", weight: 1 },
    { value: "blue_lab", weight: 1 },
    { value: "dusty_stone", weight: 1 },
    { value: "checker_hall", weight: 1 },
    { value: "copper_service", weight: 1 },
    { value: "marble_office", weight: 1 },
    { value: "night_gallery", weight: 1 },
    { value: "false_sanctuary", weight: 1 },
    { value: "classic_win98", weight: 1 },
  ];
}

const themeTypeCache = new Map();

function getThemeTypeForChunk(cr, cc) {
  const key = cr + "_" + cc;
  if (themeTypeCache.has(key)) return themeTypeCache.get(key);
  let themeType = "classic_win98";
  if (!(cr === 0 && cc === 0)) {
    const dist = Math.max(0, cc);
    const rand = makeChunkRand(cr, cc, 1);
    const previous = cc > 0 ? getThemeTypeForChunk(cr, cc - 1) : null;
    const pool = getThemeCandidates(dist);
    const filtered = previous ? pool.filter((item) => item.value !== previous) : pool;
    themeType = pickWeighted(rand, filtered.length ? filtered : pool);
  }
  themeTypeCache.set(key, themeType);
  return themeType;
}

const LAYOUT_LABELS = {
  classic_maze: "Maze clasico",
  loop_maze: "Maze con loops",
  ring_hall: "Anillo",
  room_grid: "Salas en grilla",
  cross_hub: "Cruce central",
  snake_corridor: "Corredor serpenteante",
  ladder: "Escalera",
  spiral: "Espiral",
  zigzag_chambers: "Camaras zigzag",
  twin_corridors: "Corredores gemelos",
  offset_rooms: "Salas desplazadas",
  perimeter_cuts: "Perimetro cortado",
  diamond: "Diamante",
  pinwheel: "Molino",
  switchbacks: "Retornos",
  inner_sanctum: "Santuario interior",
};

const W98 = { fontFamily: "MS Sans Serif, Arial", fontSize: 11 };
const POS_OPTS = [{ v: "tl", l: "Arriba izq" }, { v: "tr", l: "Arriba der" }, { v: "bl", l: "Abajo izq" }, { v: "br", l: "Abajo der" }];
const MODE_OPTS = [{ v: 2, l: "Central redondo" }, { v: 1, l: "En un costado" }, { v: 0, l: "Sin minimapa" }];
const MOVE_OPTS = [{ v: 0, l: "Libre" }, { v: 1, l: "Carril" }, { v: 2, l: "Auto" }];

function TextureMenu({ onClose, mmMode, onMmMode, mmPos, onMmPos, mmOp, onMmOp, isMobile, moveMode, onMoveMode, zoneInfo }) {
  const [lMode, setLMode] = useState(mmMode);
  const [lPos, setLPos] = useState(mmPos);
  const [lOp, setLOp] = useState(mmOp);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, background: "rgba(0,0,0,0.5)" }}>
      <div style={{ border: "3px outset #fff", ...W98 }}>
        <div style={{ background: "#000080", color: "#fff", padding: "3px 6px", fontSize: 12, fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Maze Setup</span>
          <span style={{ cursor: "pointer", padding: "0 5px", background: "#d4d0c8", color: "#000", border: "1px outset #fff", fontSize: 11 }} onClick={onClose}>X</span>
        </div>
        <div style={{ background: "#d4d0c8", padding: 12, width: 330 }}>
          <fieldset style={{ border: "1px solid #808080", padding: "8px 10px", marginBottom: 8 }}>
            <legend style={{ fontSize: 11, padding: "0 4px" }}>Mundo</legend>
            <div style={{ fontSize: 10, color: "#333", lineHeight: 1.5 }}>
              <div>Chunk inicial: estilo clasico fijo.</div>
              <div>Despues: layouts y temas cambian automaticamente segun distancia.</div>
            </div>
            <div style={{ marginTop: 8, padding: "6px 8px", background: "#c8c4bc", border: "1px inset #888", fontSize: 10, color: "#333" }}>
              <div><strong>Zona actual:</strong> {zoneInfo.layout}</div>
              <div><strong>Tema:</strong> {zoneInfo.theme}</div>
            </div>
          </fieldset>
          <fieldset style={{ border: "1px solid #808080", padding: "8px 10px", marginBottom: 8 }}>
            <legend style={{ fontSize: 11, padding: "0 4px" }}>Modo de movimiento</legend>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {MOVE_OPTS.map(({ v, l }) => <button key={v} onClick={() => onMoveMode(v)} style={{ background: moveMode === v ? "#000080" : "#d4d0c8", color: moveMode === v ? "#fff" : "#000", border: moveMode === v ? "2px inset #888" : "2px outset #fff", padding: "3px 8px", cursor: "pointer", ...W98 }}>{l}</button>)}
            </div>
          </fieldset>
          <fieldset style={{ border: "1px solid #808080", padding: "8px 10px", marginBottom: 8 }}>
            <legend style={{ fontSize: 11, padding: "0 4px" }}>Minimap</legend>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {MODE_OPTS.map(({ v, l }) => <button key={v} onClick={() => setLMode(v)} style={{ background: lMode === v ? "#000080" : "#d4d0c8", color: lMode === v ? "#fff" : "#000", border: lMode === v ? "2px inset #888" : "2px outset #fff", padding: "3px 8px", cursor: "pointer", ...W98 }}>{l}</button>)}
            </div>
            {lMode === 1 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {POS_OPTS.map(({ v, l }) => <button key={v} onClick={() => setLPos(v)} style={{ background: lPos === v ? "#000080" : "#d4d0c8", color: lPos === v ? "#fff" : "#000", border: lPos === v ? "2px inset #888" : "2px outset #fff", padding: "3px 8px", cursor: "pointer", ...W98 }}>{l}</button>)}
            </div>}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ ...W98, whiteSpace: "nowrap" }}>Traslucido:</span>
              <input type="range" min="0.05" max="1" step="0.05" value={lOp} onChange={(e) => setLOp(parseFloat(e.target.value))} style={{ flex: 1 }} />
              <span style={{ ...W98, width: 32, textAlign: "right" }}>{Math.round(lOp * 100)}%</span>
            </div>
          </fieldset>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginBottom: 6 }}>
            <button onClick={() => { onMmMode(lMode); onMmPos(lPos); onMmOp(lOp); onClose(); }} style={{ background: "#d4d0c8", border: "2px outset #fff", padding: "4px 18px", cursor: "pointer", ...W98 }}>OK</button>
            <button onClick={onClose} style={{ background: "#d4d0c8", border: "2px outset #fff", padding: "4px 18px", cursor: "pointer", ...W98 }}>Cancel</button>
          </div>
          <div style={{ fontSize: 10, color: "#666", textAlign: "center", marginBottom: 4 }}>M - menu · Tab - minimapa · R - carril/auto · L - libre · N - info zona</div>
          {!isMobile && (
            <div style={{ padding: "6px 8px", background: "#c8c4bc", border: "1px inset #888", fontSize: 10, color: "#333", lineHeight: 1.6 }}>
              <strong style={{ display: "block", marginBottom: 2 }}>Teclado</strong>
              W/S - Avanzar · A/D - Strafe<br />
              Flechas - Girar · Tab - Minimapa · M - Menu<br />
              R - Carril/Auto · L - Libre · N - Info zona
            </div>
          )}
          <div style={{ marginTop: 8, padding: "6px 8px", background: "#c8c4bc", border: "1px inset #888", fontSize: 9, color: "#555", textAlign: "center", lineHeight: 1.5 }}>
            Pensado por FacuBis · Hecho por Claude
          </div>
        </div>
      </div>
    </div>
  );
}

function VirtualJoystick({ side, onDelta }) {
  const touchId = useRef(null), origin = useRef({ x: 0, y: 0 }), [knob, setKnob] = useState({ x: 0, y: 0 }), MAX = 40;
  const onTS = useCallback((e) => { if (touchId.current !== null) return; const t = e.changedTouches[0]; touchId.current = t.identifier; origin.current = { x: t.clientX, y: t.clientY }; setKnob({ x: 0, y: 0 }); e.preventDefault(); }, []);
  const onTM = useCallback((e) => { for (const t of e.changedTouches) { if (t.identifier !== touchId.current) continue; let dx = t.clientX - origin.current.x, dy = t.clientY - origin.current.y; const d = Math.sqrt(dx * dx + dy * dy); if (d > MAX) { dx = dx / d * MAX; dy = dy / d * MAX; } setKnob({ x: dx, y: dy }); onDelta(dx / MAX, dy / MAX); } e.preventDefault(); }, [onDelta]);
  const onTE = useCallback((e) => { for (const t of e.changedTouches) if (t.identifier === touchId.current) { touchId.current = null; setKnob({ x: 0, y: 0 }); onDelta(0, 0); } }, [onDelta]);
  return (
    <div onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE} style={{ position: "absolute", bottom: 32, [side]: 32, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none", userSelect: "none" }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.5)", transform: "translate(" + knob.x + "px," + knob.y + "px)", transition: touchId.current === null ? "transform 0.1s" : "none", pointerEvents: "none" }} />
    </div>
  );
}

export default function Maze98() {
  const mountRef = useRef(null), touchMove = useRef({ x: 0, y: 0 }), touchLook = useRef({ x: 0, y: 0 });
  const minimapRef = useRef(null), visitedRef = useRef(new Set());
  const traversedEdgesRef = useRef(new Set());
  const isMobile = window.matchMedia("(pointer: coarse)").matches;
  const mmModeRef = useRef(1), mmPosRef = useRef("br"), mmOpRef = useRef(0.45);
  const [mmMode, setMmMode] = useState(1);
  const [mmPos, setMmPos] = useState("br");
  const [mmOp, setMmOp] = useState(0.45);
  const setMode = (v) => { const nv = typeof v === "function" ? v(mmModeRef.current) : v; mmModeRef.current = nv; setMmMode(nv); };
  const setPos = (v) => { mmPosRef.current = v; setMmPos(v); };
  const setOp = (v) => { mmOpRef.current = v; setMmOp(v); };
  const [menuOpen, setMenuOpen] = useState(false);
  const [gameKey] = useState(0);
  const moveModeRef = useRef(0);
  const [moveMode, setMoveModeState] = useState(0);
  const [modeLog, setModeLog] = useState(null);
  const [zoneInfo, setZoneInfo] = useState({ layout: LAYOUT_LABELS.classic_maze, theme: THEMES.classic_win98.label });
  const [showZoneInfo, setShowZoneInfo] = useState(false);
  const modeLogTimer = useRef(null);
  const railModeRef = useRef(false);
  const [railMode, setRailModeState] = useState(false);
  const autoModeRef = useRef(false);
  const railRef = useRef({ r: 0, c: 0, dr: 0, dc: 1, t: 0, targetR: 0, targetC: 1, phase: "moving", targetYaw: 0, pendingDr: 0, pendingDc: 0, availDirs: [] });
  const railChoiceRef = useRef(null);
  const railChoosingRef = useRef(false);
  const [railChoosing, setRailChoosing] = useState(false);
  const [railAvailSides, setRailAvailSides] = useState([]);
  const applyMoveModeRef = useRef(null);

  useEffect(() => {
    const CHUNK_W = COLS * CELL, CHUNK_H = ROWS * CELL;
    const chunkKey = (cr, cc) => cr + "_" + cc;
    const edgeKey = (r1, c1, r2, c2) => {
      const a = r1 + "_" + c1, b = r2 + "_" + c2;
      return a < b ? a + "|" + b : b + "|" + a;
    };
    const getEastOpeningRow = (cc) => (((0 * 2654435761 + cc * 1234567891) >>> 0) % ROWS);
    const dirToYaw = (dr, dc) => dr === -1 ? 0 : dc === 1 ? Math.PI / 2 : dr === 1 ? Math.PI : -Math.PI / 2;
    const yawToDir = (y) => { const a = ((y % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); if (a < Math.PI / 4 || a >= 7 * Math.PI / 4) return { dr: -1, dc: 0 }; if (a < 3 * Math.PI / 4) return { dr: 0, dc: 1 }; if (a < 5 * Math.PI / 4) return { dr: 1, dc: 0 }; return { dr: 0, dc: -1 }; };
    const relSide = (fdr, fdc, dr, dc) => { if (dr === fdr && dc === fdc) return "forward"; if (dr === -fdc && dc === fdr) return "left"; if (dr === fdc && dc === -fdr) return "right"; return "back"; };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 30, 80);
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(CELL * .5, CELL * .5, CELL * .5);
    camera.rotation.order = "YXZ";
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mountRef.current.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambient);
    const pt = new THREE.PointLight(0xffffee, 1.2, 40);
    camera.add(pt);
    scene.add(camera);

    const chunkFloorGeo = new THREE.PlaneGeometry(CHUNK_W, CHUNK_H), chunkCeilGeo = new THREE.PlaneGeometry(CHUNK_W, CHUNK_H);
    const wGH = new THREE.PlaneGeometry(CELL, CELL), wGV = new THREE.PlaneGeometry(CELL, CELL);
    const picGeo = new THREE.PlaneGeometry(CELL * 0.46, CELL * 0.34);
    const OFF = 0.06, PY = CELL * 0.52;

    const applySceneTheme = (themeType) => {
      const theme = THEMES[themeType];
      scene.background.setHex(theme.background);
      scene.fog.color.setHex(theme.fog);
      ambient.color.setHex(theme.ambientColor);
      ambient.intensity = theme.ambientIntensity;
      pt.color.setHex(theme.pointColor);
      pt.intensity = theme.pointIntensity;
    };

    const scaleTexture = (tex, repeatX, repeatY) => {
      tex.repeat.set(tex.repeat.x * repeatX, tex.repeat.y * repeatY);
      tex.needsUpdate = true;
      return tex;
    };

    const themeResourceCache = new Map();
    const pictureMaterials = Array.from({ length: 5 }, (_, idx) => new THREE.MeshBasicMaterial({ map: makePictureFrame(idx) }));
    const themedArtMaterialCache = new Map();
    const getArtResourcesForTheme = (themeType) => {
      if (themedArtMaterialCache.has(themeType)) return themedArtMaterialCache.get(themeType);
      const theme = THEMES[themeType];
      const resource = theme.artUrls
        ? {
          materials: theme.artUrls.map((url) => new THREE.MeshBasicMaterial({ map: makeArtTextureFromUrl(url, theme.decorAccent) })),
          geometry: DECOR_GEOMETRIES[theme.decorKind || "frame"],
          chance: 10,
        }
        : {
          materials: pictureMaterials,
          geometry: DECOR_GEOMETRIES.frame,
          chance: 12,
        };
      themedArtMaterialCache.set(themeType, resource);
      return resource;
    };
    const getThemeResources = (themeType) => {
      if (themeResourceCache.has(themeType)) return themeResourceCache.get(themeType);
      const theme = THEMES[themeType];
      const wallMat = new THREE.MeshLambertMaterial({ map: theme.wall(), side: THREE.DoubleSide });
      const floorMat = new THREE.MeshLambertMaterial({ map: scaleTexture(theme.floor(), COLS, ROWS) });
      const ceilMat = new THREE.MeshLambertMaterial({ map: scaleTexture(theme.ceil(), COLS, ROWS) });
      const resources = { wallMat, floorMat, ceilMat };
      themeResourceCache.set(themeType, resources);
      return resources;
    };

    const buildChunkGroup = (chunk, offX, offZ) => {
      const g = new THREE.Group();
      const { wallMat, floorMat, ceilMat } = getThemeResources(chunk.themeType);
      const artResources = getArtResourcesForTheme(chunk.themeType);
      const artMaterials = artResources.materials;
      const decorGeo = artResources.geometry;
      const decorChance = artResources.chance;
      const { walls } = chunk;
      const centerX = offX + CHUNK_W / 2, centerZ = offZ + CHUNK_H / 2;
      const fl = new THREE.Mesh(chunkFloorGeo, floorMat); fl.rotation.x = -Math.PI / 2; fl.position.set(centerX, 0, centerZ); g.add(fl);
      const ce = new THREE.Mesh(chunkCeilGeo, ceilMat); ce.rotation.x = Math.PI / 2; ce.position.set(centerX, CELL, centerZ); g.add(ce);
      for (let r = 0; r <= ROWS; r++) for (let c = 0; c < COLS; c++) if (walls.h[r][c]) {
        const w = new THREE.Mesh(wGH, wallMat); w.position.set(offX + c * CELL + CELL / 2, CELL / 2, offZ + r * CELL); g.add(w);
      }
      for (let r = 0; r < ROWS; r++) for (let c = 0; c <= COLS; c++) if (walls.v[r][c]) {
        const w = new THREE.Mesh(wGV, wallMat); w.rotation.y = Math.PI / 2; w.position.set(offX + c * CELL, CELL / 2, offZ + r * CELL + CELL / 2); g.add(w);
      }
      for (let r = 0; r <= ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (!walls.h[r][c]) continue;
        const h1 = ((((r * COLS + c) * 2654435761) >>> 0) + chunkKey(offZ / CHUNK_H, offX / CHUNK_W).length) % 100;
        if (h1 < decorChance) {
          const p = new THREE.Mesh(decorGeo, artMaterials[h1 % artMaterials.length]); p.position.set(offX + c * CELL + CELL / 2, PY, offZ + r * CELL + OFF); g.add(p);
        }
        const h2 = ((((r * COLS + c + 500) * 2654435761) >>> 0) + (chunk.layoutType.length * 7)) % 100;
        if (h2 < decorChance) {
          const p = new THREE.Mesh(decorGeo, artMaterials[h2 % artMaterials.length]); p.rotation.y = Math.PI; p.position.set(offX + c * CELL + CELL / 2, PY, offZ + r * CELL - OFF); g.add(p);
        }
      }
      for (let r = 0; r < ROWS; r++) for (let c = 0; c <= COLS; c++) {
        if (!walls.v[r][c]) continue;
        const h1 = ((((r * (COLS + 1) + c) * 3141592653) >>> 0) + chunk.layoutType.length) % 100;
        if (h1 < decorChance) {
          const p = new THREE.Mesh(decorGeo, artMaterials[h1 % artMaterials.length]); p.rotation.y = Math.PI / 2; p.position.set(offX + c * CELL + OFF, PY, offZ + r * CELL + CELL / 2); g.add(p);
        }
        const h2 = ((((r * (COLS + 1) + c + 500) * 3141592653) >>> 0) + chunk.themeType.length) % 100;
        if (h2 < decorChance) {
          const p = new THREE.Mesh(decorGeo, artMaterials[h2 % artMaterials.length]); p.rotation.y = -Math.PI / 2; p.position.set(offX + c * CELL - OFF, PY, offZ + r * CELL + CELL / 2); g.add(p);
        }
      }
      return {
        group: g,
        dispose() {},
      };
    };

    const chunkMap = new Map();
    const loadChunk = (cr, cc) => {
      const k = chunkKey(cr, cc);
      if (chunkMap.has(k)) return;
      const chunk = generateChunk(cr, cc);
      const built = buildChunkGroup(chunk, cc * CHUNK_W, cr * CHUNK_H);
      scene.add(built.group);
      chunkMap.set(k, { cr, cc, ...chunk, ...built });
    };
    const unloadChunk = (cr, cc) => {
      const k = chunkKey(cr, cc), ch = chunkMap.get(k);
      if (!ch) return;
      scene.remove(ch.group);
      ch.dispose();
      chunkMap.delete(k);
    };
    const loadNeighbors = (cr, cc) => {
      loadChunk(0, cc);
      if (cc > 0) loadChunk(0, cc - 1);
      loadChunk(0, cc + 1);
    };
    const unloadFarChunks = (cr, cc) => {
      const toRemove = [];
      for (const ch of chunkMap.values()) if (ch.cr !== 0 || Math.abs(ch.cc - cc) > 1) toRemove.push([ch.cr, ch.cc]);
      for (const [r, c] of toRemove) unloadChunk(r, c);
    };

    loadNeighbors(0, 0);
    applySceneTheme("classic_win98");

    const getLocal = (worldR, worldC) => { const cr = Math.floor(worldR / ROWS), cc = Math.floor(worldC / COLS); return { cr, cc, r: worldR - cr * ROWS, c: worldC - cc * COLS }; };
    const getChunkData = (cr, cc) => chunkMap.get(chunkKey(cr, cc));
    const getChunkMaze = (cr, cc) => getChunkData(cr, cc)?.walls;
    const canGoDir = (worldR, worldC, dr, dc) => {
      const { cr, cc, r, c } = getLocal(worldR, worldC), maze = getChunkMaze(cr, cc);
      if (!maze) return false;
      if (dr === -1) return !maze.h[r][c];
      if (dr === 1) return !maze.h[r + 1][c];
      if (dc === -1) return !maze.v[r][c];
      return !maze.v[r][c + 1];
    };
    const canMove = (nx, nz) => {
      const mg = 1.5, worldC = Math.floor(nx / CELL), worldR = Math.floor(nz / CELL);
      const { cr, cc, r, c } = getLocal(worldR, worldC), maze = getChunkMaze(cr, cc);
      if (!maze) return false;
      const lr = nz / CELL - worldR, lc = nx / CELL - worldC;
      if (lr < mg / CELL && maze.h[r][c]) return false;
      if (lr > 1 - mg / CELL && maze.h[r + 1][c]) return false;
      if (lc < mg / CELL && maze.v[r][c]) return false;
      if (lc > 1 - mg / CELL && maze.v[r][c + 1]) return false;
      return true;
    };

    const updateZoneInfo = (cr, cc) => {
      const chunk = getChunkData(cr, cc);
      if (!chunk) return;
      applySceneTheme(chunk.themeType);
      setZoneInfo({ layout: LAYOUT_LABELS[chunk.layoutType], theme: THEMES[chunk.themeType].label });
    };

    const startTex = (() => {
      const W = 320, SH = 160, c = document.createElement("canvas"); c.width = W; c.height = SH;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "rgba(200,200,200,0.18)"; ctx.fillRect(0, 0, W, SH);
      ctx.strokeStyle = "rgba(120,120,120,0.4)"; ctx.lineWidth = 2; ctx.strokeRect(1, 1, W - 2, SH - 2);
      ctx.font = "bold italic 78px 'Times New Roman',serif";
      ctx.fillStyle = "rgba(25,8,4,0.42)"; ctx.fillText("Start", 148, SH / 2 + 30);
      ctx.fillStyle = "rgba(8,3,1,0.72)"; ctx.fillText("Start", 146, SH / 2 + 28);
      const tex = new THREE.CanvasTexture(c);
      const img = new Image(); img.onload = () => { ctx.drawImage(img, 8, 8, SH - 16, SH - 16); tex.needsUpdate = true; }; img.src = windowsLogoUrl;
      return tex;
    })();
    const startSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: startTex, transparent: true, opacity: 0.92, depthWrite: false }));
    startSprite.scale.set(7, 3.5, 1); startSprite.position.set(CELL * 2, CELL * .55, CELL * .5); scene.add(startSprite);

    const keys = {};
    const onKD = (e) => {
      if (railModeRef.current && railRef.current.phase === "choosing") {
        if (e.code === "ArrowLeft") { railChoiceRef.current = "left"; e.preventDefault(); return; }
        if (e.code === "ArrowRight") { railChoiceRef.current = "right"; e.preventDefault(); return; }
        if (e.code === "ArrowUp") { railChoiceRef.current = "forward"; e.preventDefault(); return; }
        if (e.code === "ArrowDown") { railChoiceRef.current = "back"; e.preventDefault(); return; }
      }
      keys[e.code] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      if (e.code === "Tab") { e.preventDefault(); setMode((v) => (v + 1) % 3); }
      if (e.code === "KeyM") { e.preventDefault(); setMenuOpen((v) => !v); }
      if (e.code === "KeyR") {
        e.preventDefault();
        applyMoveMode(moveModeRef.current === 2 ? 1 : 2);
      }
      if (e.code === "KeyL") { e.preventDefault(); applyMoveMode(0); }
      if (e.code === "KeyN") { e.preventDefault(); setShowZoneInfo((v) => !v); }
    };
    window.addEventListener("keydown", onKD);
    window.addEventListener("keyup", (e) => { keys[e.code] = false; });

    let yaw = Math.PI / 2;
    const activateRail = () => {
      const wr = Math.floor(camera.position.z / CELL), wc = Math.floor(camera.position.x / CELL);
      let { dr, dc } = yawToDir(yaw);
      if (!canGoDir(wr, wc, dr, dc)) {
        const v = [{ dr: -1, dc: 0 }, { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }].find((d) => canGoDir(wr, wc, d.dr, d.dc));
        if (v) { dr = v.dr; dc = v.dc; }
      }
      const ty = dirToYaw(dr, dc);
      railRef.current = { r: wr, c: wc, dr, dc, t: 0, targetR: wr + dr, targetC: wc + dc, phase: "moving", targetYaw: ty, pendingDr: dr, pendingDc: dc, availDirs: [] };
      yaw = ty;
    };
    const MOVE_LABELS = ["Libre", "Carril", "Auto"];
    const applyMoveMode = (v) => {
      if (railChoosingRef.current) { railChoosingRef.current = false; setRailChoosing(false); }
      moveModeRef.current = v; setMoveModeState(v);
      railModeRef.current = v === 1; setRailModeState(v === 1);
      autoModeRef.current = v === 2;
      if (v === 1 || v === 2) activateRail();
      setModeLog("Modo: " + MOVE_LABELS[v]);
      clearTimeout(modeLogTimer.current); modeLogTimer.current = setTimeout(() => setModeLog(null), 2500);
    };
    applyMoveModeRef.current = applyMoveMode;

    let currentCr = 0, currentCc = 0;
    updateZoneInfo(0, 0);
    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate); const spd = 0.18;
      if (railModeRef.current || autoModeRef.current) {
        const rail = railRef.current;
        if (rail.phase === "moving") {
          rail.t += 0.04;
          if (rail.t >= 1) {
            traversedEdgesRef.current.add(edgeKey(rail.r, rail.c, rail.targetR, rail.targetC));
            rail.r = rail.targetR; rail.c = rail.targetC; rail.t = 0;
            const { cc: tcc } = getLocal(rail.r, rail.c);
            const tcr = 0;
            loadNeighbors(tcr, tcc); unloadFarChunks(tcr, tcc); currentCr = tcr; currentCc = tcc; updateZoneInfo(currentCr, currentCc);
            const exits = [{ dr: -1, dc: 0 }, { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }].filter((d) => canGoDir(rail.r, rail.c, d.dr, d.dc));
            const backDr = -rail.dr, backDc = -rail.dc;
            const nonBackExits = exits.filter((d) => !(d.dr === backDr && d.dc === backDc));
            if (nonBackExits.length === 0) {
              rail.pendingDr = backDr; rail.pendingDc = backDc; rail.targetYaw = dirToYaw(backDr, backDc); rail.phase = "turning";
            }
            else if (nonBackExits.length === 1) {
              const nd = nonBackExits[0];
              if (nd.dr === rail.dr && nd.dc === rail.dc) { rail.targetR = rail.r + rail.dr; rail.targetC = rail.c + rail.dc; }
              else { rail.pendingDr = nd.dr; rail.pendingDc = nd.dc; rail.targetYaw = dirToYaw(nd.dr, nd.dc); rail.phase = "turning"; }
            }
            else {
              rail.availDirs = [...nonBackExits, { dr: backDr, dc: backDc }].map((d) => ({ ...d, side: relSide(rail.dr, rail.dc, d.dr, d.dc) }));
              rail.phase = "choosing";
              if (!railChoosingRef.current) { railChoosingRef.current = true; setRailChoosing(true); setRailAvailSides(rail.availDirs.map((d) => d.side)); }
            }
          } else {
            const fx = rail.c * CELL + CELL / 2, fz = rail.r * CELL + CELL / 2, tx = rail.targetC * CELL + CELL / 2, tz = rail.targetR * CELL + CELL / 2;
            camera.position.x = fx + (tx - fx) * rail.t; camera.position.z = fz + (tz - fz) * rail.t;
          }
        } else if (rail.phase === "turning") {
          camera.position.x = rail.c * CELL + CELL / 2; camera.position.z = rail.r * CELL + CELL / 2;
          let diff = rail.targetYaw - yaw; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
          if (Math.abs(diff) < 0.01) { yaw = rail.targetYaw; rail.dr = rail.pendingDr; rail.dc = rail.pendingDc; rail.targetR = rail.r + rail.dr; rail.targetC = rail.c + rail.dc; rail.phase = "moving"; rail.t = 0; }
          else yaw += Math.sign(diff) * Math.min(0.08, Math.abs(diff));
        } else if (rail.phase === "choosing") {
          camera.position.x = rail.c * CELL + CELL / 2; camera.position.z = rail.r * CELL + CELL / 2;
          if (autoModeRef.current) {
            const { cc } = getLocal(rail.r, rail.c);
            const goalR = getEastOpeningRow(cc), goalC = (cc + 1) * COLS - 1;
            const scored = rail.availDirs.map((d) => {
              const nr = rail.r + d.dr, nc = rail.c + d.dc;
              const unseen = !traversedEdgesRef.current.has(edgeKey(rail.r, rail.c, nr, nc));
              const dist = Math.abs(goalR - nr) + Math.abs(goalC - nc);
              return { ...d, unseen, dist };
            });
            const unseen = scored.filter((d) => d.unseen);
            const pool = unseen.length ? unseen : scored;
            const bestDist = Math.min(...pool.map((d) => d.dist));
            const best = pool.filter((d) => d.dist === bestDist);
            const chosen = best[Math.floor(Math.random() * best.length)];
            rail.pendingDr = chosen.dr; rail.pendingDc = chosen.dc;
            if (chosen.dr === rail.dr && chosen.dc === rail.dc) { rail.dr = chosen.dr; rail.dc = chosen.dc; rail.targetR = rail.r + rail.dr; rail.targetC = rail.c + rail.dc; rail.phase = "moving"; rail.t = 0; }
            else { rail.targetYaw = dirToYaw(chosen.dr, chosen.dc); rail.phase = "turning"; }
          } else {
            const ch = railChoiceRef.current;
            if (ch) {
              const chosen = rail.availDirs.find((d) => d.side === ch);
              if (chosen) {
                railChoiceRef.current = null;
                if (railChoosingRef.current) { railChoosingRef.current = false; setRailChoosing(false); }
                rail.pendingDr = chosen.dr; rail.pendingDc = chosen.dc;
                if (chosen.dr === rail.dr && chosen.dc === rail.dc) { rail.dr = chosen.dr; rail.dc = chosen.dc; rail.targetR = rail.r + rail.dr; rail.targetC = rail.c + rail.dc; rail.phase = "moving"; rail.t = 0; }
                else { rail.targetYaw = dirToYaw(chosen.dr, chosen.dc); rail.phase = "turning"; }
              }
            }
          }
        }
      } else {
        if (keys["ArrowLeft"]) yaw -= 0.03; if (keys["ArrowRight"]) yaw += 0.03;
        yaw += touchLook.current.x * .07;
        const fX = Math.sin(yaw), fZ = -Math.cos(yaw), rX = Math.cos(yaw), rZ = Math.sin(yaw);
        let nx = camera.position.x, nz = camera.position.z;
        if (keys["KeyW"] || keys["ArrowUp"]) { nx += fX * spd; nz += fZ * spd; }
        if (keys["KeyS"] || keys["ArrowDown"]) { nx -= fX * spd; nz -= fZ * spd; }
        if (keys["KeyA"]) { nx -= rX * spd; nz -= rZ * spd; }
        if (keys["KeyD"]) { nx += rX * spd; nz += rZ * spd; }
        const tm = touchMove.current;
        if (Math.abs(tm.y) > .05) { nx += fX * spd * tm.y * -3.5; nz += fZ * spd * tm.y * -3.5; }
        if (Math.abs(tm.x) > .05) { nx += rX * spd * tm.x * 3.5; nz += rZ * spd * tm.x * 3.5; }
        if (canMove(nx, nz)) { camera.position.x = nx; camera.position.z = nz; }
      }
      camera.rotation.y = -yaw; camera.position.y = CELL * .5 + Math.sin(Date.now() * .005) * .05;
      startSprite.position.y = CELL * .55 + Math.sin(Date.now() * .0015) * .25;
      const newCr = 0, newCc = Math.max(0, Math.floor(camera.position.x / CHUNK_W));
      if (newCr !== currentCr || newCc !== currentCc) {
        currentCr = newCr; currentCc = newCc; loadNeighbors(currentCr, currentCc); unloadFarChunks(currentCr, currentCc); updateZoneInfo(currentCr, currentCc);
      }
      const worldR = Math.floor(camera.position.z / CELL), worldC = Math.floor(camera.position.x / CELL);
      visitedRef.current.add(worldR + "_" + worldC);
      const mc = minimapRef.current;
      if (mc && mmModeRef.current > 0) {
        const isCenter = mmModeRef.current === 2, S = isCenter ? 42 : 21, VIEW = 840;
        mc.width = isCenter ? VIEW : COLS * S; mc.height = isCenter ? VIEW : ROWS * S;
        const mx = mc.getContext("2d"); mx.clearRect(0, 0, mc.width, mc.height);
        const drawCell = (vr, vc, cx2, cy2) => {
          const { cr, cc, r, c } = getLocal(vr, vc), maze = getChunkMaze(cr, cc);
          if (!maze) return;
          if (maze.h[r][c]) { mx.beginPath(); mx.moveTo(cx2, cy2); mx.lineTo(cx2 + S, cy2); mx.stroke(); }
          if (maze.h[r + 1][c]) { mx.beginPath(); mx.moveTo(cx2, cy2 + S); mx.lineTo(cx2 + S, cy2 + S); mx.stroke(); }
          if (maze.v[r][c]) { mx.beginPath(); mx.moveTo(cx2, cy2); mx.lineTo(cx2, cy2 + S); mx.stroke(); }
          if (maze.v[r][c + 1]) { mx.beginPath(); mx.moveTo(cx2 + S, cy2); mx.lineTo(cx2 + S, cy2 + S); mx.stroke(); }
        };
        if (isCenter) {
          mx.save(); mx.translate(VIEW / 2, VIEW / 2); mx.rotate(-yaw); mx.translate(-(worldC * S + S / 2), -(worldR * S + S / 2));
          mx.strokeStyle = "rgba(255,255,255,0.95)"; mx.lineWidth = 2;
          for (const key of visitedRef.current) { const [vr, vc] = key.split("_").map(Number); drawCell(vr, vc, vc * S, vr * S); }
          mx.restore(); mx.fillStyle = "#ffffff"; mx.beginPath(); mx.moveTo(VIEW / 2, VIEW / 2 - 9); mx.lineTo(VIEW / 2 - 5, VIEW / 2 + 5); mx.lineTo(VIEW / 2 + 5, VIEW / 2 + 5); mx.closePath(); mx.fill();
        } else {
          mx.strokeStyle = "rgba(255,255,255,0.9)"; mx.lineWidth = 1.5;
          for (const key of visitedRef.current) {
            const [vr, vc] = key.split("_").map(Number);
            if (Math.floor(vr / ROWS) !== currentCr || Math.floor(vc / COLS) !== currentCc) continue;
            drawCell(vr, vc, (vc - currentCc * COLS) * S, (vr - currentCr * ROWS) * S);
          }
          const lc = worldC - currentCc * COLS, lr = worldR - currentCr * ROWS;
          const px = lc * S + S / 2, py = lr * S + S / 2, AL = 6, AW = 3.5, ddx = Math.sin(yaw), ddy = -Math.cos(yaw), nnx = -ddy, nny = ddx;
          mx.fillStyle = "#ffffff"; mx.beginPath(); mx.moveTo(px + ddx * AL, py + ddy * AL); mx.lineTo(px - ddx * AL + nnx * AW, py - ddy * AL + nny * AW); mx.lineTo(px - ddx * AL - nnx * AW, py - ddy * AL - nny * AW); mx.closePath(); mx.fill();
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKD);
      window.removeEventListener("resize", onResize);
      mountRef.current?.removeChild(renderer.domElement);
      chunkMap.forEach((chunk) => chunk.dispose());
      themeResourceCache.forEach(({ wallMat, floorMat, ceilMat }) => {
        [wallMat, floorMat, ceilMat].forEach((mat) => {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        });
      });
      themedArtMaterialCache.forEach((mats, key) => {
        if (!THEMES[key].artUrls) return;
        mats.materials.forEach((mat) => {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        });
      });
      pictureMaterials.forEach((mat) => {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      });
      chunkFloorGeo.dispose();
      chunkCeilGeo.dispose();
      wGH.dispose();
      wGV.dispose();
      Object.values(DECOR_GEOMETRIES).forEach((geo) => geo.dispose());
      startTex.dispose();
      renderer.dispose();
    };
  }, [gameKey]);

  const effectivePos = mmMode === 2 ? "center" : mmPos;
  const posStyle = effectivePos === "center" ? { top: "50%", left: "50%", transform: "translate(-50%,-50%)" } : effectivePos === "tl" ? { top: 60, left: 16 } : effectivePos === "tr" ? { top: 60, right: 16 } : effectivePos === "bl" ? { bottom: 80, left: 16 } : { bottom: 80, right: 16 };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", userSelect: "none", background: "#000" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      {isMobile && <VirtualJoystick side="left" onDelta={(x, y) => { touchMove.current = { x, y }; }} />}
      {isMobile && <VirtualJoystick side="right" onDelta={(x, y) => { touchLook.current = { x, y }; }} />}
      {menuOpen && <TextureMenu onClose={() => setMenuOpen(false)} mmMode={mmMode} onMmMode={setMode} mmPos={mmPos} onMmPos={setPos} mmOp={mmOp} onMmOp={setOp} isMobile={isMobile} moveMode={moveMode} onMoveMode={(v) => { applyMoveModeRef.current && applyMoveModeRef.current(v); }} zoneInfo={zoneInfo} />}
      {mmMode > 0 && (
        <div style={{ position: "absolute", lineHeight: 0, pointerEvents: "none", borderRadius: 4, ...posStyle }}>
          <canvas ref={minimapRef} style={{ display: "block", imageRendering: "pixelated", opacity: mmOp }} />
        </div>
      )}
      <button onClick={() => setMenuOpen(true)} style={{ position: "absolute", top: 16, left: 16, background: "#d4d0c8", color: "#000", border: "2px outset #ffffff", fontFamily: "MS Sans Serif, Arial", fontSize: 11, padding: "4px 12px", cursor: "pointer" }}>Menu</button>
      {modeLog && <div style={{ position: "absolute", top: 20, left: 72, fontFamily: "MS Sans Serif, Arial", fontSize: 11, color: "#fff", pointerEvents: "none", textShadow: "1px 1px 2px #000" }}>{modeLog}</div>}
      {showZoneInfo && <div style={{ position: "absolute", top: 46, left: 16, padding: "4px 8px", background: "rgba(0,0,0,0.45)", color: "#fff", fontFamily: "MS Sans Serif, Arial", fontSize: 10, pointerEvents: "none", lineHeight: 1.4 }}>
        <div>{zoneInfo.layout}</div>
        <div>{zoneInfo.theme}</div>
      </div>}
      {railMode && railChoosing && <div style={{ position: "absolute", bottom: 50, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, pointerEvents: "none" }}>
        {railAvailSides.includes("left") && <div style={{ background: "rgba(0,0,120,0.9)", color: "#fff", border: "2px outset #aaa", padding: "8px 16px", fontFamily: "MS Sans Serif, Arial", fontSize: 14 }}>← Izq</div>}
        {railAvailSides.includes("forward") && <div style={{ background: "rgba(0,0,120,0.9)", color: "#fff", border: "2px outset #aaa", padding: "8px 16px", fontFamily: "MS Sans Serif, Arial", fontSize: 14 }}>↑ Recto</div>}
        {railAvailSides.includes("right") && <div style={{ background: "rgba(0,0,120,0.9)", color: "#fff", border: "2px outset #aaa", padding: "8px 16px", fontFamily: "MS Sans Serif, Arial", fontSize: 14 }}>→ Der</div>}
        {railAvailSides.includes("back") && <div style={{ background: "rgba(0,0,120,0.9)", color: "#fff", border: "2px outset #aaa", padding: "8px 16px", fontFamily: "MS Sans Serif, Arial", fontSize: 14 }}>↓ Atras</div>}
      </div>}
    </div>
  );
}
