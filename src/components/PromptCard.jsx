import React from 'react';
import Tooltip from './Tooltip';

export default function PromptCard({
  prompt,
  setPrompt,
  onResetSession,
  onGenerate,
  isGenerating,
  progress,
  progressText,
  templates = [],
  selectedTemplateId,
  onSelectTemplateId,
  onOpenAdmin
}) {
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onGenerate();
    }
  };

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  return (
    <div className="liquid-card" style={{ marginBottom: '14px' }}>
      <div className="liquid-card-glow"></div>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Prompt Mô tả</span>
          <Tooltip text="Nhập nội dung ấn phẩm bạn muốn tạo. Bấm Ctrl + Enter để tạo ngay.">
            <span className="tooltip-trigger-icon">?</span>
          </Tooltip>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Admin Gear Button */}
          {onOpenAdmin && (
            <Tooltip text="Trang Admin: Tùy chỉnh danh sách Dropdown & Prompt mẫu ẩn">
              <button
                type="button"
                onClick={onOpenAdmin}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                <i className="bi bi-gear-fill"></i>
              </button>
            </Tooltip>
          )}

          <Tooltip text="Chi phí mỗi lượt tạo ấn phẩm 300 DPI">
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#2563eb',
                background: '#eff6ff',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              2.000đ/ảnh
            </span>
          </Tooltip>

          <Tooltip text="Xóa toàn bộ nội dung và làm mới">
            <button
              type="button"
              onClick={onResetSession}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mô tả ấn phẩm in ấn bạn muốn AI tạo ra..."
          className="liquid-pill-input"
          style={{
            width: '100%',
            borderRadius: '20px',
            resize: 'none',
            fontSize: '0.85rem',
            lineHeight: '1.45',
            padding: '12px 14px',
            minHeight: '84px'
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '12px',
            fontSize: '0.65rem',
            color: '#94a3b8',
            pointerEvents: 'none',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {prompt.length}
        </div>
      </div>

      {/* Slim Liquid Progress Bar */}
      {isGenerating && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ height: '4px', background: 'rgba(226, 232, 240, 0.7)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', textAlign: 'center' }}>
            {progressText || `Tiến độ: ${progress}%`}
          </div>
        </div>
      )}

      {/* Bottom Action Row: Dropdown List (nằm phía trước) & Nút Tạo (nằm phía sau) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        {/* Dropdown list (phía trước) - Cùng style Liquid Glass */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Tooltip text={`Mẫu prompt ẩn đang chọn: ${currentTemplate?.name || 'Tự do'}`}>
            <div style={{ position: 'relative', width: '100%' }}>
              <select
                value={selectedTemplateId || (templates[0] && templates[0].id)}
                onChange={(e) => onSelectTemplateId(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 32px 0 14px',
                  borderRadius: '18px',
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 4px 14px -3px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
              <i
                className="bi bi-chevron-down"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b',
                  fontSize: '0.72rem'
                }}
              ></i>
            </div>
          </Tooltip>
        </div>

        {/* Nút Tạo (phía sau) - Sửa thành chữ 'Tạo' */}
        <Tooltip text="Bấm để gửi lệnh tạo ảnh đến VPS ToolXPrint (hoặc Ctrl + Enter)">
          <button
            type="button"
            className="btn-liquid-primary"
            onClick={onGenerate}
            disabled={isGenerating}
            style={{
              width: 'auto',
              minWidth: '104px',
              height: '46px',
              padding: '0 16px',
              borderRadius: '18px',
              fontSize: '0.88rem',
              fontWeight: 800,
              gap: '6px',
              flexShrink: 0
            }}
          >
            {isGenerating ? (
              <>
                <i className="bi bi-arrow-repeat spin"></i>
                <span>Tạo...</span>
              </>
            ) : (
              <>
                <i className="bi bi-send-fill" style={{ fontSize: '0.85rem' }}></i>
                <span>Tạo</span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  2k
                </span>
              </>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
