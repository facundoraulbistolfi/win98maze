import * as THREE from "three";
import { loadThemeArtAssets } from "./biomeAssets";
import { CELL, COLS, ROWS, hash32, makeSeededRand } from "../world/layouts";

const CHUNK_W = COLS * CELL;
const CHUNK_H = ROWS * CELL;
const MINIMAP_CELL = 18;
const DECOR_OFFSET = 0.08;
const DECOR_Y = CELL * 0.55;

const THEME_FAMILIES = {
  classic_win98: {
    label: "Win98",
    wallPattern: "brick",
    floorPattern: "checker",
    ceilPattern: "white",
    wallBase: 0x8b1010,
    floorBase: 0x111111,
    floorAlt: 0xd8d8d8,
    ceilBase: 0xdddad5,
    background: 0x000000,
    fog: 0x000000,
    ambientColor: 0xffffff,
    ambientIntensity: 0.72,
    pointColor: 0xffffee,
    pointIntensity: 1.2,
    minimapTint: 0x41577d,
  },
  office_98: {
    label: "Office 98",
    wallPattern: "panel",
    floorPattern: "office_carpet",
    ceilPattern: "acoustic",
    wallBase: 0xb7b6aa,
    floorBase: 0x2d4f6a,
    floorAlt: 0x5c88a1,
    ceilBase: 0xd9ddd6,
    background: 0x06090c,
    fog: 0x0a1117,
    ambientColor: 0xdde5ee,
    ambientIntensity: 0.68,
    pointColor: 0xcfe6ff,
    pointIntensity: 1.1,
    decorKind: "wide",
    decorAccent: 0x1f4e79,
    minimapTint: 0x4a6e86,
  },
  gallery: {
    label: "Gallery",
    wallPattern: "gallery",
    floorPattern: "marble",
    ceilPattern: "white",
    wallBase: 0xf0eee8,
    floorBase: 0xb8b0a8,
    floorAlt: 0xe0d8d0,
    ceilBase: 0xdddad5,
    background: 0x0b0b0b,
    fog: 0x101010,
    ambientColor: 0xf4eee3,
    ambientIntensity: 0.64,
    pointColor: 0xfff2cf,
    pointIntensity: 1.15,
    decorKind: "poster",
    decorAccent: 0x7d7364,
    minimapTint: 0x6c6357,
  },
  service_industrial: {
    label: "Industrial",
    wallPattern: "concrete",
    floorPattern: "concrete",
    ceilPattern: "metal",
    wallBase: 0x727679,
    floorBase: 0x666b70,
    floorAlt: 0x8a9198,
    ceilBase: 0x5a6070,
    background: 0x060708,
    fog: 0x0b0d10,
    ambientColor: 0xd4dce2,
    ambientIntensity: 0.58,
    pointColor: 0xc8d8ff,
    pointIntensity: 1.05,
    decorKind: "square",
    decorAccent: 0x707a84,
    minimapTint: 0x52606c,
  },
  liminal_backrooms: {
    label: "Liminal",
    wallPattern: "backrooms_wall",
    floorPattern: "backrooms_floor",
    ceilPattern: "backrooms_ceil",
    wallBase: 0xc8b86a,
    floorBase: 0xc49a52,
    floorAlt: 0xe0c480,
    ceilBase: 0xddd5a8,
    background: 0x080702,
    fog: 0x151108,
    ambientColor: 0xe7dfad,
    ambientIntensity: 0.56,
    pointColor: 0xfff2b8,
    pointIntensity: 1.0,
    decorKind: "wide",
    decorAccent: 0x8f8863,
    minimapTint: 0x8a7c4d,
  },
  retro_wood: {
    label: "Retro Wood",
    wallPattern: "wood",
    floorPattern: "wood_floor",
    ceilPattern: "wood_ceil",
    wallBase: 0x6b3c10,
    floorBase: 0x8c5a20,
    floorAlt: 0x7e5018,
    ceilBase: 0x5a3010,
    background: 0x090603,
    fog: 0x140d07,
    ambientColor: 0xf0d7b8,
    ambientIntensity: 0.62,
    pointColor: 0xffd19a,
    pointIntensity: 1.08,
    decorKind: "wide",
    decorAccent: 0x4d2c13,
    minimapTint: 0x7b4e23,
  },
  tiled_palace: {
    label: "Tiled Palace",
    wallPattern: "tile_wall",
    floorPattern: "tile_floor",
    ceilPattern: "tile_ceil",
    wallBase: 0xd4c890,
    floorBase: 0xc8b870,
    floorAlt: 0xede8d0,
    ceilBase: 0xb8a860,
    background: 0x080809,
    fog: 0x0f1014,
    ambientColor: 0xe8e0c8,
    ambientIntensity: 0.66,
    pointColor: 0xffefbf,
    pointIntensity: 1.12,
    decorKind: "medallion",
    decorAccent: 0x1a2e8a,
    minimapTint: 0x5668a9,
  },
  brick_bunker: {
    label: "Brick Bunker",
    wallPattern: "brick",
    floorPattern: "concrete",
    ceilPattern: "brick_ceil",
    wallBase: 0x6e0c0c,
    floorBase: 0x666b70,
    floorAlt: 0x808890,
    ceilBase: 0x6a2a2a,
    background: 0x070505,
    fog: 0x110b0b,
    ambientColor: 0xdcc8c0,
    ambientIntensity: 0.58,
    pointColor: 0xffc7b0,
    pointIntensity: 1.0,
    decorKind: "square",
    decorAccent: 0x6a2a2a,
    minimapTint: 0x744040,
  },
  blue_lab: {
    label: "Blue Lab",
    wallPattern: "metal",
    floorPattern: "office_carpet",
    ceilPattern: "acoustic",
    wallBase: 0x4a5560,
    floorBase: 0x2d4f6a,
    floorAlt: 0x5f8db2,
    ceilBase: 0xd9ddd6,
    background: 0x04070b,
    fog: 0x09111a,
    ambientColor: 0xd7e8ff,
    ambientIntensity: 0.64,
    pointColor: 0xbfe2ff,
    pointIntensity: 1.12,
    decorKind: "wide",
    decorAccent: 0x5f7280,
    minimapTint: 0x4a708b,
  },
  dusty_stone: {
    label: "Dusty Stone",
    wallPattern: "stone",
    floorPattern: "dirt",
    ceilPattern: "stone_ceil",
    wallBase: 0x777777,
    floorBase: 0x5a4020,
    floorAlt: 0x836340,
    ceilBase: 0x666666,
    background: 0x090806,
    fog: 0x15120d,
    ambientColor: 0xe0d4c0,
    ambientIntensity: 0.54,
    pointColor: 0xf7ddb0,
    pointIntensity: 0.96,
    decorKind: "tablet",
    decorAccent: 0x59544f,
    minimapTint: 0x746556,
  },
  checker_hall: {
    label: "Checker Hall",
    wallPattern: "gallery",
    floorPattern: "checker",
    ceilPattern: "white",
    wallBase: 0xeae5dc,
    floorBase: 0x111111,
    floorAlt: 0xd8d8d8,
    ceilBase: 0xdddad5,
    background: 0x080808,
    fog: 0x121212,
    ambientColor: 0xf6f2ea,
    ambientIntensity: 0.68,
    pointColor: 0xffffff,
    pointIntensity: 1.18,
    decorKind: "wide",
    decorAccent: 0x333333,
    minimapTint: 0x666666,
  },
  copper_service: {
    label: "Copper Service",
    wallPattern: "wood",
    floorPattern: "concrete",
    ceilPattern: "metal",
    wallBase: 0x76451d,
    floorBase: 0x666b70,
    floorAlt: 0x8b7357,
    ceilBase: 0x555c68,
    background: 0x080706,
    fog: 0x12100d,
    ambientColor: 0xe3cfbf,
    ambientIntensity: 0.55,
    pointColor: 0xffd3b0,
    pointIntensity: 1.02,
    decorKind: "wide",
    decorAccent: 0x8a5b2d,
    minimapTint: 0x886347,
  },
  marble_office: {
    label: "Marble Office",
    wallPattern: "panel",
    floorPattern: "marble",
    ceilPattern: "acoustic",
    wallBase: 0xb7b6aa,
    floorBase: 0xc6c0ba,
    floorAlt: 0xe5ded6,
    ceilBase: 0xd9ddd6,
    background: 0x09090a,
    fog: 0x101216,
    ambientColor: 0xe7edf0,
    ambientIntensity: 0.67,
    pointColor: 0xf2f8ff,
    pointIntensity: 1.14,
    decorKind: "wide",
    decorAccent: 0x5b2c83,
    minimapTint: 0x6b6f83,
  },
  night_gallery: {
    label: "Night Gallery",
    wallPattern: "gallery",
    floorPattern: "carpet",
    ceilPattern: "metal",
    wallBase: 0xdbd5c9,
    floorBase: 0x4a2060,
    floorAlt: 0x7a4c90,
    ceilBase: 0x555c68,
    background: 0x050509,
    fog: 0x0c0c14,
    ambientColor: 0xd7cde8,
    ambientIntensity: 0.5,
    pointColor: 0xe4ccff,
    pointIntensity: 0.98,
    decorKind: "poster",
    decorAccent: 0x57466d,
    minimapTint: 0x654f7d,
  },
  false_sanctuary: {
    label: "False Sanctuary",
    wallPattern: "tile_wall",
    floorPattern: "marble",
    ceilPattern: "backrooms_ceil",
    wallBase: 0xd4c890,
    floorBase: 0xc6c0ba,
    floorAlt: 0xe5ded6,
    ceilBase: 0xddd5a8,
    background: 0x080707,
    fog: 0x14110d,
    ambientColor: 0xe9dfc6,
    ambientIntensity: 0.57,
    pointColor: 0xffefb0,
    pointIntensity: 1.04,
    decorKind: "medallion",
    decorAccent: 0x8f8863,
    minimapTint: 0x8f8a74,
  },
};

