import React, { useState } from 'react';
import Tooltip from './Tooltip';
import { DESIGN_PRESETS } from '../data/presets';
import { resetPromptTemplates } from '../data/promptTemplates';

export default function AdminPromptModal({
  isOpen,
  onClose,
  templates,
  onSaveTemplates,
  showToast
}) {
  const [localList, setLocalList] = useState(templates || []);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // New item form state
  const [newName, setNewName] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newPresetId, setNewPresetId] = useState('flyer_a4');
  const [newHiddenPrompt, setNewHiddenPrompt] = useState('');

  if (!isOpen) return null;

  const allPresets = DESIGN_PRESETS.flatMap((c) => c.items);

  const handleUpdateHiddenPrompt = (id, newPrompt) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, hiddenPrompt: newPrompt } : item))
    );
  };

  const handleUpdateName = (id, newName) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const handleUpdatePreset = (id, newPresetId) => {
    setLocalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, presetId: newPresetId } : item))
    );
  };

  const handleDelete = (id) => {
    if (localList.length <= 1) {
      if (showToast) showToast('Cần giữ lại ít nhất 1 tùy chọn trong Dropdown!', 'error');
      return;
    }
    setLocalList((prev) => prev.filter((item) => item.id !== id));
    if (showToast) showToast('Đã xóa tùy chọn khỏi danh sách.', 'info');
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

    setLocalList((prev) => [newItem, ...prev]);
    setNewName('');
    setNewBadge('');
    setNewHiddenPrompt('');
    setShowAddForm(false);
    if (showToast) showToast(`Đã thêm tùy chọn: "${newItem.name}"`, 'success');
  };

  const handleSaveAll = () => {
    onSaveTemplates(localList);
    if (showToast) showToast('🎉 Đã lưu cấu hình Prompt Dropdown thành công!', 'success');
    onClose();
  };

  const handleResetDefaults = () => {
    const defaults = resetPromptTemplates();
    setLocalList(defaults);
    onSaveTemplates(defaults);
    if (showToast) showToast('Đã khôi phục danh sách Prompt mẫu về mặc định!', 'info');
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
        {/* Header */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.85)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="bi bi-sliders text-blue-600"></i>
              <span>Quản Trị Prompt Mẫu Dropdown</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
              Nội dung prompt mẫu được giấu kín, chỉ gửi ngầm lên VPS
            </div>
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
          >
            <i className="bi bi-x-lg" style={{ fontSize: '0.8rem' }}></i>
          </button>
        </div>

        {/* Action bar */}
        <div
          style={{
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(248, 250, 252, 0.7)',
            borderBottom: '1px solid rgba(226, 232, 240, 0.6)'
          }}
        >
          <button
            type="button"
            className="liquid-pill-btn active"
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <i className={`bi ${showAddForm ? 'bi-chevron-up' : 'bi-plus-lg'}`}></i>
            <span>{showAddForm ? 'Đóng form thêm' : 'Thêm tùy chọn mới'}</span>
          </button>

          <Tooltip text="Khôi phục danh sách tùy chọn và prompt ẩn ban đầu">
            <button
              type="button"
              onClick={handleResetDefaults}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <i className="bi bi-arrow-counterclockwise"></i> Mặc định
            </button>
          </Tooltip>
        </div>

        {/* Body Scrollable */}
        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Add form */}
          {showAddForm && (
            <form
              onSubmit={handleAddNew}
              style={{
                background: '#ffffff',
                border: '1.5px solid #93c5fd',
                borderRadius: '18px',
                padding: '12px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e40af', marginBottom: '8px' }}>
                Tạo tùy chọn mới vào Dropdown
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Tên tùy chọn (VD: Voucher VIP)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="liquid-pill-input"
                  style={{ flex: 1, fontSize: '0.75rem', padding: '6px 10px' }}
                  required
                />
                <input
                  type="text"
                  placeholder="Badge (ngắn)"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  className="liquid-pill-input"
                  style={{ width: '80px', fontSize: '0.75rem', padding: '6px 8px' }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Khổ in liên kết tự động:
                </label>
                <select
                  value={newPresetId}
                  onChange={(e) => setNewPresetId(e.target.value)}
                  className="liquid-pill-input"
                  style={{ width: '100%', fontSize: '0.75rem', padding: '6px 10px' }}
                >
                  <option value="">(Không thay đổi khổ in)</option>
                  {allPresets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.width}×{p.height} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>
                    Prompt mẫu ẩn (sẽ ghép ngầm khi gửi VPS):
                  </label>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {newHiddenPrompt.length} ký tự
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Nhập phong cách, ánh sáng, chất liệu, tiêu chuẩn 300 DPI... (chỉ gửi đi, không hiện trên ô prompt chính)"
                  value={newHiddenPrompt}
                  onChange={(e) => setNewHiddenPrompt(e.target.value)}
                  className="liquid-pill-input"
                  style={{ width: '100%', fontSize: '0.75rem', padding: '8px 10px', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                className="btn-liquid-primary"
                style={{ padding: '8px 14px', fontSize: '0.78rem' }}
              >
                <i className="bi bi-check-lg"></i> Thêm vào Dropdown
              </button>
            </form>
          )}

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
        </div>

        {/* Footer save */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            background: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            gap: '8px'
          }}
        >
          <button
            type="button"
            className="liquid-pill-btn"
            onClick={onClose}
            style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
          >
            Đóng
          </button>
          <button
            type="button"
            className="btn-liquid-primary"
            onClick={handleSaveAll}
            style={{ flex: 2, padding: '10px' }}
          >
            <i className="bi bi-save"></i>
            <span>Lưu thay đổi Dropdown</span>
          </button>
        </div>
      </div>
    </div>
  );
}
