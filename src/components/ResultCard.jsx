import React from 'react';
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
  onRemoveBg
}) {
  const pxW = calculatePixels(width, unit, 300);
  const pxH = calculatePixels(height, unit, 300);

  return (
    <div className="liquid-card" style={{ padding: '12px', marginBottom: '14px' }}>
      <div className="liquid-card-glow"></div>

      {/* Main Preview Screen */}
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
          background: transparentBg ? '#f1f5f9' : '#ffffff',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
        }}
        className={transparentBg ? 'transparent-checkered' : ''}
      >
        {/* Empty State (No image, no reference image) */}
        {!resultImage && !isGenerating && !referenceImage && (
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
              <i className="bi bi-image"></i>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              Chưa có kết quả thiết kế
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
              Nhập prompt &amp; bấm Tạo để xuất file 300 DPI (hoặc tải ảnh cũ lên để sửa)
            </div>
          </div>
        )}

        {/* Reference Image Pre-Generation Preview */}
        {!resultImage && !isGenerating && referenceImage && (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <img
              src={referenceImage.url}
              alt="Ảnh cũ tham chiếu"
              style={{ maxWidth: '85%', maxHeight: '200px', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
            />
            <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(240, 249, 255, 0.95)', border: '1px solid #bae6fd', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, color: '#0369a1' }}>
              <i className="bi bi-cloud-check-fill text-blue-600"></i>
              <span>Đã tải ảnh cũ. Nhập prompt sửa và bấm Tạo!</span>
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
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
              Đang render VPS ToolXPrint...
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
              Nâng cấp độ phân giải Lanczos 4x 300 DPI
            </div>
          </div>
        )}

        {/* Generated Image */}
        {resultImage && !isGenerating && (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={resultImage}
              alt="Kết quả"
              style={{
                maxWidth: '100%',
                maxHeight: '340px',
                objectFit: 'contain',
                borderRadius: '16px'
              }}
            />

            {/* Floating Top Specs Pills */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
              <Tooltip text="Kích thước pixel ở tiêu chuẩn in ấn 300 DPI">
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
              </Tooltip>
              <Tooltip text="Chuẩn bị in offset & KTS độ nét cao">
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
              </Tooltip>
            </div>

            {/* Expand Fullscreen */}
            <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
              <Tooltip text="Mở xem kích thước gốc toàn màn hình">
                <a
                  href={resultImage}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(10px)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    textDecoration: 'none'
                  }}
                >
                  <i className="bi bi-arrows-fullscreen"></i>
                </a>
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Glass Capsule Bar (Image 1 style) */}
      <div
        style={{
          marginTop: '10px',
          padding: '6px 10px',
          background: 'rgba(255, 255, 255, 0.75)',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tooltip text="Chỉnh sửa bổ sung ảnh này bằng AI (Ctrl + E)">
            <button
              type="button"
              className="liquid-icon-btn"
              onClick={onOpenEdit}
              disabled={!resultImage || isGenerating}
              aria-label="Sửa ảnh"
            >
              <i className="bi bi-pencil-fill"></i>
            </button>
          </Tooltip>

          <Tooltip text="Xem phối cảnh 3D trên bàn làm việc / sự kiện thực tế">
            <button
              type="button"
              className="liquid-icon-btn"
              onClick={onOpenMockup3D}
              disabled={!resultImage || isGenerating}
              aria-label="3D Mockup"
            >
              <i className="bi bi-box-seam-fill"></i>
            </button>
          </Tooltip>

          {!transparentBg && (
            <Tooltip text="Xóa phông nền tạo file PNG trong suốt">
              <button
                type="button"
                className="liquid-icon-btn"
                onClick={onRemoveBg}
                disabled={!resultImage || isGenerating}
                aria-label="Tách nền"
              >
                <i className="bi bi-transparency"></i>
              </button>
            </Tooltip>
          )}
        </div>

        {/* Primary Download Button (Icon only) */}
        <Tooltip text="Tải trực tiếp file ảnh độ nét cao chuẩn in 300 DPI">
          <button
            type="button"
            className="liquid-icon-btn primary-download"
            onClick={onDownload}
            disabled={!resultImage || isGenerating}
            aria-label="Tải về file 300 DPI"
          >
            <i className="bi bi-download"></i>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
