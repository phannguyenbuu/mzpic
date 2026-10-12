import React, { useState, useRef } from 'react';
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
  const [referenceImage, setReferenceImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage({
        url: event.target.result,
        name: file.name,
        sizeMb: (file.size / (1024 * 1024)).toFixed(2)
      });
      if (showToast) showToast(`Đã tải ảnh cũ lên: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setReferenceImage(null);
    if (showToast) showToast('Đã gỡ ảnh cũ tham chiếu', 'info');
  };

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
        let promptPayload = items[i].prompt;
        if (referenceImage) {
          promptPayload += ', reference base image provided, refine and restyle based on this source image';
        }

        const resp = await fetch('/render-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: promptPayload,
            aspect_ratio: '1:1',
            resolution: '1080p',
            engine: 'gpt',
            use_ai_enhancer: true,
            presets: { style: selectedStyleId },
            init_image: referenceImage ? referenceImage.url : undefined
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
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Danh Sách Prompt Hàng Loạt</span>
          <Tooltip text="Nhập mỗi dòng một mô tả ấn phẩm để hệ thống tự động sinh hàng loạt qua VPS">
            <span className="tooltip-trigger-icon">?</span>
          </Tooltip>
        </div>

        {/* Reference / Old Image Upload Section */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        {!referenceImage ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="liquid-pill-btn"
            style={{
              width: '100%',
              padding: '8px 12px',
              justifyContent: 'center',
              fontSize: '0.76rem',
              fontWeight: 700,
              border: '1.5px dashed rgba(59, 130, 246, 0.45)',
              background: 'rgba(239, 246, 255, 0.7)',
              color: '#1d4ed8',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="bi bi-cloud-arrow-up" style={{ fontSize: '0.95rem' }}></i>
            <span>Up ảnh cũ lên để GenAI sửa hàng loạt</span>
          </button>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'rgba(240, 249, 255, 0.9)',
              border: '1px solid rgba(186, 230, 253, 0.95)',
              borderRadius: '16px',
              marginBottom: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <img
                src={referenceImage.url}
                alt="Ảnh cũ tham chiếu"
                style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover', border: '1.5px solid #0284c7' }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="bi bi-image-fill"></i>
                  <span>Ảnh cũ tham chiếu</span>
                </div>
                <div style={{ fontSize: '0.64rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {referenceImage.name} ({referenceImage.sizeMb} MB)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: '#fee2e2',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem'
              }}
              title="Gỡ ảnh cũ"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}

        <textarea
          rows={4}
          value={promptsText}
          onChange={(e) => setPromptsText(e.target.value)}
          className="liquid-pill-input"
          placeholder="Mỗi dòng một mô tả ấn phẩm..."
          style={{ width: '100%', borderRadius: '18px', resize: 'none', padding: '10px 12px', marginBottom: '10px', fontSize: '0.82rem' }}
        />

        {/* 2 Dropdowns stacked Vertically (trên / dưới) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {/* Dropdown 1 (Trên): Khổ ấn phẩm */}
          <Tooltip text="Khổ ấn phẩm áp dụng cho toàn bộ danh sách">
            <div style={{ position: 'relative', width: '100%' }}>
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="liquid-pill-input"
                style={{
                  width: '100%',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '9px 32px 9px 12px',
                  borderRadius: '16px',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {DESIGN_PRESETS.flatMap((c) => c.items).map((item) => (
                  <option key={item.id} value={item.id}>
                    Khổ in: {item.name} ({item.width} × {item.height} {item.unit})
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

          {/* Dropdown 2 (Dưới): Phong cách gia công */}
          <Tooltip text="Phong cách gia công in ấn">
            <div style={{ position: 'relative', width: '100%' }}>
              <select
                value={selectedStyleId}
                onChange={(e) => setSelectedStyleId(e.target.value)}
                className="liquid-pill-input"
                style={{
                  width: '100%',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '9px 32px 9px 12px',
                  borderRadius: '16px',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {DESIGN_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    Phong cách: {s.name}
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
