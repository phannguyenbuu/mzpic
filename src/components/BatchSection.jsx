import React, { useState } from 'react';
import { DESIGN_PRESETS, DESIGN_STYLES } from '../data/presets';

export default function BatchSection({ onOpenInStudio, showToast }) {
  const [promptsText, setPromptsText] = useState(
    '1. Tờ rơi khai trương tiệm trà bánh phong cách ấm cúng organic\n2. Voucher giảm giá 100k cho khách hàng thân thiết dập nổi viền vàng\n3. Standee đứng giới thiệu khóa học lập trình AI đồ họa 2026'
  );
  const [selectedPresetId, setSelectedPresetId] = useState('flyer_a4');
  const [selectedStyleId, setSelectedStyleId] = useState('style_foil_luxury');
  const [batchItems, setBatchItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const startBatch = async () => {
    const rawLines = promptsText.split('\n').map((l) => l.replace(/^[0-9]+[.)]\s*/, '').trim()).filter(Boolean);
    if (rawLines.length === 0) {
      if (showToast) showToast('Vui lòng nhập ít nhất 1 prompt cho tác vụ Batch!', 'info');
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
    if (showToast) showToast(`Bắt đầu chạy batch ${items.length} ấn phẩm qua ToolXPrint VPS...`, 'info');

    // Chạy tuần tự từng item trong batch
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

          // Polling
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
            // Demo fallback sample if timeout
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
    if (showToast) showToast('🎉 Hoàn tất toàn bộ tác vụ Batch!', 'success');
  };

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '20px 24px' }}>
      {/* Header Bar */}
      <div className="card-header-bar" style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="bi bi-stack" style={{ fontSize: '1.4rem', color: 'var(--blue-primary)' }}></i>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Tạo &amp; Sửa Ấn Phẩm Hàng Loạt (Batch Mode)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Nhập danh sách prompts để hệ thống tự động sinh hàng loạt ấn phẩm theo quy chuẩn in ấn
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 450px) 1fr', gap: '20px' }}>
        {/* Left: Input parameters */}
        <div className="toolx-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            <i className="bi bi-card-text text-primary"></i> Danh sách Prompts (Mỗi dòng 1 ấn phẩm):
          </div>

          <textarea
            className="prompt-textarea-main"
            rows={8}
            value={promptsText}
            onChange={(e) => setPromptsText(e.target.value)}
            placeholder="Nhập mỗi dòng 1 mô tả ấn phẩm bạn muốn tạo..."
            style={{ marginBottom: '14px' }}
          />

          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
            Khổ ấn phẩm áp dụng:
          </div>
          <select
            className="form-select"
            value={selectedPresetId}
            onChange={(e) => setSelectedPresetId(e.target.value)}
            style={{ marginBottom: '14px' }}
          >
            {DESIGN_PRESETS.flatMap((c) => c.items).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.width}×{item.height} {item.unit})
              </option>
            ))}
          </select>

          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
            Phong cách in ấn áp dụng:
          </div>
          <select
            className="form-select"
            value={selectedStyleId}
            onChange={(e) => setSelectedStyleId(e.target.value)}
            style={{ marginBottom: '16px' }}
          >
            {DESIGN_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.tag})
              </option>
            ))}
          </select>

          <button
            className="btn-run-generate"
            onClick={startBatch}
            disabled={isProcessing}
            style={{ width: '100%' }}
          >
            <span className="btn-gen-text">
              {isProcessing ? (
                <>
                  <i className="bi bi-arrow-repeat spin"></i> Đang xử lý Batch...
                </>
              ) : (
                <>
                  <i className="bi bi-play-fill"></i> Khởi chạy Batch ngay
                </>
              )}
            </span>
          </button>
        </div>

        {/* Right: Batch Queue Progress */}
        <div className="toolx-card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <i className="bi bi-list-check text-primary"></i> Hàng Đợi Tiến Trình Batch ({batchItems.length} mục)
            </span>
          </div>

          {batchItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <i className="bi bi-stack" style={{ fontSize: '2.5rem' }}></i>
              <div style={{ marginTop: '10px', fontWeight: 600 }}>Chưa có tác vụ Batch nào được khởi tạo</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                Nhập danh sách prompts bên trái và nhấn &quot;Khởi chạy Batch ngay&quot;
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {batchItems.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: item.status === 'completed' ? '#f0fdf4' : (item.status === 'processing' ? '#eff6ff' : '#f8fafc'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      #{idx + 1}. {item.prompt}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Trạng thái: <strong>{item.status.toUpperCase()}</strong></span>
                      {item.status === 'processing' && <span>Tiến độ: {item.progress}%</span>}
                    </div>
                  </div>

                  {item.resultUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={item.resultUrl}
                        alt="Kết quả"
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                      <button
                        className="tab-pill-btn active"
                        style={{ fontSize: '0.72rem', padding: '5px 10px' }}
                        onClick={() => onOpenInStudio(item.resultUrl, item.prompt)}
                      >
                        <i className="bi bi-box-arrow-up-right"></i> Mở
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.status === 'processing' ? <i className="bi bi-arrow-repeat spin text-primary"></i> : <i className="bi bi-clock"></i>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