function rgb(color) {
  return {
    r: (color >> 16) & 255,
    g: (color >> 8) & 255,
    b: color & 255,
  };
}

function toCss(color, alpha = 1) {
  return `rgba(${color.r},${color.g},${color.b},${alpha})`;
}

function mixColors(a, b, amount) {
  return {
    r: Math.round(a.r + (b.r - a.r) * amount),
    g: Math.round(a.g + (b.g - a.g) * amount),
    b: Math.round(a.b + (b.b - a.b) * amount),
  };
}

function shiftColor(color, amount) {
  const tone = amount >= 0 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  return mixColors(color, tone, Math.abs(amount));
}

function makeCanvasTexture(canvas, repeat = [1, 1]) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  return texture;
}

function addSpeckles(ctx, rand, width, height, count, color, alphaMin, alphaMax, size = 2) {
  for (let i = 0; i < count; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    const alpha = alphaMin + rand() * (alphaMax - alphaMin);
    ctx.fillStyle = toCss(color, alpha);
    ctx.fillRect(x, y, size, size);
  }
}

function addScratches(ctx, rand, width, height, count, color) {
  ctx.lineWidth = 0.6;
  for (let i = 0; i < count; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    const len = 3 + rand() * 8;
    const angle = rand() * Math.PI * 2;
    ctx.strokeStyle = toCss(color, 0.18 + rand() * 0.18);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
}

function addBlotches(ctx, rand, width, height, count, color) {
  for (let i = 0; i < count; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    const radius = 10 + rand() * 22;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, toCss(color, 0.1 + rand() * 0.08));
    gradient.addColorStop(1, toCss(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
}

function createVariantColors(theme, variantId, sessionSeed, themeType) {
  const rand = makeSeededRand(sessionSeed, variantId + 1, hash32(themeType, "variant"), 7);
  const wallBase = shiftColor(rgb(theme.wallBase), rand() * 0.28 - 0.12);
  const floorBase = shiftColor(rgb(theme.floorBase), rand() * 0.22 - 0.1);
  const floorAlt = shiftColor(rgb(theme.floorAlt || theme.floorBase), rand() * 0.22 - 0.1);
  const ceilBase = shiftColor(rgb(theme.ceilBase), rand() * 0.18 - 0.08);
  const accent = shiftColor(rgb(theme.decorAccent || theme.wallBase), rand() * 0.3 - 0.15);
  return {
    wallBase,
    floorBase,
    floorAlt,
    ceilBase,
    accent,
    grime: 0.18 + rand() * 0.28,
    contrast: 0.85 + rand() * 0.35,
  };
}

function paintBrick(ctx, width, height, palette, rand) {
  ctx.fillStyle = toCss(shiftColor(palette.wallBase, 0.35));
  ctx.fillRect(0, 0, width, height);
  const brickW = 98 + Math.floor(rand() * 28);
  const brickH = 40 + Math.floor(rand() * 18);
  const mortar = 5 + Math.floor(rand() * 3);
  const shadow = shiftColor(palette.wallBase, -0.28);
  const highlight = shiftColor(palette.wallBase, 0.22);
  for (let row = 0; row <= Math.ceil(height / (brickH + mortar)); row += 1) {
    const offset = (row % 2) * ((brickW + mortar) / 2);
    const y = row * (brickH + mortar) + mortar;
    for (let col = -1; col <= Math.ceil(width / (brickW + mortar)); col += 1) {
      const x = col * (brickW + mortar) + offset + mortar;
      ctx.fillStyle = toCss(shiftColor(palette.wallBase, rand() * 0.15 - 0.08));
      ctx.fillRect(x, y, brickW, brickH);
      ctx.fillStyle = toCss(highlight, 0.16);
      ctx.fillRect(x + 1, y + 1, brickW - 2, 4);
      ctx.fillStyle = toCss(shadow, 0.26);
      ctx.fillRect(x + brickW * 0.5, y, brickW * 0.5, brickH);
      ctx.fillRect(x + 1, y + brickH - 4, brickW - 2, 4);
    }
  }
}

function paintStone(ctx, width, height, palette, rand) {
  ctx.fillStyle = toCss(shiftColor(palette.wallBase, 0.18));
  ctx.fillRect(0, 0, width, height);
  const blockW = 100 + Math.floor(rand() * 24);
  const blockH = 52 + Math.floor(rand() * 18);
  const mortar = 4 + Math.floor(rand() * 2);
  for (let row = 0; row <= Math.ceil(height / (blockH + mortar)); row += 1) {
    const offset = (row % 2) * ((blockW + mortar) / 2);
    const y = row * (blockH + mortar) + mortar;
    for (let col = -1; col <= Math.ceil(width / (blockW + mortar)); col += 1) {
      const x = col * (blockW + mortar) + offset + mortar;
      const tone = shiftColor(palette.wallBase, rand() * 0.18 - 0.12);
      ctx.fillStyle = toCss(tone);
      ctx.fillRect(x, y, blockW, blockH);
      ctx.fillStyle = toCss(shiftColor(tone, 0.22), 0.12);
      ctx.fillRect(x + 1, y + 1, blockW - 2, 4);
      ctx.fillStyle = toCss(shiftColor(tone, -0.2), 0.2);
      ctx.fillRect(x + 1, y + blockH - 4, blockW - 2, 4);
    }
  }
}

function paintPanel(ctx, width, height, palette) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, toCss(shiftColor(palette.wallBase, 0.08)));
  gradient.addColorStop(1, toCss(shiftColor(palette.wallBase, -0.08)));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.lineWidth = 3;
  for (let y = 0; y <= height; y += 96) {
    ctx.strokeStyle = toCss(shiftColor(palette.wallBase, -0.25), 0.45);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.lineWidth = 2;
  for (let x = 0; x <= width; x += 128) {
    ctx.strokeStyle = toCss(shiftColor(palette.wallBase, 0.35), 0.14);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}

function paintGallery(ctx, width, height, palette, rand) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, toCss(shiftColor(palette.wallBase, 0.08)));
  gradient.addColorStop(0.7, toCss(palette.wallBase));
  gradient.addColorStop(1, toCss(shiftColor(palette.wallBase, -0.18)));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = toCss(shiftColor(palette.wallBase, -0.35), 0.95);
  ctx.fillRect(0, height - 38, width, 38);
  addSpeckles(ctx, rand, width, height - 42, 450, shiftColor(palette.wallBase, -0.3), 0.015, 0.05);
}

function paintConcrete(ctx, width, height, palette, rand) {
  ctx.fillStyle = toCss(palette.wallBase);
  ctx.fillRect(0, 0, width, height);
  addSpeckles(ctx, rand, width, height, 5200, shiftColor(palette.wallBase, palette.contrast ? palette.contrast * 0.1 : 0.1), 0.05, 0.2);
  addScratches(ctx, rand, width, height, 280, shiftColor(palette.wallBase, -0.25));
  for (let y = 96; y < height; y += 96) {
    ctx.strokeStyle = toCss(shiftColor(palette.wallBase, -0.3), 0.24);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function paintWood(ctx, width, height, palette, rand) {
  ctx.fillStyle = toCss(shiftColor(palette.wallBase, -0.15));
  ctx.fillRect(0, 0, width, height);
  const plank = 64 + Math.floor(rand() * 28);
  for (let y = 0; y < height; y += plank) {
    const tone = shiftColor(palette.wallBase, rand() * 0.18 - 0.08);
    ctx.fillStyle = toCss(tone);
    ctx.fillRect(0, y, width, plank);
    ctx.strokeStyle = toCss(shiftColor(tone, -0.32), 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    addScratches(ctx, rand, width, plank, 70, shiftColor(tone, -0.2));
  }
}

function paintMetal(ctx, width, height, palette, rand) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, toCss(shiftColor(palette.wallBase, 0.12)));
  gradient.addColorStop(0.5, toCss(shiftColor(palette.wallBase, -0.04)));
  gradient.addColorStop(1, toCss(shiftColor(palette.wallBase, 0.06)));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  const panelW = width / 2;
  const panelH = height / 3;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      const x = col * panelW + 4;
      const y = row * panelH + 4;
      const w = panelW - 8;
      const h = panelH - 8;
      ctx.strokeStyle = toCss(shiftColor(palette.wallBase, 0.18), 0.55);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, h);
      [[x + 6, y + 6], [x + w - 6, y + 6], [x + 6, y + h - 6], [x + w - 6, y + h - 6]].forEach(([rx, ry]) => {
        ctx.fillStyle = toCss(shiftColor(palette.wallBase, 0.2), 0.9);
        ctx.beginPath();
        ctx.arc(rx, ry, 2.4 + rand(), 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }
}

function paintBackroomsWall(ctx, width, height, palette) {
  ctx.fillStyle = toCss(palette.wallBase);
  ctx.fillRect(0, 0, width, height);
  const tileW = 48;
  const tileH = 64;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = toCss(shiftColor(palette.wallBase, -0.22), 0.55);
  for (let row = -1; row < height / tileH + 2; row += 1) {
    for (let col = -1; col < width / tileW + 2; col += 1) {
      const ox = col * tileW + (row % 2) * (tileW / 2);
      const oy = row * tileH;
      ctx.beginPath();
      ctx.moveTo(ox + tileW / 2, oy + 4);
      ctx.lineTo(ox + tileW - 4, oy + tileH / 2);
      ctx.lineTo(ox + tileW / 2, oy + tileH - 4);
      ctx.lineTo(ox + 4, oy + tileH / 2);
      ctx.closePath();
      ctx.stroke();
    }
  }
}

function paintTile(ctx, width, height, palette, rand, ornate = false) {
  ctx.fillStyle = toCss(shiftColor(palette.wallBase, 0.1));
  ctx.fillRect(0, 0, width, height);
  const size = 128;
  const accent = palette.accent;
  for (let row = 0; row < height / size; row += 1) {
    for (let col = 0; col < width / size; col += 1) {
      const x = col * size;
      const y = row * size;
      ctx.fillStyle = toCss(shiftColor(palette.floorAlt, ornate ? 0.06 : 0.02));
      ctx.fillRect(x + 3, y + 3, size - 6, size - 6);
      ctx.strokeStyle = toCss(accent, 0.95);
      ctx.lineWidth = ornate ? 6 : 4;
      ctx.strokeRect(x + 4, y + 4, size - 8, size - 8);
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size * 0.18, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < (ornate ? 8 : 4); i += 1) {
        const angle = (i / (ornate ? 8 : 4)) * Math.PI * 2;
        const inner = size * 0.18;
        const outer = size * (ornate ? 0.34 : 0.27);
        ctx.beginPath();
        ctx.moveTo(x + size / 2 + Math.cos(angle) * inner, y + size / 2 + Math.sin(angle) * inner);
        ctx.lineTo(x + size / 2 + Math.cos(angle + 0.18) * outer, y + size / 2 + Math.sin(angle + 0.18) * outer);
        ctx.stroke();
      }
      if (rand() > 0.65) {
        ctx.fillStyle = toCss(shiftColor(accent, 0.12), 0.12);
        ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6);
      }
    }
  }
}

function paintChecker(ctx, width, height, palette) {
  const size = 64;
  for (let row = 0; row < height / size; row += 1) {
    for (let col = 0; col < width / size; col += 1) {
      const tone = (row + col) % 2 === 0 ? palette.floorBase : palette.floorAlt;
      ctx.fillStyle = toCss(tone);
      ctx.fillRect(col * size, row * size, size, size);
    }
  }
}

function paintMarble(ctx, width, height, palette, rand) {
  const size = 128;
  for (let row = 0; row < height / size; row += 1) {
    for (let col = 0; col < width / size; col += 1) {
      const tone = (row + col) % 2 === 0 ? palette.floorBase : palette.floorAlt;
      ctx.fillStyle = toCss(tone);
      ctx.fillRect(col * size, row * size, size, size);
      addScratches(ctx, rand, size, size, 12, shiftColor(tone, -0.18));
    }
  }
  ctx.strokeStyle = toCss(shiftColor(palette.floorBase, -0.35), 0.65);
  ctx.lineWidth = 3;
  for (let i = 0; i <= 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * size, 0);
    ctx.lineTo(i * size, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * size);
    ctx.lineTo(width, i * size);
    ctx.stroke();
  }
}

