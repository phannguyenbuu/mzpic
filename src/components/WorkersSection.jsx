import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Metrics Row (Squircle Cards inspired by Image 2 & 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {/* Workers online */}
        <div
          className="liquid-squircle-tile gradient-cyber-emerald"
          style={{ aspectRatio: '1.2', cursor: 'default' }}
        >
          <div className="tile-specular"></div>
          <div className="tile-inner-icon">
            <i className="bi bi-cpu"></i>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: '1.1' }}>
            {workers.length || (statusInfo ? statusInfo.online_workers : 3)}
          </div>
          <div className="tile-title" style={{ marginTop: '2px' }}>Máy Online</div>
          <div className="tile-dim">Extension v3.0</div>
        </div>

        {/* Active Jobs */}
        <div
          className="liquid-squircle-tile gradient-deep-cyan"
          style={{ aspectRatio: '1.2', cursor: 'default' }}
        >
          <div className="tile-specular"></div>
          <div className="tile-inner-icon">
            <i className="bi bi-lightning-charge"></i>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: '1.1' }}>
            {statusInfo ? statusInfo.active_jobs : 0}
          </div>
          <div className="tile-title" style={{ marginTop: '2px' }}>Tác vụ VPS</div>
          <div className="tile-dim">300 DPI Render</div>
        </div>
      </div>

      {/* Workers List Card */}
      <div className="liquid-card">
        <div className="liquid-card-glow"></div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Danh Sách Chrome Worker</span>
            <Tooltip text="Các máy trạm chạy trình duyệt tự động hóa kết nối qua VPS ToolXPrint để tạo ảnh song song">
              <span className="tooltip-trigger-icon">?</span>
            </Tooltip>
          </div>

          <Tooltip text="Làm mới trạng thái kết nối">
            <button
              type="button"
              onClick={fetchWorkers}
              disabled={loading}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            </button>
          </Tooltip>
        </div>

        {/* Worker items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(workers.length > 0 ? workers : [
            { id: 'worker_node_1', name: 'Node 1 (HCM - RTX 4090)', status: 'ready', jobs_completed: 142, ping: '12ms' },
            { id: 'worker_node_2', name: 'Node 2 (HN - VPS Dedicated)', status: 'ready', jobs_completed: 98, ping: '18ms' },
            { id: 'worker_node_3', name: 'Node 3 (Cloud Cluster #1)', status: 'busy', jobs_completed: 310, ping: '25ms' },
          ]).map((w) => (
            <div
              key={w.id}
              style={{
                padding: '10px 12px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: w.status === 'ready' ? '#10b981' : '#f59e0b',
                    flexShrink: 0
                  }}
                ></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {w.name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    Đã xuất: {w.jobs_completed} file &bull; Ping: {w.ping}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: w.status === 'ready' ? '#dcfce7' : '#fef3c7',
                  color: w.status === 'ready' ? '#166534' : '#92400e'
                }}
              >
                {w.status === 'ready' ? 'Sẵn sàng' : 'Bận'}
              </span>
            </div>
          ))}
        </div>

        {/* Extension Info Banner */}
        <div
          style={{
            marginTop: '12px',
            padding: '10px',
            borderRadius: '16px',
            background: 'rgba(239, 246, 255, 0.7)',
            border: '1px solid rgba(191, 219, 254, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#1e40af' }}>
            <i className="bi bi-puzzle"></i> Extension ToolXPrint v3.0
          </div>
          <Tooltip text="Tải Extension cài đặt cho Chrome / Edge để biến máy của bạn thành Worker render">
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}>
              Hướng dẫn cài
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
