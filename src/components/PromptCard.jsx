import React from 'react';
import Tooltip from './Tooltip';
import { SAMPLE_TEMPLATES } from '../data/presets';

export default function PromptCard({
  prompt,
  setPrompt,
  onResetSession,
  onGenerate,
  isGenerating,
  progress,
  progressText,
  onSelectTemplate
}) {
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onGenerate();
    }
  };

  return (
    <div className="liquid-card" style={{ marginBottom: '14px' }}>
      <div className="liquid-card-glow"></div>

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Prompt Mô tả</span>
          <Tooltip text="Nhập chi tiết về nội dung, màu sắc, phong cách ấn phẩm bạn muốn tạo. Nhấn Ctrl + Enter để tạo ngay.">
            <span className="tooltip-trigger-icon">?</span>
          </Tooltip>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

          <Tooltip text="Xóa toàn bộ nội dung và làm mới phiên">
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

      {/* Quick Inspiration Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '8px' }}>
        {SAMPLE_TEMPLATES.map((tpl) => (
          <Tooltip key={tpl.id} text={tpl.prompt}>
            <button
              type="button"
              className="liquid-pill-btn"
              onClick={() => onSelectTemplate(tpl)}
              style={{ fontSize: '0.68rem', padding: '3px 10px', whiteSpace: 'nowrap' }}
            >
              {tpl.badge}
            </button>
          </Tooltip>
        ))}
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
            minHeight: '80px'
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
                background: 'linear-gradient(90deg, #3b82f6, #ec4899)',
                transition: 'width 0.3s ease'
              }}
            ></div>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', textAlign: 'center' }}>
            {progressText || `Tiến độ: ${progress}%`}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div style={{ marginTop: '10px' }}>
        <Tooltip text="Bấm để gửi lệnh tạo ảnh đến VPS ToolXPrint (hoặc Ctrl + Enter)">
          <button
            type="button"
            className="btn-liquid-primary"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <i className="bi bi-arrow-repeat spin"></i>
                <span>Đang render VPS 300 DPI...</span>
              </>
            ) : (
              <>
                <i className="bi bi-send-fill"></i>
                <span>Tạo ấn phẩm ngay</span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    marginLeft: '4px'
                  }}
                >
                  2.000đ
                </span>
              </>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
