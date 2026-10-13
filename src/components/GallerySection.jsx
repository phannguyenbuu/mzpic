import React, { useState, useEffect, useMemo } from 'react';
import Tooltip from './Tooltip';

export default function GallerySection({ onOpenInStudio, showToast, onOpenLightbox }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Lỗi nạp thư viện:', e);
      if (showToast) showToast('Không thể tải thư viện từ VPS', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = (item.prompt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.style || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;

      if (sourceFilter === 'all') return true;
      if (sourceFilter === 'api') return item.caller_type === 'external_api' || item.caller_system;
      if (sourceFilter === 'web') return !item.caller_type || item.caller_type === 'web';
      return true;
    });
  }, [items, searchTerm, sourceFilter]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const handleCopyLink = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    if (showToast) showToast('Đã sao chép link ảnh CDN VPS!', 'success');
  };

  const handleDownload = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `ToolXPrint_${Date.now()}.png`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Search & Filter Bar */}
      <div className="liquid-card" style={{ padding: '12px' }}>
        <div className="liquid-card-glow"></div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Thư Viện VPS</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({items.length} ảnh)</span>
            <Tooltip text="Kho lưu trữ file ảnh chuẩn in 300 DPI trên VPS ToolXPrint">
              <span className="tooltip-trigger-icon">?</span>
            </Tooltip>
          </div>

          <Tooltip text="Làm mới danh sách từ VPS">
            <button
              type="button"
              onClick={fetchGallery}
              disabled={loading}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            </button>
          </Tooltip>
        </div>

        {/* Search input */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder="Tìm theo prompt, phong cách..."
          className="liquid-pill-input"
          style={{ width: '100%', padding: '6px 12px', fontSize: '0.8rem', marginBottom: '8px' }}
        />

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'web', label: 'Web Studio' },
            { id: 'api', label: 'API Caller' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`liquid-pill-btn ${sourceFilter === f.id ? 'active' : ''}`}
              style={{ fontSize: '0.7rem', padding: '3px 10px' }}
              onClick={() => { setSourceFilter(f.id); setCurrentPage(1); }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of 2 columns */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <i className="bi bi-arrow-repeat spin" style={{ fontSize: '1.8rem', color: '#3b82f6' }}></i>
          <div style={{ fontSize: '0.8rem', marginTop: '8px' }}>Đang nạp thư viện từ VPS...</div>
        </div>
      ) : paginatedItems.length === 0 ? (
        <div className="liquid-card" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
          <i className="bi bi-inbox" style={{ fontSize: '2rem', color: '#94a3b8' }}></i>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '8px' }}>Không có ấn phẩm nào</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {paginatedItems.map((item) => {
            const thumbUrl = item.thumbnail || item.vpsUrl || (item.filename ? `/images/${item.filename}` : '');
            const fullUrl = item.vpsUrl || (item.filename ? `/images/${item.filename}` : '') || thumbUrl;

            return (
              <div
                key={item.id}
                className="liquid-card"
                style={{
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  overflow: 'hidden'
                }}
              >
                {/* Thumbnail Image Container */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#f1f5f9',
                    cursor: 'pointer'
                  }}
                  onClick={() => onOpenInStudio(fullUrl, item.prompt)}
                  title="Nhấn để mở ấn phẩm trong Studio"
                >
                  <img
                    src={thumbUrl}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      if (e.target.src !== fullUrl) {
                        e.target.src = fullUrl;
                      }
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />

                  {/* 300 DPI chip */}
                  <div style={{ position: 'absolute', top: '6px', left: '6px' }}>
                    <span
                      style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        backdropFilter: 'blur(8px)',
                        color: '#ffffff',
                        fontSize: '0.55rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '9999px'
                      }}
                    >
                      300 DPI
                    </span>
                  </div>
                </div>

                {/* Quick Actions Bar - Only buttons, no prompt text */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                    padding: '0 2px'
                  }}
                >
                  <button
                    type="button"
                    className="liquid-pill-btn active"
                    style={{ fontSize: '0.65rem', padding: '2px 8px', height: '22px' }}
                    onClick={() => onOpenInStudio(fullUrl, item.prompt)}
                  >
                    Studio
                  </button>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => onOpenLightbox && onOpenLightbox(fullUrl, item.prompt || 'Ảnh Thư Viện VPS')}
                      title="Xem ảnh gốc (Phóng to / Zoom / Pan)"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        padding: '2px'
                      }}
                    >
                      <i className="bi bi-arrows-fullscreen"></i>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(fullUrl)}
                      title="Sao chép link CDN"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        padding: '2px'
                      }}
                    >
                      <i className="bi bi-link-45deg"></i>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(fullUrl)}
                      title="Tải ảnh về máy"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        padding: '2px'
                      }}
                    >
                      <i className="bi bi-download"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
          <button
            type="button"
            className="liquid-pill-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            Trước
          </button>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="liquid-pill-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
