import React, { useState } from 'react';
import Tooltip from './Tooltip';
import { calculatePixels } from '../data/presets';

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
  setTransparentBg
}) {
  const [subTab, setSubTab] = useState('prompt'); // 'prompt' | 'specs'

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
      name: 'Tờ rơi A4',
      desc: '210 × 297 mm',
      width: 210,
      height: 297,
      unit: 'mm',
      gradient: 'gradient-peach-rose',
      icon: 'bi-file-earmark-text',
      ratio: 'portrait',
      hint: 'Khổ A4 tiêu chuẩn 210×297 mm cho tờ rơi, kẹp file'
    },
    {
      id: 'flyer_a5',
      name: 'Tờ rơi A5',
      desc: '148 × 210 mm',
      width: 148,
      height: 210,
      unit: 'mm',
      gradient: 'gradient-deep-cyan',
      icon: 'bi-file-text',
      ratio: 'portrait',
      hint: 'Khổ A5 nhỏ gọn 148×210 mm, tiết kiệm chi phí in'
    },
    {
      id: 'voucher_std',
      name: 'Voucher',
      desc: '18 × 8 cm',
      width: 18,
      height: 8,
      unit: 'cm',
      gradient: 'gradient-solar-gold',
      icon: 'bi-ticket-perforated',
      ratio: 'landscape',
      hint: 'Phiếu quà tặng 18×8 cm chuẩn in offset'
    },
    {
      id: 'standee_std',
      name: 'Standee',
      desc: '0.6 × 1.6 m',
      width: 0.6,
      height: 1.6,
      unit: 'm',
      gradient: 'gradient-cyber-emerald',
      icon: 'bi-badge-ad',
      ratio: 'portrait',
      hint: 'Standee đứng chữ X / cuốn nhôm sự kiện'
    },
    {
      id: 'namecard_vn',
      name: 'Namecard',
      desc: '90 × 54 mm',
      width: 90,
      height: 54,
      unit: 'mm',
      gradient: 'gradient-sunset-amber',
      icon: 'bi-person-badge',
      ratio: 'landscape',
      hint: 'Danh thiếp tiêu chuẩn Việt Nam 90×54 mm'
    },
    {
      id: 'sticker_round',
      name: 'Tem Tròn',
      desc: '5 × 5 cm',
      width: 5,
      height: 5,
      unit: 'cm',
      gradient: 'gradient-neon-violet',
      icon: 'bi-patch-check',
      ratio: 'square',
      hint: 'Tem nhãn bế tròn 5×5 cm dán hộp quà, ly trà'
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
          {/* Textarea */}
          <div style={{ position: 'relative' }}>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mô tả ấn phẩm in ấn bạn muốn AI tạo ra..."
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
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', textAlign: 'center' }}>
                {progressText || `Tiến độ: ${progress}%`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: KHỔ IN */}
      {subTab === 'specs' && (
        <div>
          {/* 6 Squircle Presets */}
          <div className="liquid-squircle-grid" style={{ marginBottom: '10px' }}>
            {primaryPresets.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <Tooltip key={preset.id} text={preset.hint} position="top">
                  <div
                    className={`liquid-squircle-tile ${preset.gradient} ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      if (onSelectPreset) onSelectPreset(preset);
                      if (onAspectRatioChange) onAspectRatioChange(preset.ratio);
                    }}
                  >
                    <div className="tile-specular"></div>
                    <div className="tile-inner-icon">
                      <i className={`bi ${preset.icon}`}></i>
                    </div>
                    <div className="tile-title">{preset.name}</div>
                    <div className="tile-dim">{preset.desc}</div>
                  </div>
                </Tooltip>
              );
            })}
          </div>

          {/* Custom W / H input row */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '18px',
              padding: '8px 12px',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>W:</span>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth && setWidth(parseFloat(e.target.value) || 0)}
                className="liquid-pill-input"
                style={{ width: '60px', padding: '4px 6px', fontSize: '0.8rem', textAlign: 'center' }}
              />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>H:</span>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight && setHeight(parseFloat(e.target.value) || 0)}
                className="liquid-pill-input"
                style={{ width: '60px', padding: '4px 6px', fontSize: '0.8rem', textAlign: 'center' }}
              />
            </div>

            <Tooltip text="Đơn vị đo lường (mm, cm, m, pt, px)">
              <select
                value={unit}
                onChange={(e) => onUnitChange && onUnitChange(e.target.value)}
                className="liquid-pill-input"
                style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: 700 }}
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="m">m</option>
                <option value="pt">pt</option>
                <option value="px">px</option>
              </select>
            </Tooltip>
          </div>

          {/* Aspect Ratio & Transparency Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Tooltip text="Tỉ lệ vuông 1:1">
                <button
                  type="button"
                  className={`liquid-pill-btn ${aspectRatio === 'square' ? 'active' : ''}`}
                  onClick={() => onAspectRatioChange && onAspectRatioChange('square')}
                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                >
                  1:1
                </button>
              </Tooltip>

              <Tooltip text="Tỉ lệ ngang 16:9">
                <button
                  type="button"
                  className={`liquid-pill-btn ${aspectRatio === 'landscape' ? 'active' : ''}`}
                  onClick={() => onAspectRatioChange && onAspectRatioChange('landscape')}
                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                >
                  16:9
                </button>
              </Tooltip>

              <Tooltip text="Tỉ lệ dọc 9:16">
                <button
                  type="button"
                  className={`liquid-pill-btn ${aspectRatio === 'portrait' ? 'active' : ''}`}
                  onClick={() => onAspectRatioChange && onAspectRatioChange('portrait')}
                  style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                >
                  9:16
                </button>
              </Tooltip>
            </div>

            {/* Transparent Toggle */}
            <Tooltip text="Tách nền trong suốt: Xuất file PNG không phông">
              <div
                onClick={() => setTransparentBg && setTransparentBg(!transparentBg)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  background: transparentBg ? '#dbeafe' : 'rgba(255,255,255,0.7)',
                  border: transparentBg ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.9)',
                  borderRadius: '9999px',
                  padding: '3px 8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <i className={`bi bi-transparency ${transparentBg ? 'text-blue-600' : 'text-slate-500'}`} style={{ fontSize: '0.8rem' }}></i>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: transparentBg ? '#1d4ed8' : '#475569' }}>
                  Tách nền
                </span>
              </div>
            </Tooltip>
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
        <Tooltip text="Bấm để gửi lệnh tạo ảnh đến VPS ToolXPrint (hoặc Ctrl + Enter)">
          <button
            type="button"
            className="btn-liquid-primary"
            onClick={onGenerate}
            disabled={isGenerating}
            style={{
              width: 'auto',
              minWidth: '104px',
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
                <i className="bi bi-send-fill" style={{ fontSize: '0.85rem' }}></i>
                <span>Tạo</span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  2k
                </span>
              </>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
