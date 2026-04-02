import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import windowsLogoUrl from "../windows_logo.png";
import { createChunkRenderer } from "../render/chunks";
import { createWorldSession, LAYOUT_LABELS, START_VISTA_PATH_CELLS, THEME_LABELS } from "../world/session";
import { CELL, COLS, ROWS, hash32, makeSeededRand } from "../world/layouts";

const W98 = { fontFamily: "MS Sans Serif, Arial", fontSize: 11 };
const POS_OPTS = [
  { v: "tl", l: "Arriba izq" },
  { v: "tr", l: "Arriba der" },
  { v: "bl", l: "Abajo izq" },
  { v: "br", l: "Abajo der" },
];
const MODE_OPTS = [
  { v: 2, l: "Central redondo" },
  { v: 1, l: "En un costado" },
  { v: 0, l: "Sin minimapa" },
];
const MOVE_OPTS = [
  { v: 0, l: "Libre" },
  { v: 1, l: "Carril" },
  { v: 2, l: "Auto" },
];

const START_CELL = {
  r: Math.floor(ROWS / 2),
  c: Math.floor(COLS / 2),
};
const START_YAW = Math.PI / 2;
const START_LOGO_OFFSET_CELLS = START_VISTA_PATH_CELLS + 0.2;
const LOAD_RADIUS = 1;
const PRELOAD_RADIUS = 2;

function getSessionSeed() {
  const querySeed = new URLSearchParams(window.location.search).get("seed");
  if (querySeed) {
    const parsed = Number(querySeed);
    return Number.isFinite(parsed) ? (parsed >>> 0) || 1 : hash32(querySeed);
  }
  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] || 1;
  }
  return hash32(Date.now(), Math.floor(performance.now() * 1000), navigator.userAgent);
}

function TextureMenu({
  onClose,
  mmMode,
  onMmMode,
  mmPos,
  onMmPos,
  mmOp,
  onMmOp,
  isMobile,
  moveMode,
  onMoveMode,
  zoneInfo,
}) {
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
        <div style={{ background: "#d4d0c8", padding: 12, width: 340 }}>
          <fieldset style={{ border: "1px solid #808080", padding: "8px 10px", marginBottom: 8 }}>
            <legend style={{ fontSize: 11, padding: "0 4px" }}>Mundo</legend>
            <div style={{ fontSize: 10, color: "#333", lineHeight: 1.5 }}>
              <div>Seed de sesion nueva en cada carga.</div>
              <div>Chunks 2D con layouts y biomes variables.</div>
            </div>
            <div style={{ marginTop: 8, padding: "6px 8px", background: "#c8c4bc", border: "1px inset #888", fontSize: 10, color: "#333" }}>
              <div><strong>Zona actual:</strong> {zoneInfo.layout}</div>
              <div><strong>Tema:</strong> {zoneInfo.theme}</div>
            </div>
          </fieldset>
          <fieldset style={{ border: "1px solid #808080", padding: "8px 10px", marginBottom: 8 }}>
            <legend style={{ fontSize: 11, padding: "0 4px" }}>Modo de movimiento</legend>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {MOVE_OPTS.map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => onMoveMode(v)}
                  style={{ background: moveMode === v ? "#000080" : "#d4d0c8", color: moveMode === v ? "#fff" : "#000", border: moveMode === v ? "2px inset #888" : "2px outset #fff", padding: "3px 8px", cursor: "pointer", ...W98 }}
                >
                  {l}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset style={{ border: "1px solid #808080", padding: "8px 10px", marginBottom: 8 }}>
            <legend style={{ fontSize: 11, padding: "0 4px" }}>Minimap</legend>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {MODE_OPTS.map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setLMode(v)}
                  style={{ background: lMode === v ? "#000080" : "#d4d0c8", color: lMode === v ? "#fff" : "#000", border: lMode === v ? "2px inset #888" : "2px outset #fff", padding: "3px 8px", cursor: "pointer", ...W98 }}
                >
                  {l}
                </button>
              ))}
            </div>
            {lMode === 1 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {POS_OPTS.map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => setLPos(v)}
                    style={{ background: lPos === v ? "#000080" : "#d4d0c8", color: lPos === v ? "#fff" : "#000", border: lPos === v ? "2px inset #888" : "2px outset #fff", padding: "3px 8px", cursor: "pointer", ...W98 }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
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
            Pensado por FacuBis · Hecho por Claude & Codex
          </div>
        </div>
      </div>
    </div>
  );
}

