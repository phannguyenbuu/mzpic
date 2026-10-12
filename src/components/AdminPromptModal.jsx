import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';
import { DESIGN_PRESETS } from '../data/presets';
import { resetPromptTemplates, DEFAULT_GENERAL_COMMENT, resetGeneralComment } from '../data/promptTemplates';

export default function AdminPromptModal({
  isOpen,
  onClose,
  templates,
  onSaveTemplates,
  generalComment = '',
  onSaveGeneralComment,
  showToast
}) {
  const [localList, setLocalList] = useState(templates || []);
  const [localGeneralComment, setLocalGeneralComment] = useState(generalComment || '');
  const [editingId, setEditingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form state
  const [newName, setNewName] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newPresetId, setNewPresetId] = useState('flyer_a4');
  const [newHiddenPrompt, setNewHiddenPrompt] = useState('');

  useEffect(() => {
    if (templates) setLocalList(templates);
  }, [templates]);

  useEffect(() => {
    if (generalComment !== undefined) setLocalGeneralComment(generalComment || '');
  }, [generalComment, isOpen]);

  if (!isOpen) return null;

  const allPresets = DESIGN_PRESETS.flatMap((c) => c.items);

  const persistTemplates = (list) => {
    onSaveTemplates(list);
    savePromptTemplates(list);
  };

  const persistGeneralComment = (comment) => {
    if (onSaveGeneralComment) {
      onSaveGeneralComment(comment);
    }
    saveGeneralComment(comment);
  };

  const handleUpdateHiddenPrompt = (id, newPrompt) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, hiddenPrompt: newPrompt } : item))
    );
  };

  const handleBlurHiddenPrompt = () => {
    persistTemplates(localList);
  };

  const handleUpdateName = (id, newName) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const handleBlurName = () => {
    persistTemplates(localList);
  };

  const handleUpdatePreset = (id, newPresetId) => {
    const updated = localList.map((item) => (item.id === id ? { ...item, presetId: newPresetId } : item));
    setLocalList(updated);
    persistTemplates(updated);
  };

  const handleDelete = (id) => {
    if (localList.length <= 1) {
      if (showToast) showToast('Cần giữ lại ít nhất 1 tùy chọn trong Dropdown!', 'error');
      return;
    }
    const updated = localList.filter((item) => item.id !== id);
    setLocalList(updated);
    persistTemplates(updated);
    if (showToast) showToast('Đã xóa và tự động lưu cấu hình.', 'info');
  };

  const handleAddNew = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      if (showToast) showToast('Vui lòng nhập tên tùy chọn!', 'error');
      return;
    }

    const newItem = {
      id: `tpl_custom_${Date.now()}`,
      name: newName.trim(),
      badge: newBadge.trim() || newName.trim().slice(0, 10),
      presetId: newPresetId || null,
      hiddenPrompt: newHiddenPrompt.trim()
    };

    const updated = [newItem, ...localList];
    setLocalList(updated);
    persistTemplates(updated);
    setNewName('');
    setNewBadge('');
    setNewHiddenPrompt('');
    setShowAddModal(false);
    if (showToast) showToast(`Đã thêm & tự động lưu: "${newItem.name}"`, 'success');
  };

  const handleBlurGeneralComment = () => {
    persistGeneralComment(localGeneralComment);
  };

  const handleResetDefaults = () => {
    const defaults = resetPromptTemplates();
    setLocalList(defaults);
    persistTemplates(defaults);
    const defaultComment = resetGeneralComment();
    setLocalGeneralComment(defaultComment);
    persistGeneralComment(defaultComment);
    if (showToast) showToast('Đã khôi phục danh sách và tự động lưu!', 'info');
  };

  return (
    <div className="liquid-modal-backdrop" onClick={onClose}>
      <div
        className="liquid-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '430px',
          width: '94%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0
        }}
      >
        {/* Top Action Bar (Header removed per user request) */}
        <div
          style={{
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.95)',
            borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="liquid-pill-btn active"
              style={{ fontSize: '0.74rem', padding: '5px 12px', fontWeight: 700 }}
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-plus-lg"></i>
              <span>Thêm tùy chọn mới</span>
            </button>

            <Tooltip text="Khôi phục danh sách tùy chọn và comment chung về mặc định">
              <button
                type="button"
                onClick={handleResetDefaults}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <i className="bi bi-arrow-counterclockwise"></i> Mặc định
              </button>
            </Tooltip>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#f1f5f9',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
            title="Đóng bảng quản trị"
          >
            <i className="bi bi-x-lg" style={{ fontSize: '0.8rem' }}></i>
          </button>
        </div>

        {/* Body Scrollable */}
        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* General Comment Card (Comment chung áp dụng toàn hệ thống) */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(240, 253, 250, 0.95) 0%, rgba(239, 246, 255, 0.95) 100%)',
              border: '1.5px solid rgba(14, 165, 233, 0.3)',
              borderRadius: '18px',
              padding: '12px 14px',
              boxShadow: '0 4px 14px -3px rgba(14, 165, 233, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="bi bi-chat-square-quote-fill" style={{ color: '#0284c7', fontSize: '0.85rem' }}></i>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0369a1' }}>
                  Comment chung (General Comment)
                </span>
                <Tooltip text="Nội dung này được tự động ghép ngầm vào TẤT CẢ các lượt tạo ảnh trên VPS (bất kể tùy chọn dropdown nào được chọn).">
                  <span className="tooltip-trigger-icon" style={{ width: '16px', height: '16px', fontSize: '0.62rem' }}>?</span>
                </Tooltip>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                  {localGeneralComment.length} ký tự
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLocalGeneralComment(DEFAULT_GENERAL_COMMENT);
                    persistGeneralComment(DEFAULT_GENERAL_COMMENT);
                    if (showToast) showToast('Đã áp dụng mẫu comment chung & tự động lưu!', 'success');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#0284c7',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                    fontWeight: 600
                  }}
                  title="Điền mẫu comment chung chuẩn in 300 DPI"
                >
                  Mẫu chuẩn
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={localGeneralComment}
              onChange={(e) => setLocalGeneralComment(e.target.value)}
              onBlur={handleBlurGeneralComment}
              placeholder="Nhập nội dung comment chung (VD: chuẩn in ấn thương mại 300 DPI, màu sắc CMYK tươi sáng, không lỗi font...)"
              className="liquid-pill-input"
              style={{
                width: '100%',
                fontSize: '0.74rem',
                lineHeight: '1.4',
                padding: '8px 10px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                resize: 'vertical'
              }}
            />
            <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="bi bi-info-circle" style={{ fontSize: '0.65rem', color: '#0284c7' }}></i>
              <span>Tự động ghép ngầm vào cuối prompt của mọi lượt render (giấu kín với người dùng).</span>
            </div>
          </div>

          {/* List of existing templates */}
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Danh sách tùy chọn hiện có ({localList.length})
          </div>

          {localList.map((tpl, idx) => (
            <div
              key={tpl.id}
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                borderRadius: '16px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              {/* Row 1: Name, Preset & Delete */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', width: '18px' }}>
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={tpl.name}
                    onChange={(e) => handleUpdateName(tpl.id, e.target.value)}
                    onBlur={handleBlurName}
                    className="liquid-pill-input"
                    style={{ flex: 1, fontSize: '0.78rem', fontWeight: 700, padding: '4px 8px' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(tpl.id)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#fee2e2',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Xóa tùy chọn này"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>

              {/* Row 2: Preset association */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, width: '60px' }}>
                  Khổ in:
                </span>
                <select
                  value={tpl.presetId || ''}
                  onChange={(e) => handleUpdatePreset(tpl.id, e.target.value)}
                  className="liquid-pill-input"
                  style={{ flex: 1, fontSize: '0.7rem', padding: '3px 8px' }}
                >
                  <option value="">(Tự do - không đổi khổ in)</option>
                  {allPresets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.width}×{p.height} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 3: Hidden prompt textarea */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0284c7' }}>
                    🔒 Prompt ẩn ghép ngầm:
                  </span>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {tpl.hiddenPrompt ? tpl.hiddenPrompt.length : 0} ký tự
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={tpl.hiddenPrompt || ''}
                  onChange={(e) => handleUpdateHiddenPrompt(tpl.id, e.target.value)}
                  onBlur={handleBlurHiddenPrompt}
                  placeholder="Nhập nội dung prompt mẫu ẩn..."
                  className="liquid-pill-input"
                  style={{
                    width: '100%',
                    fontSize: '0.72rem',
                    padding: '6px 8px',
                    lineHeight: '1.35',
                    background: '#f8fafc',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          ))}

          {/* Auto-save notification note */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '14px',
              background: 'rgba(240, 253, 244, 0.85)',
              border: '1px solid rgba(187, 247, 208, 0.9)',
              textAlign: 'center',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#15803d',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <i className="bi bi-shield-check" style={{ fontSize: '0.85rem' }}></i>
            <span>Tất cả thay đổi được tự động lưu ngay khi bạn rời khỏi ô nhập hoặc dropdown.</span>
          </div>
        </div>
      </div>

      {/* Sub-modal: Tạo tùy chọn mới đè lên modal cũ */}
      {showAddModal && (
        <div
          className="liquid-modal-backdrop"
          onClick={() => setShowAddModal(false)}
          style={{ zIndex: 10002, background: 'rgba(15, 23, 42, 0.55)' }}
        >
          <div
            className="liquid-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '380px',
              width: '92%',
              padding: '18px 20px',
              borderRadius: '22px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.95)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="bi bi-plus-circle-fill text-blue-600"></i>
                <span>Tạo tùy chọn mới vào Dropdown</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b'
                }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: '0.75rem' }}></i>
              </button>
            </div>

            <form onSubmit={handleAddNew}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Tên tùy chọn:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Sửa ảnh kiến trúc"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="liquid-pill-input"
                    style={{ width: '100%', fontSize: '0.78rem', padding: '8px 10px' }}
                    required
                    autoFocus
                  />
                </div>
                <div style={{ width: '90px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Badge (ngắn):
                  </label>
                  <input
                    type="text"
                    placeholder="Badge..."
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    className="liquid-pill-input"
                    style={{ width: '100%', fontSize: '0.78rem', padding: '8px 8px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Khổ in liên kết tự động:
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <select
                    value={newPresetId}
                    onChange={(e) => setNewPresetId(e.target.value)}
                    className="liquid-pill-input"
                    style={{
                      width: '100%',
                      fontSize: '0.76rem',
                      padding: '8px 30px 8px 10px',
                      appearance: 'none',
                      WebkitAppearance: 'none'
                    }}
                  >
                    <option value="">(Không thay đổi khổ in)</option>
                    {allPresets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.width}×{p.height} {p.unit})
                      </option>
                    ))}
                  </select>
                  <i
                    className="bi bi-chevron-down"
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#64748b',
                      fontSize: '0.72rem'
                    }}
                  ></i>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>
                    Prompt mẫu ẩn (sẽ ghép ngầm khi gửi VPS):
                  </label>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {newHiddenPrompt.length} ký tự
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Nhập phong cách, ánh sáng, chất liệu, tiêu chuẩn 300 DPI... (chỉ gửi đi, không hiện trên ô prompt chính)"
                  value={newHiddenPrompt}
                  onChange={(e) => setNewHiddenPrompt(e.target.value)}
                  className="liquid-pill-input"
                  style={{ width: '100%', fontSize: '0.75rem', padding: '8px 10px', resize: 'vertical', lineHeight: '1.4' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="liquid-pill-btn"
                  style={{ flex: 1, padding: '9px 0', justifyContent: 'center', fontSize: '0.76rem' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-liquid-primary"
                  style={{ flex: 2, padding: '9px 0', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-check-lg"></i>
                  <span>Thêm vào Dropdown</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
