import React from 'react';
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
    <div className="toolx-card prompt-box-card">
      <div className="card-header-bar">
        <div className="card-title-group">
          <i className="bi bi-stars"></i>
          <span>Prompt Mô tả Hình ảnh</span>
        </div>
        <button className="btn-reset-session" onClick={onResetSession} title="Làm mới nội dung">
          <i className="bi bi-arrow-clockwise"></i> Reset Session
        </button>
      </div>

      <div className="card-inner-body" style={{ paddingBottom: '14px' }}>
        {/* Mẫu gợi ý nhanh 1-click */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i className="bi bi-lightbulb-fill text-warning"></i>
            <span>Mẫu prompt in ấn gợi ý nhanh:</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {SAMPLE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                className="cat-chip"
                style={{ fontSize: '0.7rem', padding: '3px 8px', whiteSpace: 'nowrap' }}
                onClick={() => onSelectTemplate(tpl)}
                title={tpl.prompt}
              >
                <span>{tpl.badge}</span>
              </button>
            ))}
          </div>
        </div>

        <textarea
          className="prompt-textarea-main"
          placeholder="Nhập chi tiết bức ảnh ấn phẩm bạn muốn tạo ra (Ví dụ: Tờ rơi A4 khai trương thẩm mỹ viện sang trọng, voucher quà tặng dập nổi vàng...)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={5}
        />

        <div className="prompt-footer-row">
          <div className="shortcut-tip">
            <i className="bi bi-lightning-charge-fill"></i> Phím tắt: Ctrl + Enter
          </div>
          <div style={{ display: 'flex', alignContent: 'center', alignItems: 'center', gap: '10px' }}>
            <div className="price-hint-badge" title="Chi phí cho mỗi lượt tạo ấn phẩm">
              <i className="bi bi-coin"></i> Giá: <strong>2.000đ</strong> / ảnh
            </div>
            <div id="charCountDisplay" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {prompt.length} ký tự
            </div>
          </div>
        </div>

        {/* Thanh tiến trình */}
        <div className="progress-line-container" style={{ display: isGenerating ? 'block' : 'none' }}>
          <div className="progress-track">
            <div
              className="progress-fill"
              id="progressFillBar"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span id="progressTextLabel">{progressText || `Tiến độ xử lý: ${progress}%`}</span>
        </div>

        <button
          className="btn-run-generate"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          <span className="btn-gen-text">
            {isGenerating ? (
              <>
                <i className="bi bi-arrow-repeat spin"></i> Đang xử lý AI chuẩn 300 DPI...
              </>
            ) : (
              <>
                <i className="bi bi-send-fill"></i> Tạo ấn phẩm ngay (Ctrl + Enter)
              </>
            )}
          </span>
          <span className="btn-gen-cost-badge" title="Chi phí trừ vào ví">
            <i className="bi bi-coin"></i> 2.000đ
          </span>
        </button>
      </div>
    </div>
  );
}