function paintCarpet(ctx, width, height, palette, rand, office = false) {
  ctx.fillStyle = toCss(palette.floorBase);
  ctx.fillRect(0, 0, width, height);
  addSpeckles(
    ctx,
    rand,
    width,
    height,
    office ? 4200 : 2600,
    shiftColor(palette.floorAlt, office ? 0.15 : 0.08),
    0.06,
    0.18,
  );
  const spacing = office ? 32 : 16;
  ctx.strokeStyle = toCss(shiftColor(palette.floorAlt, 0.1), office ? 0.1 : 0.14);
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function paintConcreteFloor(ctx, width, height, palette, rand) {
  ctx.fillStyle = toCss(palette.floorBase);
  ctx.fillRect(0, 0, width, height);
  addSpeckles(ctx, rand, width, height, 7500, shiftColor(palette.floorAlt, 0.08), 0.06, 0.18);
  for (let i = 0; i <= 4; i += 1) {
    ctx.strokeStyle = toCss(shiftColor(palette.floorBase, -0.35), 0.3);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(i * 128, 0);
    ctx.lineTo(i * 128, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * 128);
    ctx.lineTo(width, i * 128);
    ctx.stroke();
  }
}

function paintDirt(ctx, width, height, palette, rand) {
  ctx.fillStyle = toCss(palette.floorBase);
  ctx.fillRect(0, 0, width, height);
  addSpeckles(ctx, rand, width, height, 3400, shiftColor(palette.floorAlt, 0.08), 0.08, 0.24);
  addBlotches(ctx, rand, width, height, 30, shiftColor(palette.floorBase, -0.22));
}

function paintBackroomsFloor(ctx, width, height, palette, rand) {
  ctx.fillStyle = toCss(palette.floorBase);
  ctx.fillRect(0, 0, width, height);
  addScratches(ctx, rand, width, height, 900, shiftColor(palette.floorAlt, -0.08));
  addBlotches(ctx, rand, width, height, 26, shiftColor(palette.floorBase, 0.08));
}

function paintWhiteCeil(ctx, width, height, palette, rand) {
  ctx.fillStyle = toCss(palette.ceilBase);
  ctx.fillRect(0, 0, width, height);
  addSpeckles(ctx, rand, width, height, 420, shiftColor(palette.ceilBase, -0.08), 0.08, 0.2, 3);
}

function paintAcousticCeil(ctx, width, height, palette, rand) {
  ctx.fillStyle = toCss(palette.ceilBase);
  ctx.fillRect(0, 0, width, height);
  const size = 128;
  ctx.strokeStyle = toCss(shiftColor(palette.ceilBase, -0.22), 0.42);
  ctx.lineWidth = 2;
  for (let x = 0; x <= width; x += size) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += size) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  addSpeckles(ctx, rand, width, height, 4200, shiftColor(palette.ceilBase, -0.06), 0.05, 0.16);
}

