/** iPhone 16 Pro display — Figma logical frame (SMA iOS26 EC screen). */
export const SMA_LOGICAL_WIDTH = 402
export const SMA_LOGICAL_HEIGHT = 874

/** Figma chrome heights (EC frame node 1142:7210). */
export const SMA_STATUS_BAR_HEIGHT = 62
export const SMA_TOOLBAR_HEIGHT = 54
export const SMA_TAB_BAR_HEIGHT = 95
export const SMA_CHROME_TOP = SMA_STATUS_BAR_HEIGHT + SMA_TOOLBAR_HEIGHT

/** Texture resolution for the iPhone screen UV mapping. */
export const SMA_TEXTURE_WIDTH = 1608
export const SMA_TEXTURE_HEIGHT = 3496

export const SMA_TEXTURE_SCALE = SMA_TEXTURE_WIDTH / SMA_LOGICAL_WIDTH

export const smaAsset = (name: string) => `/images/sma-ios26/${name}`
