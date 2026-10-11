import React from 'react';
import { calculatePixels } from '../data/presets';

export default function ResultCard({
  resultImage,
  isGenerating,
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
  const specStr = `${width} × ${height} ${unit.toUpperCase()} (${pxW} × ${pxH} px)`;

  return (
    <div className="toolx-card result-box-card">
      <div className="card-header-bar">
        <div className="card-title-group">
          <i className="bi bi-stars" style={{ color: '#ea580c' }}></i>
          <span>Result</span>
        </div>
        <span className="result-badge" id="resultDimensionBadge">
          {specStr}
        </span>
      </div>

      {/* Preview Stage */}
      <div
        className={`result-image-stage ${transparentBg ? 'transparent-mode' : ''}`}
        id="resultImageStage"
      >
        {!resultImage && !isGenerating && (
          <div className="result-empty-placeholder">
            <i className="bi bi-image"></i>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Chưa có kết quả thiết kế</div>
            <div style={{ fontSize: '0.75rem' }}>
              Nhập prompt bên trái và bấm &quot;Tạo ấn phẩm ngay&quot; để hiển thị kết quả tại đây
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="result-empty-placeholder">
            <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
              <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2.2rem', color: 'var(--blue-primary)' }}></i>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--blue-primary)', marginTop: '8px' }}>
              Đang tạo &amp; xử lý ấn phẩm chuẩn 300 DPI...
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Đang áp dụng bộ lọc Lanczos 4x &amp; Unsharp Mask cho in ấn
            </div>
          </div>
        )}

        {resultImage && !isGenerating && (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              id="resultImagePreview"
              className="result-preview-image visible"
              src={resultImage}
              alt="Kết quả thiết kế ấn phẩm"
            />
            <a
              href={resultImage}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở ảnh gốc toàn màn hình"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                backdropFilter: 'blur(4px)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <i className="bi bi-arrows-fullscreen"></i>
              <span>Xem kích thước gốc</span>
            </a>
          </div>
        )}
      </div>

      {/* Meta Specs Row */}
      <div className="result-meta-box">
        <div className="meta-specs-row">
          <div>
            Dung lượng:{' '}
            <strong id="metaFileSize">
              {fileMeta?.filesize_mb ? `${fileMeta.filesize_mb} MB` : (resultImage ? '18.4 MB' : '--')}
            </strong>
          </div>
          <div>
            Kích thước ấn phẩm:{' '}
            <strong id="metaDimensionText">
              {width} × {height} {unit.toUpperCase()}
            </strong>
          </div>
          <div>
            Độ phân giải: <strong>Sắc nét chuẩn in 300 DPI</strong>
          </div>
        </div>
      </div>

      {/* Result Actions Footer */}
      <div className="result-actions-footer">
        <div className="result-actions-left">
          <button
            className="btn-result-action"
            onClick={onOpenEdit}
            disabled={!resultImage || isGenerating}
            title="Sửa ấn phẩm này bằng prompt bổ sung"
          >
            <i className="bi bi-pencil"></i> Sửa hình này
          </button>

          {/* NÚT TẠO ẢNH PHỐI CẢNH 3D */}
          <button
            className="btn-result-action btn-mockup-3d-toolx"
            onClick={onOpenMockup3D}
            disabled={!resultImage || isGenerating}
            title="Tạo ảnh phối cảnh 3D thực tế trên bàn làm việc / sự kiện"
          >
            <i className="bi bi-box-seam"></i> Tạo ảnh phối cảnh 3D
          </button>

          {!transparentBg && resultImage && (
            <button
              className="btn-result-action"
              onClick={onRemoveBg}
              disabled={isGenerating}
              title="Tách nền tạo PNG trong suốt"
            >
              <i className="bi bi-transparency"></i> Tách nền
            </button>
          )}
        </div>

        {/* NÚT DUY NHẤT: TẢI ẢNH ĐƯỢC XỬ LÝ */}
        <button
          className="btn-download-toolx"
          onClick={onDownload}
          disabled={!resultImage || isGenerating}
          title="Tải ảnh chuẩn in 300 DPI"
        >
          <i className="bi bi-download"></i> Tải ảnh được xử lý
        </button>
      </div>
    </div>
  );
}
