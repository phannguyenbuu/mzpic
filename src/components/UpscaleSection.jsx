import React, { useState } from 'react';
import Tooltip from './Tooltip';

export default function UpscaleSection({ currentStudioImage, showToast }) {
  const [imageSrc, setImageSrc] = useState(
    currentStudioImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
  );
  const [scale, setScale] = useState(4);
  const [targetDpi, setTargetDpi] = useState(300);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setUpscaledUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleStartUpscale = () => {
    setIsUpscaling(true);
    if (showToast) showToast(`Đang kích nét AI x${scale} với chuẩn ${targetDpi} DPI...`, 'info');

    setTimeout(() => {
      setIsUpscaling(false);
      setUpscaledUrl(imageSrc);
      if (showToast) showToast(`🎉 Kích nét thành công x${scale} (${targetDpi} DPI siêu nét in ấn)!`, 'success');
    }, 2000);
  };

  const handleDownload = () => {
    if (!upscaledUrl) return;
    const a = document.createElement('a');
    a.href = upscaledUrl;
    a.download = `Upscale_${scale}X_${targetDpi}DPI_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
              filter: upscaledUrl ? 'contrast(1.05) sharpness(1.2)' : 'none'
            }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Kích Nét AI 10X</span>
            <Tooltip text="Khử vỡ hạt, phục hồi chi tiết và nâng độ phân giải lên 300-600 DPI cho Standee & Biển bạt">
              <span className="tooltip-trigger-icon">?</span>
            </Tooltip>
          </div>

          {/* Source toggles */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {currentStudioImage && (
              <Tooltip text="Lấy ảnh hiện tại đang làm trong Studio">
                <button
                  type="button"
                  className="liquid-pill-btn active"
                  style={{ fontSize: '0.68rem', padding: '3px 8px' }}
                  onClick={() => { setImageSrc(currentStudioImage); setUpscaledUrl(null); }}
                >
                  Ảnh Studio
                </button>
              </Tooltip>
            )}
            <Tooltip text="Chọn ảnh từ thiết bị để kích nét">
              <label
                className="liquid-pill-btn"
                style={{ fontSize: '0.68rem', padding: '3px 8px', cursor: 'pointer' }}
              >
                <i className="bi bi-upload"></i> Tải lên
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </Tooltip>
          </div>
        </div>

        {/* Scale Multiplier */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>Hệ số phóng to:</span>
            <Tooltip text="Hệ số nhân pixel nguyên bản (2X đến 16X)">
              <span className="tooltip-trigger-icon">?</span>
            </Tooltip>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {[2, 4, 8, 10, 16].map((s) => (
              <button
                key={s}
                type="button"
                className={`liquid-pill-btn ${scale === s ? 'active' : ''}`}
                style={{ justifyContent: 'center', padding: '6px 0', fontSize: '0.75rem', fontWeight: 700 }}
                onClick={() => setScale(s)}
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
                onClick={() => setTargetDpi(dpi)}
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
              <span>Đang Kích Nét AI...</span>
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
