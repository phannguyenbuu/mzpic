import React, { useState } from 'react';
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
  onOpenAdmin,
  onOpenGalleryModal,
  galleryCount = 0
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('vi-VN') + 'đ';
  };

  return (
    <header className="liquid-topbar" style={{ position: 'relative' }}>
      {/* Brand / Logo Capsule (Trái) */}
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

      {/* Center: Gallery Button (Ở giữa Header) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Tooltip text="Gallery tác phẩm đã biến đổi của bạn (Before / After slider)" position="bottom">
          <button
            type="button"
            onClick={onOpenGalleryModal}
            className="liquid-pill-btn"
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.92)',
              border: '1.5px solid rgba(226, 232, 240, 0.95)',
              color: '#0f172a',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <i className="bi bi-collection-play-fill text-indigo-600" style={{ fontSize: '0.92rem' }}></i>
            <span style={{ letterSpacing: '0.01em' }}>Gallery</span>
            {galleryCount > 0 && (
              <span
                style={{
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  marginLeft: '2px'
                }}
              >
                {galleryCount}
              </span>
            )}
          </button>
        </Tooltip>
      </div>

      {/* Right Controls: Wallet & Auth (Phải) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          <Tooltip text="Đăng nhập tài khoản (Google, Email, Token/QR)" position="bottom">
            <button
              type="button"
              onClick={onOpenGoogleAuth}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px 8px',
                minWidth: '42px',
                height: '36px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1.5px solid rgba(226, 232, 240, 0.95)',
                color: '#1e293b',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
                gap: '2px',
                lineHeight: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.color = '#2563eb';
                e.currentTarget.style.background = '#f0f7ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.95)';
                e.currentTarget.style.color = '#1e293b';
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              <i className="bi bi-person-circle" style={{ fontSize: '1.05rem', lineHeight: 1 }}></i>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, lineHeight: 1, letterSpacing: '0.01em' }}>
                Login
              </span>
            </button>
          </Tooltip>
        ) : (
          <div style={{ position: 'relative' }}>
            <Tooltip text={`Tài khoản: ${user.name} • Bấm để xem Menu`} position="bottom">
              <div
                onClick={() => setUserMenuOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: '2px 4px 2px 2px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(226, 232, 240, 0.8)'
                }}
              >
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                  alt="Avatar"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid #3b82f6'
                  }}
                />
                <i className="bi bi-chevron-down" style={{ fontSize: '0.65rem', color: '#64748b', marginRight: '4px' }}></i>
              </div>
            </Tooltip>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                  onClick={() => setUserMenuOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '115%',
                    right: 0,
                    width: '220px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    padding: '8px',
                    zIndex: 101,
                    animation: 'fadeIn 0.15s ease'
                  }}
                >
                  <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>{user.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email || 'user@mzpic.com'}</div>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        background: user.role === 'admin' ? '#fef3c7' : '#e0e7ff',
                        color: user.role === 'admin' ? '#b45309' : '#3730a3'
                      }}
                    >
                      {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        onOpenGalleryModal();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: '#334155',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <i className="bi bi-collection-play-fill text-indigo-600"></i>
                      <span>Gallery của tôi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setActiveTab('admin');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: '#334155',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <i className="bi bi-sliders text-blue-600"></i>
                      <span>Cài đặt & Quản trị</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onLogout) onLogout();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        borderTop: '1px solid #f1f5f9',
                        marginTop: '2px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
