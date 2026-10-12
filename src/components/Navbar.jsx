import React from 'react';
import Tooltip from './Tooltip';

export default function Navbar({
  walletBalance,
  onOpenTopup,
  user,
  onOpenGoogleAuth,
  onLogout,
  activeTab,
  setActiveTab,
  onlineWorkersCount = 3,
  onOpenAdmin
}) {
  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('vi-VN') + 'đ';
  };

  return (
    <header className="liquid-topbar">
      {/* Brand / Logo Capsule */}
      <Tooltip text="MzPic Pro - Về trang chủ Studio" position="bottom">
        <div
          className="liquid-brand-capsule"
          onClick={() => setActiveTab('single')}
          style={{ cursor: 'pointer' }}
        >
          <div className="liquid-brand-logo">M</div>
          <span className="liquid-brand-title">MzPic</span>
        </div>
      </Tooltip>

      {/* Center Utility Capsules: Thư viện */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Thư viện - Tăng bề rộng gấp đôi */}
        <Tooltip text="Thư viện ảnh VPS thời gian thực" position="bottom">
          <button
            type="button"
            className={`liquid-pill-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab(activeTab === 'library' ? 'single' : 'library')}
            style={{
              minWidth: '108px',
              padding: '5px 18px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <i className="bi bi-images" style={{ fontSize: '0.85rem' }}></i>
            <span>Kho</span>
          </button>
        </Tooltip>
      </div>

      {/* Right Controls: Wallet & Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Wallet Pill */}
        <Tooltip text={`Số dư ví: ${formatCurrency(walletBalance)}. Bấm nạp`} position="bottom">
          <div className="liquid-wallet-capsule" onClick={onOpenTopup}>
            <span>{formatCurrency(walletBalance)}</span>
            <div className="liquid-wallet-add">
              <i className="bi bi-plus"></i>
            </div>
          </div>
        </Tooltip>

        {/* User Auth */}
        {!user ? (
          <Tooltip text="Đăng nhập Google" position="bottom">
            <button
              type="button"
              onClick={onOpenGoogleAuth}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <i className="bi bi-person text-slate-700" style={{ fontSize: '0.95rem' }}></i>
            </button>
          </Tooltip>
        ) : (
          <Tooltip text={`Tài khoản: ${user.name} (Bấm đăng xuất)`} position="bottom">
            <img
              src={user.avatar}
              alt="Avatar"
              onClick={onLogout}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </Tooltip>
        )}
      </div>
    </header>
  );
}
