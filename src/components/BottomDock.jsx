import React from 'react';
import Tooltip from './Tooltip';

export default function BottomDock({ activeTab, setActiveTab, workersCount = 3 }) {
  const items = [
    { id: 'single', label: 'Single', icon: 'bi-stars', hint: 'Tạo & Sửa ấn phẩm đơn lẻ' },
    { id: 'batch', label: 'Batch', icon: 'bi-stack', badge: 'Mới', hint: 'Tạo ấn phẩm hàng loạt theo danh sách' },
    { id: 'upscale', label: 'Kích Nét', icon: 'bi-arrows-angle-expand', badge: '10X', hint: 'Kích nét siêu phân giải 300-600 DPI' },
    { id: 'library', label: 'Thư viện', icon: 'bi-images', hint: 'Kho lưu trữ ảnh VPS thời gian thực' },
    { id: 'devices', label: 'Máy', icon: 'bi-cpu', badge: `${workersCount}`, hint: 'Danh sách Chrome Workers trực tuyến' },
  ];

  return (
    <div className="liquid-dock-container">
      <div className="liquid-dock">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Tooltip key={item.id} text={item.hint} position="top">
              <button
                type="button"
                className={`dock-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <div className="dock-icon-box">
                  <i className={`bi ${item.icon}`}></i>
                </div>
                <span>{item.label}</span>
                {item.badge && <span className="dock-badge">{item.badge}</span>}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
