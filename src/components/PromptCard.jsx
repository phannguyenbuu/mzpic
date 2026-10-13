import React, { useState, useEffect, useRef } from 'react';
import Tooltip from './Tooltip';
import { calculatePixels } from '../data/presets';
import { extractImageFromPasteEvent, readImageFromClipboard } from '../utils/clipboard';

export default function PromptCard({
  prompt,
  setPrompt,
  onResetSession,
  onGenerate,
  isGenerating,
  progress,
  progressText,
  templates = [],
  selectedTemplateId,
  onSelectTemplateId,
  onOpenAdmin,
  referenceImage,
  onUploadReferenceImage,
  onRemoveReferenceImage,
  // Khổ in specs props
  selectedPresetId,
  onSelectPreset,
  width = 210,
  height = 297,
  setWidth,
  setHeight,
  unit = 'mm',
  onUnitChange,
  aspectRatio = 'portrait',
  onAspectRatioChange,
  transparentBg = false,
  setTransparentBg,
  onOpenLightbox
}) {
  const [subTab, setSubTab] = useState('prompt'); // 'prompt' | 'specs'
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onUploadReferenceImage) onUploadReferenceImage(file);
    e.target.value = '';
  };

  const handlePasteClick = async () => {
    try {
      const file = await readImageFromClipboard();
      if (file) {
        if (onUploadReferenceImage) onUploadReferenceImage(file);
      } else {
        alert('Không tìm thấy hình ảnh trong bộ nhớ tạm! Hãy chụp màn hình hoặc copy ảnh rồi bấm Paste.');
      }
    } catch (err) {
      alert(err.message || 'Không thể dán ảnh từ Clipboard. Hãy bấm phím Ctrl + V!');
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      const file = extractImageFromPasteEvent(e);
      if (file) {
        e.preventDefault();
        if (onUploadReferenceImage) {
          onUploadReferenceImage(file);
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [onUploadReferenceImage]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onGenerate();
    }
  };

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const pxW = calculatePixels(width, unit, 300);
  const pxH = calculatePixels(height, unit, 300);

  const primaryPresets = [
    {
      id: 'flyer_a4',
      name: 'A4',
      fullName: 'Tờ rơi A4',
      desc: '210 × 297 mm',
      width: 210,
      height: 297,
      unit: 'mm',
      gradientClass: 'gradient-peach-rose',
      bubbleGlow: 'rgba(244, 63, 94, 0.65)',
      animationBob: 'playfulBubbleBob1 4.2s ease-in-out infinite',
      icon: 'bi-file-earmark-text',
      ratio: 'portrait',
      hint: 'Khổ A4 tiêu chuẩn 210×297 mm cho tờ rơi, kẹp file'
    },
    {
      id: 'flyer_a5',
      name: 'A5',
      fullName: 'Tờ rơi A5',
      desc: '148 × 210 mm',
      width: 148,
      height: 210,
      unit: 'mm',
      gradientClass: 'gradient-deep-cyan',
      bubbleGlow: 'rgba(2, 132, 199, 0.65)',
      animationBob: 'playfulBubbleBob2 3.8s ease-in-out infinite',
      icon: 'bi-file-text',
      ratio: 'portrait',
      hint: 'Khổ A5 nhỏ gọn 148×210 mm, tiết kiệm chi phí in'
    },
    {
      id: 'voucher_std',
      name: 'Voucher',
      fullName: 'Voucher VIP',
      desc: '18 × 8 cm',
      width: 18,
      height: 8,
      unit: 'cm',
      gradientClass: 'gradient-solar-gold',
      bubbleGlow: 'rgba(245, 158, 11, 0.65)',
      animationBob: 'playfulBubbleBob3 4.5s ease-in-out infinite',
      icon: 'bi-ticket-perforated',
      ratio: 'landscape',
      hint: 'Phiếu quà tặng 18×8 cm chuẩn in offset'
    },
    {
      id: 'standee_std',
      name: 'Standee',
      fullName: 'Standee',
      desc: '0.6 × 1.6 m',
      width: 0.6,
      height: 1.6,
      unit: 'm',
      gradientClass: 'gradient-cyber-emerald',
      bubbleGlow: 'rgba(16, 185, 129, 0.65)',
      animationBob: 'playfulBubbleBob4 3.9s ease-in-out infinite',
      icon: 'bi-badge-ad',
      ratio: 'portrait',
      hint: 'Standee đứng chữ X / cuốn nhôm sự kiện'
    },
    {
      id: 'namecard_vn',
      name: 'Card',
      fullName: 'Namecard',
      desc: '90 × 54 mm',
      width: 90,
      height: 54,
      unit: 'mm',
      gradientClass: 'gradient-sunset-amber',
      bubbleGlow: 'rgba(236, 72, 153, 0.65)',
      animationBob: 'playfulBubbleBob5 4.1s ease-in-out infinite',
      icon: 'bi-person-badge',
      ratio: 'landscape',
      hint: 'Danh thiếp tiêu chuẩn Việt Nam 90×54 mm'
    }
  ];

  return (
    <div className="liquid-card" style={{ marginBottom: '14px' }}>
      <div className="liquid-card-glow"></div>

      {/* Header bar: 2 Simple Tabs [Prompt] & [Khổ In] */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        {/* 2 Tabs Segmented Capsule */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(241, 245, 249, 0.9)',
            padding: '3px',
            borderRadius: '9999px',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)'
          }}
        >
          <button
            type="button"
            className={`liquid-pill-btn ${subTab === 'prompt' ? 'active' : ''}`}
            onClick={() => setSubTab('prompt')}
            style={{
              padding: '4px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              borderRadius: '9999px',
              border: 'none',
              boxShadow: subTab === 'prompt' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none'
            }}
          >
            Prompt
          </button>
          <button
            type="button"
            className={`liquid-pill-btn ${subTab === 'specs' ? 'active' : ''}`}
            onClick={() => setSubTab('specs')}
            style={{
              padding: '4px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              borderRadius: '9999px',
              border: 'none',
              boxShadow: subTab === 'specs' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none'
            }}
          >
            Khổ In
          </button>
        </div>

        {/* Right utility icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* If on specs tab, show 300 DPI px size */}
          {subTab === 'specs' && (
            <Tooltip text="Kích thước pixel tương ứng ở độ phân giải in 300 DPI">
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#475569',
                  background: 'rgba(255, 255, 255, 0.85)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {pxW}×{pxH} px
              </span>
            </Tooltip>
          )}

          {/* Admin Gear Button */}
          {onOpenAdmin && (
            <Tooltip text="Trang Admin: Tùy chỉnh danh sách Dropdown & Prompt mẫu ẩn">
              <button
                type="button"
                onClick={onOpenAdmin}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                <i className="bi bi-gear-fill"></i>
              </button>
            </Tooltip>
          )}

          {/* Refresh button */}
          <Tooltip text="Xóa toàn bộ nội dung và làm mới">
            <button
              type="button"
              onClick={onResetSession}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem'
              }}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Tab Content: PROMPT */}
      {subTab === 'prompt' && (
        <div>
          {/* Reference / Old Image Upload Section */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />

          {!referenceImage ? (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="liquid-pill-btn"
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  justifyContent: 'center',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  border: '1.5px dashed rgba(59, 130, 246, 0.45)',
                  background: 'rgba(239, 246, 255, 0.65)',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="bi bi-cloud-arrow-up" style={{ fontSize: '0.95rem' }}></i>
                <span>Up Ảnh Cần Sửa</span>
              </button>

              <Tooltip text="Dán ảnh từ bộ nhớ tạm (Ctrl + V)">
                <button
                  type="button"
                  onClick={handlePasteClick}
                  className="liquid-pill-btn"
                  style={{
                    width: 'auto',
                    padding: '7px 12px',
                    justifyContent: 'center',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    border: '1.5px solid rgba(59, 130, 246, 0.35)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className="bi bi-clipboard-plus" style={{ fontSize: '0.95rem' }}></i>
                  <span>Paste (Ctrl+V)</span>
                </button>
              </Tooltip>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                background: 'rgba(240, 249, 255, 0.9)',
                border: '1px solid rgba(186, 230, 253, 0.95)',
                borderRadius: '16px',
                marginBottom: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <img
                  src={referenceImage.url}
                  alt="Ảnh mẫu cần sửa"
                  style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover', border: '1.5px solid #0284c7', cursor: 'zoom-in' }}
                  onClick={() => onOpenLightbox && onOpenLightbox(referenceImage.url, 'Ảnh Mẫu Cần Sửa (Ảnh cũ)')}
                  title="Bấm để xem ảnh gốc & phóng to (Zoom / Pan / Tải về)"
                />
                <div style={{ minWidth: 0, cursor: 'pointer' }} onClick={() => onOpenLightbox && onOpenLightbox(referenceImage.url, 'Ảnh Mẫu Cần Sửa (Ảnh cũ)')}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="bi bi-image-fill"></i>
                    <span>Ảnh mẫu cần sửa</span>
                    <i className="bi bi-arrows-fullscreen" style={{ fontSize: '0.65rem', marginLeft: '2px', opacity: 0.8 }}></i>
                  </div>
                  <div style={{ fontSize: '0.64rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {referenceImage.name} ({referenceImage.sizeMb} MB)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemoveReferenceImage}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.78rem'
                }}
                title="Gỡ ảnh mẫu"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          )}

          {/* Textarea */}
          <div style={{ position: 'relative' }}>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mô tả ấn phẩm in ấn bạn muốn thiết kế..."
              className="liquid-pill-input"
              style={{
                width: '100%',
                borderRadius: '20px',
                resize: 'none',
                fontSize: '0.85rem',
                lineHeight: '1.45',
                padding: '12px 14px',
                minHeight: '84px'
              }}
            />

            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '12px',
                fontSize: '0.65rem',
                color: '#94a3b8',
                pointerEvents: 'none',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {prompt.length}
            </div>
          </div>

          {/* Slim Liquid Progress Bar */}
          {isGenerating && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ height: '4px', background: 'rgba(226, 232, 240, 0.7)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                    transition: 'width 0.3s ease'
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: KHỔ IN */}
      {subTab === 'specs' && (
        <div>
          {/* 5 Playful Liquid Olympic Bubbles (Spanning 100% full width) */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 2px 14px',
              marginBottom: '2px'
            }}
          >
            {primaryPresets.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <Tooltip key={preset.id} text={`${preset.fullName} (${preset.desc}) - ${preset.hint}`} position="top">
                  <button
                    type="button"
                    className={`liquid-olympic-bubble ${preset.gradientClass} ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      if (onSelectPreset) onSelectPreset(preset);
                      if (onAspectRatioChange) onAspectRatioChange(preset.ratio);
                    }}
                    style={{
                      '--bubble-glow': preset.bubbleGlow,
                      animation: isSelected ? undefined : preset.animationBob
                    }}
                  >
                    {/* Glass Bubble Specular Reflection */}
                    <div className="bubble-specular-shine"></div>

                    {/* Icon */}
                    <i
                      className={`bi ${preset.icon}`}
                      style={{
                        fontSize: '1.05rem',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))',
                        marginBottom: '1px'
                      }}
                    ></i>

                    {/* Title */}
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        lineHeight: 1,
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.55)'
                      }}
                    >
                      {preset.name}
                    </span>

                    {/* Active Bouncy Checkmark Badge */}
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-3px',
                          right: '-3px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          color: '#0284c7',
                          fontSize: '0.68rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          fontWeight: 900
                        }}
                      >
                        <i className="bi bi-check-lg"></i>
                      </div>
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </div>

          {/* Custom W / H input row (Spanning full 100% width) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              gap: '8px',
              marginBottom: '8px'
            }}
          >
            {/* Input W */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.88)',
                border: '1.5px solid rgba(226, 232, 240, 0.95)',
                borderRadius: '16px',
                padding: '0 12px',
                height: '42px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', marginRight: '8px' }}>W:</span>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth && setWidth(parseFloat(e.target.value) || 0)}
                placeholder="Rộng"
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Input H */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.88)',
                border: '1.5px solid rgba(226, 232, 240, 0.95)',
                borderRadius: '16px',
                padding: '0 12px',
                height: '42px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', marginRight: '8px' }}>H:</span>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight && setHeight(parseFloat(e.target.value) || 0)}
                placeholder="Cao"
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Unit Selector */}
            <Tooltip text="Đơn vị đo lường (mm, cm, m, pt, px)">
              <div
                style={{
                  width: '74px',
                  height: '42px',
                  background: 'rgba(255, 255, 255, 0.88)',
                  border: '1.5px solid rgba(226, 232, 240, 0.95)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  position: 'relative'
                }}
              >
                <select
                  value={unit}
                  onChange={(e) => onUnitChange && onUnitChange(e.target.value)}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    textAlign: 'center',
                    paddingRight: '14px'
                  }}
                >
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="m">m</option>
                  <option value="pt">pt</option>
                  <option value="px">px</option>
                </select>
                <i
                  className="bi bi-chevron-down"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    pointerEvents: 'none',
                    fontSize: '0.62rem',
                    color: '#64748b'
                  }}
                ></i>
              </div>
            </Tooltip>
          </div>

          {/* Tỉ lệ Aspect Ratio Capsule (Spanning full 100% width) */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              background: 'rgba(241, 245, 249, 0.85)',
              padding: '3px',
              borderRadius: '16px',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              gap: '4px',
              marginBottom: '8px'
            }}
          >
            <button
              type="button"
              className={`liquid-pill-btn ${aspectRatio === 'square' ? 'active' : ''}`}
              onClick={() => onAspectRatioChange && onAspectRatioChange('square')}
              style={{
                flex: 1,
                height: '38px',
                justifyContent: 'center',
                borderRadius: '13px',
                fontSize: '0.78rem',
                fontWeight: 800,
                gap: '6px'
              }}
            >
              <i className="bi bi-square" style={{ fontSize: '0.75rem' }}></i>
              <span>1:1 Vuông</span>
            </button>

            <button
              type="button"
              className={`liquid-pill-btn ${aspectRatio === 'landscape' ? 'active' : ''}`}
              onClick={() => onAspectRatioChange && onAspectRatioChange('landscape')}
              style={{
                flex: 1,
                height: '38px',
                justifyContent: 'center',
                borderRadius: '13px',
                fontSize: '0.78rem',
                fontWeight: 800,
                gap: '6px'
              }}
            >
              <i className="bi bi-aspect-ratio" style={{ fontSize: '0.75rem' }}></i>
              <span>16:9 Ngang</span>
            </button>

            <button
              type="button"
              className={`liquid-pill-btn ${aspectRatio === 'portrait' ? 'active' : ''}`}
              onClick={() => onAspectRatioChange && onAspectRatioChange('portrait')}
              style={{
                flex: 1,
                height: '38px',
                justifyContent: 'center',
                borderRadius: '13px',
                fontSize: '0.78rem',
                fontWeight: 800,
                gap: '6px'
              }}
            >
              <i className="bi bi-phone" style={{ fontSize: '0.75rem' }}></i>
              <span>9:16 Dọc</span>
            </button>
          </div>

          {/* Tách nền toggle (Spanning full 100% width) */}
          <div
            onClick={() => setTransparentBg && setTransparentBg(!transparentBg)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              borderRadius: '14px',
              background: transparentBg ? 'rgba(219, 234, 254, 0.85)' : 'rgba(255, 255, 255, 0.75)',
              border: transparentBg ? '1.5px solid #3b82f6' : '1px solid rgba(226, 232, 240, 0.85)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '2px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className={`bi bi-transparency ${transparentBg ? 'text-blue-600' : 'text-slate-500'}`} style={{ fontSize: '0.95rem' }}></i>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: transparentBg ? '#1d4ed8' : '#334155' }}>
                Tách nền trong suốt (PNG không phông)
              </span>
            </div>

            <div
              style={{
                width: '34px',
                height: '18px',
                borderRadius: '9999px',
                background: transparentBg ? '#2563eb' : '#cbd5e1',
                position: 'relative',
                transition: 'background 0.2s ease'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: transparentBg ? '18px' : '2px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Row: Dropdown List (nằm phía trước) & Nút Tạo (nằm phía sau) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        {/* Dropdown list (phía trước) */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Tooltip text={`Mẫu prompt ẩn đang chọn: ${currentTemplate?.name || 'Tự do'}`}>
            <div style={{ position: 'relative', width: '100%' }}>
              <select
                value={selectedTemplateId || (templates[0] && templates[0].id)}
                onChange={(e) => onSelectTemplateId && onSelectTemplateId(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 32px 0 14px',
                  borderRadius: '18px',
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 4px 14px -3px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
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

        {/* Nút Tạo (phía sau) */}
        <Tooltip text="Bấm để tạo ảnh (hoặc Ctrl + Enter)">
          <button
            type="button"
            className="btn-liquid-primary"
            onClick={() => onGenerate && onGenerate()}
            disabled={isGenerating}
            style={{
              width: 'auto',
              minWidth: '130px',
              height: '46px',
              padding: '0 16px',
              borderRadius: '18px',
              fontSize: '0.88rem',
              fontWeight: 800,
              gap: '6px',
              flexShrink: 0
            }}
          >
            {isGenerating ? (
              <>
                <i className="bi bi-arrow-repeat spin"></i>
                <span>Tạo...</span>
              </>
            ) : (
              <>
                <i className="bi bi-sparkles" style={{ fontSize: '0.88rem' }}></i>
                <span>Tạo</span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.28)',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.6)'
                  }}
                >
                  2.000đ/ảnh
                </span>
              </>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
