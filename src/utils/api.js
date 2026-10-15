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
    caller: 'SchoolPaper'
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

/**
 * Trích xuất URL hình ảnh hợp lệ từ job data của ToolXPrint / ChatGPT Worker.
 * Ưu tiên:
 * 1. result_image_url
 * 2. preview_image_url (ảnh preview tức thì do worker chụp/render)
 * 3. filename (/images/${filename})
 * 4. pins[0].url
 *
 * @param {Object} job
 * @returns {string}
 */
export function extractJobImageUrl(job) {
  if (!job) return '';
  if (job.result_image_url && typeof job.result_image_url === 'string' && job.result_image_url.trim()) {
    return job.result_image_url.trim();
  }
  if (job.preview_image_url && typeof job.preview_image_url === 'string' && job.preview_image_url.trim()) {
    return job.preview_image_url.trim();
  }
  if (job.filename && typeof job.filename === 'string' && job.filename.trim()) {
    const fn = job.filename.trim();
    return fn.startsWith('http') ? fn : (fn.startsWith('/') ? fn : `/images/${fn}`);
  }
  if (Array.isArray(job.pins) && job.pins.length > 0) {
    const pin = job.pins[0];
    if (typeof pin === 'string' && pin.trim()) return pin.trim();
    if (pin && typeof pin.url === 'string' && pin.url.trim()) return pin.url.trim();
  }
  return '';
}
