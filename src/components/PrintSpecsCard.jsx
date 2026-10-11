import React, { useState } from 'react';
import { DESIGN_PRESETS, DESIGN_STYLES, convertDimension, calculatePixels } from '../data/presets';

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
  setTransparentBg,
  selectedStyleId,
  setSelectedStyleId
}) {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  const activeCategory = DESIGN_PRESETS[activeCategoryIndex] || DESIGN_PRESETS[0];
  const pxW = calculatePixels(width, unit, 300);
  const pxH = calculatePixels(height, unit, 300);

  const currentPreset = DESIGN_PRESETS.flatMap(c => c.items).find(i => i.id === selectedPresetId);

  return (
    <div className="toolx-card">
      <div className="card-header-bar">
        <div className="card-title-group">
          <i className="bi bi-image"></i>
          <span>Kích thước &amp; Định dạng ấn phẩm</span>
        </div>
        <div className="header-tab-pills">
          <button className="tab-pill-btn active">
            <i className="bi bi-sliders"></i> Thông số kích thước
          </button>
        </div>
      </div>

      <div className="card-inner-body">
        {/* 1. Danh mục & Kích thước có sẵn (Presets) */}
        <div>
          <div className="form-section-title">
            <span><i className="bi bi-aspect-ratio text-primary"></i> Ấn phẩm &amp; Kích thước có sẵn</span>
            <span style={{ color: 'var(--blue-primary)', fontSize: '0.72rem' }}>
              {currentPreset ? `${currentPreset.name} (${currentPreset.width}×${currentPreset.height} ${currentPreset.unit})` : 'Tùy chỉnh'}
            </span>
          </div>

          <div className="category-chips-row" style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '8px' }}>
            {DESIGN_PRESETS.map((cat, idx) => (
              <button
                key={cat.category}
                type="button"
                className={`cat-chip ${activeCategoryIndex === idx ? 'active' : ''}`}
                onClick={() => setActiveCategoryIndex(idx)}
              >
                <i className={`bi ${cat.icon}`}></i> {cat.category}
              </button>
            ))}
          </div>

          <div className="presets-chips-grid">
            {activeCategory.items.map((item) => {
              const isSelected = selectedPresetId === item.id;
              return (
                <div
                  key={item.id}
                  className={`preset-chip-item ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectPreset(item)}
                >
                  <div className="preset-chip-name">
                    <span>{item.name}</span>
                    {item.badge && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--blue-primary)' }}>{item.badge}</span>
                    )}
                  </div>
                  <div className="preset-chip-dim">
                    {item.width} × {item.height} {item.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Kích thước tùy chỉnh (mm, cm, m, pt, px) */}
        <div>
          <div className="form-section-title">
            <span><i className="bi bi-rulers text-primary"></i> Kích thước đo lường tùy chỉnh</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quy đổi tự động</span>
          </div>

          <div className="custom-dimensions-row">
            <div className="input-block">
              <label htmlFor="inputWidth">Rộng (W)</label>
              <input
                type="number"
                id="inputWidth"
                className="form-input"
                value={width}
                min="1"
                step="any"
                onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-block">
              <label htmlFor="inputHeight">Cao (H)</label>
              <input
                type="number"
                id="inputHeight"
                className="form-input"
                value={height}
                min="1"
                step="any"
                onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-block">
              <label htmlFor="selectUnit">Đơn vị</label>
              <select
                id="selectUnit"
                className="form-select"
                value={unit}
                onChange={(e) => onUnitChange(e.target.value)}
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="m">m</option>
                <option value="pt">pt</option>
                <option value="px">px</option>
              </select>
            </div>
          </div>

          <div className="dimension-sub-banner" style={{ marginTop: '8px' }}>
            <div>
              <span>Quy đổi sang pixel: </span>
              <strong id="badgeConvertedPx">{pxW} × {pxH} px</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Chuẩn in 300 DPI sắc nét</span>
            </div>
          </div>
        </div>

        {/* 3. Hướng & Tỉ lệ (Vuông 1:1, Ngang, Dọc) */}
        <div>
          <div className="form-section-title">
            <span><i className="bi bi-arrows-fullscreen text-primary"></i> Tỉ lệ &amp; Khổ giấy ấn phẩm</span>
          </div>

          <div className="aspect-selector-row">
            {/* Vuông */}
            <div
              className={`aspect-pill-box ${aspectRatio === 'square' ? 'active' : ''}`}
              onClick={() => onAspectRatioChange('square')}
            >
              <div className="aspect-info">
                <span className="aspect-title">Vuông (1:1)</span>
                <span className="aspect-sub">Avatar / Tem tròn</span>
              </div>
              <div className="aspect-icon-box">
                <div className="rect-square"></div>
              </div>
            </div>

            {/* Ngang */}
            <div
              className={`aspect-pill-box ${aspectRatio === 'landscape' ? 'active' : ''}`}
              onClick={() => onAspectRatioChange('landscape')}
            >
              <div className="aspect-info">
                <span className="aspect-title">Ngang (Landscape)</span>
                <span className="aspect-sub">Voucher / Namecard</span>
              </div>
              <div className="aspect-icon-box">
                <div className="rect-landscape"></div>
              </div>
            </div>

            {/* Dọc */}
            <div
              className={`aspect-pill-box ${aspectRatio === 'portrait' ? 'active' : ''}`}
              onClick={() => onAspectRatioChange('portrait')}
            >
              <div className="aspect-info">
                <span className="aspect-title">Dọc (Portrait)</span>
                <span className="aspect-sub">Tờ rơi / Standee</span>
              </div>
              <div className="aspect-icon-box">
                <div className="rect-portrait"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Phong cách in ấn chuyên nghiệp ToolXPrint */}
        <div>
          <div className="form-section-title">
            <span><i className="bi bi-palette text-primary"></i> Phong cách in ấn thực tế</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Chất liệu &amp; Gia công</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
            {DESIGN_STYLES.map((style) => (
              <div
                key={style.id}
                onClick={() => setSelectedStyleId(style.id === selectedStyleId ? 'none' : style.id)}
                style={{
                  border: style.id === selectedStyleId ? '2px solid var(--blue-primary)' : '1px solid var(--border-color)',
                  background: style.id === selectedStyleId ? 'var(--blue-light)' : '#ffffff',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className={`bi ${style.icon}`} style={{ color: style.color }}></i>
                  <span>{style.name}</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {style.tag}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Tách Nền (PNG) Toggle Bar */}
        <div className="tach-nen-bar">
          <div className="tach-nen-left">
            <i className="bi bi-transparency"></i>
            <div>
              <div className="tach-nen-title">Tách nền (PNG trong suốt)</div>
              <div className={`tach-nen-status ${transparentBg ? 'active' : ''}`}>
                {transparentBg ? 'Đang BẬT • Xuất PNG trong suốt không phông' : 'Đang tắt • Giữ nền màu chuẩn in'}
              </div>
            </div>
          </div>
          <label className="switch-ui">
            <input
              type="checkbox"
              checked={transparentBg}
              onChange={(e) => setTransparentBg(e.target.checked)}
            />
            <span className="switch-track"></span>
          </label>
        </div>

      </div>
    </div>
  );
}
