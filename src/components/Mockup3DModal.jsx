import React from 'react';
import Tooltip from './Tooltip';

export default function Mockup3DModal({ isOpen, onClose, mockupUrl, originalImage, isRenderingMockup }) {
  if (!isOpen) return null;

  const handleDownload = () => {
    const targetUrl = mockupUrl || originalImage;
    if (!targetUrl) return;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    try {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = `Mockup_3D_SchoolPaper_${Date.now()}.png`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {}
  };

  return (
    <div className="liquid-modal-backdrop" onClick={onClose}>
      <div className="liquid-modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <i className="bi bi-box-seam"></i>
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                Phối Cảnh 3D Ấn Phẩm
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Mô phỏng góc nghiêng và đổ bóng thực tế
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
          >
            &times;
          </button>
        </div>

        {/* 3D Stage */}
        <div
          style={{
            minHeight: '280px',
            maxHeight: '340px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)'
          }}
        >
          {isRenderingMockup ? (
            <div style={{ textAlign: 'center' }}>
              <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem', color: '#2563eb' }}></i>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>
                Đang tạo chiều sâu 3D...
              </div>
            </div>
          ) : (
            <img
              src={mockupUrl || originalImage}
              alt="3D Mockup"
              style={{
                maxHeight: '260px',
                maxWidth: '90%',
                objectFit: 'contain',
                borderRadius: '8px',
                transform: 'rotate(-5deg) skewY(3deg) scale(0.92)',
                boxShadow: '0 25px 45px -10px rgba(15, 23, 42, 0.45)',
                transition: 'transform 0.3s ease'
              }}
            />
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button
            type="button"
            className="liquid-pill-btn"
            style={{ flex: 1, padding: '10px 0', justifyContent: 'center' }}
            onClick={onClose}
          >
            Đóng
          </button>

          <button
            type="button"
            className="btn-liquid-primary"
            style={{ flex: 2, padding: '10px 0' }}
            onClick={handleDownload}
            disabled={isRenderingMockup}
          >
            <i className="bi bi-download"></i> Tải Mockup 3D
          </button>
        </div>
      </div>
    </div>
  );
}
