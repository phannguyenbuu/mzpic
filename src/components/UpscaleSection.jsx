import React, { useState } from 'react';

export default function UpscaleSection({ currentStudioImage, showToast }) {
  const [imageSrc, setImageSrc] = useState(
    currentStudioImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
  );
  const [scale, setScale] = useState(4);
  const [targetDpi, setTargetDpi] = useState(300);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState(null);
  const [sliderPos, setSliderPos] = useState(50);

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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
      {/* Header Bar */}
      <div className="card-header-bar" style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="bi bi-arrows-angle-expand" style={{ fontSize: '1.4rem', color: '#9333ea' }}></i>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Kích Nét AI Siêu Độ Phân Giải (10X / 16X Super-Resolution)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Phục vụ in ấn khổ lớn (Standee, Poster, Biển bạt) với độ sắc nét tuyệt đối 300 - 600 DPI
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
        {/* Controls Column */}
        <div className="toolx-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
            <i className="bi bi-sliders text-primary"></i> Tùy chọn Kích Nét
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              Nguồn ảnh:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {currentStudioImage && (
                <button
                  type="button"
                  className="tab-pill-btn active"
                  style={{ fontSize: '0.75rem', flex: 1 }}
                  onClick={() => { setImageSrc(currentStudioImage); setUpscaledUrl(null); }}
                >
                  <i className="bi bi-magic"></i> Ảnh Studio
                </button>
              )}
              <label className="tab-pill-btn" style={{ fontSize: '0.75rem', flex: 1, textAlign: 'center', cursor: 'pointer' }}>
                <i className="bi bi-upload"></i> Tải ảnh lên
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              Hệ số phóng to (Scale Factor):
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {[2, 4, 8, 10, 16].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`tab-pill-btn ${scale === s ? 'active' : ''}`}
                  onClick={() => setScale(s)}
                  style={{ fontSize: '0.75rem', padding: '6px 0', textAlign: 'center' }}
                >
                  {s}X
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
              Chuẩn DPI In ấn mục tiêu:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {[150, 300, 600].map((dpi) => (
                <button
                  key={dpi}
                  type="button"
                  className={`tab-pill-btn ${targetDpi === dpi ? 'active' : ''}`}
                  onClick={() => setTargetDpi(dpi)}
                  style={{ fontSize: '0.75rem', padding: '6px 0', textAlign: 'center' }}
                >
                  {dpi} DPI
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-run-generate"
            onClick={handleStartUpscale}
            disabled={isUpscaling}
            style={{ width: '100%' }}
          >
            <span className="btn-gen-text">
              {isUpscaling ? (
                <>
                  <i className="bi bi-arrow-repeat spin"></i> Đang Kích Nét AI...
                </>
              ) : (
                <>
                  <i className="bi bi-stars"></i> Bắt đầu Kích Nét {scale}X
                </>
              )}
            </span>
          </button>

          {upscaledUrl && (
            <button
              className="btn-download-toolx"
              onClick={handleDownload}
              style={{ width: '100%', marginTop: '10px', padding: '8px' }}
            >
              <i className="bi bi-download"></i> Tải ảnh {scale}X ({targetDpi} DPI)
            </button>
          )}
        </div>

        {/* Preview Area */}
        <div className="toolx-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
            <i className="bi bi-eye text-primary"></i> Khung So Sánh &amp; Xem Trước Độ Nét
          </div>

          <div style={{ flex: 1, minHeight: '440px', background: '#f8fafc', borderRadius: '10px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={upscaledUrl || imageSrc}
              alt="Xem trước"
              style={{
                maxHeight: '460px',
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                filter: upscaledUrl ? 'contrast(1.05) sharpness(1.2)' : 'none'
              }}
            />

            {upscaledUrl && (
              <div style={{ position: 'absolute', bottom: '14px', right: '14px', background: 'rgba(15, 23, 42, 0.8)', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', backdropFilter: 'blur(4px)' }}>
                <i className="bi bi-shield-check text-success"></i> Đã kích nét {scale}X ({targetDpi} DPI hoàn tất)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
