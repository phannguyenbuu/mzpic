import React, { useRef } from 'react';
import ReactDOM from 'react-dom';

/**
 * Liquid Theme Modal for Post-processing individual layers (Khung / Thân báo)
 */
export default function LayerPostProcessModal({
  isOpen,
  onClose,
  layer,
  onUpdateLayer,
  onReplaceLayerImage,
  onRegenerateLayer,
  onOpenLightbox,
  isGenerating = false,
  onOpenEdit,
  onOpenResize,
  onOpenColorGrading,
  onOpenMockup3D,
  onRemoveBg,
  onDownload,
  transparentBg = false
}) {
  const fileInputRef = useRef(null);

  if (!isOpen || !layer) return null;

  const currentOpacity = layer.opacity ?? (layer.id === 'body' ? 11 : 100);
  const isVisible = layer.visible !== false;
  const currentBlendMode = layer.blendMode || (layer.id === 'frame' ? 'multiply' : 'normal');

  const handleOpacityChange = (val) => {
    if (onUpdateLayer) {
      onUpdateLayer(layer.id, { opacity: val });
    }
  };

  const handleBlendModeChange = (mode) => {
    if (onUpdateLayer) {
      onUpdateLayer(layer.id, { blendMode: mode });
    }
  };

  const handleToggleVisible = () => {
    if (onUpdateLayer) {
      onUpdateLayer(layer.id, { visible: !isVisible });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onReplaceLayerImage) {
      onReplaceLayerImage(layer.id, file);
    }
    e.target.value = '';
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="liquid-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '0',
          overflow: 'hidden',
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1.5px ${layer.accentColor || '#6366f1'}33`,
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${layer.accentColor || '#6366f1'}, #4338ca)`,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                boxShadow: `0 4px 12px ${layer.accentColor || '#6366f1'}44`
              }}
            >
              <span>{layer.emoji || '🎨'}</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Hậu Kỳ Layer: {layer.shortLabel || layer.label}
                </h3>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: isVisible ? '#dcfce7' : '#fee2e2',
                    color: isVisible ? '#15803d' : '#b91c1c',
                    border: `1px solid ${isVisible ? '#86efac' : '#fca5a5'}`
                  }}
                >
                  {isVisible ? 'Đang hiện' : 'Đang ẩn'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                {layer.label || 'Tùy chỉnh độ mờ, chế độ hòa trộn và tạo lại layer'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(0, 0, 0, 0.06)',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.15s ease'
            }}
            title="Đóng (Esc)"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 1. Large Image Preview with Checkered Background */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '280px',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1.5px solid #e2e8f0',
              background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 16px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            {layer.image ? (
              <img
                src={layer.image}
                alt={layer.shortLabel}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  opacity: isVisible ? currentOpacity / 100 : 0.15,
                  mixBlendMode: currentBlendMode,
                  transition: 'opacity 0.2s ease'
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <i className="bi bi-image" style={{ fontSize: '2.5rem' }}></i>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '6px' }}>
                  Chưa có ảnh cho layer này
                </div>
              </div>
            )}

            {/* Float Controls on Preview */}
            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
              {layer.image && onOpenLightbox && (
                <button
                  type="button"
                  onClick={() => onOpenLightbox(layer.image, `Layer ${layer.shortLabel}`)}
                  className="liquid-icon-btn"
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    color: '#ffffff',
                    border: 'none',
                    width: '32px',
                    height: '32px',
                    backdropFilter: 'blur(4px)'
                  }}
                  title="Phóng to ảnh"
                >
                  <i className="bi bi-arrows-fullscreen"></i>
                </button>
              )}
            </div>

            {/* Opacity Watermark Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(4px)',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}
            >
              Độ mờ: {currentOpacity}% • Hòa trộn: {currentBlendMode}
            </div>
          </div>

          {/* 2. Opacity Slider & Quick Presets */}
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="bi bi-circle-half" style={{ color: layer.accentColor || '#6366f1', fontSize: '1rem' }}></i>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>
                  Độ trong suốt / Đậm nhạt (Opacity)
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: layer.accentColor || '#6366f1',
                  background: '#ffffff',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  border: `1.5px solid ${layer.accentColor || '#6366f1'}44`
                }}
              >
                {currentOpacity}%
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', minWidth: 0 }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, minWidth: '22px', flexShrink: 0 }}>0%</span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={currentOpacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                style={{
                  flex: 1,
                  minWidth: 0,
                  width: '100%',
                  margin: 0,
                  padding: 0,
                  accentColor: layer.accentColor || '#6366f1',
                  height: '6px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, minWidth: '32px', textAlign: 'right', flexShrink: 0 }}>100%</span>
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Chọn nhanh:</span>
              {[
                { val: 0, label: '0% (Ẩn)' },
                { val: 11, label: '11% (Chuẩn mờ nền)' },
                { val: 25, label: '25%' },
                { val: 50, label: '50%' },
                { val: 75, label: '75%' },
                { val: 90, label: '90%' },
                { val: 100, label: '100% (Đặc)' }
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleOpacityChange(val)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '3px 10px',
                    borderRadius: '8px',
                    border: currentOpacity === val ? `1.5px solid ${layer.accentColor || '#6366f1'}` : '1px solid #cbd5e1',
                    background: currentOpacity === val ? `${layer.accentColor || '#6366f1'}15` : '#ffffff',
                    color: currentOpacity === val ? layer.accentColor || '#6366f1' : '#475569',
                    fontWeight: currentOpacity === val ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Blend Mode Selector */}
          <div
            style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b' }}>
              Chế độ hòa trộn (Blend Mode)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                { mode: 'multiply', label: 'Multiply (Nhân màu - viền khung nổi bật)', desc: 'Xóa nền trắng' },
                { mode: 'normal', label: 'Normal (Bình thường)', desc: 'Tiêu chuẩn' },
                { mode: 'screen', label: 'Screen (Lọc sáng)', desc: 'Làm sáng' },
                { mode: 'overlay', label: 'Overlay (Phủ)', desc: 'Tăng tương phản' }
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleBlendModeChange(mode)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '5px 12px',
                    borderRadius: '10px',
                    border: currentBlendMode === mode ? `1.5px solid ${layer.accentColor || '#6366f1'}` : '1px solid #cbd5e1',
                    background: currentBlendMode === mode ? `${layer.accentColor || '#6366f1'}18` : '#ffffff',
                    color: currentBlendMode === mode ? layer.accentColor || '#6366f1' : '#475569',
                    fontWeight: currentBlendMode === mode ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {onRegenerateLayer && (
              <button
                type="button"
                onClick={() => onRegenerateLayer(layer.id)}
                disabled={isGenerating}
                className="liquid-pill-btn"
                style={{
                  flex: 1,
                  minWidth: '160px',
                  padding: '9px 14px',
                  justifyContent: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                <i className={`bi ${isGenerating ? 'bi-arrow-repeat spin' : 'bi-arrow-repeat'}`}></i>
                <span>Tạo lại chỉ layer {layer.shortLabel}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="liquid-pill-btn"
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '9px 14px',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: '#ffffff',
                color: '#334155',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <i className="bi bi-upload"></i>
              <span>Thay ảnh layer</span>
            </button>

            <button
              type="button"
              onClick={handleToggleVisible}
              className="liquid-pill-btn"
              style={{
                padding: '9px 14px',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: isVisible ? '#fef2f2' : '#f0fdf4',
                color: isVisible ? '#b91c1c' : '#15803d',
                border: `1.5px solid ${isVisible ? '#fecaca' : '#bbf7d0'}`,
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <i className={`bi ${isVisible ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
              <span>{isVisible ? 'Ẩn layer' : 'Hiện layer'}</span>
            </button>
          </div>

          {/* Hidden File Input for Image Replacement */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Modal Footer with Cloned Action Capsule Bar */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          {/* Primary Action Glass Capsule Bar: Cloned row of buttons */}
          <div
            style={{
              padding: '5px 8px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '18px',
              border: '1px solid rgba(226, 232, 240, 0.95)',
              boxShadow: '0 4px 16px -3px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'nowrap'
            }}
          >
            <button
              type="button"
              className="liquid-icon-btn"
              onClick={() => {
                if (onOpenEdit) onOpenEdit(layer.image);
                onClose();
              }}
              disabled={!layer.image || isGenerating}
              title="Chỉnh sửa bổ sung layer trong Studio"
              style={{ flexShrink: 0 }}
            >
              <i className="bi bi-pencil-fill"></i>
            </button>
            <button
              type="button"
              className="liquid-icon-btn"
              onClick={() => {
                if (onOpenResize) onOpenResize(layer.image);
              }}
              disabled={!layer.image || isGenerating}
              title="Chỉnh kích thước chính xác (mm, cm, px, DPI)"
              style={{ flexShrink: 0 }}
            >
              <i className="bi bi-aspect-ratio"></i>
            </button>
            <button
              type="button"
              className="liquid-icon-btn"
              onClick={() => {
                if (onOpenColorGrading) onOpenColorGrading(layer.image);
              }}
              disabled={!layer.image || isGenerating}
              title="Hậu kỳ màu HSL & Curves"
              style={{ flexShrink: 0 }}
            >
              <i className="bi bi-sliders2-vertical"></i>
            </button>
            <button
              type="button"
              className="liquid-icon-btn"
              onClick={() => {
                if (onOpenMockup3D) onOpenMockup3D(layer.image);
                onClose();
              }}
              disabled={!layer.image || isGenerating}
              title="Render Mockup 3D trong không gian thực tế"
              style={{ flexShrink: 0 }}
            >
              <i className="bi bi-box-seam-fill"></i>
            </button>
            {!transparentBg && (
              <button
                type="button"
                className="liquid-icon-btn"
                onClick={() => {
                  if (onRemoveBg) onRemoveBg(layer.image);
                }}
                disabled={!layer.image || isGenerating}
                title="Xóa phông tách nền PNG trong suốt"
                style={{ flexShrink: 0 }}
              >
                <i className="bi bi-transparency"></i>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (layer.image) {
                  const a = document.createElement('a');
                  a.href = layer.image;
                  a.download = `layer_${layer.id || 'image'}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                } else if (onDownload) {
                  onDownload();
                }
              }}
              disabled={!layer.image || isGenerating}
              className="liquid-icon-btn primary-download"
              title="Tải về layer này"
              style={{
                marginLeft: 'auto',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #4f46e5 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 14px -2px rgba(37, 99, 235, 0.45)'
              }}
            >
              <i className="bi bi-cloud-arrow-down-fill" style={{ fontSize: '1.15rem' }}></i>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="liquid-pill-btn"
            style={{
              padding: '7px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Xong
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