function VirtualJoystick({ side, onDelta }) {
  const touchId = useRef(null);
  const origin = useRef({ x: 0, y: 0 });
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const max = 40;
  const onTS = useCallback((e) => {
    if (touchId.current !== null) return;
    const touch = e.changedTouches[0];
    touchId.current = touch.identifier;
    origin.current = { x: touch.clientX, y: touch.clientY };
    setKnob({ x: 0, y: 0 });
    e.preventDefault();
  }, []);
  const onTM = useCallback((e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier !== touchId.current) continue;
      let dx = touch.clientX - origin.current.x;
      let dy = touch.clientY - origin.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > max) {
        dx = (dx / distance) * max;
        dy = (dy / distance) * max;
      }
      setKnob({ x: dx, y: dy });
      onDelta(dx / max, dy / max);
    }
    e.preventDefault();
  }, [onDelta]);
  const onTE = useCallback((e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier !== touchId.current) continue;
      touchId.current = null;
      setKnob({ x: 0, y: 0 });
      onDelta(0, 0);
    }
  }, [onDelta]);
  return (
    <div onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE} style={{ position: "absolute", bottom: 32, [side]: 32, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none", userSelect: "none" }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.5)", transform: `translate(${knob.x}px,${knob.y}px)`, transition: touchId.current === null ? "transform 0.1s" : "none", pointerEvents: "none" }} />
    </div>
  );
}

function createStartTexture() {
  const width = 320;
  const height = 160;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(200,200,200,0.18)";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(120,120,120,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  ctx.font = "bold italic 78px 'Times New Roman', serif";
  ctx.fillStyle = "rgba(25,8,4,0.42)";
  ctx.fillText("Start", 148, height / 2 + 30);
  ctx.fillStyle = "rgba(8,3,1,0.72)";
  ctx.fillText("Start", 146, height / 2 + 28);
  const texture = new THREE.CanvasTexture(canvas);
  const image = new Image();
  image.onload = () => {
    ctx.drawImage(image, 8, 8, height - 16, height - 16);
    texture.needsUpdate = true;
  };
  image.src = windowsLogoUrl;
  return texture;
}