function paintMetalCeil(ctx, width, height, palette) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, toCss(shiftColor(palette.ceilBase, 0.1)));
  gradient.addColorStop(0.5, toCss(shiftColor(palette.ceilBase, -0.03)));
  gradient.addColorStop(1, toCss(shiftColor(palette.ceilBase, 0.08)));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = toCss(shiftColor(palette.ceilBase, 0.18), 0.45);
  ctx.lineWidth = 2;
  for (let x = 0; x < width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function paintWoodCeil(ctx, width, height, palette, rand) {
  ctx.fillStyle = toCss(shiftColor(palette.ceilBase, -0.12));
  ctx.fillRect(0, 0, width, height);
  const plank = height / 4;
  for (let row = 0; row < 4; row += 1) {
    const tone = shiftColor(palette.ceilBase, rand() * 0.16 - 0.08);
    ctx.fillStyle = toCss(tone);
    ctx.fillRect(0, row * plank, width, plank);
    ctx.strokeStyle = toCss(shiftColor(tone, -0.25), 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, row * plank);
    ctx.lineTo(width, row * plank);
    ctx.stroke();
  }
}

function paintBrickCeil(ctx, width, height, palette, rand) {
  paintBrick(ctx, width, height, { ...palette, wallBase: palette.ceilBase }, rand);
}

function paintBackroomsCeil(ctx, width, height, palette, rand) {
  ctx.fillStyle = toCss(palette.ceilBase);
  ctx.fillRect(0, 0, width, height);
  const size = 128;
  ctx.strokeStyle = toCss(shiftColor(palette.ceilBase, -0.2), 0.5);
  ctx.lineWidth = 2;
  for (let x = 0; x <= width; x += size) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += size) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  addSpeckles(ctx, rand, width, height, 1800, shiftColor(palette.ceilBase, -0.06), 0.08, 0.22);
}

