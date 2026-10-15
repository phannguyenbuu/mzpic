import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';
import { extractImageFromPasteEvent, readImageFromClipboard } from '../utils/clipboard';
import { requestAiUpscale, downloadFile } from '../utils/upscale';

export default function UpscaleSection({ currentStudioImage, showToast, onOpenLightbox }) {
  const [imageSrc, setImageSrc] = useState(
    currentStudioImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
  );
  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem('mzpic_upscale_scale');
    return saved ? parseInt(saved, 10) : 4;
  });
  const [targetDpi, setTargetDpi] = useState(() => {
    const saved = localStorage.getItem('mzpic_upscale_target_dpi');
    return saved ? parseInt(saved, 10) : 300;
  });
  const [modelId, setModelId] = useState('digital-art-4x');
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState('');
  const [upscaledUrl, setUpscaledUrl] = useState(null);
  const [jobMeta, setJobMeta] = useState(null);

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setUpscaledUrl(null);
      setJobMeta(null);
      if (showToast) showToast(`Đã nhận ảnh: ${file.name || 'Pasted-Image.png'}`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    e.target.value = '';
  };

  const handlePasteClick = async () => {
    try {
      const file = await readImageFromClipboard();
      if (file) {
        processImageFile(file);
      } else {
        if (showToast) showToast('Không tìm thấy hình ảnh trong Clipboard! Hãy copy ảnh rồi bấm Paste.', 'error');
        else alert('Không tìm thấy hình ảnh trong bộ nhớ tạm! Hãy chụp màn hình hoặc copy ảnh rồi bấm Paste.');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Không thể dán ảnh từ Clipboard. Hãy bấm phím Ctrl + V!', 'error');
      else alert(err.message || 'Không thể dán ảnh từ Clipboard. Hãy bấm phím Ctrl + V!');
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      const file = extractImageFromPasteEvent(e);
      if (file) {
        e.preventDefault();
        processImageFile(file);
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const handleStartUpscale = async () => {
    if (!imageSrc) {
      if (showToast) showToast('Chưa có nguồn ảnh để kích nét AI!', 'warning');
      return;
    }
    setIsUpscaling(true);
    setProgress(5);
    setStepText('Đang gửi ảnh lên máy chủ GPU Kích Nét AI (genai.toolxprint)...');
    if (showToast) showToast(`🚀 Đang kích nét x${scale} (${targetDpi} DPI) bằng GPU GTX 1080 Ti...`, 'info');

    try {
      const upscaled = await requestAiUpscale(imageSrc, {
        scale,
        modelId,
        printDpi: targetDpi,
        onProgress: ({ progress: p, current_step }) => {
          setProgress(p);
          setStepText(current_step);
        }
      });

      const finalUrl = upscaled.downloadUrl || upscaled.url;
      setUpscaledUrl(finalUrl);
      setJobMeta({
        targetDimensions: upscaled.targetDimensions,
        fileSizeMb: upscaled.fileSizeMb,
        durationSeconds: upscaled.durationSeconds
      });
      setIsUpscaling(false);
      setProgress(100);
      setStepText('Hoàn tất!');
      if (showToast) showToast(`🎉 Kích nét AI thành công x${scale} (${upscaled.targetDimensions || targetDpi + ' DPI'})!`, 'success');
    } catch (err) {
      setIsUpscaling(false);
      setProgress(0);
      setStepText('');
      if (showToast) showToast(`❌ Lỗi kích nét AI: ${err.message}`, 'error');
    }
  };

  const handleDownload = () => {
    if (!upscaledUrl) return;
    downloadFile(upscaledUrl, `KichNet_AI_${scale}X_${targetDpi}DPI_${Date.now()}.png`);
    if (showToast) showToast('✅ Đã tải file ảnh kích nét siêu phân giải!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Preview Stage */}
      <div className="liquid-card" style={{ padding: '12px' }}>
        <div className="liquid-card-glow"></div>
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '260px',
            maxHeight: '340px',
            borderRadius: '22px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
          }}
        >
          <img
            src={upscaledUrl || imageSrc}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '340px',
              objectFit: 'contain',
              borderRadius: '16px',
              cursor: 'zoom-in'
            }}
            onClick={() => onOpenLightbox && onOpenLightbox(upscaledUrl || imageSrc, upscaledUrl ? `Ảnh Kích Nét Siêu Phân Giải (${scale}X - ${targetDpi} DPI)` : 'Ảnh Gốc Cần Kích Nét')}
            title="Bấm để xem ảnh gốc & phóng to (Zoom / Pan / Tải về)"
          />

          {/* Floating Badges */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
            <Tooltip text="Chuẩn phân giải in ấn cao cấp">
              <span
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '9999px'
                }}
              >
                {targetDpi} DPI
              </span>
            </Tooltip>
            <Tooltip text="Độ phóng đại siêu phân giải">
              <span
                style={{
                  background: 'rgba(15, 23, 42, 0.72)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '9999px'
                }}
              >
                {scale}X AI
              </span>
            </Tooltip>
            {upscaledUrl && (
              <span
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  boxShadow: '0 2px 6px rgba(236, 72, 153, 0.4)'
                }}
              >
                ⚡ GPU GTX 1080 Ti
              </span>
            )}
          </div>

          {/* Dimension badge if available */}
          {jobMeta?.targetDimensions && (
            <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
              <span
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {jobMeta.targetDimensions} px • {jobMeta.fileSizeMb}
              </span>
            </div>
          )}

          {/* Action on image */}
          {upscaledUrl && (
            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
              <Tooltip text="Tải ảnh gốc đã kích nét siêu phân giải">
                <button
                  type="button"
                  onClick={handleDownload}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#ec4899',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(236, 72, 153, 0.4)'
                  }}
                >
                  <i className="bi bi-download" style={{ fontSize: '0.85rem' }}></i>
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="liquid-card" style={{ padding: '16px' }}>
        <div className="liquid-card-glow"></div>

        {/* Section Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="bi bi-gpu-card" style={{ color: '#ec4899', fontSize: '1.05rem' }}></i>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Kích Nét GPU AI (NVIDIA GTX 1080 Ti)</span>
          </div>
          {currentStudioImage && (
            <button
              type="button"
              className="liquid-pill-btn"
              style={{ fontSize: '0.7rem', padding: '4px 8px' }}
              onClick={() => { setImageSrc(currentStudioImage); setUpscaledUrl(null); setJobMeta(null); }}
            >
              Lấy ảnh Studio
            </button>
          )}
        </div>

        {/* Upload & Paste Image Toolbar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <Tooltip text="Chọn ảnh từ thiết bị để kích nét">
            <label
              style={{
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.76rem',
                fontWeight: 700,
                border: '1.5px dashed rgba(236, 72, 153, 0.45)',
                background: 'rgba(255, 255, 255, 0.8)',
                color: '#db2777',
                cursor: 'pointer',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="bi bi-upload" style={{ fontSize: '0.95rem' }}></i>
              <span>Chọn ảnh</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>
          </Tooltip>

          <Tooltip text="Dán ảnh trực tiếp từ bộ nhớ tạm (Ctrl + V)">
            <button
              type="button"
              style={{
                height: '38px',
                borderRadius: '12px',
                justifyContent: 'center',
                fontSize: '0.76rem',
                fontWeight: 700,
                border: '1.5px solid rgba(59, 130, 246, 0.35)',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#2563eb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
              onClick={handlePasteClick}
            >
              <i className="bi bi-clipboard-plus" style={{ fontSize: '0.95rem' }}></i>
              <span>Paste (Ctrl+V)</span>
            </button>
          </Tooltip>
        </div>

        {/* AI Model Selector */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Mô hình AI:</span>
            <Tooltip text="Mô hình tối ưu cho từng loại ấn phẩm">
              <span className="tooltip-trigger-icon">?</span>
            </Tooltip>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {[
              { id: 'digital-art-4x', label: 'Báo Tường / Đồ họa', hint: 'In ấn / Poster' },
              { id: 'upscayl-standard-4x', label: 'Chuẩn', hint: 'Đa năng' },
              { id: 'ultrasharp-4x', label: 'UltraSharp', hint: 'Viền chữ sắc nét' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                className={`liquid-pill-btn ${modelId === m.id ? 'active' : ''}`}
                style={{
                  flexDirection: 'column',
                  padding: '6px 4px',
                  height: 'auto',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  gap: '2px'
                }}
                onClick={() => setModelId(m.id)}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 800 }}>{m.label}</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>{m.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scale Multiplier */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Hệ số phóng to:</span>
            <Tooltip text="Hệ số nhân pixel nguyên bản (2X, 4X, 8X)">
              <span className="tooltip-trigger-icon">?</span>
            </Tooltip>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[2, 4, 8].map((s) => (
              <button
                key={s}
                type="button"
                className={`liquid-pill-btn ${scale === s ? 'active' : ''}`}
                style={{
                  height: '38px',
                  justifyContent: 'center',
                  padding: '6px 0',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  borderRadius: '14px'
                }}
                onClick={() => {
                  setScale(s);
                  localStorage.setItem('mzpic_upscale_scale', s);
                }}
              >
                {s}X
              </button>
            ))}
          </div>
        </div>

        {/* Target DPI */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Độ phân giải in mục tiêu:</span>
            <Tooltip text="150 DPI cho bạt Hiflex / màn chiếu; 300 DPI cho in offset & KTS; 600 DPI cho photobook nghệ thuật">
              <span className="tooltip-trigger-icon">?</span>
            </Tooltip>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {[150, 300, 600].map((dpi) => (
              <button
                key={dpi}
                type="button"
                className={`liquid-pill-btn ${targetDpi === dpi ? 'active' : ''}`}
                style={{ justifyContent: 'center', padding: '6px 0', fontSize: '0.75rem', fontWeight: 700 }}
                onClick={() => {
                  setTargetDpi(dpi);
                  localStorage.setItem('mzpic_upscale_target_dpi', dpi);
                }}
              >
                {dpi} DPI
              </button>
            ))}
          </div>
        </div>

        {/* Live Progress Bar during upscale */}
        {isUpscaling && (
          <div style={{ marginBottom: '14px', padding: '10px 12px', background: 'rgba(236, 72, 153, 0.08)', borderRadius: '14px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px', color: '#db2777' }}>
              <span>⚡ GPU Worker Đang Kích Nét (GTX 1080 Ti)</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#fce7f3', borderRadius: '9999px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #ec4899, #8b5cf6)', borderRadius: '9999px', transition: 'width 0.4s ease' }}></div>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {stepText || 'AI đang nâng độ phân giải ảnh...'}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          className="btn-liquid-primary"
          onClick={handleStartUpscale}
          disabled={isUpscaling}
        >
          {isUpscaling ? (
            <>
              <i className="bi bi-arrow-repeat spin"></i>
              <span>GPU Đang Kích Nét ({progress}%)...</span>
            </>
          ) : (
            <>
              <i className="bi bi-stars"></i>
              <span>Bắt đầu Kích Nét AI {scale}X (GTX 1080 Ti)</span>
            </>
          )}
        </button>

        {upscaledUrl && (
          <button
            type="button"
            className="liquid-pill-btn active"
            onClick={handleDownload}
            style={{ width: '100%', marginTop: '10px', padding: '10px', justifyContent: 'center', fontWeight: 700 }}
          >
            <i className="bi bi-download"></i> Tải ảnh {scale}X ({jobMeta?.targetDimensions || `${targetDpi} DPI`})
          </button>
        )}
      </div>
    </div>
  );
}
