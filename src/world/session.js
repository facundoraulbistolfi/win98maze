import {
  COLS,
  LAYOUTS,
  LAYOUT_LABELS,
  OPPOSITE_SIDE,
  ROWS,
  SIDE_ORDER,
  SIDE_VECTORS,
  carveRow,
  clamp,
  generateLayout,
  hash32,
  makeSeededRand,
  pickWeighted,
} from "./layouts";

export { LAYOUT_LABELS };

export const START_VISTA_PATH_CELLS = 2;

export const THEME_LABELS = {
  classic_win98: "Win98",
  office_98: "Office 98",
  gallery: "Gallery",
  service_industrial: "Industrial",
  liminal_backrooms: "Liminal",
  retro_wood: "Retro Wood",
  tiled_palace: "Tiled Palace",
  brick_bunker: "Brick Bunker",
  blue_lab: "Blue Lab",
  dusty_stone: "Dusty Stone",
  checker_hall: "Checker Hall",
  copper_service: "Copper Service",
  marble_office: "Marble Office",
  night_gallery: "Night Gallery",
  false_sanctuary: "False Sanctuary",
};

const THEME_FAMILIES = {
  classic_win98: "retro",
  office_98: "retro",
  gallery: "gallery",
  service_industrial: "industrial",
  liminal_backrooms: "liminal",
  retro_wood: "warm",
  tiled_palace: "ornate",
  brick_bunker: "industrial",
  blue_lab: "lab",
  dusty_stone: "ancient",
  checker_hall: "gallery",
  copper_service: "warm",
  marble_office: "retro",
  night_gallery: "gallery",
  false_sanctuary: "ornate",
};

export function getChunkKey(cr, cc) {
  return `${cr}_${cc}`;
}

function isValidChunk(cr, cc) {
  return cr >= 0 && cc >= 0;
}

function stepChunk(cr, cc, side) {
  const delta = SIDE_VECTORS[side];
  return { cr: cr + delta.dr, cc: cc + delta.dc };
}

function sideTowardNeighbor(cr, cc, nr, nc) {
  if (nr === cr - 1 && nc === cc) return "north";
  if (nr === cr + 1 && nc === cc) return "south";
  if (nr === cr && nc === cc + 1) return "east";
  return "west";
}

function getParentChunk(cr, cc) {
  if (cr === 0 && cc === 0) return null;
  if (cr === 0) return { cr, cc: cc - 1 };
  if (cc === 0) return { cr: cr - 1, cc };
  if (cc >= cr) return { cr, cc: cc - 1 };
  return { cr: cr - 1, cc };
}

function getInwardReferences(cr, cc) {
  const refs = [];
  const parent = getParentChunk(cr, cc);
  if (parent) refs.push(parent);
  if (cr > 0 && cc > 0) {
    const alt = cc >= cr ? { cr: cr - 1, cc } : { cr, cc: cc - 1 };
    if (!refs.some((item) => item.cr === alt.cr && item.cc === alt.cc)) refs.push(alt);
  }
  return refs;
}

function getBorderIndex(seed, cr, cc, side) {
  const neighbor = stepChunk(cr, cc, side);
  if (side === "east" || side === "west") {
    const edgeCr = cr;
    const edgeCc = Math.min(cc, neighbor.cc);
    return clamp((hash32(seed, "edge_h", edgeCr, edgeCc) % (ROWS - 2)) + 1, 1, ROWS - 2);
  }
  const edgeCr = Math.min(cr, neighbor.cr);
  const edgeCc = cc;
  return clamp((hash32(seed, "edge_v", edgeCr, edgeCc) % (COLS - 2)) + 1, 1, COLS - 2);
}

