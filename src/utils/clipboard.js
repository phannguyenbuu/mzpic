/**
 * Utility functions for reading images from Clipboard (Paste button & Ctrl + V)
 */

/**
 * Extract an image File object from a ClipboardEvent (paste event)
 * @param {ClipboardEvent} e 
 * @returns {File|null}
 */
export function extractImageFromPasteEvent(e) {
  if (!e || !e.clipboardData) return null;
  const items = e.clipboardData.items;
  if (!items) return null;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return null;
}

/**
 * Read image File from navigator.clipboard API when user clicks the Paste button
 * @returns {Promise<File|null>}
 */
export async function readImageFromClipboard() {
  if (!navigator.clipboard || !navigator.clipboard.read) {
    throw new Error('Trình duyệt chưa cấp quyền Clipboard hoặc không hỗ trợ đọc tự động. Hãy dùng phím Ctrl + V để dán trực tiếp!');
  }
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const imgType = item.types.find((t) => t.startsWith('image/'));
      if (imgType) {
        const blob = await item.getType(imgType);
        const ext = imgType.split('/')[1] || 'png';
        return new File([blob], `clipboard_${Date.now()}.${ext}`, { type: imgType });
      }
    }
    return null;
  } catch (err) {
    if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
      throw new Error('Chưa cấp quyền đọc Clipboard cho trang web. Vui lòng bấm phím tắt Ctrl + V trên bàn phím để dán ảnh!');
    }
    throw err;
  }
}
