import React, { useState, useEffect, useMemo } from 'react';

export default function GallerySection({ onOpenInStudio, showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
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

  const handleCopyLink = (url, id) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    if (showToast) showToast('Đã sao chép link ảnh CDN trên VPS!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (url, promptText) => {
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
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '20px 24px' }}>
      {/* Header bar */}
      <div className="card-header-bar" style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="bi bi-images" style={{ fontSize: '1.4rem', color: 'var(--blue-primary)' }}></i>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Thư viện Ấn phẩm GenAI ToolXPrint
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Đồng bộ thời gian thực từ kho lưu trữ máy chủ VPS ({items.length} ấn phẩm đã tạo)
            </div>
          </div>
        </div>

        <button
          className="btn-reset-session"
          onClick={fetchGallery}
          disabled={loading}
          style={{ padding: '6px 14px' }}
        >
          <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Làm mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
          <input
            type="text"
            className="form-input"
            placeholder="Tìm kiếm theo nội dung prompt hoặc phong cách..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={`cat-chip ${sourceFilter === 'all' ? 'active' : ''}`}
            onClick={() => { setSourceFilter('all'); setCurrentPage(1); }}
          >
            Tất cả ({items.length})
          </button>
          <button
            type="button"
            className={`cat-chip ${sourceFilter === 'web' ? 'active' : ''}`}
            onClick={() => { setSourceFilter('web'); setCurrentPage(1); }}
          >
            Web Studio
          </button>
          <button
            type="button"
            className={`cat-chip ${sourceFilter === 'api' ? 'active' : ''}`}
            onClick={() => { setSourceFilter('api'); setCurrentPage(1); }}
          >
            API / Python
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2.5rem', color: 'var(--blue-primary)' }}></i>
          <div style={{ marginTop: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
            Đang tải dữ liệu thư viện từ VPS ToolXPrint...
          </div>
        </div>
      ) : paginatedItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <i className="bi bi-inbox" style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }}></i>
          <div style={{ marginTop: '10px', fontWeight: 600, color: 'var(--text-main)' }}>Không tìm thấy ấn phẩm nào</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Thử thay đổi từ khóa tìm kiếm hoặc quay lại Studio tạo ấn phẩm mới
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {paginatedItems.map((item, idx) => {
            const imgUrl = item.vpsUrl || `/images/${item.localPath || item.filename}`;
            const id = item.id || `img_${idx}`;
            return (
              <div
                key={id}
                className="toolx-card"
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.2s', boxShadow: 'var(--shadow-card)' }}
              >
                {/* Image Stage */}
                <div style={{ position: 'relative', width: '100%', height: '220px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={imgUrl}
                    alt={item.prompt || 'Ấn phẩm'}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                    {item.aspectRatio && (
                      <span className="result-badge" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(15,23,42,0.7)', color: '#ffffff' }}>
                        {item.aspectRatio}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: '1.4', maxHeight: '42px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontWeight: 500 }}>
                    {item.prompt || 'Ấn phẩm không có prompt mô tả'}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>
                      <i className="bi bi-clock"></i> {item.timestamp || 'Gần đây'}
                    </span>
                    {item.caller_system && (
                      <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.caller_system}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '6px' }}>
                    <button
                      className="tab-pill-btn active"
                      style={{ flex: 1, fontSize: '0.72rem', padding: '5px', textAlign: 'center' }}
                      onClick={() => onOpenInStudio(imgUrl, item.prompt)}
                      title="Mở ảnh này trong Studio để sửa hoặc xem 3D Mockup"
                    >
                      <i className="bi bi-magic"></i> Mở Studio
                    </button>
                    <button
                      className="tab-pill-btn"
                      style={{ fontSize: '0.72rem', padding: '5px 8px' }}
                      onClick={() => handleCopyLink(imgUrl, id)}
                      title="Sao chép link CDN máy chủ VPS"
                    >
                      <i className={`bi ${copiedId === id ? 'bi-check2 text-success' : 'bi-link-45deg'}`}></i>
                    </button>
                    <button
                      className="tab-pill-btn"
                      style={{ fontSize: '0.72rem', padding: '5px 8px' }}
                      onClick={() => handleDownload(imgUrl, item.prompt)}
                      title="Tải ảnh gốc về máy"
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '24px' }}>
          <button
            className="tab-pill-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <i className="bi bi-chevron-left"></i> Trang trước
          </button>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Trang {currentPage} / {totalPages}
          </span>
          <button
            className="tab-pill-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Trang sau <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}
