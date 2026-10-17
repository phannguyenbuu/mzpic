/**
 * Composite multiple layers onto an HTML5 canvas and export data URL at native resolution.
 * Supports individual layer opacities, visibility, blend modes, and fallback to composite image.
 *
 * NOTE: ZERO JS Canvas upscaling is performed here. Canvas is strictly sized to the
 * native resolution of the input layers (e.g. 1024x1792 px) to prevent browser Out-Of-Memory.
 * All high-resolution / print / A0 upscale MUST be delegated to GenAI GPU Upscaler.
 */

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.warn('Failed to load image for composite:', src, err);
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Composite layers with individual opacity and visibility at NATIVE resolution.
 *
 * @param {Array<Object>} layersList Array of layer objects { id, image, opacity, visible, zIndex, blendMode }
 * @param {string|null} fallbackImage Composite image if layers don't have separate images
 * @returns {Promise<string>} Base64 JPEG dataUrl
 */
export async function compositeLayersToDataUrl(layersList = [], fallbackImage = null) {
  // Filter active layers that have an image and opacity > 0
  const activeLayers = (layersList || [])
    .filter((l) => l && l.visible && l.image && (l.opacity === undefined || l.opacity > 0))
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  // Load all images in parallel
  const loadedResults = await Promise.all(
    activeLayers.map(async (layer) => {
      const img = await loadImage(layer.image);
      return img ? { layer, img } : null;
    })
  );
  const loadedLayers = loadedResults.filter(Boolean);

  let baseWidth = 0;
  let baseHeight = 0;

  if (loadedLayers.length > 0) {
    baseWidth = Math.max(...loadedLayers.map((item) => item.img.naturalWidth || item.img.width || 0));
    baseHeight = Math.max(...loadedLayers.map((item) => item.img.naturalHeight || item.img.height || 0));
  } else if (fallbackImage) {
    const fbImg = await loadImage(fallbackImage);
    if (fbImg) {
      baseWidth = fbImg.naturalWidth || fbImg.width || 0;
      baseHeight = fbImg.naturalHeight || fbImg.height || 0;
      loadedLayers.push({ layer: { opacity: 100 }, img: fbImg });
    }
  }

  if (!baseWidth || !baseHeight) {
    baseWidth = 1024;
    baseHeight = 1792;
  }

  // Create canvas at NATIVE resolution only (under 10MB VRAM)
  const canvas = document.createElement('canvas');
  canvas.width = baseWidth;
  canvas.height = baseHeight;
  const ctx = canvas.getContext('2d');

  // Background is solid white by default for print
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  // Draw layers in order with their opacity and blendMode
  for (const { layer, img } of loadedLayers) {
    ctx.save();
    const op = typeof layer.opacity === 'number' ? Math.max(0, Math.min(100, layer.opacity)) / 100 : 1;
    ctx.globalAlpha = op;
    if (layer.blendMode) {
      ctx.globalCompositeOperation = layer.blendMode;
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.drawImage(img, 0, 0, baseWidth, baseHeight);
    ctx.restore();
  }

  let dataUrl = '';
  try {
    dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  } catch (err) {
    dataUrl = canvas.toDataURL('image/png');
  }

  // Immediately free canvas GPU buffer
  canvas.width = 1;
  canvas.height = 1;

  return dataUrl;
}