function makeSurfaceTexture(kind, palette, rand) {
  const sizeByKind = {
    wood: [256, 512],
    metal: [256, 256],
    carpet: [256, 256],
    office_carpet: [256, 256],
    dirt: [256, 256],
    white: [256, 256],
    metal_ceil: [256, 256],
    wood_ceil: [512, 256],
  };
  const [width, height] = sizeByKind[kind] || [512, 512];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (kind === "brick") paintBrick(ctx, width, height, palette, rand);
  else if (kind === "stone") paintStone(ctx, width, height, palette, rand);
  else if (kind === "panel") paintPanel(ctx, width, height, palette);
  else if (kind === "gallery") paintGallery(ctx, width, height, palette, rand);
  else if (kind === "concrete") paintConcrete(ctx, width, height, palette, rand);
  else if (kind === "wood") paintWood(ctx, width, height, palette, rand);
  else if (kind === "metal") paintMetal(ctx, width, height, palette, rand);
  else if (kind === "backrooms_wall") paintBackroomsWall(ctx, width, height, palette);
  else if (kind === "tile_wall") paintTile(ctx, width, height, palette, rand, false);
  else if (kind === "tile_floor") paintTile(ctx, width, height, palette, rand, true);
  else if (kind === "tile_ceil") paintTile(ctx, width, height, { ...palette, wallBase: palette.ceilBase }, rand, true);
  else if (kind === "checker") paintChecker(ctx, width, height, palette);
  else if (kind === "marble") paintMarble(ctx, width, height, palette, rand);
  else if (kind === "carpet") paintCarpet(ctx, width, height, palette, rand, false);
  else if (kind === "office_carpet") paintCarpet(ctx, width, height, palette, rand, true);
  else if (kind === "concrete_floor") paintConcreteFloor(ctx, width, height, palette, rand);
  else if (kind === "dirt") paintDirt(ctx, width, height, palette, rand);
  else if (kind === "backrooms_floor") paintBackroomsFloor(ctx, width, height, palette, rand);
  else if (kind === "white") paintWhiteCeil(ctx, width, height, palette, rand);
  else if (kind === "acoustic") paintAcousticCeil(ctx, width, height, palette, rand);
  else if (kind === "metal_ceil") paintMetalCeil(ctx, width, height, palette);
  else if (kind === "wood_ceil") paintWoodCeil(ctx, width, height, palette, rand);
  else if (kind === "brick_ceil") paintBrickCeil(ctx, width, height, palette, rand);
  else if (kind === "stone_ceil") paintStone(ctx, width, height, { ...palette, wallBase: palette.ceilBase }, rand);
  else if (kind === "backrooms_ceil") paintBackroomsCeil(ctx, width, height, palette, rand);
  else paintConcrete(ctx, width, height, palette, rand);

  addBlotches(ctx, rand, canvas.width, canvas.height, 20 + Math.floor(palette.grime * 18), shiftColor(palette.wallBase || palette.floorBase || palette.ceilBase, -0.35));
  addSpeckles(ctx, rand, canvas.width, canvas.height, 800, shiftColor(palette.accent || palette.wallBase, 0.12), 0.02, 0.08);
  return makeCanvasTexture(canvas, kind === "wood" ? [1, 2] : kind.includes("carpet") ? [2, 2] : kind.includes("wood_ceil") ? [2, 1] : kind.includes("backrooms_floor") ? [3, 3] : [1, 1]);
}

