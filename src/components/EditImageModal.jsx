import React, { useState } from 'react';

export default function EditImageModal({ isOpen, onClose, originalImage, onConfirmEdit, isEditing }) {
  const [editPrompt, setEditPrompt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;
    onConfirmEdit(editPrompt.trim());
  };

  return (
    <div className="liquid-modal-backdrop" onClick={onClose}>
      <div className="liquid-modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <i className="bi bi-pencil-square"></i>
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                Sửa Ấn Phẩm
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Chỉnh sửa chi tiết &amp; phối cảnh
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

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
            <img
              src={originalImage}
              alt="Nguồn"
              style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'cover' }}
            />
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4' }}>
              Nhập các chi tiết cần thay đổi (ví dụ: &quot;Đổi nền màu đỏ rượu, thêm hoa văn chìm dập nổi&quot;).
            </div>
          </div>

          <textarea
            rows={3}
            placeholder="Yêu cầu sửa đổi ảnh..."
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            className="liquid-pill-input"
            style={{ width: '100%', borderRadius: '18px', resize: 'none', padding: '10px 12px', marginBottom: '14px' }}
            autoFocus
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="liquid-pill-btn"
              style={{ flex: 1, padding: '10px 0', justifyContent: 'center' }}
              onClick={onClose}
              disabled={isEditing}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-liquid-primary"
              style={{ flex: 2, padding: '10px 0' }}
              disabled={isEditing || !editPrompt.trim()}
            >
              {isEditing ? (
                <>
                  <i className="bi bi-arrow-repeat spin"></i>
                  <span>Đang sửa...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-magic"></i>
                  <span>Cập nhật ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
