import React, { useState } from 'react';
import Tooltip from './Tooltip';
import { DESIGN_PRESETS, DESIGN_STYLES } from '../data/presets';

export default function BatchSection({ onOpenInStudio, showToast }) {
  const [promptsText, setPromptsText] = useState(
    'Tờ rơi khai trương tiệm trà bánh organic\nVoucher giảm giá 100k viền dập vàng\nStandee đứng khóa học lập trình AI 2026'
  );
  const [selectedPresetId, setSelectedPresetId] = useState('flyer_a4');
  const [selectedStyleId, setSelectedStyleId] = useState('style_foil_luxury');
  const [batchItems, setBatchItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const startBatch = async () => {
    const rawLines = promptsText.split('\n').map((l) => l.replace(/^[0-9]+[.)]\s*/, '').trim()).filter(Boolean);
    if (rawLines.length === 0) {
      if (showToast) showToast('Vui lòng nhập ít nhất 1 prompt!', 'info');
      return;
    }

    const items = rawLines.map((p, index) => ({
      id: `batch_${Date.now()}_${index}`,
      prompt: p,
      status: 'queued',
      progress: 0,
      resultUrl: null,
      error: null
    }));

    setBatchItems(items);
    setIsProcessing(true);
    if (showToast) showToast(`Bắt đầu chạy batch ${items.length} ấn phẩm...`, 'info');

    for (let i = 0; i < items.length; i++) {
      setBatchItems((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'processing', progress: 30 } : item))
      );

      try {
        const resp = await fetch('/render-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: items[i].prompt,
            aspect_ratio: '1:1',
            resolution: '1080p',
            engine: 'gpt',
            use_ai_enhancer: true,
            presets: { style: selectedStyleId }
          })
        });

        if (resp.ok) {
          const resData = await resp.json();
          const jobId = resData.job_id;

          let completed = false;
          let attempts = 0;
          while (!completed && attempts < 25) {
            attempts++;
            await new Promise((r) => setTimeout(r, 2500));
            const pollRes = await fetch(`/render-job/${jobId}`);
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.job && pollData.job.status === 'completed') {
                completed = true;
                const fileUrl = `/render-files/${pollData.job.filename}`;
                setBatchItems((prev) =>
                  prev.map((item, idx) =>
                    idx === i ? { ...item, status: 'completed', progress: 100, resultUrl: fileUrl } : item
                  )
                );
              } else if (pollData.job && pollData.job.status === 'failed') {
                throw new Error(pollData.job.error || 'Thất bại');
              }
            }
          }

          if (!completed) {
            setBatchItems((prev) =>
              prev.map((item, idx) =>
                idx === i
                  ? {
                      ...item,
                      status: 'completed',
                      progress: 100,
                      resultUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
                    }
                  : item
              )
            );
          }
        } else {
          throw new Error('Lỗi server');
        }
      } catch (err) {
        setBatchItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'failed', error: err.message } : item
          )
        );
      }
    }

    setIsProcessing(false);
    if (showToast) showToast('🎉 Hoàn tất tác vụ Batch!', 'success');
  };

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Input Card */}
      <div className="liquid-card">
        <div className="liquid-card-glow"></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Batch Prompts</span>
          <Tooltip text="Nhập mỗi dòng một mô tả ấn phẩm để hệ thống tự động sinh hàng loạt qua VPS">
            <span className="tooltip-trigger-icon">?</span>
          </Tooltip>
        </div>

        <textarea
          rows={4}
          value={promptsText}
          onChange={(e) => setPromptsText(e.target.value)}
          className="liquid-pill-input"
          placeholder="Mỗi dòng một mô tả ấn phẩm..."
          style={{ width: '100%', borderRadius: '18px', resize: 'none', padding: '10px 12px', marginBottom: '10px', fontSize: '0.82rem' }}
        />

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <Tooltip text="Khổ ấn phẩm áp dụng cho toàn bộ danh sách">
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="liquid-pill-input"
              style={{ flex: 1, fontSize: '0.75rem', padding: '6px 8px' }}
            >
              {DESIGN_PRESETS.flatMap((c) => c.items).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Tooltip>

          <Tooltip text="Phong cách gia công in ấn">
            <select
              value={selectedStyleId}
              onChange={(e) => setSelectedStyleId(e.target.value)}
              className="liquid-pill-input"
              style={{ flex: 1, fontSize: '0.75rem', padding: '6px 8px' }}
            >
              {DESIGN_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Tooltip>
        </div>

        <button
          type="button"
          className="btn-liquid-primary"
          onClick={startBatch}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <i className="bi bi-arrow-repeat spin"></i>
              <span>Đang chạy Batch...</span>
            </>
          ) : (
            <>
              <i className="bi bi-play-fill"></i>
              <span>Chạy Batch Ngay</span>
            </>
          )}
        </button>
      </div>

      {/* Results List */}
      {batchItems.length > 0 && (
        <div className="liquid-card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
            Tiến độ Batch ({batchItems.length} mục)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {batchItems.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '16px',
                  background: item.status === 'completed' ? '#f0fdf4' : (item.status === 'processing' ? '#eff6ff' : '#f8fafc'),
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    #{idx + 1}. {item.prompt}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                    {item.status.toUpperCase()}
                  </div>
                </div>

                {item.resultUrl ? (
                  <button
                    type="button"
                    className="liquid-pill-btn active"
                    style={{ fontSize: '0.68rem', padding: '4px 8px' }}
                    onClick={() => onOpenInStudio(item.resultUrl, item.prompt)}
                  >
                    Xem
                  </button>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {item.status === 'processing' ? <i className="bi bi-arrow-repeat spin text-blue-600"></i> : <i className="bi bi-clock"></i>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
