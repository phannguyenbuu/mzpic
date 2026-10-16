import React, { useEffect, useRef, useState } from 'react';
import { loginWithGoogleCredential, setStoredAuth } from '../utils/agentApi';

export const GOOGLE_CLIENT_ID = '475773389104-4frju27uljiuj0mtihidgude16ghr39t.apps.googleusercontent.com';

export default function GoogleAuthModal({ isOpen, onClose, onLogin, showToast, isRequired = false }) {
  const [activeTab, setActiveTab] = useState('google'); // 'google', 'email', 'token_qr'
  const googleBtnRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Token / QR state
  const [tokenInput, setTokenInput] = useState('');
  const [qrToken, setQrToken] = useState(() => `MZPIC_AUTH_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Handle Google GIS Credential
  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setErrorMsg('Không nhận được mã xác thực từ Google');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const authResult = await loginWithGoogleCredential(response.credential);
      if (authResult.ok && authResult.user) {
        if (showToast) showToast(`🎉 Xin chào ${authResult.user.name}! Đăng nhập Google thành công.`, 'success');
        if (onLogin) onLogin(authResult.user);
        onClose();
      } else {
        throw new Error('Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('Lỗi đăng nhập Google:', err);
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ xác thực');
      if (showToast) showToast('Đăng nhập Google thất bại!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Google Identity Services
  useEffect(() => {
    if (!isOpen || activeTab !== 'google') return;

    let timer = setTimeout(() => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              width: 290,
              text: 'continue_with',
              shape: 'pill',
              logo_alignment: 'left'
            });
          }
        } catch (e) {
          console.warn('GSI render error:', e);
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, activeTab]);

  // Handle Email / Password Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ Email hợp lệ');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Vui lòng nhập mật khẩu (tối thiểu 4 ký tự)');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // Gọi API đăng nhập GoPrinx / AgentAPI hoặc tạo session trực tiếp
      const username = email.split('@')[0];
      const user = {
        id: 'usr_' + Date.now().toString(36),
        name: username.charAt(0).toUpperCase() + username.slice(1),
        email: email.trim().toLowerCase(),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        role: 'user',
        loginType: 'email'
      };
      const token = 'mzpic_token_' + btoa(email + ':' + Date.now());

      setStoredAuth(token, user);

      if (showToast) showToast(`🎉 Đăng nhập thành công với tài khoản: ${email}`, 'success');
      if (onLogin) onLogin(user);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi đăng nhập Email');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Token Direct Login
  const handleTokenLogin = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg('Vui lòng nhập Access Token hoặc mã token nbuu');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const cleanToken = tokenInput.trim();
      const isNbuu = cleanToken.toLowerCase() === 'nbuu';
      const oneDayMs = 24 * 60 * 60 * 1000; // Duy trì đúng 1 ngày (24 giờ)
      const expiresAt = Date.now() + oneDayMs;

      const user = isNbuu
        ? {
            id: 'usr_nbuu',
            name: 'Nguyên Bửu (Admin)',
            email: 'phannguyenbuu@gmail.com',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
            role: 'admin',
            token: 'nbuu',
            loginType: 'token',
            expiresAt: expiresAt
          }
        : {
            id: 'token_usr_' + cleanToken.slice(-6),
            name: 'Token User',
            email: 'token@adm.toolxprint.com',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
            role: 'admin',
            token: cleanToken,
            loginType: 'token',
            expiresAt: expiresAt
          };

      setStoredAuth(cleanToken, user);

      if (showToast) {
        showToast(
          isNbuu
            ? '🎉 Xin chào Nguyên Bửu! Đã đăng nhập quyền Admin (thời hạn 24 giờ).'
            : '🎉 Kết nối thành công bằng Access Token (thời hạn 24 giờ)!',
          'success'
        );
      }
      if (onLogin) onLogin(user);
      onClose();
    } catch (err) {
      setErrorMsg('Token không hợp lệ!');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (isRequired) {
      if (showToast) showToast('🔒 Bạn cần đăng nhập để bắt đầu làm việc trong Studio!', 'warning');
      return;
    }
    if (onClose) onClose();
  };

  return (
    <div className="liquid-modal-backdrop" onClick={handleBackdropClick} style={{ zIndex: 12000 }}>
      <div
        className="liquid-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '24px 20px',
          maxWidth: '420px',
          width: '92vw',
          borderRadius: '24px',
          background: 'rgba(255, 255, 255, 0.98)',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)'
        }}
      >
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: '#ffffff',
              boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              border: '1.5px solid rgba(226, 232, 240, 0.9)'
            }}
          >
            {activeTab === 'google' && (
              <svg viewBox="0 0 48 48" style={{ width: '30px', height: '30px' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            )}
            {activeTab === 'email' && (
              <i className="bi bi-envelope-fill text-blue-600" style={{ fontSize: '1.6rem' }}></i>
            )}
            {activeTab === 'token_qr' && (
              <i className="bi bi-qr-code text-indigo-600" style={{ fontSize: '1.6rem' }}></i>
            )}
          </div>

          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
            Đăng Nhập Tài Khoản
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
            Đồng bộ dữ liệu & quản lý prompt qua <b>adm.toolxprint.com</b>
          </div>
        </div>

        {/* 3 Nav Tabs: Google / Email / Token-QR */}
        <div
          style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '14px',
            padding: '4px',
            marginBottom: '16px',
            gap: '4px'
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('google'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '7px 4px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeTab === 'google' ? '#ffffff' : 'transparent',
              color: activeTab === 'google' ? '#2563eb' : '#64748b',
              boxShadow: activeTab === 'google' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <i className="bi bi-google"></i>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('email'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '7px 4px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeTab === 'email' ? '#ffffff' : 'transparent',
              color: activeTab === 'email' ? '#2563eb' : '#64748b',
              boxShadow: activeTab === 'email' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <i className="bi bi-envelope"></i>
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('token_qr'); setErrorMsg(''); }}
            style={{
              flex: 1,
              padding: '7px 4px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: activeTab === 'token_qr' ? '#ffffff' : 'transparent',
              color: activeTab === 'token_qr' ? '#2563eb' : '#64748b',
              boxShadow: activeTab === 'token_qr' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
          >
            <i className="bi bi-qr-code-scan"></i>
            <span>Token / QR</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              fontSize: '0.72rem',
              fontWeight: 600,
              marginBottom: '14px',
              textAlign: 'center'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* ── TAB 1: GOOGLE SIGN-IN ── */}
        {activeTab === 'google' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 18px' }}>
            <div ref={googleBtnRef} style={{ minHeight: '44px', display: 'flex', justifyContent: 'center' }}></div>
          </div>
        )}

        {/* ── TAB 2: EMAIL & PASSWORD ── */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Địa chỉ Email
              </label>
              <div style={{ position: 'relative' }}>
                <i
                  className="bi bi-envelope"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}
                ></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@quanlymay.com"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.8rem',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <i
                  className="bi bi-lock"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}
                ></i>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.8rem',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748b', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ghi nhớ phiên đăng nhập</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="liquid-pill-btn"
              style={{
                width: '100%',
                padding: '9px 0',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                marginTop: '4px'
              }}
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng Nhập Bằng Email'}
            </button>
          </form>
        )}

        {/* ── TAB 3: TOKEN / QUÉT QR ── */}
        {activeTab === 'token_qr' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
            {/* Direct Token Paste */}
            <form onSubmit={handleTokenLogin} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
                Nhập Access Token / API Key
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Nhập mã token (ví dụ: nbuu)..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.78rem',
                    outline: 'none',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="liquid-pill-btn"
                  style={{
                    padding: '8px 14px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Kết Nối
                </button>
              </div>
            </form>

            {/* QR Code login display */}
            <div
              style={{
                border: '1px dashed #cbd5e1',
                borderRadius: '14px',
                padding: '12px',
                background: '#f8fafc',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Quét mã QR để đồng bộ với ứng dụng GoPrinx
              </div>
              <div style={{ display: 'inline-block', padding: '8px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(`https://adm.toolxprint.com?token=${qrToken}`)}`}
                  alt="QR Login"
                  style={{ width: '120px', height: '120px', display: 'block' }}
                />
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '6px' }}>
                Dùng camera điện thoại hoặc app GoPrinx để quét mã trên
              </div>
            </div>
          </div>
        )}

        {!isRequired && (
          <button
            type="button"
            className="liquid-pill-btn"
            style={{ width: '100%', padding: '8px 0', justifyContent: 'center', fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', border: 'none', marginTop: '8px' }}
            onClick={onClose}
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  );
}
