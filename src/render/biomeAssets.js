const biomeAssetLoaders = import.meta.glob("../assets/biomes/**/*.svg", {
  import: "default",
});

const THEME_ART_ASSET_PATHS = {
  office_98: [
    "../assets/biomes/office_98/chart_bar_quarterly.svg",
    "../assets/biomes/office_98/chart_pie_marketshare.svg",
    "../assets/biomes/office_98/chart_bar_targets.svg",
    "../assets/biomes/office_98/chart_pie_budget.svg",
  ],
  gallery: [
    "../assets/biomes/gallery/gallery_poster.svg",
    "../assets/biomes/gallery/gallery_label.svg",
  ],
  service_industrial: [
    "../assets/biomes/industrial/warning_panel.svg",
    "../assets/biomes/industrial/stencil_plate.svg",
  ],
  liminal_backrooms: [
    "../assets/biomes/liminal/notice_board.svg",
    "../assets/biomes/liminal/exit_arrow.svg",
  ],
  retro_wood: ["../assets/biomes/retro_wood/wood_plaque.svg"],
  tiled_palace: ["../assets/biomes/tile/ceramic_medallion.svg"],
  brick_bunker: ["../assets/biomes/industrial/stencil_plate.svg"],
  blue_lab: ["../assets/biomes/lab/lab_monitor.svg"],
  dusty_stone: ["../assets/biomes/stone/stone_tablet.svg"],
  checker_hall: ["../assets/biomes/gallery/gallery_label.svg"],
  copper_service: ["../assets/biomes/industrial/warning_panel.svg"],
  marble_office: [
    "../assets/biomes/office_98/chart_bar_quarterly.svg",
    "../assets/biomes/office_98/chart_pie_marketshare.svg",
    "../assets/biomes/office_98/chart_bar_targets.svg",
    "../assets/biomes/office_98/chart_pie_budget.svg",
  ],
  night_gallery: ["../assets/biomes/gallery/gallery_poster.svg"],
  false_sanctuary: [
    "../assets/biomes/tile/ceramic_medallion.svg",
    "../assets/biomes/liminal/exit_arrow.svg",
  ],
};

const assetUrlPromiseCache = new Map();
const imagePromiseCache = new Map();

async function loadAssetUrl(path) {
  if (!assetUrlPromiseCache.has(path)) {
    const loader = biomeAssetLoaders[path];
    if (!loader) {
      assetUrlPromiseCache.set(path, Promise.reject(new Error(`Missing biome asset loader: ${path}`)));
    } else {
      assetUrlPromiseCache.set(path, loader());
    }
  }
  return assetUrlPromiseCache.get(path);
}

async function preloadImage(url) {
  if (!imagePromiseCache.has(url)) {
    imagePromiseCache.set(
      url,
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load biome art image: ${url}`));
        image.src = url;
      }),
    );
  }
  return imagePromiseCache.get(url);
}

export async function loadThemeArtAssets(themeType) {
  const paths = THEME_ART_ASSET_PATHS[themeType] || [];
  const entries = await Promise.all(
    paths.map(async (path) => {
      try {
        const url = await loadAssetUrl(path);
        const image = await preloadImage(url);
        return { url, image };
      } catch (error) {
        console.warn(`[biome-assets] Could not preload ${path}`, error);
        return null;
      }
    }),
  );
  return entries.filter(Boolean);
}
