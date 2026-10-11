import React from 'react';
import Tooltip from './Tooltip';
import { calculatePixels } from '../data/presets';

export default function PrintSpecsCard({
  selectedPresetId,
  onSelectPreset,
  width,
  height,
  setWidth,
  setHeight,
  unit,
  onUnitChange,
  aspectRatio,
  onAspectRatioChange,
  transparentBg,
  setTransparentBg
}) {
  const pxW = calculatePixels(width, unit, 300);
  const pxH = calculatePixels(height, unit, 300);

  // 6 preset squircles directly matching Image 2 & Image 4 style
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

      {/* Section Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Khổ In &amp; Tỉ Lệ</span>
          <Tooltip text="Chọn nhanh ấn phẩm chuẩn in hoặc tự nhập kích thước đo lường tùy chỉnh (mm, cm, m, px)">
            <span className="tooltip-trigger-icon">?</span>
          </Tooltip>
        </div>

        {/* 300 DPI Pixel Preview Badge */}
        <Tooltip text="Kích thước pixel tương ứng ở độ phân giải 300 DPI chuẩn in offset">
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#475569',
              background: 'rgba(255, 255, 255, 0.75)',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {pxW}×{pxH} px
          </span>
        </Tooltip>
      </div>

      {/* 6 Liquid Squircle Presets (Exact Image 2 & 4 style) */}
      <div className="liquid-squircle-grid" style={{ marginBottom: '14px' }}>
        {primaryPresets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <Tooltip key={preset.id} text={preset.hint} position="top">
              <div
                className={`liquid-squircle-tile ${preset.gradient} ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectPreset(preset);
                  onAspectRatioChange(preset.ratio);
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

      {/* Custom Dimensions (Pill Row style from Image 4) */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '20px',
          padding: '10px 12px',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          marginBottom: '10px',
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
            onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
            className="liquid-pill-input"
            style={{ width: '64px', padding: '4px 8px', fontSize: '0.8rem', textAlign: 'center' }}
          />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>H:</span>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
            className="liquid-pill-input"
            style={{ width: '64px', padding: '4px 8px', fontSize: '0.8rem', textAlign: 'center' }}
          />
        </div>

        <Tooltip text="Đơn vị đo lường (mm, cm, m, pt, px) quy đổi tự động">
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            className="liquid-pill-input"
            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}
          >
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="m">m</option>
            <option value="pt">pt</option>
            <option value="px">px</option>
          </select>
        </Tooltip>
      </div>

      {/* Aspect Ratio & Transparency Row (Capsule Pill style) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        {/* Aspect Ratio Pills */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <Tooltip text="Tỉ lệ vuông 1:1 (Avatar, tem tròn)">
            <button
              type="button"
              className={`liquid-pill-btn ${aspectRatio === 'square' ? 'active' : ''}`}
              onClick={() => onAspectRatioChange('square')}
              style={{ padding: '5px 10px', fontSize: '0.72rem' }}
            >
              1:1
            </button>
          </Tooltip>

          <Tooltip text="Tỉ lệ ngang 16:9 (Voucher, Namecard, Banner)">
            <button
              type="button"
              className={`liquid-pill-btn ${aspectRatio === 'landscape' ? 'active' : ''}`}
              onClick={() => onAspectRatioChange('landscape')}
              style={{ padding: '5px 10px', fontSize: '0.72rem' }}
            >
              16:9
            </button>
          </Tooltip>

          <Tooltip text="Tỉ lệ dọc 9:16 (Tờ rơi A4/A5, Standee, Poster)">
            <button
              type="button"
              className={`liquid-pill-btn ${aspectRatio === 'portrait' ? 'active' : ''}`}
              onClick={() => onAspectRatioChange('portrait')}
              style={{ padding: '5px 10px', fontSize: '0.72rem' }}
            >
              9:16
            </button>
          </Tooltip>
        </div>

        {/* Transparent Toggle Capsule */}
        <Tooltip text="Tách nền trong suốt: Xuất file PNG không phông để ghép thiết kế">
          <div
            onClick={() => setTransparentBg(!transparentBg)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              background: transparentBg ? '#dbeafe' : 'rgba(255,255,255,0.7)',
              border: transparentBg ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.9)',
              borderRadius: '9999px',
              padding: '4px 10px',
              transition: 'all 0.15s ease'
            }}
          >
            <i className={`bi bi-transparency ${transparentBg ? 'text-blue-600' : 'text-slate-500'}`} style={{ fontSize: '0.85rem' }}></i>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: transparentBg ? '#1d4ed8' : '#475569' }}>
              Tách nền
            </span>
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