export default function MazeGame({ onReady }) {
  const mountRef = useRef(null);
  const minimapRef = useRef(null);
  const touchMove = useRef({ x: 0, y: 0 });
  const touchLook = useRef({ x: 0, y: 0 });
  const traversedEdgesRef = useRef(new Set());
  const mmModeRef = useRef(1);
  const mmPosRef = useRef("br");
  const mmOpRef = useRef(0.45);
  const [mmMode, setMmMode] = useState(1);
  const [mmPos, setMmPos] = useState("br");
  const [mmOp, setMmOp] = useState(0.45);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveMode, setMoveModeState] = useState(0);
  const [modeLog, setModeLog] = useState(null);
  const [zoneInfo, setZoneInfo] = useState({ layout: LAYOUT_LABELS.classic_maze, theme: THEME_LABELS.classic_win98 });
  const [showZoneInfo, setShowZoneInfo] = useState(false);
  const [railMode, setRailModeState] = useState(false);
  const [railChoosing, setRailChoosing] = useState(false);
  const [railAvailSides, setRailAvailSides] = useState([]);
  const [sessionSeed] = useState(getSessionSeed);
  const moveModeRef = useRef(0);
  const autoModeRef = useRef(false);
  const railModeRef = useRef(false);
  const railChoiceRef = useRef(null);
  const railChoosingRef = useRef(false);
  const railRef = useRef({ r: START_CELL.r, c: START_CELL.c, dr: 0, dc: 1, t: 0, targetR: START_CELL.r, targetC: START_CELL.c + 1, phase: "moving", targetYaw: START_YAW, pendingDr: 0, pendingDc: 1, availDirs: [] });
  const applyMoveModeRef = useRef(null);
  const modeLogTimer = useRef(null);
  const isMobile = window.matchMedia("(pointer: coarse)").matches;

  const setMode = (value) => {
    const next = typeof value === "function" ? value(mmModeRef.current) : value;
    mmModeRef.current = next;
    setMmMode(next);
  };

  const setPos = (value) => {
    mmPosRef.current = value;
    setMmPos(value);
  };

  const setOp = (value) => {
    mmOpRef.current = value;
    setMmOp(value);
  };

  useEffect(() => {
    const session = createWorldSession({ seed: sessionSeed });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 30, 90);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 240);
    camera.position.set((START_CELL.c + 0.5) * CELL, CELL * 0.5, (START_CELL.r + 0.5) * CELL);
    camera.rotation.order = "YXZ";
    camera.rotation.y = -START_YAW;

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mountRef.current?.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambient);
    const pointLight = new THREE.PointLight(0xffffee, 1.2, 44);
    camera.add(pointLight);
    scene.add(camera);

    const chunkRenderer = createChunkRenderer({ scene, sessionSeed });
    const currentChunk = { cr: 0, cc: 0 };
    const currentDescriptor = session.getChunkDescriptor(0, 0);
    let currentVariant = null;
    let bootReady = false;
    let disposed = false;

    const applySceneTheme = (descriptor) => {
      currentVariant = chunkRenderer.getThemeVariantForDescriptor(descriptor);
      scene.background.setHex(currentVariant.background);
      scene.fog.color.setHex(currentVariant.fog);
      ambient.color.setHex(currentVariant.ambientColor);
      ambient.intensity = currentVariant.ambientIntensity;
      pointLight.color.setHex(currentVariant.pointColor);
      pointLight.intensity = currentVariant.pointIntensity;
      setZoneInfo({
        layout: LAYOUT_LABELS[descriptor.layoutType] || descriptor.layoutType,
        theme: THEME_LABELS[descriptor.themeType] || descriptor.themeType,
      });
    };

    const collectDescriptorsAround = (cr, cc, radius) => {
      const descriptors = [];
      for (let dr = -radius; dr <= radius; dr += 1) {
        for (let dc = -radius; dc <= radius; dc += 1) {
          const descriptor = session.getChunkDescriptor(cr + dr, cc + dc);
          if (descriptor) descriptors.push(descriptor);
        }
      }
      return descriptors;
    };

    const warmChunkNeighborhood = async (cr, cc) => {
      await chunkRenderer.preloadDescriptors(collectDescriptorsAround(cr, cc, PRELOAD_RADIUS));
    };

    const syncLoadedChunks = (cr, cc) => {
      const keep = new Set();
      for (let dr = -LOAD_RADIUS; dr <= LOAD_RADIUS; dr += 1) {
        for (let dc = -LOAD_RADIUS; dc <= LOAD_RADIUS; dc += 1) {
          const nextCr = cr + dr;
          const nextCc = cc + dc;
          const descriptor = session.getChunkDescriptor(nextCr, nextCc);
          if (!descriptor) continue;
          chunkRenderer.loadChunk(descriptor);
          keep.add(descriptor.key);
        }
      }
      chunkRenderer.getLoadedEntries().forEach((entry) => {
        if (!keep.has(entry.descriptor.key)) chunkRenderer.unloadChunk(entry.descriptor.key);
      });
    };

    const startTexture = createStartTexture();
    const startMaterial = new THREE.SpriteMaterial({ map: startTexture, transparent: true, opacity: 0.92, depthWrite: false });
    const startSprite = new THREE.Sprite(startMaterial);
    startSprite.scale.set(7, 3.5, 1);
    // Spawn onboarding invariant: the player starts facing east and must see the floating Start logo.
    startSprite.position.set((START_CELL.c + START_LOGO_OFFSET_CELLS) * CELL, CELL * 0.7, (START_CELL.r + 0.5) * CELL);
    scene.add(startSprite);

    void (async () => {
      try {
        await warmChunkNeighborhood(0, 0);
      } catch (error) {
        console.warn("[maze-game] Initial biome preload failed, continuing with fallbacks.", error);
      }
      if (disposed) return;
      syncLoadedChunks(0, 0);
      applySceneTheme(currentDescriptor);
      bootReady = true;
      onReady?.();
    })();

    const keys = {};
    const edgeKey = (r1, c1, r2, c2) => {
      const a = `${r1}_${c1}`;
      const b = `${r2}_${c2}`;
      return a < b ? `${a}|${b}` : `${b}|${a}`;
    };
    const dirToYaw = (dr, dc) => (dr === -1 ? 0 : dc === 1 ? Math.PI / 2 : dr === 1 ? Math.PI : -Math.PI / 2);
    const yawToDir = (yaw) => {
      const angle = ((yaw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      if (angle < Math.PI / 4 || angle >= 7 * Math.PI / 4) return { dr: -1, dc: 0 };
      if (angle < 3 * Math.PI / 4) return { dr: 0, dc: 1 };
      if (angle < 5 * Math.PI / 4) return { dr: 1, dc: 0 };
      return { dr: 0, dc: -1 };
    };
    const relSide = (fdr, fdc, dr, dc) => {
      if (dr === fdr && dc === fdc) return "forward";
      if (dr === -fdc && dc === fdr) return "left";
      if (dr === fdc && dc === -fdr) return "right";
      return "back";
    };
    const getLocal = (worldR, worldC) => {
      if (worldR < 0 || worldC < 0) return null;
      const cr = Math.floor(worldR / ROWS);
      const cc = Math.floor(worldC / COLS);
      return { cr, cc, r: worldR - cr * ROWS, c: worldC - cc * COLS };
    };
    const getChunkWalls = (cr, cc) => session.getChunkDescriptor(cr, cc)?.walls;
    const canGoDir = (worldR, worldC, dr, dc) => {
      const local = getLocal(worldR, worldC);
      if (!local) return false;
      const maze = getChunkWalls(local.cr, local.cc);
      if (!maze) return false;
      if (dr === -1) return !maze.h[local.r][local.c];
      if (dr === 1) return !maze.h[local.r + 1][local.c];
      if (dc === -1) return !maze.v[local.r][local.c];
      return !maze.v[local.r][local.c + 1];
    };
    const canMove = (nextX, nextZ) => {
      if (nextX < 0 || nextZ < 0) return false;
      const margin = 1.5;
      const worldC = Math.floor(nextX / CELL);
      const worldR = Math.floor(nextZ / CELL);
      const local = getLocal(worldR, worldC);
      if (!local) return false;
      const maze = getChunkWalls(local.cr, local.cc);
      if (!maze) return false;
      const lr = nextZ / CELL - worldR;
      const lc = nextX / CELL - worldC;
      if (lr < margin / CELL && maze.h[local.r][local.c]) return false;
      if (lr > 1 - margin / CELL && maze.h[local.r + 1][local.c]) return false;
      if (lc < margin / CELL && maze.v[local.r][local.c]) return false;
      if (lc > 1 - margin / CELL && maze.v[local.r][local.c + 1]) return false;
      return true;
    };

    let yaw = START_YAW;

    const activateRail = () => {
      const wr = Math.floor(camera.position.z / CELL);
      const wc = Math.floor(camera.position.x / CELL);
      let { dr, dc } = yawToDir(yaw);
      if (!canGoDir(wr, wc, dr, dc)) {
        const fallback = [
          { dr: -1, dc: 0 },
          { dr: 0, dc: 1 },
          { dr: 1, dc: 0 },
          { dr: 0, dc: -1 },
        ].find((direction) => canGoDir(wr, wc, direction.dr, direction.dc));
        if (fallback) {
          dr = fallback.dr;
          dc = fallback.dc;
        }
      }
      const targetYaw = dirToYaw(dr, dc);
      railRef.current = {
        r: wr,
        c: wc,
        dr,
        dc,
        t: 0,
        targetR: wr + dr,
        targetC: wc + dc,
        phase: "moving",
        targetYaw,
        pendingDr: dr,
        pendingDc: dc,
        availDirs: [],
      };
      yaw = targetYaw;
    };

    const MOVE_LABELS = ["Libre", "Carril", "Auto"];
    const applyMoveMode = (value) => {
      if (railChoosingRef.current) {
        railChoosingRef.current = false;
        setRailChoosing(false);
      }
      moveModeRef.current = value;
      setMoveModeState(value);
      railModeRef.current = value === 1;
      setRailModeState(value === 1);
      autoModeRef.current = value === 2;
      if (value === 1 || value === 2) activateRail();
      setModeLog(`Modo: ${MOVE_LABELS[value]}`);
      clearTimeout(modeLogTimer.current);
      modeLogTimer.current = setTimeout(() => setModeLog(null), 2500);
    };
    applyMoveModeRef.current = applyMoveMode;

    const chooseAutoDirection = (rail, choices) => {
      const rand = makeSeededRand(sessionSeed, rail.r, rail.c, 707);
      return choices
        .map((choice) => {
          const nr = rail.r + choice.dr;
          const nc = rail.c + choice.dc;
          const unseen = !traversedEdgesRef.current.has(edgeKey(rail.r, rail.c, nr, nc));
          const straight = choice.dr === rail.dr && choice.dc === rail.dc;
          const outward = nr + nc;
          const jitter = rand();
          return {
            ...choice,
            score: (unseen ? 100 : 0) + (straight ? 8 : 0) + outward * 0.35 + jitter,
          };
        })
        .sort((a, b) => b.score - a.score)[0];
    };

    const onKD = (event) => {
      if (railModeRef.current && railRef.current.phase === "choosing") {
        if (event.code === "ArrowLeft") { railChoiceRef.current = "left"; event.preventDefault(); return; }
        if (event.code === "ArrowRight") { railChoiceRef.current = "right"; event.preventDefault(); return; }
        if (event.code === "ArrowUp") { railChoiceRef.current = "forward"; event.preventDefault(); return; }
        if (event.code === "ArrowDown") { railChoiceRef.current = "back"; event.preventDefault(); return; }
      }
      keys[event.code] = true;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
      if (event.code === "Tab") { event.preventDefault(); setMode((value) => (value + 1) % 3); }
      if (event.code === "KeyM") { event.preventDefault(); setMenuOpen((value) => !value); }
      if (event.code === "KeyR") { event.preventDefault(); applyMoveMode(moveModeRef.current === 2 ? 1 : 2); }
      if (event.code === "KeyL") { event.preventDefault(); applyMoveMode(0); }
      if (event.code === "KeyN") { event.preventDefault(); setShowZoneInfo((value) => !value); }
    };
    const onKU = (event) => {
      keys[event.code] = false;
    };

    window.addEventListener("keydown", onKD);
    window.addEventListener("keyup", onKU);

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!bootReady) {
        renderer.render(scene, camera);
        return;
      }
      const speed = 0.18;
      if (railModeRef.current || autoModeRef.current) {
        const rail = railRef.current;
        if (rail.phase === "moving") {
          rail.t += 0.04;
          if (rail.t >= 1) {
            traversedEdgesRef.current.add(edgeKey(rail.r, rail.c, rail.targetR, rail.targetC));
            rail.r = rail.targetR;
            rail.c = rail.targetC;
            rail.t = 0;
            const exits = [
              { dr: -1, dc: 0 },
              { dr: 0, dc: 1 },
              { dr: 1, dc: 0 },
              { dr: 0, dc: -1 },
            ].filter((direction) => canGoDir(rail.r, rail.c, direction.dr, direction.dc));
            const backDr = -rail.dr;
            const backDc = -rail.dc;
            const nonBackExits = exits.filter((direction) => !(direction.dr === backDr && direction.dc === backDc));
            if (!nonBackExits.length) {
              rail.pendingDr = backDr;
              rail.pendingDc = backDc;
              rail.targetYaw = dirToYaw(backDr, backDc);
              rail.phase = "turning";
            } else if (nonBackExits.length === 1) {
              const next = nonBackExits[0];
              if (next.dr === rail.dr && next.dc === rail.dc) {
                rail.targetR = rail.r + rail.dr;
                rail.targetC = rail.c + rail.dc;
              } else {
                rail.pendingDr = next.dr;
                rail.pendingDc = next.dc;
                rail.targetYaw = dirToYaw(next.dr, next.dc);
                rail.phase = "turning";
              }
            } else {
              rail.availDirs = [...nonBackExits, { dr: backDr, dc: backDc }].map((direction) => ({
                ...direction,
                side: relSide(rail.dr, rail.dc, direction.dr, direction.dc),
              }));
              rail.phase = "choosing";
              if (!railChoosingRef.current) {
                railChoosingRef.current = true;
                setRailChoosing(true);
                setRailAvailSides(rail.availDirs.map((direction) => direction.side));
              }
            }
          } else {
            const fromX = rail.c * CELL + CELL / 2;
            const fromZ = rail.r * CELL + CELL / 2;
            const toX = rail.targetC * CELL + CELL / 2;
            const toZ = rail.targetR * CELL + CELL / 2;
            camera.position.x = fromX + (toX - fromX) * rail.t;
            camera.position.z = fromZ + (toZ - fromZ) * rail.t;
          }
        } else if (rail.phase === "turning") {
          camera.position.x = rail.c * CELL + CELL / 2;
          camera.position.z = rail.r * CELL + CELL / 2;
          let diff = rail.targetYaw - yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) < 0.01) {
            yaw = rail.targetYaw;
            rail.dr = rail.pendingDr;
            rail.dc = rail.pendingDc;
            rail.targetR = rail.r + rail.dr;
            rail.targetC = rail.c + rail.dc;
            rail.phase = "moving";
            rail.t = 0;
          } else {
            yaw += Math.sign(diff) * Math.min(0.08, Math.abs(diff));
          }
        } else if (rail.phase === "choosing") {
          camera.position.x = rail.c * CELL + CELL / 2;
          camera.position.z = rail.r * CELL + CELL / 2;
          if (autoModeRef.current) {
            const chosen = chooseAutoDirection(rail, rail.availDirs);
            rail.pendingDr = chosen.dr;
            rail.pendingDc = chosen.dc;
            if (chosen.dr === rail.dr && chosen.dc === rail.dc) {
              rail.dr = chosen.dr;
              rail.dc = chosen.dc;
              rail.targetR = rail.r + rail.dr;
              rail.targetC = rail.c + rail.dc;
              rail.phase = "moving";
              rail.t = 0;
            } else {
              rail.targetYaw = dirToYaw(chosen.dr, chosen.dc);
              rail.phase = "turning";
            }
            if (railChoosingRef.current) {
              railChoosingRef.current = false;
              setRailChoosing(false);
            }
          } else if (railChoiceRef.current) {
            const chosen = rail.availDirs.find((direction) => direction.side === railChoiceRef.current);
            if (chosen) {
              railChoiceRef.current = null;
              if (railChoosingRef.current) {
                railChoosingRef.current = false;
                setRailChoosing(false);
              }
              rail.pendingDr = chosen.dr;
              rail.pendingDc = chosen.dc;
              if (chosen.dr === rail.dr && chosen.dc === rail.dc) {
                rail.dr = chosen.dr;
                rail.dc = chosen.dc;
                rail.targetR = rail.r + rail.dr;
                rail.targetC = rail.c + rail.dc;
                rail.phase = "moving";
                rail.t = 0;
              } else {
                rail.targetYaw = dirToYaw(chosen.dr, chosen.dc);
                rail.phase = "turning";
              }
            }
          }
        }
      } else {
        if (keys.ArrowLeft) yaw -= 0.03;
        if (keys.ArrowRight) yaw += 0.03;
        yaw += touchLook.current.x * 0.07;
        const forwardX = Math.sin(yaw);
        const forwardZ = -Math.cos(yaw);
        const rightX = Math.cos(yaw);
        const rightZ = Math.sin(yaw);
        let nextX = camera.position.x;
        let nextZ = camera.position.z;
        if (keys.KeyW || keys.ArrowUp) { nextX += forwardX * speed; nextZ += forwardZ * speed; }
        if (keys.KeyS || keys.ArrowDown) { nextX -= forwardX * speed; nextZ -= forwardZ * speed; }
        if (keys.KeyA) { nextX -= rightX * speed; nextZ -= rightZ * speed; }
        if (keys.KeyD) { nextX += rightX * speed; nextZ += rightZ * speed; }
        const mobileMove = touchMove.current;
        if (Math.abs(mobileMove.y) > 0.05) { nextX += forwardX * speed * mobileMove.y * -3.5; nextZ += forwardZ * speed * mobileMove.y * -3.5; }
        if (Math.abs(mobileMove.x) > 0.05) { nextX += rightX * speed * mobileMove.x * 3.5; nextZ += rightZ * speed * mobileMove.x * 3.5; }
        if (canMove(nextX, nextZ)) {
          camera.position.x = nextX;
          camera.position.z = nextZ;
        }
      }

      camera.rotation.y = -yaw;
      camera.position.y = CELL * 0.5 + Math.sin(Date.now() * 0.005) * 0.05;
      startSprite.position.y = CELL * 0.7 + Math.sin(Date.now() * 0.0015) * 0.25;

      const worldR = Math.floor(camera.position.z / CELL);
      const worldC = Math.floor(camera.position.x / CELL);
      const local = getLocal(worldR, worldC);
      if (local) {
        if (local.cr !== currentChunk.cr || local.cc !== currentChunk.cc) {
          currentChunk.cr = local.cr;
          currentChunk.cc = local.cc;
          syncLoadedChunks(currentChunk.cr, currentChunk.cc);
          const descriptor = session.getChunkDescriptor(currentChunk.cr, currentChunk.cc);
          if (descriptor) applySceneTheme(descriptor);
          void warmChunkNeighborhood(currentChunk.cr, currentChunk.cc);
        }
        chunkRenderer.markVisited(local.cr, local.cc, local.r, local.c);
      }

      const minimap = minimapRef.current;
      if (minimap && mmModeRef.current > 0 && local) {
        if (mmModeRef.current === 2) {
          minimap.width = 840;
          minimap.height = 840;
        } else {
          minimap.width = COLS * 21;
          minimap.height = ROWS * 21;
        }
        chunkRenderer.drawMinimap(minimap, {
          mode: mmModeRef.current,
          currentCr: local.cr,
          currentCc: local.cc,
          worldR,
          worldC,
          yaw,
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(modeLogTimer.current);
      window.removeEventListener("keydown", onKD);
      window.removeEventListener("keyup", onKU);
      window.removeEventListener("resize", onResize);
      chunkRenderer.dispose();
      if (startMaterial.map) startMaterial.map.dispose();
      startMaterial.dispose();
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [sessionSeed]);

  const effectivePos = mmMode === 2 ? "center" : mmPos;
  const posStyle = effectivePos === "center"
    ? { top: "50%", left: "50%", transform: "translate(-50%,-50%)" }
    : effectivePos === "tl"
      ? { top: 60, left: 16 }
      : effectivePos === "tr"
        ? { top: 60, right: 16 }
        : effectivePos === "bl"
          ? { bottom: 80, left: 16 }
          : { bottom: 80, right: 16 };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", userSelect: "none", background: "#000" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      {isMobile && <VirtualJoystick side="left" onDelta={(x, y) => { touchMove.current = { x, y }; }} />}
      {isMobile && <VirtualJoystick side="right" onDelta={(x, y) => { touchLook.current = { x, y }; }} />}
      {menuOpen && (
        <TextureMenu
          onClose={() => setMenuOpen(false)}
          mmMode={mmMode}
          onMmMode={setMode}
          mmPos={mmPos}
          onMmPos={setPos}
          mmOp={mmOp}
          onMmOp={setOp}
          isMobile={isMobile}
          moveMode={moveMode}
          onMoveMode={(value) => { if (applyMoveModeRef.current) applyMoveModeRef.current(value); }}
          zoneInfo={zoneInfo}
        />
      )}
      {mmMode > 0 && (
        <div style={{ position: "absolute", lineHeight: 0, pointerEvents: "none", borderRadius: 4, ...posStyle }}>
          <canvas ref={minimapRef} style={{ display: "block", imageRendering: "pixelated", opacity: mmOp }} />
        </div>
      )}
      <button onClick={() => setMenuOpen(true)} style={{ position: "absolute", top: 16, left: 16, background: "#d4d0c8", color: "#000", border: "2px outset #ffffff", fontFamily: "MS Sans Serif, Arial", fontSize: 11, padding: "4px 12px", cursor: "pointer" }}>Menu</button>
      {modeLog && <div style={{ position: "absolute", top: 20, left: 72, fontFamily: "MS Sans Serif, Arial", fontSize: 11, color: "#fff", pointerEvents: "none", textShadow: "1px 1px 2px #000" }}>{modeLog}</div>}
      {showZoneInfo && (
        <div style={{ position: "absolute", top: 46, left: 16, padding: "4px 8px", background: "rgba(0,0,0,0.45)", color: "#fff", fontFamily: "MS Sans Serif, Arial", fontSize: 10, pointerEvents: "none", lineHeight: 1.4 }}>
          <div>{zoneInfo.layout}</div>
          <div>{zoneInfo.theme}</div>
        </div>
      )}
      {railMode && railChoosing && (
        <div style={{ position: "absolute", bottom: 50, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, pointerEvents: "none" }}>
          {railAvailSides.includes("left") && <div style={{ background: "rgba(0,0,120,0.9)", color: "#fff", border: "2px outset #aaa", padding: "8px 16px", fontFamily: "MS Sans Serif, Arial", fontSize: 14 }}>← Izq</div>}
          {railAvailSides.includes("forward") && <div style={{ background: "rgba(0,0,120,0.9)", color: "#fff", border: "2px outset #aaa", padding: "8px 16px", fontFamily: "MS Sans Serif, Arial", fontSize: 14 }}>↑ Recto</div>}
          {railAvailSides.includes("right") && <div style={{ background: "rgba(0,0,120,0.9)", color: "#fff", border: "2px outset #aaa", padding: "8px 16px", fontFamily: "MS Sans Serif, Arial", fontSize: 14 }}>→ Der</div>}
          {railAvailSides.includes("back") && <div style={{ background: "rgba(0,0,120,0.9)", color: "#fff", border: "2px outset #aaa", padding: "8px 16px", fontFamily: "MS Sans Serif, Arial", fontSize: 14 }}>↓ Atras</div>}
        </div>
      )}
    </div>
  );
}
