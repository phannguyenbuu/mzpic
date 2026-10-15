/**
 * Composite multiple layers onto an HTML5 canvas and export high-res data URL.
 * Supports individual layer opacities, visibility, and fallback to composite image.
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
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
 * Composite layers with individual opacity and visibility.
 *
 * @param {Array<Object>} layersList Array of layer objects { id, image, opacity, visible, zIndex }
 * @param {string|null} fallbackImage Composite image if layers don't have separate images
 * @param {number} targetWidth Target canvas width in pixels
 * @param {number} targetHeight Target canvas height in pixels
 * @returns {Promise<string>} Base64 PNG dataUrl
 */
export async function compositeLayersToDataUrl(layersList = [], fallbackImage = null, targetWidth = 2480, targetHeight = 3508) {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  // Background is solid white by default for print
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Filter visible layers that have an image and opacity > 0
  const activeLayers = (layersList || [])
    .filter((l) => l && l.visible && l.image && (l.opacity === undefined || l.opacity > 0))
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  if (activeLayers.length === 0 && fallbackImage) {
    // If no individual layer images but fallback exists, draw fallback
    const fbImg = await loadImage(fallbackImage);
    if (fbImg) {
      ctx.drawImage(fbImg, 0, 0, targetWidth, targetHeight);
    }
  } else {
    // Draw active layers in order with their opacity over white background

    for (const layer of activeLayers) {
      const img = await loadImage(layer.image);
      if (img) {
        ctx.save();
        const op = typeof layer.opacity === 'number' ? Math.max(0, Math.min(100, layer.opacity)) / 100 : 1;
        ctx.globalAlpha = op;
        if (layer.blendMode) {
          ctx.globalCompositeOperation = layer.blendMode;
        } else {
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        ctx.restore();
      }
    }
  }

  return canvas.toDataURL('image/png');
}
