import React from 'react';
import Tooltip from './Tooltip';

export default function BottomDock({ activeTab, setActiveTab }) {
  const isAgentApi = typeof window !== 'undefined' && (
    window.location.host.includes('agentapi') ||
    window.location.pathname.includes('/mzpic')
  );

  const items = [
    {
      id: 'single',
      label: 'Ảnh Đơn',
      icon: 'bi-stars',
      hint: 'Tạo & Sửa ấn phẩm đơn lẻ',
      url: isAgentApi ? 'https://mzpic.com/single' : null
    },
    {
      id: 'batch',
      label: 'Hàng Loạt',
      icon: 'bi-stack',
      hint: 'Sửa ấn phẩm hàng loạt theo danh sách',
      url: isAgentApi ? 'https://mzpic.com/batch' : null
    },
    {
      id: 'upscale',
      label: 'Kích Nét',
      icon: 'bi-arrows-angle-expand',
      badge: '8X',
      hint: 'Kích nét siêu phân giải 2X, 4X, 8X',
      url: isAgentApi ? 'https://mzpic.com/upscale' : null
    }
  ];

  const handleItemClick = (item) => {
    if (item.url) {
      window.location.href = item.url;
    } else {
      setActiveTab(item.id);
    }
  };

  return (
    <nav className="liquid-dock-container" aria-label="Taskbar chính">
      <div className="liquid-dock">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`dock-item ${isActive ? 'active' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <Tooltip text={item.hint} position="top" style={{ width: '100%', height: '100%', display: 'flex' }}>
                <div className="dock-item-content">
                  <div className="dock-icon-box">
                    <i className={`bi ${item.icon}`}></i>
                  </div>
                  <span className="dock-label">{item.label}</span>
                  {item.badge && <span className={`dock-badge ${isActive ? 'badge-active' : ''}`}>{item.badge}</span>}
                </div>
              </Tooltip>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
