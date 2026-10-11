import React from 'react';
import Tooltip from './Tooltip';

export default function Navbar({
  walletBalance,
  onOpenTopup,
  user,
  onOpenGoogleAuth,
  onLogout,
  onResetSession,
  activeTab,
  setActiveTab
}) {
  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('vi-VN') + 'đ';
  };

  return (
    <header className="liquid-topbar">
      {/* Brand / Logo Capsule */}
      <Tooltip text="MzPic Pro - Nền tảng GenAI in ấn chuẩn 300 DPI" position="bottom">
        <div
          className="liquid-brand-capsule"
          onClick={() => setActiveTab('single')}
          style={{ cursor: 'pointer' }}
        >
          <div className="liquid-brand-logo">M</div>
          <span className="liquid-brand-title">MzPic</span>
        </div>
      </Tooltip>

      {/* Dynamic Center Badge (Image 1 style) */}
      <Tooltip text="Chuẩn bị in offset & kỹ thuật số 300 DPI" position="bottom">
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
          <span>ToolXPrint</span>
        </div>
      </Tooltip>

      {/* Right Controls: Wallet & Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Wallet Pill */}
        <Tooltip text={`Số dư: ${formatCurrency(walletBalance)}. Bấm nạp thêm`} position="bottom">
          <div className="liquid-wallet-capsule" onClick={onOpenTopup}>
            <span>{formatCurrency(walletBalance)}</span>
            <div className="liquid-wallet-add">
              <i className="bi bi-plus"></i>
            </div>
          </div>
        </Tooltip>

        {/* User Auth */}
        {!user ? (
          <Tooltip text="Đăng nhập tài khoản Google" position="bottom">
            <button
              type="button"
              onClick={onOpenGoogleAuth}
              style={{
                width: '32px',
                height: '32px',
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
              <i className="bi bi-person text-slate-700" style={{ fontSize: '1rem' }}></i>
            </button>
          </Tooltip>
        ) : (
          <Tooltip text={`Tài khoản: ${user.name} (Bấm để đăng xuất)`} position="bottom">
            <img
              src={user.avatar}
              alt="Avatar"
              onClick={onLogout}
              style={{
                width: '32px',
                height: '32px',
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