function makePictureFrame(seed, accentColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 72;
  const ctx = canvas.getContext("2d");
  const rand = makeSeededRand(seed, seed % 17, seed % 23, 13);
  const accent = rgb(accentColor);
  const frameLight = shiftColor(accent, 0.35);
  const frameDark = shiftColor(accent, -0.28);
  ctx.fillStyle = toCss(frameDark);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = toCss(frameLight);
  ctx.fillRect(1, 1, canvas.width - 2, 4);
  ctx.fillRect(1, 1, 4, canvas.height - 2);
  ctx.fillStyle = toCss(frameDark);
  ctx.fillRect(1, canvas.height - 5, canvas.width - 2, 4);
  ctx.fillRect(canvas.width - 5, 1, 4, canvas.height - 2);
  ctx.fillStyle = toCss(shiftColor(accent, 0.55));
  ctx.fillRect(7, 7, canvas.width - 14, canvas.height - 14);
  for (let i = 0; i < 8; i += 1) {
    ctx.strokeStyle = toCss(shiftColor(accent, rand() * 0.45 - 0.2), 0.6);
    ctx.lineWidth = 1 + rand();
    ctx.beginPath();
    ctx.moveTo(14 + rand() * 60, 12);
    ctx.bezierCurveTo(20 + rand() * 50, 28 + rand() * 12, 24 + rand() * 40, 40 + rand() * 8, 12 + rand() * 70, 58);
    ctx.stroke();
  }
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = toCss(shiftColor(accent, rand() * 0.6 - 0.1), 0.3);
    ctx.beginPath();
    ctx.arc(20 + rand() * 52, 18 + rand() * 32, 6 + rand() * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function makeArtTextureFromImage(image, accentColor) {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 72;
  const ctx = canvas.getContext("2d");
  const accent = rgb(accentColor);
  ctx.fillStyle = toCss(shiftColor(accent, -0.28));
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = toCss(shiftColor(accent, 0.45));
  ctx.fillRect(1, 1, canvas.width - 2, 4);
  ctx.fillRect(1, 1, 4, canvas.height - 2);
  ctx.fillStyle = toCss(shiftColor(accent, -0.35));
  ctx.fillRect(1, canvas.height - 5, canvas.width - 2, 4);
  ctx.fillRect(canvas.width - 5, 1, 4, canvas.height - 2);
  ctx.fillStyle = "rgba(248,246,239,1)";
  ctx.fillRect(7, 7, canvas.width - 14, canvas.height - 14);
  ctx.strokeStyle = toCss(accent, 0.9);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  const texture = new THREE.CanvasTexture(canvas);
  if (image) {
    ctx.drawImage(image, 10, 10, canvas.width - 20, canvas.height - 20);
    texture.needsUpdate = true;
  }
  return texture;
}

export function buildThemeVariant({ themeType, sessionSeed, cr, cc, variantId = 0, artAssets = [] }) {
  const theme = THEME_FAMILIES[themeType] || THEME_FAMILIES.classic_win98;
  const colors = createVariantColors(theme, variantId, sessionSeed, themeType);
  const wallRand = makeSeededRand(sessionSeed, cr, cc, hash32(themeType, variantId, "wall"));
  const floorRand = makeSeededRand(sessionSeed, cr, cc, hash32(themeType, variantId, "floor"));
  const ceilRand = makeSeededRand(sessionSeed, cr, cc, hash32(themeType, variantId, "ceil"));
  const artRand = makeSeededRand(sessionSeed, cr, cc, hash32(themeType, variantId, "art"));
  const wallTexture = makeSurfaceTexture(theme.wallPattern, { ...colors, grime: colors.grime }, wallRand);
  const floorTexture = makeSurfaceTexture(
    theme.floorPattern === "concrete" ? "concrete_floor" : theme.floorPattern,
    { ...colors, grime: colors.grime },
    floorRand,
  );
  const ceilTexture = makeSurfaceTexture(
    theme.ceilPattern === "metal" ? "metal_ceil" : theme.ceilPattern,
    { ...colors, grime: colors.grime },
    ceilRand,
  );
  const artEntries = artAssets.length
    ? artAssets
    : Array.from({ length: 5 }, (_, index) => ({ generated: true, seed: hash32(sessionSeed, cr, cc, variantId, index) }));
  const artTextures = artEntries.map((entry, index) => {
    if (entry?.image) return makeArtTextureFromImage(entry.image, theme.decorAccent || theme.wallBase);
    return makePictureFrame(entry.seed || hash32(themeType, index), theme.decorAccent || theme.wallBase);
  });
  return {
    label: theme.label,
    wallTexture,
    floorTexture,
    ceilTexture,
    decorChance: 8 + Math.floor(artRand() * 7),
    decorKind: theme.decorKind || "frame",
    decorAccent: theme.decorAccent || theme.wallBase,
    artTextures,
    background: theme.background,
    fog: theme.fog,
    ambientColor: theme.ambientColor,
    ambientIntensity: theme.ambientIntensity,
    pointColor: theme.pointColor,
    pointIntensity: theme.pointIntensity,
    minimapTint: theme.minimapTint,
  };
}

function createThemeResources(variant) {
  const wallMat = new THREE.MeshLambertMaterial({ map: variant.wallTexture, side: THREE.DoubleSide });
  const floorMat = new THREE.MeshLambertMaterial({ map: variant.floorTexture });
  const ceilMat = new THREE.MeshLambertMaterial({ map: variant.ceilTexture });
  floorMat.map.repeat.set(COLS, ROWS);
  floorMat.map.needsUpdate = true;
  ceilMat.map.repeat.set(COLS, ROWS);
  ceilMat.map.needsUpdate = true;
  const artMaterials = variant.artTextures.map((texture) => new THREE.MeshBasicMaterial({ map: texture, transparent: true }));
  return {
    wallMat,
    floorMat,
    ceilMat,
    artMaterials,
  };
}

function buildMinimapBase(descriptor, variant) {
  const canvas = document.createElement("canvas");
  canvas.width = COLS * MINIMAP_CELL;
  canvas.height = ROWS * MINIMAP_CELL;
  const ctx = canvas.getContext("2d");
  const tint = rgb(variant.minimapTint);
  ctx.fillStyle = toCss(shiftColor(tint, -0.5), 0.95);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = toCss(shiftColor(tint, -0.18), 0.18);
  ctx.fillRect(2, 2, canvas.width - 4, canvas.height - 4);
  return canvas;
}

function hasVisitedCell(visited, r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  return visited[r * COLS + c] === 1;
}

function shouldRevealHorizontalWall(visited, r, c) {
  return hasVisitedCell(visited, r - 1, c) || hasVisitedCell(visited, r, c);
}

function shouldRevealVerticalWall(visited, r, c) {
  return hasVisitedCell(visited, r, c - 1) || hasVisitedCell(visited, r, c);
}

function redrawVisitedCanvas(entry) {
  const canvas = entry.minimap.canvas;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(entry.minimap.baseCanvas, 0, 0);
  const tint = rgb(entry.variant.minimapTint);
  ctx.fillStyle = toCss(shiftColor(tint, 0.18), 0.34);
  for (let i = 0; i < entry.minimap.visited.length; i += 1) {
    if (!entry.minimap.visited[i]) continue;
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    ctx.fillRect(c * MINIMAP_CELL + 3, r * MINIMAP_CELL + 3, MINIMAP_CELL - 6, MINIMAP_CELL - 6);
  }
  ctx.strokeStyle = toCss(shiftColor(tint, -0.35), 0.82);
  ctx.lineWidth = 2.4;
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (!hasVisitedCell(entry.minimap.visited, r, c)) continue;
      const left = c * MINIMAP_CELL;
      const top = r * MINIMAP_CELL;
      const right = left + MINIMAP_CELL;
      const bottom = top + MINIMAP_CELL;
      if (!hasVisitedCell(entry.minimap.visited, r - 1, c)) {
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
        ctx.stroke();
      }
      if (!hasVisitedCell(entry.minimap.visited, r + 1, c)) {
        ctx.beginPath();
        ctx.moveTo(left, bottom);
        ctx.lineTo(right, bottom);
        ctx.stroke();
      }
      if (!hasVisitedCell(entry.minimap.visited, r, c - 1)) {
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, bottom);
        ctx.stroke();
      }
      if (!hasVisitedCell(entry.minimap.visited, r, c + 1)) {
        ctx.beginPath();
        ctx.moveTo(right, top);
        ctx.lineTo(right, bottom);
        ctx.stroke();
      }
    }
  }
  ctx.strokeStyle = toCss(shiftColor(tint, 0.45), 0.94);
  ctx.lineWidth = 1.6;
  for (let r = 0; r <= ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (!entry.descriptor.walls.h[r][c] || !shouldRevealHorizontalWall(entry.minimap.visited, r, c)) continue;
      ctx.beginPath();
      ctx.moveTo(c * MINIMAP_CELL, r * MINIMAP_CELL);
      ctx.lineTo((c + 1) * MINIMAP_CELL, r * MINIMAP_CELL);
      ctx.stroke();
    }
  }
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c <= COLS; c += 1) {
      if (!entry.descriptor.walls.v[r][c] || !shouldRevealVerticalWall(entry.minimap.visited, r, c)) continue;
      ctx.beginPath();
      ctx.moveTo(c * MINIMAP_CELL, r * MINIMAP_CELL);
      ctx.lineTo(c * MINIMAP_CELL, (r + 1) * MINIMAP_CELL);
      ctx.stroke();
    }
  }
}

