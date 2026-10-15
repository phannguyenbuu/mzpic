import React, { useState, useRef } from 'react';
import Tooltip from './Tooltip';
import { calculatePixels } from '../data/presets';

export default function ResultCard({
  resultImage,
  isGenerating,
  referenceImage,
  width,
  height,
  unit,
  transparentBg,
  presetId,
  fileMeta,
  onOpenEdit,
  onOpenMockup3D,
  onDownload,
  onRemoveBg,
  onOpenLightbox,
  onOpenResize,
  onOpenColorGrading,
  onUpscaleA0,
  aiUpscaleState,
  // Layer Post-processing props:
  layers = {},
  onUpdateLayer,
  onReplaceLayerImage,
  onRegenerateLayer,
  onDownloadWithGenAiUpscale
}) {
  const [layersExpanded, setLayersExpanded] = useState(true);

  const pxW = calculatePixels(width, unit, 300);
  const pxH = calculatePixels(height, unit, 300);

  const fileInputRefs = {
    frame: useRef(null),
    border: useRef(null),
    header: useRef(null),
    footer: useRef(null),
    body: useRef(null)
  };

  const hasIndividualLayers = Boolean(
    layers?.frame?.image ||
    layers?.border?.image ||
    layers?.header?.image ||
    layers?.footer?.image ||
    layers?.body?.image
  );

  const hasAnyLayerImage = Boolean(
    resultImage ||
    hasIndividualLayers
  );

  return (
    <div className="liquid-card" style={{ padding: '12px', marginBottom: '14px' }}>
      <div className="liquid-card-glow"></div>

      {/* Main Preview Screen / 4-Layer Composite Canvas */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '260px',
          maxHeight: '360px',
          borderRadius: '22px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: transparentBg ? '#f1f5f9' : '#ffffff',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)'
        }}
        className={transparentBg ? 'transparent-checkered' : ''}
      >
        {/* Empty State */}
        {!hasAnyLayerImage && !isGenerating && !referenceImage && (
          <div style={{ textAlign: 'center', padding: '30px 16px', color: '#64748b' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '18px',
                background: 'rgba(255,255,255,0.85)',
                boxShadow: '0 8px 20px -4px rgba(0,0,0,0.06)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: '#3b82f6',
                marginBottom: '10px'
              }}
            >
              <i className="bi bi-layers-half"></i>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              Chưa có kết quả thiết kế
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
              Nhập nội dung 4 tab và bấm <strong>Tạo Ảnh</strong> để xuất 4 layer báo tường
            </div>
          </div>
        )}

        {/* Reference Image Pre-Generation Preview */}
        {!hasAnyLayerImage && !isGenerating && referenceImage && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              cursor: 'zoom-in'
            }}
            onClick={() => onOpenLightbox && onOpenLightbox(referenceImage.url, 'Ảnh Mẫu Cần Sửa')}
          >
            <img
              src={referenceImage.url}
              alt="Ảnh mẫu cần sửa"
              style={{ maxWidth: '85%', maxHeight: '200px', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
            />
            <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(240, 249, 255, 0.95)', border: '1px solid #bae6fd', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, color: '#0369a1' }}>
              <i className="bi bi-arrows-fullscreen text-blue-600"></i>
              <span>Ảnh mẫu cần sửa • Bấm để phóng to / Zoom / Pan</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#2563eb' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(37, 99, 235, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}
            >
              <i className="bi bi-arrow-repeat spin" style={{ fontSize: '1.8rem' }}></i>
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
              Đang tạo bản thiết kế 4 layer...
            </div>
          </div>
        )}

        {/* 4-Layer Stacked Display (Click to open Lightbox Modal with Zoom/Pan) */}
        {hasAnyLayerImage && !isGenerating && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '350px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'zoom-in'
            }}
            onClick={() => onOpenLightbox && onOpenLightbox(resultImage || layers?.body?.image || layers?.border?.image, 'Kết Quả 4 Layer Báo Tường')}
          >
            {/* Fallback Base Composite Image: Chỉ hiện khi KHÔNG có layer riêng lẻ nào */}
            {!hasIndividualLayers && resultImage && (
              <img
                src={resultImage}
                alt="Base Artwork"
                style={{
                  position: 'absolute',
                  maxWidth: '100%',
                  maxHeight: '340px',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  zIndex: 0
                }}
              />
            )}

            {/* Layer 1: Body (Z-Index: 1, Opacity default e.g. 11% or 90%) */}
            {layers?.body?.image && layers.body.visible !== false && (
              <img
                src={layers.body.image}
                alt="Body Layer"
                style={{
                  position: 'absolute',
                  maxWidth: '100%',
                  maxHeight: '340px',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  opacity: Math.max(0, Math.min(100, layers.body.opacity ?? 11)) / 100,
                  zIndex: 1,
                  transition: 'opacity 0.15s ease'
                }}
              />
            )}

            {/* Layer 2: Frame (Khung: Viền • Header • Footer) with multiply blend mode */}
            {layers?.frame?.image && layers.frame.visible !== false && (
              <img
                src={layers.frame.image}
                alt="Khung Layer"
                style={{
                  position: 'absolute',
                  maxWidth: '100%',
                  maxHeight: '340px',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  opacity: Math.max(0, Math.min(100, layers.frame.opacity ?? 100)) / 100,
                  zIndex: 2,
                  mixBlendMode: 'multiply',
                  transition: 'opacity 0.15s ease'
                }}
              />
            )}

            {/* Backward compatibility for separate footer, header, border */}
            {layers?.footer?.image && layers.footer.visible !== false && (
              <img
                src={layers.footer.image}
                alt="Footer Layer"
                style={{
                  position: 'absolute',
                  maxWidth: '100%',
                  maxHeight: '340px',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  opacity: Math.max(0, Math.min(100, layers.footer.opacity ?? 100)) / 100,
                  zIndex: 3,
                  mixBlendMode: 'multiply',
                  transition: 'opacity 0.15s ease'
                }}
              />
            )}

            {/* Layer 3: Header (Z-Index: 4) */}
            {layers?.header?.image && layers.header.visible !== false && (
              <img
                src={layers.header.image}
                alt="Header Layer"
                style={{
                  position: 'absolute',
                  maxWidth: '100%',
                  maxHeight: '340px',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  opacity: Math.max(0, Math.min(100, layers.header.opacity ?? 100)) / 100,
                  zIndex: 4,
                  mixBlendMode: 'multiply',
                  transition: 'opacity 0.15s ease'
                }}
              />
            )}

            {/* Layer 4: Border (Z-Index: 5) */}
            {layers?.border?.image && layers.border.visible !== false && (
              <img
                src={layers.border.image}
                alt="Border Layer"
                style={{
                  position: 'absolute',
                  maxWidth: '100%',
                  maxHeight: '340px',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  opacity: Math.max(0, Math.min(100, layers.border.opacity ?? 100)) / 100,
                  zIndex: 5,
                  mixBlendMode: 'multiply',
                  transition: 'opacity 0.15s ease'
                }}
              />
            )}

            {/* Floating Top Specs Pills */}
            <div
              style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', cursor: onOpenResize ? 'pointer' : 'default', zIndex: 10 }}
              onClick={onOpenResize}
            >
              {((width === 841 && height === 1189) || presetId === 'wall_newspaper_a0') && (
                <span
                  style={{
                    background: 'linear-gradient(135deg, #ec4899, #db2777)',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 6px rgba(219, 39, 119, 0.4)'
                  }}
                >
                  📰 Báo Tường A0
                </span>
              )}
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
                {pxW}×{pxH} px
              </span>
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
                300 DPI
              </span>
            </div>

            {/* Expand Modal Icon (Opens In-Place Modal with Zoom/Pan - NEVER opens new tab) */}
            <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLightbox && onOpenLightbox(resultImage || layers?.body?.image || layers?.border?.image, 'Xem Toàn Màn Hình');
                }}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'rgba(15, 23, 42, 0.72)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
                title="Phóng to toàn màn hình & Zoom/Pan"
              >
                <i className="bi bi-arrows-fullscreen"></i>
              </button>
            </div>

            {/* Live GPU AI Upscaling Status Pill */}
            {aiUpscaleState?.isUpscaling && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  right: '10px',
                  background: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '14px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  zIndex: 20,
                  pointerEvents: 'none'
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: '2px solid rgba(244, 114, 182, 0.3)',
                    borderTopColor: '#f472b6',
                    animation: 'spin 0.8s linear infinite',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6' }}>
                      ⚡ Đang Kích Nét AI...
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                      {aiUpscaleState.progress}%
                    </span>
                  </div>
                  <div style={{ fontSize: '0.64rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {aiUpscaleState?.progress >= 100 ? 'Hoàn tất kích nét!' : 'Đang kích nét...'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4-Layer Hậu Kỳ Section: Collapsible với Icon Mũi Tên Lên/Xuống */}
      <div
        style={{
          marginTop: '12px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '18px',
          border: '1.5px solid rgba(226, 232, 240, 0.95)',
          padding: '10px 12px',
          boxShadow: '0 4px 16px -3px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Collapsible toggle bar with up/down arrow */}
        <div
          onClick={() => setLayersExpanded((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: '2px 4px',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="bi bi-layers-half text-indigo-600" style={{ fontSize: '0.95rem' }}></i>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
              Hậu kỳ
            </span>
          </div>
          <button
            type="button"
            style={{
              border: 'none',
              background: 'rgba(0, 0, 0, 0.05)',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#334155',
              fontSize: '0.8rem',
              transition: 'transform 0.2s ease'
            }}
            title={layersExpanded ? 'Thu gọn panel hậu kỳ' : 'Mở rộng panel hậu kỳ'}
          >
            <i className={`bi ${layersExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
          </button>
        </div>

        {/* Layers Grid (When expanded) */}
        {layersExpanded && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginTop: '10px' }}>
            {Object.keys(layers || {})
              .sort((a, b) => (layers[b]?.zIndex || 0) - (layers[a]?.zIndex || 0))
              .map((key) => {
                const l = layers?.[key];
                if (!l) return null;
                return (
                  <div
                    key={l.id}
                    style={{
                      background: l.visible !== false ? '#f8fafc' : '#f1f5f9',
                      border: `1.5px solid ${l.visible !== false ? l.accentColor + '55' : '#cbd5e1'}`,
                      borderRadius: '14px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      opacity: l.visible !== false ? 1 : 0.6,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Header: Title + Regenerate + Eye toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.85rem' }}>{l.emoji}</span>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: l.accentColor }}>{l.shortLabel}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {onRegenerateLayer && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRegenerateLayer(l.id);
                            }}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: '#64748b',
                              fontSize: '0.8rem',
                              padding: '2px'
                            }}
                            title={`Tạo lại chỉ layer ${l.shortLabel}`}
                          >
                            <i className="bi bi-arrow-repeat"></i>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateLayer && onUpdateLayer(l.id, { visible: l.visible === false ? true : false });
                          }}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: l.visible !== false ? '#2563eb' : '#94a3b8',
                            fontSize: '0.85rem',
                            padding: '2px'
                          }}
                          title={l.visible !== false ? 'Ẩn layer này' : 'Hiện layer này'}
                        >
                          <i className={`bi ${l.visible !== false ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
                        </button>
                      </div>
                    </div>

                    {/* Thumbnail box (Nhấp để đổi ảnh) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div
                        onClick={() => fileInputRefs[l.id]?.current?.click()}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          border: '1px solid #cbd5e1',
                          position: 'relative'
                        }}
                        title="Nhấp để tải hoặc thay đổi ảnh cho layer này"
                      >
                        {l.image ? (
                          <img
                            src={l.image}
                            alt={l.shortLabel}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <i className="bi bi-image" style={{ color: '#94a3b8', fontSize: '0.9rem' }}></i>
                        )}
                        <input
                          ref={fileInputRefs[l.id]}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && onReplaceLayerImage) {
                              onReplaceLayerImage(l.id, file);
                            }
                            e.target.value = '';
                          }}
                        />
                      </div>
                    </div>

                    {/* Opacity Slider (Bỏ chữ "Opacity", chỉ hiện phần trăm và thanh trượt) */}
                    <div style={{ marginTop: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.66rem', fontWeight: 800, color: l.accentColor, marginBottom: '2px' }}>
                        <span>{l.opacity ?? (l.id === 'body' ? 11 : 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={l.opacity ?? (l.id === 'body' ? 11 : 100)}
                        onChange={(e) => onUpdateLayer && onUpdateLayer(l.id, { opacity: Number(e.target.value) })}
                        style={{
                          width: '100%',
                          accentColor: l.accentColor,
                          height: '4px',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Primary Action Glass Capsule Bar: Tất cả trên 1 hàng ngang, nút Tải về chỉ dùng icon */}
      <div
        style={{
          marginTop: '12px',
          padding: '6px 8px',
          background: 'rgba(255, 255, 255, 0.85)',
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
          onClick={onOpenEdit}
          disabled={!hasAnyLayerImage || isGenerating}
          title="Chỉnh sửa bổ sung ấn phẩm"
          style={{ flexShrink: 0 }}
        >
          <i className="bi bi-pencil-fill"></i>
        </button>
        <button
          type="button"
          className="liquid-icon-btn"
          onClick={onOpenResize}
          disabled={!hasAnyLayerImage || isGenerating}
          title="Chỉnh kích thước chính xác (mm, cm, px, DPI)"
          style={{ flexShrink: 0 }}
        >
          <i className="bi bi-aspect-ratio"></i>
        </button>
        <button
          type="button"
          className="liquid-icon-btn"
          onClick={onOpenColorGrading}
          disabled={!hasAnyLayerImage || isGenerating}
          title="Hậu kỳ màu HSL & Curves"
          style={{ flexShrink: 0 }}
        >
          <i className="bi bi-sliders2-vertical"></i>
        </button>
        <button
          type="button"
          className="liquid-icon-btn"
          onClick={onOpenMockup3D}
          disabled={!hasAnyLayerImage || isGenerating}
          title="Render Mockup 3D trong không gian thực tế"
          style={{ flexShrink: 0 }}
        >
          <i className="bi bi-box-seam-fill"></i>
        </button>
        {!transparentBg && (
          <button
            type="button"
            className="liquid-icon-btn"
            onClick={onRemoveBg}
            disabled={!hasAnyLayerImage || isGenerating}
            title="Xóa phông tách nền PNG trong suốt"
            style={{ flexShrink: 0 }}
          >
            <i className="bi bi-transparency"></i>
          </button>
        )}

        {/* Nút Tải về (Không có chữ, chỉ dùng icon, cùng hàng ngang, đẩy sang phải) */}
        <button
          type="button"
          onClick={onDownloadWithGenAiUpscale || onDownload}
          disabled={!hasAnyLayerImage || isGenerating || aiUpscaleState?.isUpscaling}
          className="liquid-icon-btn primary-download"
          title={aiUpscaleState?.isUpscaling ? `Đang kích nét AI (${aiUpscaleState.progress}%)...` : "Tải về (Kích nét AI)"}
          style={{
            marginLeft: 'auto',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #4f46e5 100%)',
            color: '#ffffff',
            boxShadow: '0 4px 14px -2px rgba(37, 99, 235, 0.45)'
          }}
        >
          {aiUpscaleState?.isUpscaling ? (
            <i className="bi bi-arrow-repeat spin" style={{ fontSize: '1.05rem' }}></i>
          ) : (
            <i className="bi bi-cloud-arrow-down-fill" style={{ fontSize: '1.15rem' }}></i>
          )}
        </button>
      </div>
    </div>
  );
}