function preferredExtraSides(seed, cr, cc) {
  if (cr === 0 && cc === 0) return ["east", "south"];
  const parent = getParentChunk(cr, cc);
  const parentSide = parent ? sideTowardNeighbor(cr, cc, parent.cr, parent.cc) : null;
  const dist = cr + cc;
  const candidates = SIDE_ORDER.filter((side) => {
    if (side === parentSide) return false;
    const neighbor = stepChunk(cr, cc, side);
    return isValidChunk(neighbor.cr, neighbor.cc);
  });
  const extraCount = dist >= 6 ? 2 : 1;
  return candidates
    .map((side) => {
      const neighbor = stepChunk(cr, cc, side);
      const outwardBias = neighbor.cr + neighbor.cc >= dist ? 0.25 : 0.02;
      const orthogonalBias = parentSide && OPPOSITE_SIDE[parentSide] !== side ? 0.08 : 0;
      const jitter = (hash32(seed, "extra", cr, cc, side) % 1000) / 1000;
      return { side, score: jitter + outwardBias + orthogonalBias };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, extraCount)
    .map((item) => item.side);
}

function edgeIsOpen(seed, cr, cc, side) {
  const neighbor = stepChunk(cr, cc, side);
  if (!isValidChunk(neighbor.cr, neighbor.cc)) return false;
  const parent = getParentChunk(cr, cc);
  if (parent && parent.cr === neighbor.cr && parent.cc === neighbor.cc) return true;
  const neighborParent = getParentChunk(neighbor.cr, neighbor.cc);
  if (neighborParent && neighborParent.cr === cr && neighborParent.cc === cc) return true;
  const myExtras = preferredExtraSides(seed, cr, cc);
  if (myExtras.includes(side)) return true;
  const theirExtras = preferredExtraSides(seed, neighbor.cr, neighbor.cc);
  return theirExtras.includes(OPPOSITE_SIDE[side]);
}

function getChunkOpenings(seed, cr, cc) {
  const openings = [];
  SIDE_ORDER.forEach((side) => {
    if (!edgeIsOpen(seed, cr, cc, side)) return;
    openings.push({
      side,
      index: getBorderIndex(seed, cr, cc, side),
    });
  });
  return openings;
}

function candidatePoolForLayout(dist, openingCount) {
  const pool = [
    { value: "classic_maze", weight: dist <= 2 ? 6 : 3 },
    { value: "loop_maze", weight: openingCount >= 3 ? 4 : 3 },
    { value: "dense_maze", weight: dist >= 2 ? 2 : 1 },
    { value: "room_maze", weight: dist >= 1 ? 2 : 1 },
    { value: "ring_maze", weight: openingCount >= 3 ? 3 : 1 },
    { value: "sanctuary_maze", weight: dist >= 4 ? 2 : 0 },
  ];
  return pool.filter((item) => item.weight > 0);
}

function candidatePoolForTheme(dist) {
  if (dist <= 1) {
    return [
      { value: "classic_win98", weight: 4 },
      { value: "office_98", weight: 3 },
      { value: "gallery", weight: 2 },
      { value: "retro_wood", weight: 2 },
      { value: "checker_hall", weight: 1 },
    ];
  }
  if (dist <= 4) {
    return [
      { value: "classic_win98", weight: 1 },
      { value: "office_98", weight: 2 },
      { value: "gallery", weight: 2 },
      { value: "service_industrial", weight: 2 },
      { value: "retro_wood", weight: 2 },
      { value: "tiled_palace", weight: 1 },
      { value: "blue_lab", weight: 1 },
      { value: "dusty_stone", weight: 1 },
      { value: "checker_hall", weight: 1 },
      { value: "marble_office", weight: 1 },
    ];
  }
  return [
    { value: "office_98", weight: 1 },
    { value: "gallery", weight: 1 },
    { value: "service_industrial", weight: 2 },
    { value: "liminal_backrooms", weight: 2 },
    { value: "retro_wood", weight: 1 },
    { value: "tiled_palace", weight: 1 },
    { value: "brick_bunker", weight: 2 },
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

function filterAgainstNeighbors(pool, recentExact, recentFamilies, familiesByValue) {
  let filtered = pool.filter((item) => !recentExact.has(item.value));
  if (!filtered.length) filtered = pool;
  const familyFiltered = filtered.filter((item) => !recentFamilies.has(familiesByValue[item.value]));
  return familyFiltered.length ? familyFiltered : filtered;
}

function createDecorProfile(seed, cr, cc) {
  const rand = makeSeededRand(seed, cr, cc, 911);
  return {
    densityBias: rand() * 0.35 - 0.08,
    accentShift: rand() * 0.25 - 0.125,
    artOffset: Math.floor(rand() * 8),
  };
}

function ensureStartChunkVista(walls) {
  const centerR = Math.floor(ROWS / 2);
  const centerC = Math.floor(COLS / 2);
  const vistaEnd = Math.min(COLS - 1, centerC + START_VISTA_PATH_CELLS);
  carveRow(walls, centerR, centerC, vistaEnd);
}

export function createWorldSession({ seed }) {
  const descriptorCache = new Map();

  function getChunkDescriptor(cr, cc) {
    if (!isValidChunk(cr, cc)) return null;
    const key = getChunkKey(cr, cc);
    if (descriptorCache.has(key)) return descriptorCache.get(key);

    const dist = cr + cc;
    const openings = getChunkOpenings(seed, cr, cc);
    const inwardRefs = getInwardReferences(cr, cc)
      .map(({ cr: refCr, cc: refCc }) => getChunkDescriptor(refCr, refCc))
      .filter(Boolean);

    const recentLayouts = new Set(inwardRefs.map((item) => item.layoutType));
    const recentLayoutFamilies = new Set(
      inwardRefs.map((item) => LAYOUTS[item.layoutType]?.family).filter(Boolean),
    );
    const recentThemes = new Set(inwardRefs.map((item) => item.themeType));
    const recentThemeFamilies = new Set(
      inwardRefs.map((item) => THEME_FAMILIES[item.themeType]).filter(Boolean),
    );

    let layoutType = "classic_maze";
    let themeType = "classic_win98";
    let variantId = 0;

    if (!(cr === 0 && cc === 0)) {
      const layoutRand = makeSeededRand(seed, cr, cc, 101);
      const layoutPool = filterAgainstNeighbors(
        candidatePoolForLayout(dist, openings.length),
        recentLayouts,
        recentLayoutFamilies,
        Object.fromEntries(Object.entries(LAYOUTS).map(([name, value]) => [name, value.family])),
      );
      layoutType = pickWeighted(layoutRand, layoutPool);

      const themeRand = makeSeededRand(seed, cr, cc, 202);
      const themePool = filterAgainstNeighbors(
        candidatePoolForTheme(dist),
        recentThemes,
        recentThemeFamilies,
        THEME_FAMILIES,
      );
      themeType = pickWeighted(themeRand, themePool);

      variantId = hash32(seed, "variant", cr, cc, themeType) % 6;
    }

    const anchorCells = [{ r: Math.floor(ROWS / 2), c: Math.floor(COLS / 2) }];
    const { walls } = generateLayout({
      layoutType,
      rows: ROWS,
      cols: COLS,
      rand: makeSeededRand(seed, cr, cc, 303),
      requiredOpenings: openings,
      anchors: anchorCells,
      dist,
    });
    if (cr === 0 && cc === 0) ensureStartChunkVista(walls);

    const descriptor = {
      key,
      cr,
      cc,
      dist,
      openings,
      layoutType,
      themeType,
      variantId,
      walls,
      decorProfile: createDecorProfile(seed, cr, cc),
    };

    descriptorCache.set(key, descriptor);
    return descriptor;
  }

  return {
    seed,
    getChunkDescriptor,
  };
}
