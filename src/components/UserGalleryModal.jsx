import React, { useState, useEffect, useRef, useMemo } from 'react';
import Tooltip from './Tooltip';

/**
 * BeforeAfterSlider: Slider so sánh Trước (ảnh mẫu gốc) / Sau (ảnh biến đổi)
 */
function BeforeAfterSlider({ beforeUrl, afterUrl, alt = 'So sánh trước sau' }) {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseUpGlobal = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUpGlobal);
    window.addEventListener('touchend', handleMouseUpGlobal);
    return () => {
      window.removeEventListener('mouseup', handleMouseUpGlobal);
      window.removeEventListener('touchend', handleMouseUpGlobal);
    };
  }, []);

  const hasBefore = Boolean(beforeUrl && typeof beforeUrl === 'string' && beforeUrl.trim());
  const hasAfter = Boolean(afterUrl && typeof afterUrl === 'string' && afterUrl.trim());

  // 1. Nếu không có cả 2 ảnh
  if (!hasBefore && !hasAfter) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '260px', background: '#0f172a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <i className="bi bi-image" style={{ fontSize: '2rem', color: '#475569', marginBottom: '8px', display: 'block' }}></i>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Chưa có ảnh xem trước</span>
        </div>
      </div>
    );
  }

  // 2. Nếu chỉ có ảnh SAU (tạo mới từ prompt, không có ảnh mẫu gốc)
  if (!hasBefore && hasAfter) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '260px', background: '#0f172a', borderRadius: '12px', overflow: 'hidden' }}>
        <img
          src={afterUrl}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            background: 'rgba(37, 99, 235, 0.85)',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '0.65rem',
            fontWeight: 700
          }}
        >
          Sau (AI)
        </div>
      </div>
    );
  }

  // 3. Nếu chỉ có ảnh TRƯỚC (ảnh mẫu gốc)
  if (hasBefore && !hasAfter) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '260px', background: '#0f172a', borderRadius: '12px', overflow: 'hidden' }}>
        <img
          src={beforeUrl}
          alt={alt}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '0.65rem',
            fontWeight: 700
          }}
        >
          Trước (Gốc)
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      style={{
        position: 'relative',
        width: '100%',
        height: '270px',
        background: '#090d16',
        borderRadius: '14px',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: 'ew-resize',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}
    >
      {/* 1. Base Layer: AFTER (Ảnh sau khi biến đổi) */}
      <img
        src={afterUrl}
        alt="Sau khi biến đổi"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        draggable={false}
      />

      {/* 2. Top Layer: BEFORE (Ảnh mẫu gốc) với clip width */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${sliderPos}%`,
          overflow: 'hidden',
          borderRight: '2px solid #ffffff',
          boxShadow: '2px 0 10px rgba(0,0,0,0.4)',
          background: '#090d16'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
            height: '100%'
          }}
        >
          <img
            src={beforeUrl}
            alt="Ảnh mẫu gốc"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* 3. Draggable Divider Handle */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `${sliderPos}%`,
          transform: 'translate(-50%, -50%)',
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1e293b',
          fontSize: '0.85rem',
          pointerEvents: 'none',
          zIndex: 10,
          border: '2px solid #3b82f6'
        }}
      >
        <i className="bi bi-arrows"></i>
      </div>

      {/* 4. Badges: Trước / Sau */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          color: '#ffffff',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '0.62rem',
          fontWeight: 800,
          letterSpacing: '0.02em',
          pointerEvents: 'none'
        }}
      >
        ◀ TRƯỚC (GỐC)
      </div>

      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(37, 99, 235, 0.85)',
          backdropFilter: 'blur(4px)',
          color: '#ffffff',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '0.62rem',
          fontWeight: 800,
          letterSpacing: '0.02em',
          pointerEvents: 'none'
        }}
      >
        SAU (AI SỬA) ▶
      </div>

      {/* Quick Jump Buttons below divider */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '4px',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          padding: '2px 4px',
          borderRadius: '9999px',
          zIndex: 12
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setSliderPos(100)}
          style={{
            background: sliderPos === 100 ? '#3b82f6' : 'transparent',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            fontSize: '0.6rem',
            padding: '2px 6px',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          Trước
        </button>
        <button
          type="button"
          onClick={() => setSliderPos(50)}
          style={{
            background: sliderPos === 50 ? '#3b82f6' : 'transparent',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            fontSize: '0.6rem',
            padding: '2px 6px',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          50/50
        </button>
        <button
          type="button"
          onClick={() => setSliderPos(0)}
          style={{
            background: sliderPos === 0 ? '#3b82f6' : 'transparent',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            fontSize: '0.6rem',
            padding: '2px 6px',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          Sau
        </button>
      </div>
    </div>
  );
}

/**
 * UserGalleryModal: Modal danh sách các tác phẩm đã biến đổi của chính user đó kèm Before/After slider
 */
export default function UserGalleryModal({
  isOpen,
  onClose,
  user,
  galleryItems = [],
  onDeleteItem,
  onClearAll,
  onOpenInStudio,
  onOpenLightbox,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPresetFilter, setSelectedPresetFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    item: null,
    isAll: false
  });

  if (!isOpen) return null;

  const userIdentifier = user?.name || user?.email || 'Người dùng';

  // Filtered gallery items
  const filteredItems = galleryItems.filter((item) => {
    const matchSearch =
      !searchTerm ||
      (item.presetName && item.presetName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.dimensions && item.dimensions.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchPreset =
      selectedPresetFilter === 'all' ||
      item.aspectRatio === selectedPresetFilter ||
      item.presetName === selectedPresetFilter;

    return matchSearch && matchPreset;
  });

  const handleDownload = (url, fileName = 'SchoolPaper_Result.png') => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {}
    if (showToast) showToast('Đang tải file ấn phẩm về máy...', 'success');
  };

  const handleCopyPrompt = (prompt) => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    if (showToast) showToast('Đã copy prompt vào bộ nhớ tạm!', 'success');
  };

  return (
    <div className="liquid-modal-backdrop" onClick={onClose} style={{ zIndex: 12000 }}>
      <div
        className="liquid-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '94vw',
          maxWidth: '860px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.98)',
          boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.25)'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}
            >
              <i className="bi bi-collection-play-fill"></i>
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Gallery Tác Phẩm Của Bạn</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: '#e0e7ff',
                    color: '#3730a3',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontWeight: 700
                  }}
                >
                  {galleryItems.length} tác phẩm
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                Lịch sử biến đổi ảnh của <b>{userIdentifier}</b> • Kéo thanh trượt để so sánh Trước / Sau
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {galleryItems.length > 0 && onClearAll && (
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: true, item: null, isAll: true })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Xóa tất cả
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <i
              className="bi bi-search"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                fontSize: '0.8rem'
              }}
            ></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo khổ ấn phẩm, tên thiết kế..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '12px',
                border: '1.5px solid #e2e8f0',
                fontSize: '0.78rem',
                outline: 'none',
                background: '#f8fafc'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>
        </div>

        {/* Gallery Content List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingRight: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: '48px 16px',
                textAlign: 'center',
                color: '#64748b',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '1.5px dashed #cbd5e1'
              }}
            >
              <i className="bi bi-images" style={{ fontSize: '2.4rem', color: '#94a3b8', display: 'block', marginBottom: '10px' }}></i>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>
                {galleryItems.length === 0 ? 'Chưa có tác phẩm nào trong Gallery' : 'Không tìm thấy kết quả phù hợp'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', maxWidth: '380px', margin: '4px auto 0' }}>
                {galleryItems.length === 0
                  ? 'Khi bạn tải ảnh mẫu và AI hoàn tất biến đổi ấn phẩm, kết quả sẽ tự động lưu vào Gallery này kèm thanh trượt Trước / Sau.'
                  : 'Hãy thử tìm kiếm với từ khóa khác.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    padding: '12px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Item Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.64rem',
                          fontWeight: 800,
                          background: '#dbeafe',
                          color: '#1e40af',
                          padding: '2px 8px',
                          borderRadius: '9999px'
                        }}
                      >
                        {item.presetName || 'Ấn phẩm'}
                      </span>
                      {item.dimensions && (
                        <span style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>
                          {item.dimensions}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                      {item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                    </div>
                  </div>

                  {/* Before / After Slider Comparison */}
                  <BeforeAfterSlider
                    beforeUrl={item.beforeImage}
                    afterUrl={item.afterImage}
                    alt={item.presetName || 'Ấn phẩm'}
                  />

                  {/* Prompt Text Snippet (chỉ hiển thị nếu người dùng có nhập thêm) */}
                  {item.prompt && item.prompt.trim() && (
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: '#334155',
                        background: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid #e2e8f0'
                      }}
                      title={item.prompt}
                    >
                      <b>Prompt:</b> {item.prompt}
                    </div>
                  )}

                  {/* Action Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: 'auto', paddingTop: '4px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Tooltip text="Mở lại ảnh này vào Studio để chỉnh sửa tiếp">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenInStudio) {
                              onOpenInStudio(item.afterImage, item.prompt, item.beforeImage);
                              onClose();
                            }
                          }}
                          className="liquid-pill-btn"
                          style={{
                            padding: '5px 10px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe'
                          }}
                        >
                          <i className="bi bi-brush"></i>
                          <span>Studio</span>
                        </button>
                      </Tooltip>

                      <Tooltip text="Phóng to ảnh xem chi tiết">
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenLightbox) {
                              onOpenLightbox(item.afterImage, `Tác phẩm: ${item.presetName || 'Ấn phẩm'}`);
                            }
                          }}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            color: '#475569',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem'
                          }}
                        >
                          <i className="bi bi-arrows-fullscreen"></i>
                        </button>
                      </Tooltip>

                      {item.prompt && item.prompt.trim() && (
                        <Tooltip text="Sao chép nội dung prompt">
                          <button
                            type="button"
                            onClick={() => handleCopyPrompt(item.prompt)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              background: '#ffffff',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem'
                            }}
                          >
                            <i className="bi bi-clipboard"></i>
                          </button>
                        </Tooltip>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <Tooltip text="Tải ảnh kết quả về máy">
                        <button
                          type="button"
                          onClick={() => handleDownload(item.afterImage, `SchoolPaper_${item.id || Date.now()}.png`)}
                          className="liquid-pill-btn"
                          style={{
                            padding: '5px 10px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none'
                          }}
                        >
                          <i className="bi bi-download"></i>
                          <span>Tải về</span>
                        </button>
                      </Tooltip>

                      {onDeleteItem && (
                        <Tooltip text="Xóa khỏi Gallery">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ isOpen: true, item, isAll: false })}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              border: '1px solid #fee2e2',
                              background: '#fef2f2',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem'
                            }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal: "Bạn có chắc muốn xóa không?" */}
      {deleteConfirm.isOpen && (
        <div
          className="liquid-modal-backdrop"
          onClick={() => setDeleteConfirm({ isOpen: false, item: null, isAll: false })}
          style={{ zIndex: 13000, background: 'rgba(15, 23, 42, 0.65)' }}
        >
          <div
            className="liquid-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '24px 20px',
              maxWidth: '350px',
              width: '90vw',
              borderRadius: '20px',
              background: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              animation: 'fadeIn 0.15s ease'
            }}
          >
            {/* Warning Icon */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.45rem',
                marginBottom: '12px'
              }}
            >
              <i className="bi bi-trash3-fill"></i>
            </div>

            {/* Title: Exactly user's prompt text: "Bạn có chắc muốn xóa không?" */}
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Bạn có chắc muốn xóa không?
            </div>

            {/* Description */}
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.45, marginBottom: '16px' }}>
              {deleteConfirm.isAll
                ? `Toàn bộ ${galleryItems.length} tác phẩm trong Gallery sẽ bị xóa vĩnh viễn và không thể khôi phục.`
                : 'Tác phẩm biến đổi này sẽ bị xóa khỏi Gallery của bạn.'}
            </div>

            {/* Preview of item being deleted */}
            {!deleteConfirm.isAll && deleteConfirm.item && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                  textAlign: 'left'
                }}
              >
                <img
                  src={deleteConfirm.item.afterImage}
                  alt="Preview"
                  style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1e293b' }}>
                    {deleteConfirm.item.presetName || 'Ấn phẩm'}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {deleteConfirm.item.dimensions || deleteConfirm.item.presetName || 'Ảnh biến đổi'}
                  </div>
                </div>
              </div>
            )}

            {/* 2 Buttons: Hủy & Xác nhận Xóa */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, item: null, isAll: false })}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.isAll) {
                    if (onClearAll) onClearAll();
                  } else if (deleteConfirm.item) {
                    if (onDeleteItem) onDeleteItem(deleteConfirm.item.id);
                  }
                  setDeleteConfirm({ isOpen: false, item: null, isAll: false });
                }}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)'
                }}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
