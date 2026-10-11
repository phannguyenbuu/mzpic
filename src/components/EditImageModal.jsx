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
    <div className="google-auth-modal active" onClick={onClose}>
      <div className="google-auth-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="card-header-bar" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)' }}>
          <div className="card-title-group" style={{ fontSize: '1rem', fontWeight: 700 }}>
            <i className="bi bi-pencil-square text-primary"></i>
            <span>Chỉnh Sửa Ấn Phẩm (Image-to-Image AI)</span>
          </div>
          <button className="btn-close-modal" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '18px' }}>
          <div style={{ display: 'flex', gap: '14px', marginBottom: '14px' }}>
            <img
              src={originalImage}
              alt="Ảnh nguồn"
              style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
            <div style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Nhập yêu cầu sửa đổi bạn muốn AI thực hiện trên ấn phẩm hiện tại.
              <div style={{ marginTop: '6px', fontWeight: 600, color: 'var(--text-main)' }}>
                Ví dụ: &quot;Đổi tông màu sang xanh ngọc bích, thêm hiệu ứng ép kim nhũ vàng cho viền&quot;
              </div>
            </div>
          </div>

          <textarea
            className="prompt-textarea-main"
            rows={4}
            placeholder="Mô tả chi tiết những gì bạn muốn thay đổi trên bức ảnh này..."
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            style={{ marginBottom: '14px' }}
            autoFocus
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn-cancel-auth" onClick={onClose} disabled={isEditing}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn-download-toolx"
              disabled={isEditing || !editPrompt.trim()}
              style={{ padding: '7px 20px' }}
            >
              {isEditing ? (
                <>
                  <i className="bi bi-arrow-repeat spin"></i> Đang sửa ảnh...
                </>
              ) : (
                <>
                  <i className="bi bi-magic"></i> Cập nhật ấn phẩm
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
