import React from 'react';

export default function GoogleAuthModal({ isOpen, onClose, onLogin }) {
  if (!isOpen) return null;

  return (
    <div className="liquid-modal-backdrop" onClick={onClose}>
      <div className="liquid-modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <svg viewBox="0 0 48 48" style={{ width: '40px', height: '40px', margin: '0 auto' }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
            Đăng nhập bằng Google
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            Chọn tài khoản để tiếp tục đến MzPic Studio
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <div
            onClick={() => onLogin({
              name: 'Tony Nguyen',
              email: 'tony.nguyen@mzpic.design',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'
            })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '16px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'rgba(255, 255, 255, 0.65)',
              cursor: 'pointer'
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
              alt="Avatar"
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Tony Nguyen</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>tony.nguyen@mzpic.design</div>
            </div>
            <i className="bi bi-chevron-right text-slate-400"></i>
          </div>

          <div
            onClick={() => onLogin({
              name: 'Phan Nguyen Buu',
              email: 'buu.pn@toolxprint.com',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80'
            })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '16px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'rgba(255, 255, 255, 0.65)',
              cursor: 'pointer'
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
              alt="Avatar"
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Phan Nguyen Buu</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>buu.pn@toolxprint.com</div>
            </div>
            <i className="bi bi-chevron-right text-slate-400"></i>
          </div>
        </div>

        <button
          type="button"
          className="liquid-pill-btn"
          style={{ width: '100%', padding: '10px 0', justifyContent: 'center' }}
          onClick={onClose}
        >
          Hủy bỏ
        </button>
      </div>
    </div>
  );
}
