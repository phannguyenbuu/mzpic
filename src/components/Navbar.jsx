import React from 'react';

export default function Navbar({
  walletBalance,
  onOpenTopup,
  user,
  onOpenGoogleAuth,
  onLogout,
  onQuickDownload,
  hasResult,
  activeTab,
  setActiveTab,
  onlineWorkersCount = 3
}) {
  const tabs = [
    { id: 'single', label: 'Single', badge: null },
    { id: 'batch', label: 'Batch', badge: 'Mới', badgeClass: 'badge-blue' },
    { id: 'upscale', label: 'Kích Nét AI', badge: '10X', badgeClass: 'badge-purple' },
    { id: 'library', label: 'Thư viện', badge: null, hasDropdown: false },
    { id: 'devices', label: 'Máy & Extension', badge: `${onlineWorkersCount || 3}`, badgeClass: 'badge-green' },
    { id: 'docs', label: 'API Docs', badge: 'REST', badgeClass: 'badge-blue' },
  ];

  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('vi-VN') + 'đ';
  };

  return (
    <header className="toolx-navbar">
      <div className="nav-left-group">
        <a
          href="#"
          className="brand-mzpic"
          title="MzPic - Nền tảng thiết kế ấn phẩm AI (GenAI ToolXPrint)"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('single');
          }}
        >
          <div className="brand-mzpic-logo">M</div>
          <div className="brand-mzpic-text">
            <span>Mz</span><span className="accent">Pic</span>
            <span className="brand-mzpic-tag">PRO</span>
          </div>
        </a>
      </div>

      <nav className="nav-center-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.badge && (
              <span className={`pill-badge ${tab.badgeClass}`}>{tab.badge}</span>
            )}
            {tab.hasDropdown && (
              <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem', marginLeft: '3px' }}></i>
            )}
          </button>
        ))}
      </nav>

      <div className="nav-right-actions">
        {/* Ví người dùng (Wallet) */}
        <div
          className="wallet-badge"
          id="walletBadge"
          title="Bấm để xem chi tiết hoặc nạp thêm tiền"
          onClick={onOpenTopup}
          style={{ cursor: 'pointer' }}
        >
          <div className="wallet-icon-box">
            <i className="bi bi-wallet2"></i>
          </div>
          <div className="wallet-info">
            <span className="wallet-label">Ví MzPic</span>
            <span className="wallet-amount" id="walletAmountDisplay">
              {formatCurrency(walletBalance)}
            </span>
          </div>
          <button
            className="btn-topup-wallet"
            onClick={(e) => {
              e.stopPropagation();
              onOpenTopup();
            }}
            title="Nạp thêm tiền vào ví"
          >
            <i className="bi bi-plus-lg"></i> Nạp
          </button>
        </div>

        {/* Nút Đăng nhập / Hồ sơ người dùng */}
        {!user ? (
          <button
            className="btn-google-auth"
            onClick={onOpenGoogleAuth}
            title="Đăng nhập hoặc đăng ký bằng tài khoản Google"
          >
            <svg viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>Đăng nhập Google</span>
          </button>
        ) : (
          <div className="user-profile-badge" style={{ display: 'flex' }}>
            <img className="user-avatar-img" src={user.avatar} alt="Avatar" />
            <span>{user.name}</span>
            <i
              className="bi bi-box-arrow-right text-muted"
              title="Đăng xuất"
              onClick={onLogout}
              style={{ cursor: 'pointer', marginLeft: '6px' }}
            ></i>
          </div>
        )}

        <button
          className={`btn-icon-nav btn-icon-green ${!hasResult ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={onQuickDownload}
          title="Tải xuống nhanh kết quả thiết kế"
          disabled={!hasResult}
        >
          <i className="bi bi-download"></i>
        </button>

        <button className="btn-icon-nav" title="Cài đặt hệ thống">
          <i className="bi bi-gear"></i>
        </button>
      </div>
    </header>
  );
}
