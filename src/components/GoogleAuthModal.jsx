import React, { useEffect, useRef, useState } from 'react';
import { loginWithGoogleCredential } from '../utils/agentApi';

export const GOOGLE_CLIENT_ID = '475773389104-4frju27uljiuj0mtihidgude16ghr39t.apps.googleusercontent.com';

export default function GoogleAuthModal({ isOpen, onClose, onLogin, showToast }) {
  const googleBtnRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setErrorMsg('Không nhận được thông tin xác thực từ Google');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const authResult = await loginWithGoogleCredential(response.credential);
      if (authResult.ok && authResult.user) {
        if (showToast) showToast(`🎉 Xin chào ${authResult.user.name}! Đã đăng nhập Google thành công.`, 'success');
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

  useEffect(() => {
    if (!isOpen) return;

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
              width: 280,
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
  }, [isOpen]);

  const handleTriggerGooglePrompt = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google prompt not displayed, using button directly');
        }
      });
    } else {
      if (showToast) showToast('Google SDK chưa tải xong, vui lòng thử lại sau 2 giây!', 'warning');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="liquid-modal-backdrop" onClick={onClose}>
      <div className="liquid-modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '24px 20px', maxWidth: '380px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '20px',
              background: '#ffffff',
              boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              border: '1px solid rgba(226, 232, 240, 0.8)'
            }}
          >
            <svg viewBox="0 0 48 48" style={{ width: '32px', height: '32px' }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          </div>

          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
            Đăng Nhập Google
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
            Xác thực tài khoản qua máy chủ trung tâm <b>agentapi.quanlymay.com</b>
          </div>
        </div>

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

        {/* Official Google Sign-In Button Container */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div ref={googleBtnRef} style={{ minHeight: '44px', display: 'flex', justifyContent: 'center' }}></div>

          {/* Fallback button if GSI button has rendering delay */}
          <button
            type="button"
            onClick={handleTriggerGooglePrompt}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '9999px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#1e293b',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <i className="bi bi-google text-blue-600"></i>
            <span>{isLoading ? 'Đang xác thực...' : 'Mở Hộp Thoại Google'}</span>
          </button>
        </div>

        {/* Demo Fast Login for development / testing */}
        <div
          style={{
            borderTop: '1px dashed #e2e8f0',
            paddingTop: '12px',
            marginBottom: '14px'
          }}
        >
          <div style={{ fontSize: '0.66rem', color: '#94a3b8', textAlign: 'center', marginBottom: '8px' }}>
            HOẶC ĐĂNG NHẬP NHANH VỚI TÀI KHOẢN MẪU
          </div>

          <div
            onClick={() => {
              const demoUser = {
                id: 63,
                name: 'GoPrinx Admin',
                email: 'gox@quanlymay.com',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
                role: 'admin'
              };
              if (onLogin) onLogin(demoUser);
              onClose();
              if (showToast) showToast('Đã đăng nhập với tài khoản Quản trị!', 'success');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: 'rgba(255, 255, 255, 0.75)',
              cursor: 'pointer',
              marginBottom: '6px'
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
              alt="Avatar"
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>GoPrinx Admin</div>
              <div style={{ fontSize: '0.66rem', color: '#64748b' }}>gox@quanlymay.com</div>
            </div>
            <i className="bi bi-box-arrow-in-right text-blue-600"></i>
          </div>
        </div>

        <button
          type="button"
          className="liquid-pill-btn"
          style={{ width: '100%', padding: '9px 0', justifyContent: 'center', fontSize: '0.78rem' }}
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
