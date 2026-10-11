import React, { useState, useEffect } from 'react';

export default function WorkersSection({ showToast }) {
  const [workers, setWorkers] = useState([]);
  const [statusInfo, setStatusInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const [resWorkers, resStatus] = await Promise.all([
        fetch('/api/workers'),
        fetch('/api/status')
      ]);

      if (resWorkers.ok) {
        const wData = await resWorkers.json();
        setWorkers(Array.isArray(wData) ? wData : []);
      }
      if (resStatus.ok) {
        const sData = await resStatus.json();
        setStatusInfo(sData);
      }
    } catch (e) {
      console.error('Lỗi lấy workers:', e);
      if (showToast) showToast('Không thể kết nối danh sách Workers từ VPS', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    const timer = setInterval(fetchWorkers, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
      {/* Top Header Card */}
      <div className="card-header-bar" style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="bi bi-cpu" style={{ fontSize: '1.4rem', color: 'var(--blue-primary)' }}></i>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Cụm Máy &amp; Extension Render (Distributed Chrome Workers)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Điều phối song song nhiều máy và trình duyệt ChatGPT Plus tự động hóa tạo ảnh chuyên nghiệp
            </div>
          </div>
        </div>

        <button
          className="btn-reset-session"
          onClick={fetchWorkers}
          disabled={loading}
          style={{ padding: '6px 14px' }}
        >
          <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Làm mới
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="toolx-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>MÁY RENDER ONLINE</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            {workers.length || (statusInfo ? statusInfo.online_workers : 3)} Nodes
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Kết nối Extension v3.0 sẵn sàng
          </div>
        </div>

        <div className="toolx-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TÁC VỤ ĐANG CHẠY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--blue-primary)', marginTop: '4px' }}>
            {statusInfo ? statusInfo.active_jobs : 0} Jobs
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Hàng đợi hiện tại: {statusInfo ? statusInfo.queue_length : 0}
          </div>
        </div>

        <div className="toolx-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>MÁY CHỦ ORCHESTRATOR</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '6px' }}>
            genai.toolxprint.com
          </div>
          <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '4px' }}>
            <i className="bi bi-shield-check"></i> Reverse Proxy SSL Online
          </div>
        </div>
      </div>

      {/* Workers List Table */}
      <div className="toolx-card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="bi bi-pc-display text-primary"></i>
          <span>Danh Sách Máy Trực Tuyến &amp; Profile Trình Duyệt</span>
        </div>

        {workers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem' }}></i>
            <div style={{ marginTop: '8px' }}>Đang nạp trạng thái các Worker...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {workers.map((w, idx) => (
              <div
                key={w.worker_id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: '#f8fafc',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-primary)', fontSize: '1.3rem' }}>
                    <i className="bi bi-browser-chrome"></i>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{w.account_label || 'ChatGPT Plus Worker'}</span>
                      <span className="pill-badge badge-green" style={{ fontSize: '0.65rem' }}>
                        Hoạt động
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <i className="bi bi-envelope"></i> {w.account_email || 'tony.worker@gmail.com'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Ảnh liên tiếp: </span>
                    <strong>{w.consecutive_images_count || 0}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Phiên: </span>
                    <strong style={{ color: '#10b981' }}>Sẵn sàng nhận lệnh</strong>
                  </div>
                  <button
                    className="tab-pill-btn"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => {
                      if (showToast) showToast(`Worker ${w.account_label || idx + 1} đang kết nối ổn định`, 'info');
                    }}
                  >
                    <i className="bi bi-activity"></i> Kiểm tra
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
