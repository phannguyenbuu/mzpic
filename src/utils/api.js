/**
 * Utility functions for ToolXPrint GenAI API integration (https://genai.toolxprint.com)
 */

/**
 * Format reference image to a valid format accepted by the VPS API and Chrome Worker.
 * - Base64 Data URLs are preserved (e.g. data:image/png;base64,...)
 * - Absolute HTTP/HTTPS URLs are preserved
 * - Relative URLs (e.g. /images/xxx.png) are converted to https://genai.toolxprint.com/images/xxx.png
 *
 * @param {string|{url?: string, data?: string}|null} ref
 * @returns {string|null}
 */
export function formatReferenceImageUrl(ref) {
  if (!ref) return null;
  const raw = typeof ref === 'string' ? ref : (ref.url || ref.data || '');
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return `https://genai.toolxprint.com${trimmed}`;
  return `https://genai.toolxprint.com/${trimmed}`;
}

/**
 * Create a new generation job or an edit job on ToolXPrint GenAI Hub.
 * - If referenceImage is present: calls POST /api/jobs/edit-full
 * - If referenceImage is absent: calls POST /api/jobs/create
 *
 * @param {Object} options
 * @param {string} options.prompt
 * @param {string} [options.aspectRatio='1:1']
 * @param {string} [options.style='None']
 * @param {string|Object|null} [options.referenceImage=null]
 * @param {Array<string|Object>|null} [options.referenceImages=null]
 * @param {boolean} [options.preserveSurroundings=true]
 * @returns {Promise<Object>}
 */
export async function createRenderJob({
  prompt,
  aspectRatio = '1:1',
  style = 'None',
  referenceImage = null,
  referenceImages = null,
  preserveSurroundings = true
}) {
  let formattedRefs = [];
  if (Array.isArray(referenceImages) && referenceImages.length > 0) {
    formattedRefs = referenceImages
      .map((img) => formatReferenceImageUrl(img))
      .filter(Boolean);
  } else if (referenceImage) {
    const formatted = formatReferenceImageUrl(referenceImage);
    if (formatted) formattedRefs.push(formatted);
  }

  const isEditing = formattedRefs.length > 0;
  const endpoint = isEditing ? '/api/jobs/edit-full' : '/api/jobs/create';

  const payload = {
    prompt: (prompt || '').trim(),
    aspect_ratio: aspectRatio,
    style: style && style !== 'none' ? style : 'None',
    caller: 'MzPic'
  };

  if (isEditing) {
    payload.reference_images = formattedRefs;
    payload.preserve_surroundings = preserveSurroundings;
  } else {
    payload.new_chat = false;
  }

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Lỗi máy chủ (${resp.status}): ${errorText || resp.statusText}`);
  }

  return await resp.json();
}
