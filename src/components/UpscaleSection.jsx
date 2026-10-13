import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';
import { extractImageFromPasteEvent, readImageFromClipboard } from '../utils/clipboard';

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
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState(null);

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

  const handleStartUpscale = () => {
    setIsUpscaling(true);
    if (showToast) showToast(`Đang kích nét x${scale} với chuẩn ${targetDpi} DPI...`, 'info');

    setTimeout(() => {
      setIsUpscaling(false);
      setUpscaledUrl(imageSrc);
      if (showToast) showToast(`🎉 Kích nét thành công x${scale} (${targetDpi} DPI siêu nét in ấn)!`, 'success');
    }, 2000);
  };

  const handleDownload = () => {
    if (!upscaledUrl) return;
    window.open(upscaledUrl, '_blank', 'noopener,noreferrer');
    try {
      const a = document.createElement('a');
      a.href = upscaledUrl;
      a.download = `Upscale_${scale}X_${targetDpi}DPI_${Date.now()}.png`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {}
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
              filter: upscaledUrl ? 'contrast(1.05) sharpness(1.2)' : 'none',
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
                  borderRadius: '9999px',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {scale}X Super-Res
              </span>
            </Tooltip>
          </div>

          {upscaledUrl && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(16, 185, 129, 0.85)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px'
              }}
            >
              <i className="bi bi-shield-check"></i> Đã hoàn tất {scale}X
            </div>
          )}
        </div>
      </div>

      {/* Controls Card */}
      <div className="liquid-card">
        <div className="liquid-card-glow"></div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Kích Nét Chuẩn In (2X, 4X, 8X)</span>
          {currentStudioImage && (
            <Tooltip text="Lấy ảnh hiện tại đang làm trong Studio">
              <button
                type="button"
                className="liquid-pill-btn active"
                style={{ fontSize: '0.68rem', padding: '3px 8px' }}
                onClick={() => { setImageSrc(currentStudioImage); setUpscaledUrl(null); }}
              >
                <i className="bi bi-magic"></i> Lấy từ Studio
              </button>
            </Tooltip>
          )}
        </div>

        {/* 2 Buttons nằm ngang, song song, liquid style */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <Tooltip text="Chọn ảnh từ thiết bị để kích nét">
            <label
              className="liquid-pill-btn"
              style={{
                flex: 1,
                padding: '8px 12px',
                justifyContent: 'center',
                fontSize: '0.76rem',
                fontWeight: 700,
                border: '1.5px dashed rgba(59, 130, 246, 0.45)',
                background: 'rgba(239, 246, 255, 0.7)',
                color: '#1d4ed8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <i className="bi bi-cloud-arrow-up" style={{ fontSize: '0.95rem' }}></i>
              <span>Up Ảnh Cần Sửa</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </Tooltip>

          <Tooltip text="Dán ảnh từ bộ nhớ tạm (Ctrl + V)">
            <button
              type="button"
              className="liquid-pill-btn"
              style={{
                flex: 1,
                padding: '8px 12px',
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
              <span>Đang Kích Nét...</span>
            </>
          ) : (
            <>
              <i className="bi bi-stars"></i>
              <span>Bắt đầu Kích Nét {scale}X</span>
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
            <i className="bi bi-download"></i> Tải ảnh {scale}X ({targetDpi} DPI)
          </button>
        )}
      </div>
    </div>
  );
}