function buildChunkGroup(entry, resources, worldX, worldZ, decorGeometries) {
  const group = new THREE.Group();
  const floorGeo = new THREE.PlaneGeometry(CHUNK_W, CHUNK_H);
  const ceilGeo = new THREE.PlaneGeometry(CHUNK_W, CHUNK_H);
  const wallGeo = new THREE.PlaneGeometry(CELL, CELL);
  const centerX = worldX + CHUNK_W / 2;
  const centerZ = worldZ + CHUNK_H / 2;
  const floor = new THREE.Mesh(floorGeo, resources.floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(centerX, 0, centerZ);
  group.add(floor);
  const ceil = new THREE.Mesh(ceilGeo, resources.ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(centerX, CELL, centerZ);
  group.add(ceil);

  const horizontalMatrices = [];
  const verticalMatrices = [];
  const decorBuckets = new Map();
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  const decorKind = decorGeometries[entry.variant.decorKind] ? entry.variant.decorKind : "frame";
  const decorGeo = decorGeometries[decorKind];

  for (let r = 0; r <= ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (!entry.descriptor.walls.h[r][c]) continue;
      matrix.compose(
        position.set(worldX + c * CELL + CELL / 2, CELL / 2, worldZ + r * CELL),
        quaternion.setFromEuler(new THREE.Euler(0, 0, 0)),
        scale,
      );
      horizontalMatrices.push(matrix.clone());
      const decorHash = hash32(entry.descriptor.key, "decor_h", r, c, entry.descriptor.decorProfile.artOffset);
      const decorThreshold = (decorHash % 100) < (entry.variant.decorChance + Math.floor(entry.descriptor.decorProfile.densityBias * 10));
      if (decorThreshold) {
        const materialIndex = decorHash % resources.artMaterials.length;
        const facingNorth = (decorHash >>> 3) % 2 === 0;
        const bucketKey = `${materialIndex}:${facingNorth ? "north" : "south"}`;
        if (!decorBuckets.has(bucketKey)) decorBuckets.set(bucketKey, []);
        decorBuckets.get(bucketKey).push({
          x: worldX + c * CELL + CELL / 2,
          y: DECOR_Y,
          z: worldZ + r * CELL + (facingNorth ? -DECOR_OFFSET : DECOR_OFFSET),
          rot: facingNorth ? Math.PI : 0,
          materialIndex,
        });
      }
    }
  }

  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c <= COLS; c += 1) {
      if (!entry.descriptor.walls.v[r][c]) continue;
      matrix.compose(
        position.set(worldX + c * CELL, CELL / 2, worldZ + r * CELL + CELL / 2),
        quaternion.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
        scale,
      );
      verticalMatrices.push(matrix.clone());
      const decorHash = hash32(entry.descriptor.key, "decor_v", r, c, entry.descriptor.decorProfile.artOffset);
      const decorThreshold = (decorHash % 100) < (entry.variant.decorChance + Math.floor(entry.descriptor.decorProfile.densityBias * 10));
      if (decorThreshold) {
        const materialIndex = decorHash % resources.artMaterials.length;
        const facingWest = (decorHash >>> 3) % 2 === 0;
        const bucketKey = `${materialIndex}:${facingWest ? "west" : "east"}`;
        if (!decorBuckets.has(bucketKey)) decorBuckets.set(bucketKey, []);
        decorBuckets.get(bucketKey).push({
          x: worldX + c * CELL + (facingWest ? -DECOR_OFFSET : DECOR_OFFSET),
          y: DECOR_Y,
          z: worldZ + r * CELL + CELL / 2,
          rot: facingWest ? -Math.PI / 2 : Math.PI / 2,
          materialIndex,
        });
      }
    }
  }

  if (horizontalMatrices.length) {
    const mesh = new THREE.InstancedMesh(wallGeo, resources.wallMat, horizontalMatrices.length);
    horizontalMatrices.forEach((item, index) => mesh.setMatrixAt(index, item));
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  if (verticalMatrices.length) {
    const mesh = new THREE.InstancedMesh(wallGeo, resources.wallMat, verticalMatrices.length);
    verticalMatrices.forEach((item, index) => mesh.setMatrixAt(index, item));
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  decorBuckets.forEach((items, key) => {
    const [materialIndex] = key.split(":").map(Number);
    const mesh = new THREE.InstancedMesh(decorGeo, resources.artMaterials[materialIndex], items.length);
    items.forEach((item, index) => {
      matrix.compose(
        position.set(item.x, item.y, item.z),
        quaternion.setFromEuler(new THREE.Euler(0, item.rot, 0)),
        scale,
      );
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  });

  return { group, floorGeo, ceilGeo, wallGeo };
}

export function createChunkRenderer({ scene, sessionSeed }) {
  const themeResourceCache = new Map();
  const themeResourcePromiseCache = new Map();
  const chunkCache = new Map();
  const decorGeometries = {
    frame: new THREE.PlaneGeometry(CELL * 0.46, CELL * 0.34),
    poster: new THREE.PlaneGeometry(CELL * 0.38, CELL * 0.6),
    wide: new THREE.PlaneGeometry(CELL * 0.6, CELL * 0.26),
    square: new THREE.PlaneGeometry(CELL * 0.42, CELL * 0.42),
    tablet: new THREE.PlaneGeometry(CELL * 0.38, CELL * 0.52),
    medallion: new THREE.CircleGeometry(CELL * 0.2, 24),
  };

  function getThemeCacheKey(descriptor) {
    return `${sessionSeed}:${descriptor.themeType}:${descriptor.variantId}`;
  }

  function disposeThemeResources(resources) {
    [resources.wallMat, resources.floorMat, resources.ceilMat].forEach((material) => {
      if (material.map) material.map.dispose();
      material.dispose();
    });
    resources.artMaterials.forEach((material) => {
      if (material.map) material.map.dispose();
      material.dispose();
    });
  }

  function buildThemeCacheEntry(descriptor, artAssets = [], fallback = false) {
    const variant = buildThemeVariant({
      themeType: descriptor.themeType,
      sessionSeed,
      cr: descriptor.cr,
      cc: descriptor.cc,
      variantId: descriptor.variantId,
      artAssets,
    });
    return {
      fallback,
      variant,
      resources: createThemeResources(variant),
    };
  }

  async function ensureThemeResources(descriptor) {
    const key = getThemeCacheKey(descriptor);
    const cached = themeResourceCache.get(key);
    if (cached && !cached.fallback) return cached;
    if (!themeResourcePromiseCache.has(key)) {
      themeResourcePromiseCache.set(
        key,
        (async () => {
          const artAssets = await loadThemeArtAssets(descriptor.themeType);
          const nextEntry = buildThemeCacheEntry(descriptor, artAssets, false);
          const previous = themeResourceCache.get(key);
          if (previous?.fallback) disposeThemeResources(previous.resources);
          themeResourceCache.set(key, nextEntry);
          themeResourcePromiseCache.delete(key);
          return nextEntry;
        })().catch((error) => {
          themeResourcePromiseCache.delete(key);
          console.warn(`[chunk-renderer] Falling back to generated decor for ${descriptor.themeType}`, error);
          const fallbackEntry = buildThemeCacheEntry(descriptor, [], true);
          const previous = themeResourceCache.get(key);
          if (previous?.fallback) disposeThemeResources(previous.resources);
          themeResourceCache.set(key, fallbackEntry);
          return fallbackEntry;
        }),
      );
    }
    return themeResourcePromiseCache.get(key);
  }

  function getThemeEntryForDescriptor(descriptor) {
    const key = getThemeCacheKey(descriptor);
    if (!themeResourceCache.has(key)) {
      console.warn(
        `[chunk-renderer] Theme ${descriptor.themeType}/${descriptor.variantId} requested before preload; using procedural fallback.`,
      );
      themeResourceCache.set(key, buildThemeCacheEntry(descriptor, [], true));
    }
    return themeResourceCache.get(key);
  }

  function getThemeVariantForDescriptor(descriptor) {
    return getThemeEntryForDescriptor(descriptor).variant;
  }

  function ensureEntry(descriptor) {
    const cached = chunkCache.get(descriptor.key);
    if (cached) return cached;
    const variant = getThemeVariantForDescriptor(descriptor);
    const entry = {
      descriptor,
      variant,
      minimap: {
        baseCanvas: buildMinimapBase(descriptor, variant),
        canvas: document.createElement("canvas"),
        visited: new Uint8Array(ROWS * COLS),
        revealedCount: 0,
      },
      loaded: false,
      group: null,
      geometries: null,
    };
    entry.minimap.canvas.width = entry.minimap.baseCanvas.width;
    entry.minimap.canvas.height = entry.minimap.baseCanvas.height;
    redrawVisitedCanvas(entry);
    chunkCache.set(descriptor.key, entry);
    return entry;
  }

  async function preloadDescriptors(descriptors) {
    const uniqueDescriptors = Array.from(
      new Map(
        descriptors.filter(Boolean).map((descriptor) => [descriptor.key, descriptor]),
      ).values(),
    );
    await Promise.all(
      uniqueDescriptors.map(async (descriptor) => {
        await ensureThemeResources(descriptor);
        const themeEntry = getThemeEntryForDescriptor(descriptor);
        const existing = chunkCache.get(descriptor.key);
        if (existing) {
          existing.variant = themeEntry.variant;
          existing.minimap.baseCanvas = buildMinimapBase(descriptor, themeEntry.variant);
          existing.minimap.canvas.width = existing.minimap.baseCanvas.width;
          existing.minimap.canvas.height = existing.minimap.baseCanvas.height;
          redrawVisitedCanvas(existing);
          return;
        }
      }),
    );
  }

  function loadChunk(descriptor) {
    const entry = ensureEntry(descriptor);
    entry.variant = getThemeVariantForDescriptor(descriptor);
    if (entry.loaded) return entry;
    const { resources } = getThemeEntryForDescriptor(descriptor);
    const worldX = descriptor.cc * CHUNK_W;
    const worldZ = descriptor.cr * CHUNK_H;
    const built = buildChunkGroup(entry, resources, worldX, worldZ, decorGeometries);
    entry.group = built.group;
    entry.geometries = built;
    entry.loaded = true;
    scene.add(entry.group);
    return entry;
  }

  function unloadChunk(chunkKey) {
    const entry = chunkCache.get(chunkKey);
    if (!entry || !entry.loaded) return;
    scene.remove(entry.group);
    entry.group = null;
    if (entry.geometries) {
      entry.geometries.floorGeo.dispose();
      entry.geometries.ceilGeo.dispose();
      entry.geometries.wallGeo.dispose();
      entry.geometries = null;
    }
    entry.loaded = false;
  }

  function getLoadedEntries() {
    return Array.from(chunkCache.values()).filter((entry) => entry.loaded);
  }

  function getExploredEntriesForMinimap(worldR, worldC, scaledCell, viewSize) {
    const chunkWidth = COLS * scaledCell;
    const chunkHeight = ROWS * scaledCell;
    const centerX = worldC * scaledCell + scaledCell / 2;
    const centerY = worldR * scaledCell + scaledCell / 2;
    const expandedHalf = (viewSize / 2) * Math.SQRT2;
    const minX = centerX - expandedHalf - chunkWidth;
    const maxX = centerX + expandedHalf + chunkWidth;
    const minY = centerY - expandedHalf - chunkHeight;
    const maxY = centerY + expandedHalf + chunkHeight;
    return Array.from(chunkCache.values()).filter((entry) => {
      if (!entry.minimap.revealedCount) return false;
      const chunkX = entry.descriptor.cc * chunkWidth;
      const chunkY = entry.descriptor.cr * chunkHeight;
      return (
        chunkX < maxX &&
        chunkX + chunkWidth > minX &&
        chunkY < maxY &&
        chunkY + chunkHeight > minY
      );
    });
  }

  function markVisited(cr, cc, r, c) {
    const entry = chunkCache.get(`${cr}_${cc}`);
    if (!entry) return;
    const index = r * COLS + c;
    if (entry.minimap.visited[index]) return;
    entry.minimap.visited[index] = 1;
    entry.minimap.revealedCount += 1;
    redrawVisitedCanvas(entry);
  }

  function drawMinimap(canvas, { mode, currentCr, currentCc, worldR, worldC, yaw }) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mode === 2) {
      const view = canvas.width;
      const scaledCell = 24;
      ctx.save();
      ctx.translate(view / 2, view / 2);
      ctx.rotate(-yaw);
      ctx.translate(-(worldC * scaledCell + scaledCell / 2), -(worldR * scaledCell + scaledCell / 2));
      getExploredEntriesForMinimap(worldR, worldC, scaledCell, view).forEach((entry) => {
        ctx.drawImage(
          entry.minimap.canvas,
          entry.descriptor.cc * COLS * scaledCell,
          entry.descriptor.cr * ROWS * scaledCell,
          COLS * scaledCell,
          ROWS * scaledCell,
        );
      });
      ctx.restore();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(view / 2, view / 2 - 10);
      ctx.lineTo(view / 2 - 6, view / 2 + 6);
      ctx.lineTo(view / 2 + 6, view / 2 + 6);
      ctx.closePath();
      ctx.fill();
      return;
    }
    const entry = chunkCache.get(`${currentCr}_${currentCc}`);
    if (!entry) return;
    ctx.drawImage(entry.minimap.canvas, 0, 0, canvas.width, canvas.height);
    const localC = worldC - currentCc * COLS;
    const localR = worldR - currentCr * ROWS;
    const cell = canvas.width / COLS;
    const px = localC * cell + cell / 2;
    const py = localR * cell + cell / 2;
    const dirX = Math.sin(yaw);
    const dirY = -Math.cos(yaw);
    const sideX = -dirY;
    const sideY = dirX;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(px + dirX * 6, py + dirY * 6);
    ctx.lineTo(px - dirX * 6 + sideX * 3.5, py - dirY * 6 + sideY * 3.5);
    ctx.lineTo(px - dirX * 6 - sideX * 3.5, py - dirY * 6 - sideY * 3.5);
    ctx.closePath();
    ctx.fill();
  }

  function dispose() {
    chunkCache.forEach((entry) => {
      if (entry.loaded && entry.group) scene.remove(entry.group);
      if (entry.geometries) {
        entry.geometries.floorGeo.dispose();
        entry.geometries.ceilGeo.dispose();
        entry.geometries.wallGeo.dispose();
      }
    });
    themeResourceCache.forEach(({ resources }) => {
      disposeThemeResources(resources);
    });
    Object.values(decorGeometries).forEach((geometry) => geometry.dispose());
  }

  return {
    loadChunk,
    unloadChunk,
    preloadDescriptors,
    getLoadedEntries,
    getThemeVariantForDescriptor,
    markVisited,
    drawMinimap,
    dispose,
  };
}
