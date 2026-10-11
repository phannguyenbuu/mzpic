import React, { useState, useEffect, useMemo } from 'react';
import Tooltip from './Tooltip';

export default function GallerySection({ onOpenInStudio, showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

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
    const a = document.createElement('a');
    a.href = url;
    a.download = `ToolXPrint_${Date.now()}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
          {paginatedItems.map((item) => (
            <div
              key={item.id}
              className="liquid-card"
              style={{
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '20px',
                overflow: 'hidden'
              }}
            >
              {/* Image Container */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: '#f1f5f9'
                }}
              >
                <img
                  src={item.url}
                  alt={item.prompt}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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

              {/* Title / Prompt */}
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#0f172a',
                  marginTop: '6px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: '1.3'
                }}
              >
                {item.prompt || 'Ấn phẩm in'}
              </div>

              {/* Quick Actions Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(226, 232, 240, 0.6)' }}>
                <Tooltip text="Nạp ảnh này vào Studio">
                  <button
                    type="button"
                    className="liquid-pill-btn active"
                    style={{ fontSize: '0.62rem', padding: '2px 8px' }}
                    onClick={() => onOpenInStudio(item.url, item.prompt)}
                  >
                    Studio
                  </button>
                </Tooltip>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <Tooltip text="Sao chép link CDN">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.url)}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      <i className="bi bi-link-45deg"></i>
                    </button>
                  </Tooltip>

                  <Tooltip text="Tải ảnh về máy">
                    <button
                      type="button"
                      onClick={() => handleDownload(item.url)}
                      style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      <i className="bi bi-download"></i>
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
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
