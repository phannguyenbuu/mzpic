import React from 'react';

export default function GoogleAuthModal({ isOpen, onClose, onLogin }) {
  if (!isOpen) return null;

  return (
    <div className="google-auth-modal active" onClick={onClose}>
      <div className="google-auth-card" onClick={(e) => e.stopPropagation()}>
        <div className="google-auth-header">
          <svg viewBox="0 0 48 48" style={{ width: '36px', height: '36px' }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#202124', marginTop: '10px' }}>
            Đăng nhập bằng Google
          </div>
          <div style={{ fontSize: '0.85rem', color: '#5f6368', marginTop: '2px' }}>
            Chọn tài khoản để tiếp tục đến MzPic Studio
          </div>
        </div>

        <div className="google-auth-body">
          <div
            className="google-account-item"
            onClick={() => onLogin({
              name: 'Tony Nguyen',
              email: 'tony.nguyen@mzpic.design',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'
            })}
            title="Nhấn để đăng nhập bằng tài khoản này"
          >
            <img
              className="account-avatar"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
              alt="Avatar"
            />
            <div className="account-info">
              <div className="account-name">Tony Nguyen</div>
              <div className="account-email">tony.nguyen@mzpic.design</div>
            </div>
            <i className="bi bi-arrow-right-short" style={{ fontSize: '1.4rem', color: '#5f6368', marginLeft: 'auto' }}></i>
          </div>

          <div
            className="google-account-item"
            style={{ marginTop: '8px' }}
            onClick={() => onLogin({
              name: 'Phan Nguyen Buu',
              email: 'buu.pn@toolxprint.com',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80'
            })}
            title="Nhấn để đăng nhập bằng tài khoản ToolXPrint"
          >
            <img
              className="account-avatar"
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
              alt="Avatar"
            />
            <div className="account-info">
              <div className="account-name">Phan Nguyen Buu</div>
              <div className="account-email">buu.pn@toolxprint.com</div>
            </div>
            <i className="bi bi-arrow-right-short" style={{ fontSize: '1.4rem', color: '#5f6368', marginLeft: 'auto' }}></i>
          </div>

          <div className="google-disclaimer">
            Để tiếp tục, Google sẽ chia sẻ tên, địa chỉ email, tùy chọn ngôn ngữ và ảnh hồ sơ của bạn với MzPic.
          </div>
        </div>

        <div className="google-auth-footer">
          <button className="btn-cancel-auth" onClick={onClose}>
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
}
