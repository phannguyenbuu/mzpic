import React from 'react';

export default function Mockup3DModal({ isOpen, onClose, mockupUrl, originalImage, isRenderingMockup }) {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (!mockupUrl) return;
    const a = document.createElement('a');
    a.href = mockupUrl;
    a.download = `Mockup_3D_MzPic_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="mockup-3d-modal active" onClick={onClose}>
      <div className="mockup-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
        <div className="mockup-modal-header">
          <h3>
            <i className="bi bi-box-seam text-primary"></i> Phối Cảnh 3D Ấn Phẩm Thực Tế
          </h3>
          <button className="btn-close-modal" onClick={onClose} title="Đóng">
            &times;
          </button>
        </div>

        <div className="mockup-stage-box" style={{ minHeight: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isRenderingMockup ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2.5rem', color: 'var(--blue-primary)' }}></i>
              <div style={{ marginTop: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                Đang tạo phối cảnh 3D góc nghiêng và đổ bóng tự nhiên...
              </div>
            </div>
          ) : mockupUrl ? (
            <div className="mockup-persp-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <img
                src={mockupUrl}
                alt="Phối cảnh 3D ấn phẩm"
                style={{ maxHeight: '520px', maxWidth: '100%', objectFit: 'contain', borderRadius: '10px' }}
              />
            </div>
          ) : (
            <div className="mockup-persp-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <img
                src={originalImage}
                alt="Phối cảnh 3D ấn phẩm"
                style={{ maxHeight: '480px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px', transform: 'rotate(-4deg) skewY(3deg)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}
              />
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <i className="bi bi-check-circle-fill text-success"></i> Phối cảnh 3D độ nét cao, sẵn sàng gửi khách hàng duyệt mẫu
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-cancel-auth" onClick={onClose}>
              Đóng
            </button>
            <button
              className="btn-download-toolx"
              onClick={handleDownload}
              disabled={!mockupUrl && !originalImage}
              style={{ padding: '7px 16px' }}
            >
              <i className="bi bi-download"></i> Tải Mockup 3D
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
