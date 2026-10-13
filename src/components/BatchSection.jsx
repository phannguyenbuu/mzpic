import React, { useState, useRef, useEffect } from 'react';
import Tooltip from './Tooltip';
import CropRotateModal from './CropRotateModal';
import { DESIGN_PRESETS, DESIGN_STYLES } from '../data/presets';
import { createRenderJob } from '../utils/api';
import { extractImageFromPasteEvent, readImageFromClipboard } from '../utils/clipboard';

export default function BatchSection({ onOpenInStudio, showToast, onOpenLightbox }) {
  // 3 Sub-tabs theo yêu cầu của bạn: 'images' (Ảnh Mẫu) | 'logo' (Logo Mới) | 'prompt' (Prompt)
  const [activeTab, setActiveTab] = useState('images');

  // Crop / Rotate modal state for batch images
  const [cropTarget, setCropTarget] = useState(null); // { id, url, name, type: 'main' | 'extra' }

  // 1. Danh sách Ảnh mẫu chính cần sửa (Main Target Images)
  const [mainImages, setMainImages] = useState([]);

  // 2. Danh sách Logo mới / Ảnh phụ tham chiếu dùng chung
  const [extraRefImages, setExtraRefImages] = useState([]);

  // 3. Prompt dùng chung cho toàn bộ đợt sửa
  const [batchEditPrompt, setBatchEditPrompt] = useState(
    'Giữ nguyên toàn bộ bố cục, hình ảnh sản phẩm, người mẫu và thông tin chữ của ảnh mẫu. Thay thế logo cũ bằng Logo mới từ ảnh tham chiếu.'
  );

  // 2 Dropdowns bên dưới: Khổ in và Phong cách (có mục Mặc định và lưu localStorage)
  const [selectedPresetId, setSelectedPresetId] = useState(() => {
    return localStorage.getItem('mzpic_batch_preset_id') || 'default';
  });
  const [selectedStyleId, setSelectedStyleId] = useState(() => {
    return localStorage.getItem('mzpic_batch_style_id') || 'none';
  });

  // Tiến độ từng ảnh (Tasks)
  const [tasks, setTasks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const cancelBatchRef = useRef(false);

  // File input refs
  const mainFileInputRef = useRef(null);
  const extraFileInputRef = useRef(null);

  // Helper đọc file thành Data URL
  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Thêm ảnh vào danh sách Ảnh Mẫu Chính
  const addMainImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      if (showToast) showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)!', 'error');
      return;
    }

    const newItems = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const url = await readFileAsDataUrl(file);
        newItems.push({
          id: `main_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          url,
          name: file.name || `Anh_mau_${Date.now()}.png`,
          sizeMb: (file.size / (1024 * 1024)).toFixed(2)
        });
      } catch (err) {
        console.error('Lỗi đọc ảnh:', err);
      }
    }

    if (newItems.length > 0) {
      setMainImages((prev) => [...prev, ...newItems]);
      if (showToast) showToast(`Đã thêm ${newItems.length} ảnh mẫu cần sửa!`, 'success');
    }
  };

  // Thêm ảnh vào danh sách Logo Mới / Ảnh Phụ
  const addExtraRefImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      if (showToast) showToast('Vui lòng chọn file hình ảnh!', 'error');
      return;
    }

    const newItems = [];
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const url = await readFileAsDataUrl(file);
        const lower = (file.name || '').toLowerCase();
        let defaultLabel = 'Logo mới';
        if (lower.includes('qr')) defaultLabel = 'Mã QR';
        else if (lower.includes('icon') || lower.includes('hoa_tiet')) defaultLabel = 'Họa tiết';

        newItems.push({
          id: `extra_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          url,
          name: file.name || `Logo_${Date.now()}.png`,
          sizeMb: (file.size / (1024 * 1024)).toFixed(2),
          label: defaultLabel
        });
      } catch (err) {
        console.error('Lỗi đọc ảnh phụ:', err);
      }
    }

    if (newItems.length > 0) {
      setExtraRefImages((prev) => [...prev, ...newItems]);
      if (showToast) showToast(`Đã thêm ${newItems.length} logo/ảnh phụ!`, 'success');
    }
  };

  // Paste Ảnh Mẫu
  const handlePasteMain = async () => {
    try {
      const file = await readImageFromClipboard();
      if (file) {
        await addMainImageFiles([file]);
      } else {
        if (showToast) showToast('Không tìm thấy hình ảnh trong Clipboard! Hãy copy ảnh rồi bấm Paste.', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Không thể dán ảnh từ Clipboard. Hãy bấm phím Ctrl + V!', 'error');
    }
  };

  // Paste Logo
  const handlePasteExtra = async () => {
    try {
      const file = await readImageFromClipboard();
      if (file) {
        await addExtraRefImageFiles([file]);
      } else {
        if (showToast) showToast('Không tìm thấy logo trong Clipboard!', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Không thể dán logo từ Clipboard. Hãy bấm phím Ctrl + V!', 'error');
    }
  };

  // Global Ctrl+V
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'textarea' || activeTag === 'input') return;

      const file = extractImageFromPasteEvent(e);
      if (file) {
        e.preventDefault();
        if (activeTab === 'logo') {
          addExtraRefImageFiles([file]);
        } else {
          addMainImageFiles([file]);
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [activeTab]);

  // Xóa ảnh
  const handleRemoveMainImage = (id) => {
    setMainImages((prev) => prev.filter((img) => img.id !== id));
    if (showToast) showToast('Đã gỡ ảnh mẫu', 'info');
  };

  const handleRemoveExtraImage = (id) => {
    setExtraRefImages((prev) => prev.filter((img) => img.id !== id));
    if (showToast) showToast('Đã gỡ logo/ảnh phụ', 'info');
  };

  const handleClearAllMain = () => {
    setMainImages([]);
    if (showToast) showToast('Đã xóa tất cả ảnh mẫu', 'info');
  };

  // Cắt / xoay ảnh trong batch
  const handleApplyBatchCrop = (editedDataUrl) => {
    if (!cropTarget) return;
    if (cropTarget.type === 'main') {
      setMainImages((prev) =>
        prev.map((item) => (item.id === cropTarget.id ? { ...item, url: editedDataUrl } : item))
      );
    } else if (cropTarget.type === 'extra') {
      setExtraRefImages((prev) =>
        prev.map((item) => (item.id === cropTarget.id ? { ...item, url: editedDataUrl } : item))
      );
    }
    if (showToast) showToast('✓ Đã cập nhật ảnh sau khi cắt / xoay!', 'success');
    setCropTarget(null);
  };

  // Chèn prompt nhanh
  const setQuickPrompt = (snippet) => {
    setBatchEditPrompt(snippet);
    if (showToast) showToast('Đã áp dụng mẫu câu lệnh chỉnh sửa!', 'success');
  };

  // Tải về 1 ảnh kết quả (Mở tab mới & trigger download)
  const handleDownloadTask = (task, e) => {
    if (e) e.stopPropagation();
    if (!task.resultUrl) return;

    const fileName = `MZPic_Batch_${task.index}_${task.mainImage?.name || 'edited.png'}`;
    window.open(task.resultUrl, '_blank', 'noopener,noreferrer');

    try {
      const a = document.createElement('a');
      a.href = task.resultUrl;
      a.download = fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }

    if (showToast) showToast(`Đang tải ảnh #${task.index} về máy...`, 'success');
  };

  // Tải về tất cả ảnh đã hoàn thành
  const handleDownloadAllCompleted = () => {
    const completedTasks = tasks.filter((t) => t.status === 'completed' && t.resultUrl);
    if (completedTasks.length === 0) {
      if (showToast) showToast('Chưa có ảnh nào hoàn thành để tải về!', 'info');
      return;
    }

    completedTasks.forEach((t, i) => {
      setTimeout(() => {
        handleDownloadTask(t);
      }, i * 450);
    });

    if (showToast) showToast(`Đang mở tải ${completedTasks.length} ảnh đã hoàn tất!`, 'success');
  };

  // Dừng chạy
  const handleCancelBatch = () => {
    cancelBatchRef.current = true;
    setIsProcessing(false);
    if (showToast) showToast('Đã dừng tiến trình chạy batch!', 'warning');
  };

  // Chạy lần lượt từng ảnh mẫu chính (Sequential Processing)
  const startSequentialBatch = async () => {
    if (mainImages.length === 0) {
      if (showToast) showToast('Vui lòng thêm ít nhất 1 ảnh mẫu trong tab "Ảnh Mẫu"!', 'info');
      setActiveTab('images');
      return;
    }

    if (!batchEditPrompt.trim()) {
      if (showToast) showToast('Vui lòng nhập câu lệnh mô tả trong tab "Prompt"!', 'info');
      setActiveTab('prompt');
      return;
    }

    cancelBatchRef.current = false;
    setIsProcessing(true);

    const initialTasks = mainImages.map((img, idx) => ({
      id: `task_${Date.now()}_${idx}`,
      index: idx + 1,
      mainImage: img,
      status: 'queued',
      progress: 0,
      progressText: 'Chờ đến lượt...',
      resultUrl: null,
      error: null
    }));

    setTasks(initialTasks);
    if (showToast) showToast(`🚀 Bắt đầu sửa lần lượt ${initialTasks.length} ảnh mẫu...`, 'info');

    for (let i = 0; i < initialTasks.length; i++) {
      if (cancelBatchRef.current) break;

      setTasks((prev) =>
        prev.map((t, idx) =>
          idx === i ? { ...t, status: 'processing', progress: 15, progressText: 'Đang gửi ảnh mẫu...' } : t
        )
      );

      const currentMainImg = initialTasks[i].mainImage;
      const combinedRefImages = [currentMainImg, ...extraRefImages];

      let promptToSend = batchEditPrompt.trim();
      if (extraRefImages.length > 0) {
        promptToSend = `[Chỉnh sửa Ảnh #1]: ${promptToSend}. (Lưu ý quan trọng: Ảnh #1 là ảnh mẫu chính cần giữ nguyên kết cấu; Ảnh #2 là logo/tài nguyên mới cần thay thế hoặc chèn vào).`;
      } else {
        promptToSend = `[Chỉnh sửa Ảnh #1]: ${promptToSend}. Giữ nguyên cấu trúc ấn phẩm.`;
      }

      // Khổ in: nếu chọn 'default' thì giữ nguyên tỉ lệ gốc của ảnh mẫu (1:1 / portrait)
      const mappedAspectRatio = selectedPresetId === 'default' ? '1:1' : '1:1';
      const styleToSend = selectedStyleId === 'none' || selectedStyleId === 'default' ? 'none' : selectedStyleId;

      try {
        const resData = await createRenderJob({
          prompt: promptToSend,
          aspectRatio: mappedAspectRatio,
          style: styleToSend,
          referenceImages: combinedRefImages,
          preserveSurroundings: true
        });

        const jobId = resData.id || resData.job_id;
        if (!jobId) throw new Error('Không nhận được Job ID từ máy chủ.');

        setTasks((prev) =>
          prev.map((t, idx) =>
            idx === i ? { ...t, progress: 30, progressText: 'Đang render AI trên GPU...' } : t
          )
        );

        let completed = false;
        let attempts = 0;
        const maxAttempts = 50;

        while (!completed && attempts < maxAttempts && !cancelBatchRef.current) {
          attempts++;
          await new Promise((r) => setTimeout(r, 2000));

          const pollRes = await fetch(`/api/jobs/${jobId}`);
          if (pollRes.ok) {
            const pollData = await pollRes.json();
            if (pollData.status === 'completed') {
              completed = true;
              const fileUrl = pollData.result_image_url || (pollData.filename ? `/images/${pollData.filename}` : '');
              
              setTasks((prev) =>
                prev.map((t, idx) =>
                  idx === i
                    ? {
                        ...t,
                        status: 'completed',
                        progress: 100,
                        progressText: 'Hoàn thành ✓',
                        resultUrl: fileUrl
                      }
                    : t
                )
              );

              if (showToast) showToast(`✓ Đã sửa xong Ảnh #${i + 1}!`, 'success');
            } else if (pollData.status === 'failed') {
              throw new Error(pollData.error || 'Máy chủ xử lý thất bại');
            } else {
              setTasks((prev) =>
                prev.map((t, idx) =>
                  idx === i
                    ? {
                        ...t,
                        progress: pollData.progress || Math.min(85, 30 + attempts * 2),
                        progressText: `Đang render... (${attempts * 2}s)`
                      }
                    : t
                )
              );
            }
          }
        }

        if (!completed && !cancelBatchRef.current) {
          throw new Error('Quá thời gian chờ phản hồi từ máy chủ (Timeout)');
        }
      } catch (err) {
        console.error(`Lỗi sửa ảnh #${i + 1}:`, err);
        setTasks((prev) =>
          prev.map((t, idx) =>
            idx === i
              ? {
                  ...t,
                  status: 'failed',
                  progressText: 'Lỗi',
                  error: err.message || 'Lỗi không xác định'
                }
              : t
          )
        );
        if (showToast) showToast(`✖ Ảnh #${i + 1} gặp lỗi: ${err.message}`, 'error');
      }
    }

    setIsProcessing(false);
    if (!cancelBatchRef.current) {
      if (showToast) showToast('🎉 Đã hoàn tất đợt sửa ảnh mẫu hàng loạt!', 'success');
    }
  };

  // Thử lại 1 ảnh
  const retrySingleTask = async (taskIndex) => {
    if (isProcessing) {
      if (showToast) showToast('Vui lòng đợi đợt chạy hiện tại hoàn tất trước!', 'warning');
      return;
    }

    const taskToRetry = tasks[taskIndex];
    if (!taskToRetry) return;

    setTasks((prev) =>
      prev.map((t, idx) =>
        idx === taskIndex
          ? { ...t, status: 'processing', progress: 15, progressText: 'Đang thử lại...', error: null }
          : t
      )
    );

    const combinedRefImages = [taskToRetry.mainImage, ...extraRefImages];
    let promptToSend = batchEditPrompt.trim();
    if (extraRefImages.length > 0) {
      promptToSend = `[Chỉnh sửa Ảnh #1]: ${promptToSend}. (Ảnh #1 là ảnh mẫu; Ảnh #2 là logo/tài nguyên tham chiếu).`;
    }

    try {
      const resData = await createRenderJob({
        prompt: promptToSend,
        aspectRatio: '1:1',
        style: selectedStyleId === 'default' ? 'none' : selectedStyleId,
        referenceImages: combinedRefImages,
        preserveSurroundings: true
      });

      const jobId = resData.id || resData.job_id;
      let completed = false;
      let attempts = 0;

      while (!completed && attempts < 50) {
        attempts++;
        await new Promise((r) => setTimeout(r, 2000));
        const pollRes = await fetch(`/api/jobs/${jobId}`);
        if (pollRes.ok) {
          const pollData = await pollRes.json();
          if (pollData.status === 'completed') {
            completed = true;
            const fileUrl = pollData.result_image_url || (pollData.filename ? `/images/${pollData.filename}` : '');
            setTasks((prev) =>
              prev.map((t, idx) =>
                idx === taskIndex
                  ? { ...t, status: 'completed', progress: 100, progressText: 'Hoàn thành ✓', resultUrl: fileUrl }
                  : t
              )
            );
            if (showToast) showToast(`✓ Đã sửa xong Ảnh #${taskIndex + 1}!`, 'success');
          } else if (pollData.status === 'failed') {
            throw new Error(pollData.error || 'Thất bại');
          }
        }
      }
    } catch (err) {
      setTasks((prev) =>
        prev.map((t, idx) =>
          idx === taskIndex ? { ...t, status: 'failed', error: err.message } : t
        )
      );
      if (showToast) showToast(`✖ Thử lại thất bại: ${err.message}`, 'error');
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const overallPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '90px' }}>
      
      {/* ── 3 TABS Ở MỤC HÀNG LOẠT: ẢNH MẪU / LOGO MỚI / PROMPT (THEO ĐÚNG YÊU CẦU CỦA BẠN) ── */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          padding: '4px',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }}
      >
        {/* Tab 1: Ảnh Mẫu */}
        <button
          type="button"
          onClick={() => setActiveTab('images')}
          style={{
            flex: 1,
            padding: '8px 8px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeTab === 'images' ? '#2563eb' : 'transparent',
            color: activeTab === 'images' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'images' ? '0 4px 12px rgba(37, 99, 235, 0.28)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}
        >
          <i className="bi bi-images"></i>
          <span>Ảnh Mẫu</span>
          {mainImages.length > 0 && (
            <span
              style={{
                fontSize: '0.62rem',
                padding: '1px 5px',
                borderRadius: '9999px',
                background: activeTab === 'images' ? '#ffffff' : '#dbeafe',
                color: activeTab === 'images' ? '#2563eb' : '#1d4ed8',
                fontWeight: 800
              }}
            >
              {mainImages.length}
            </span>
          )}
        </button>

        {/* Tab 2: Logo Mới */}
        <button
          type="button"
          onClick={() => setActiveTab('logo')}
          style={{
            flex: 1,
            padding: '8px 8px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeTab === 'logo' ? '#2563eb' : 'transparent',
            color: activeTab === 'logo' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'logo' ? '0 4px 12px rgba(37, 99, 235, 0.28)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}
        >
          <i className="bi bi-shield-check"></i>
          <span>Logo Mới</span>
          {extraRefImages.length > 0 && (
            <span
              style={{
                fontSize: '0.62rem',
                padding: '1px 5px',
                borderRadius: '9999px',
                background: activeTab === 'logo' ? '#ffffff' : '#dcfce7',
                color: activeTab === 'logo' ? '#2563eb' : '#15803d',
                fontWeight: 800
              }}
            >
              {extraRefImages.length}
            </span>
          )}
        </button>

        {/* Tab 3: Prompt */}
        <button
          type="button"
          onClick={() => setActiveTab('prompt')}
          style={{
            flex: 1,
            padding: '8px 8px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeTab === 'prompt' ? '#2563eb' : 'transparent',
            color: activeTab === 'prompt' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'prompt' ? '0 4px 12px rgba(37, 99, 235, 0.28)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}
        >
          <i className="bi bi-chat-left-text-fill"></i>
          <span>Prompt</span>
        </button>
      </div>

      {/* ── NỘI DUNG THEO TỪNG TAB ── */}

      {/* TAB 1: ẢNH MẪU */}
      {activeTab === 'images' && (
        <div className="liquid-card">
          <div className="liquid-card-glow"></div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                Danh Sách Ảnh Mẫu Cần Sửa ({mainImages.length} ảnh)
              </span>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Nạp bộ poster / ảnh sản phẩm cần sửa (Kem ủ trắng, sữa tắm, dầu gội...)
              </div>
            </div>

            {mainImages.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllMain}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Xóa tất cả
              </button>
            )}
          </div>

          <input
            ref={mainFileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                addMainImageFiles(e.target.files);
                e.target.value = '';
              }
            }}
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => mainFileInputRef.current?.click()}
              className="liquid-pill-btn"
              style={{
                flex: 1,
                padding: '9px 12px',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: '1.5px dashed rgba(59, 130, 246, 0.45)',
                background: 'rgba(239, 246, 255, 0.8)',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="bi bi-cloud-arrow-up" style={{ fontSize: '1rem' }}></i>
              <span>Up Ảnh Mẫu (Chọn nhiều file)</span>
            </button>

            <Tooltip text="Dán ảnh từ clipboard (Ctrl + V)">
              <button
                type="button"
                onClick={handlePasteMain}
                className="liquid-pill-btn"
                style={{
                  padding: '9px 14px',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: '1.5px solid rgba(59, 130, 246, 0.35)',
                  background: '#ffffff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="bi bi-clipboard-plus" style={{ fontSize: '1rem' }}></i>
                <span>Paste (Ctrl+V)</span>
              </button>
            </Tooltip>
          </div>

          {mainImages.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '16px',
                textAlign: 'center',
                color: '#64748b',
                background: '#f8fafc'
              }}
            >
              <i className="bi bi-images" style={{ fontSize: '1.6rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}></i>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Chưa có ảnh mẫu nào</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                Bấm nút trên hoặc nhấn Ctrl+V để tải hàng loạt ảnh mẫu
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
              {mainImages.map((img, idx) => (
                <div
                  key={img.id}
                  style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1.5px solid #bfdbfe',
                    background: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <div
                    style={{ position: 'relative', width: '100%', paddingTop: '100%', cursor: 'pointer', background: '#f1f5f9' }}
                    onClick={() => setCropTarget({ id: img.id, url: img.url, name: img.name, type: 'main' })}
                    title="Bấm để Cắt & Xoay / Chỉnh sửa ảnh mẫu (Crop / Transform)"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      top: '5px',
                      left: '5px',
                      background: 'rgba(37, 99, 235, 0.9)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '9999px'
                    }}
                  >
                    #{idx + 1}
                  </div>

                  <div style={{ position: 'absolute', top: '5px', right: '5px', display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCropTarget({ id: img.id, url: img.url, name: img.name, type: 'main' });
                      }}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(37, 99, 235, 0.9)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Cắt & Xoay ảnh mẫu này"
                    >
                      <i className="bi bi-crop"></i>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveMainImage(img.id)}
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Gỡ ảnh này"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>

                  <div style={{ padding: '4px 6px', fontSize: '0.62rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {img.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LOGO MỚI */}
      {activeTab === 'logo' && (
        <div className="liquid-card">
          <div className="liquid-card-glow"></div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                Logo Mới & Tài Nguyên Thay Thế (Dùng chung cho mọi ảnh)
              </span>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Logo mới hoặc mã QR này sẽ được AI tự động đưa vào từng ảnh mẫu
              </div>
            </div>

            {extraRefImages.length > 0 && (
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a' }}>
                {extraRefImages.length} tài nguyên
              </span>
            )}
          </div>

          <input
            ref={extraFileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                addExtraRefImageFiles(e.target.files);
                e.target.value = '';
              }
            }}
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button
              type="button"
              onClick={() => extraFileInputRef.current?.click()}
              className="liquid-pill-btn"
              style={{
                flex: 1,
                padding: '8px 12px',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1.5px dashed rgba(16, 185, 129, 0.45)',
                background: 'rgba(240, 253, 244, 0.8)',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="bi bi-plus-circle" style={{ fontSize: '0.9rem' }}></i>
              <span>Thêm Logo / Ảnh Phụ</span>
            </button>

            <button
              type="button"
              onClick={handlePasteExtra}
              className="liquid-pill-btn"
              style={{
                padding: '8px 12px',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                background: '#ffffff',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="bi bi-clipboard-plus" style={{ fontSize: '0.9rem' }}></i>
              <span>Paste Logo</span>
            </button>
          </div>

          {extraRefImages.length === 0 ? (
            <div
              style={{
                padding: '20px 16px',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '14px',
                textAlign: 'center',
                color: '#64748b',
                background: '#f8fafc'
              }}
            >
              <i className="bi bi-shield-plus" style={{ fontSize: '1.5rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}></i>
              <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Chưa có Logo mới</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                Nếu cần thay logo, hãy tải lên logo thương hiệu mới tại đây
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {extraRefImages.map((img, idx) => (
                <div
                  key={img.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    background: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #d1fae5'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid #10b981',
                        cursor: 'pointer'
                      }}
                      onClick={() => setCropTarget({ id: img.id, url: img.url, name: img.name, type: 'extra' })}
                      title="Bấm để Cắt & Xoay / Chỉnh sửa logo (Crop / Transform)"
                    />
                    <div>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          background: '#dcfce7',
                          color: '#15803d'
                        }}
                      >
                        Tài nguyên #{idx + 1}: {img.label}
                      </span>
                      <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                        {img.name} ({img.sizeMb} MB)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setCropTarget({ id: img.id, url: img.url, name: img.name, type: 'extra' })}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#e0f2fe',
                        border: 'none',
                        color: '#0284c7',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Cắt & Xoay logo này"
                    >
                      <i className="bi bi-crop"></i>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveExtraImage(img.id)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#fee2e2',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Gỡ ảnh này"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROMPT */}
      {activeTab === 'prompt' && (
        <div className="liquid-card">
          <div className="liquid-card-glow"></div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                Lệnh Chỉnh Sửa Áp Dụng Cho Từng Ảnh Mẫu
              </span>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Mô tả chi tiết việc thay đổi logo, giữ nguyên sản phẩm và bố cục
              </div>
            </div>
          </div>

          <textarea
            rows={4}
            value={batchEditPrompt}
            onChange={(e) => setBatchEditPrompt(e.target.value)}
            className="liquid-pill-input"
            placeholder="Nhập yêu cầu sửa ảnh hàng loạt..."
            style={{ width: '100%', borderRadius: '16px', resize: 'none', padding: '10px 12px', marginBottom: '8px', fontSize: '0.82rem' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.64rem', fontWeight: 700, color: '#64748b' }}>Gợi ý nhanh:</span>
            <button
              type="button"
              onClick={() =>
                setQuickPrompt('Giữ nguyên toàn bộ bố cục, hình ảnh sản phẩm, người mẫu và thông tin chữ của ảnh mẫu. Thay thế logo cũ bằng Logo mới từ ảnh tham chiếu.')
              }
              style={{ fontSize: '0.62rem', padding: '3px 8px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#2563eb', cursor: 'pointer' }}
            >
              ⚡ Thay Logo cũ bằng Logo mới
            </button>

            <button
              type="button"
              onClick={() =>
                setQuickPrompt('Chèn Logo mới vào góc trên cùng bên phải của ảnh mẫu một cách tự nhiên, giữ nguyên toàn bộ nội dung sản phẩm.')
              }
              style={{ fontSize: '0.62rem', padding: '3px 8px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#2563eb', cursor: 'pointer' }}
            >
              ⚡ Chèn Logo vào góc trên
            </button>

            <button
              type="button"
              onClick={() =>
                setQuickPrompt('Làm mới và nâng cấp độ phân giải, giữ nguyên bố cục chữ và người mẫu, thay đổi chi tiết sản phẩm theo phong cách hiện đại.')
              }
              style={{ fontSize: '0.62rem', padding: '3px 8px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#2563eb', cursor: 'pointer' }}
            >
              ⚡ Nâng cấp sắc nét & giữ bố cục
            </button>
          </div>
        </div>
      )}

      {/* ── BÊN DƯỚI: 2 DROPDOWN KHỔ IN VÀ PHONG CÁCH (CÓ THÊM MỤC MẶC ĐỊNH THEO YÊU CẦU CỦA BẠN) ── */}
      <div className="liquid-card" style={{ padding: '14px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
          ⚙️ Cấu Hình Chung Cho Mọi Ảnh Trong Đợt Sửa
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          
          {/* Dropdown 1: Khổ in (Có mục MẶC ĐỊNH) */}
          <Tooltip text="Khổ ấn phẩm áp dụng cho toàn bộ danh sách ảnh mẫu">
            <div style={{ position: 'relative', width: '100%' }}>
              <select
                value={selectedPresetId}
                onChange={(e) => {
                  setSelectedPresetId(e.target.value);
                  localStorage.setItem('mzpic_batch_preset_id', e.target.value);
                }}
                className="liquid-pill-input"
                style={{
                  width: '100%',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '9px 32px 9px 12px',
                  borderRadius: '16px',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {/* MỤC MẶC ĐỊNH THEO YÊU CẦU CỦA BẠN */}
                <option value="default">
                  ★ Khổ in: Mặc định (Giữ nguyên kích thước & tỉ lệ gốc của ảnh mẫu)
                </option>
                {DESIGN_PRESETS.flatMap((c) => c.items).map((item) => (
                  <option key={item.id} value={item.id}>
                    Khổ in: {item.name} ({item.width} × {item.height} {item.unit})
                  </option>
                ))}
              </select>
              <i
                className="bi bi-chevron-down"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b',
                  fontSize: '0.72rem'
                }}
              ></i>
            </div>
          </Tooltip>

          {/* Dropdown 2: Phong cách (Có mục MẶC ĐỊNH) */}
          <Tooltip text="Phong cách gia công in ấn cho toàn bộ ảnh mẫu">
            <div style={{ position: 'relative', width: '100%' }}>
              <select
                value={selectedStyleId}
                onChange={(e) => {
                  setSelectedStyleId(e.target.value);
                  localStorage.setItem('mzpic_batch_style_id', e.target.value);
                }}
                className="liquid-pill-input"
                style={{
                  width: '100%',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '9px 32px 9px 12px',
                  borderRadius: '16px',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {/* MỤC MẶC ĐỊNH THEO YÊU CẦU CỦA BẠN */}
                <option value="none">
                  ★ Phong cách: Mặc định (Tự nhiên / Chuẩn in thực tế)
                </option>
                {DESIGN_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    Phong cách: {s.name}
                  </option>
                ))}
              </select>
              <i
                className="bi bi-chevron-down"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b',
                  fontSize: '0.72rem'
                }}
              ></i>
            </div>
          </Tooltip>
        </div>

        {/* Nút Bắt Đầu Sửa Lần Lượt */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-liquid-primary"
            onClick={startSequentialBatch}
            disabled={isProcessing || mainImages.length === 0}
            style={{ flex: 1, padding: '12px 16px' }}
          >
            {isProcessing ? (
              <>
                <i className="bi bi-arrow-repeat spin"></i>
                <span>Đang sửa lần lượt ({completedCount}/{mainImages.length})...</span>
              </>
            ) : (
              <>
                <i className="bi bi-play-fill" style={{ fontSize: '1.2rem' }}></i>
                <span>Bắt Đầu Sửa Lần Lượt ({mainImages.length} Ảnh Mẫu)</span>
              </>
            )}
          </button>

          {isProcessing && (
            <button
              type="button"
              onClick={handleCancelBatch}
              className="liquid-pill-btn"
              style={{
                padding: '0 16px',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '0.78rem'
              }}
            >
              <i className="bi bi-stop-circle"></i> Dừng
            </button>
          )}
        </div>
      </div>

      {/* ── BẢNG THEO DÕI TIẾN ĐỘ TỪNG ẢNH & ICON TẢI VỀ ── */}
      {tasks.length > 0 && (
        <div className="liquid-card" style={{ padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                Tiến Độ Sửa Từng Ảnh ({completedCount}/{tasks.length} Hoàn Thành)
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                Xử lý lần lượt từng ảnh mẫu qua GPU để đảm bảo chất lượng sắc nét.
              </div>
            </div>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleDownloadAllCompleted}
                className="liquid-pill-btn active"
                style={{
                  fontSize: '0.72rem',
                  padding: '6px 12px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                }}
              >
                <i className="bi bi-cloud-arrow-down-fill"></i>
                <span>Tải Về Tất Cả ({completedCount})</span>
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden', marginBottom: '14px' }}>
            <div
              style={{
                width: `${overallPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #2563eb, #10b981)',
                transition: 'width 0.4s ease'
              }}
            ></div>
          </div>

          {/* Danh sách Task từng ảnh */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.map((task, idx) => (
              <div
                key={task.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '16px',
                  background:
                    task.status === 'completed'
                      ? '#f0fdf4'
                      : task.status === 'processing'
                      ? '#eff6ff'
                      : task.status === 'failed'
                      ? '#fef2f2'
                      : '#ffffff',
                  border:
                    task.status === 'completed'
                      ? '1.5px solid #86efac'
                      : task.status === 'processing'
                      ? '1.5px solid #93c5fd'
                      : task.status === 'failed'
                      ? '1.5px solid #fca5a5'
                      : '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                {/* Ảnh mẫu gốc */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      position: 'relative',
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      cursor: 'zoom-in',
                      border: '1px solid #cbd5e1'
                    }}
                    onClick={() => onOpenLightbox && onOpenLightbox(task.mainImage.url, `Ảnh Mẫu #${task.index}: ${task.mainImage.name}`)}
                    title="Bấm để xem ảnh gốc (Zoom / Pan)"
                  >
                    <img
                      src={task.mainImage.url}
                      alt={task.mainImage.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        fontSize: '0.55rem',
                        fontWeight: 800,
                        textAlign: 'center',
                        padding: '1px 0'
                      }}
                    >
                      #{task.index}
                    </div>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Ảnh mẫu #{task.index}: {task.mainImage.name}
                    </div>

                    <div style={{ marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {task.status === 'queued' && (
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="bi bi-clock"></i> Chờ đến lượt...
                        </span>
                      )}

                      {task.status === 'processing' && (
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', background: '#dbeafe', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="bi bi-arrow-repeat spin"></i> {task.progressText || 'Đang xử lý...'}
                        </span>
                      )}

                      {task.status === 'completed' && (
                        <span style={{ fontSize: '0.64rem', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', background: '#dcfce7', color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="bi bi-check-circle-fill text-green-600"></i> ✓ ĐÃ XONG
                        </span>
                      )}

                      {task.status === 'failed' && (
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: '#fee2e2', color: '#b91c1c', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <i className="bi bi-exclamation-triangle-fill"></i> Lỗi: {task.error}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ color: '#94a3b8', fontSize: '0.9rem', flexShrink: 0 }}>
                  <i className="bi bi-arrow-right"></i>
                </div>

                {/* Ảnh kết quả & Icon Tải Về */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {task.status === 'completed' && task.resultUrl ? (
                    <>
                      <div
                        style={{
                          position: 'relative',
                          width: '46px',
                          height: '46px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          cursor: 'zoom-in',
                          border: '1.5px solid #10b981',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)'
                        }}
                        onClick={() => onOpenLightbox && onOpenLightbox(task.resultUrl, `Kết Quả Đã Sửa #${task.index}`)}
                        title="Bấm để xem ảnh kết quả phóng to (Zoom / Pan)"
                      >
                        <img
                          src={task.resultUrl}
                          alt="Kết quả"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: '#10b981',
                            color: '#ffffff',
                            borderRadius: '50%',
                            width: '14px',
                            height: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.55rem'
                          }}
                        >
                          <i className="bi bi-check"></i>
                        </div>
                      </div>

                      {/* ICON TẢI VỀ NỔI BẬT */}
                      <Tooltip text="Tải ảnh này về máy (Mở tab mới)">
                        <button
                          type="button"
                          onClick={(e) => handleDownloadTask(task, e)}
                          className="liquid-pill-btn active"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
                          }}
                        >
                          <i className="bi bi-download" style={{ fontSize: '0.85rem' }}></i>
                          <span>Tải về</span>
                        </button>
                      </Tooltip>

                      <Tooltip text="Mở trong Studio">
                        <button
                          type="button"
                          onClick={() => onOpenInStudio && onOpenInStudio(task.resultUrl, batchEditPrompt)}
                          className="liquid-pill-btn"
                          style={{ padding: '6px 8px', fontSize: '0.7rem', color: '#2563eb' }}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      </Tooltip>
                    </>
                  ) : task.status === 'processing' ? (
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '10px',
                        background: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2563eb',
                        fontSize: '1.2rem'
                      }}
                    >
                      <i className="bi bi-arrow-repeat spin"></i>
                    </div>
                  ) : task.status === 'failed' ? (
                    <button
                      type="button"
                      onClick={() => retrySingleTask(idx)}
                      className="liquid-pill-btn"
                      style={{ fontSize: '0.68rem', padding: '4px 8px', color: '#dc2626', border: '1px solid #fca5a5' }}
                    >
                      <i className="bi bi-arrow-clockwise"></i> Thử lại
                    </button>
                  ) : (
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '10px',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontSize: '1rem'
                      }}
                      title="Chưa đến lượt"
                    >
                      <i className="bi bi-hourglass-split"></i>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crop / Rotate Modal for Batch Images & Logos */}
      {cropTarget && (
        <CropRotateModal
          isOpen={!!cropTarget}
          imageUrl={cropTarget.url}
          imageName={cropTarget.name}
          onClose={() => setCropTarget(null)}
          onApply={handleApplyBatchCrop}
        />
      )}
    </div>
  );
}
