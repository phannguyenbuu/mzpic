import { jsPDF } from 'jspdf';

/**
 * Chuyển đổi bất kỳ URL ảnh (HTTP / Blob / DataURL) thành Data URL base64 tương thích jsPDF
 * @param {string} src
 * @returns {Promise<string>}
 */
export async function ensureImageDataUrl(src) {
  if (!src) throw new Error('Không có dữ liệu ảnh để xuất PDF.');

  if (typeof src === 'string' && src.startsWith('data:image/')) {
    return src;
  }

  // Thử fetch chuyển Blob sang Data URL
  try {
    const response = await fetch(src, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    // Fallback: Vẽ qua Canvas HTMLImageElement với crossOrigin anonymous
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.98));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh để xuất PDF.'));
      img.src = src;
    });
  }
}

/**
 * Xuất file PDF chuẩn in ấn A0 (841 x 1189 mm) hoặc theo kích thước yêu cầu
 * @param {string} imageSrc - Base64 DataURL hoặc URL ảnh
 * @param {Object} options
 * @param {number} [options.width=841] - Chiều rộng mm (mặc định A0: 841mm)
 * @param {number} [options.height=1189] - Chiều cao mm (mặc định A0: 1189mm)
 * @param {string} [options.filename] - Tên file PDF xuất ra
 * @returns {Promise<boolean>}
 */
export async function exportToA0Pdf(imageSrc, options = {}) {
  const {
    width = 841,
    height = 1189,
    filename = `BaoTuong_A0_841x1189mm_${Date.now()}.pdf`,
    title = 'Báo Tường Học Đường A0 (841 × 1189 mm)'
  } = options;

  const dataUrl = await ensureImageDataUrl(imageSrc);

  const orientation = width > height ? 'landscape' : 'portrait';

  // Khởi tạo jsPDF với đơn vị mm và khổ chính xác 841 x 1189 mm (A0)
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [width, height],
    compress: true
  });

  pdf.setProperties({
    title: title || 'Báo Tường A0',
    subject: `Chuẩn in ấn A0 ${width}x${height} mm 300 DPI`,
    author: 'ToolXPrint - School Paper Generator',
    creator: 'ToolXPrint GenAI Studio'
  });

  const isPng = dataUrl.startsWith('data:image/png');
  const imageFormat = isPng ? 'PNG' : 'JPEG';

  const internalW = pdf.internal.pageSize.getWidth();
  const internalH = pdf.internal.pageSize.getHeight();

  // Vẽ tràn viền khổ giấy A0 chính xác (0, 0, internalW, internalH)
  pdf.addImage(dataUrl, imageFormat, 0, 0, internalW, internalH, undefined, 'FAST');

  // Kích hoạt tải về máy
  pdf.save(filename);
  return true;
}
