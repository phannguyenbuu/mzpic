/**
 * Utility for AI Upscale powered by genai.toolxprint.com API & Local GPU Worker (NVIDIA GTX 1080 Ti).
 * Replaces client-side canvas interpolation with genuine deep-learning AI super-resolution.
 */

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? ''
  : 'https://genai.toolxprint.com';

/**
 * Format image URL / reference for genai.toolxprint upscale endpoint.
 */
export function prepareUpscaleInput(imageSrc) {
  if (!imageSrc) return { input_path: null, image_base64: null };

  if (typeof imageSrc === 'string' && imageSrc.startsWith('data:image/')) {
    return { image_base64: imageSrc };
  }

  let path = typeof imageSrc === 'string' ? imageSrc : (imageSrc.url || imageSrc.data || '');
  if (!path) return { input_path: null, image_base64: null };

  if (path.startsWith('data:image/')) {
    return { image_base64: path };
  }

  // If path is local / relative e.g. /images/...
  if (path.startsWith('/')) {
    return { input_path: `https://genai.toolxprint.com${path}` };
  }
  if (!path.startsWith('http://') && !path.startsWith('https://')) {
    return { input_path: `https://genai.toolxprint.com/images/${path}` };
  }
  return { input_path: path };
}

/**
 * Request real AI Upscale using genai.toolxprint.com API and poll until completed.
 *
 * @param {string|Object} imageSrc
 * @param {Object} options
 * @param {number} [options.scale=4] (2, 4, 8)
 * @param {string} [options.modelId='digital-art-4x'] ('upscayl-standard-4x', 'digital-art-4x', 'ultrasharp-4x')
 * @param {string} [options.exportFormat='png']
 * @param {number} [options.printDpi=300]
 * @param {number|null} [options.customWidth=null]
 * @param {Function} [options.onProgress] callback with { progress, status, current_step, jobId }
 * @param {number} [options.pollIntervalMs=1800]
 * @param {number} [options.maxTimeoutMs=360000]
 * @returns {Promise<Object>}
 */
export async function requestAiUpscale(imageSrc, options = {}) {
  const {
    scale = 4,
    modelId = 'digital-art-4x',
    exportFormat = 'png',
    printDpi = 300,
    customWidth = null,
    onProgress = null,
    pollIntervalMs = 1800,
    maxTimeoutMs = 360000
  } = options;

  const { input_path, image_base64 } = prepareUpscaleInput(imageSrc);

  if (!input_path && !image_base64) {
    throw new Error('Nguồn ảnh không hợp lệ để kích nét AI.');
  }

  const payload = {
    scale: Number(scale) || 4,
    model_id: modelId || 'digital-art-4x',
    export_format: exportFormat,
    print_dpi: printDpi,
    tile_size: 0,
    tta: false
  };

  if (image_base64) {
    payload.image_base64 = image_base64;
  } else {
    payload.input_path = input_path;
  }

  if (customWidth) {
    payload.custom_width = parseInt(customWidth, 10);
  }

  // 1. Submit upscale job to genai.toolxprint.com
  const createResp = await fetch(`${API_BASE}/api/upscale/job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!createResp.ok) {
    const errorText = await createResp.text();
    throw new Error(`Lỗi máy chủ kích nét AI (${createResp.status}): ${errorText || createResp.statusText}`);
  }

  const initialJob = await createResp.json();
  const jobId = initialJob.id;

  if (onProgress) {
    onProgress({
      progress: initialJob.progress || 5,
      status: initialJob.status || 'queued',
      current_step: initialJob.current_step || 'Đã đưa vào hàng đợi GPU Kích Nét AI...',
      jobId
    });
  }

  // 2. Poll job status until completed or failed
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        if (Date.now() - startTime > maxTimeoutMs) {
          clearInterval(interval);
          reject(new Error('Tác vụ kích nét AI quá thời gian chờ (timeout). Vui lòng thử lại.'));
          return;
        }

        const pollResp = await fetch(`${API_BASE}/api/upscale/status/${jobId}`);
        if (!pollResp.ok) {
          return;
        }

        const job = await pollResp.json();

        if (onProgress) {
          onProgress({
            progress: typeof job.progress === 'number' ? job.progress : 15,
            status: job.status,
            current_step: job.current_step || 'GPU AI đang kết xuất...',
            jobId
          });
        }

        if (job.status === 'completed') {
          clearInterval(interval);

          const downloadUrl = job.download_url
            ? (job.download_url.startsWith('http') ? job.download_url : `https://genai.toolxprint.com${job.download_url}`)
            : (job.output_file ? `https://genai.toolxprint.com${job.output_file}` : null);

          const outputFile = job.output_file
            ? (job.output_file.startsWith('http') ? job.output_file : `https://genai.toolxprint.com${job.output_file}`)
            : downloadUrl;

          const previewUrl = job.preview_url
            ? (job.preview_url.startsWith('http') ? job.preview_url : `https://genai.toolxprint.com${job.preview_url}`)
            : downloadUrl;

          resolve({
            id: jobId,
            status: 'completed',
            url: downloadUrl || outputFile,
            downloadUrl,
            outputFile,
            previewUrl,
            fileSizeMb: job.file_size_mb || '25.0 MB',
            sourceDimensions: job.source_dimensions,
            targetDimensions: job.target_dimensions,
            durationSeconds: job.duration_seconds || 0
          });
        } else if (job.status === 'failed') {
          clearInterval(interval);
          reject(new Error(job.error || 'Tác vụ kích nét AI thất bại trên GPU'));
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra trạng thái kích nét AI:', err);
      }
    }, pollIntervalMs);
  });
}

/**
 * Compatibility alias for legacy calls. Directs to real AI upscale.
 */
export async function upscaleImageToHighRes(imageSrc, options = {}) {
  return await requestAiUpscale(imageSrc, options);
}

/**
 * Trigger file download directly with cross-origin Blob fallback.
 */
export async function downloadFile(url, fileName) {
  if (!url) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName || `BaoTuong_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
  } catch (err) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `BaoTuong_${Date.now()}.png`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
