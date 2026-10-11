import React, { useState } from 'react';

export default function TopupModal({ isOpen, onClose, currentBalance, onConfirmTopup }) {
  const [selectedAmount, setSelectedAmount] = useState(50000);

  if (!isOpen) return null;

  const packages = [
    { amount: 20000, label: '+20.000đ', gens: '10 lượt tạo', badge: null },
    { amount: 50000, label: '+50.000đ', gens: '25 lượt tạo', badge: 'Phổ biến' },
    { amount: 100000, label: '+100.000đ', gens: '55 lượt tạo', badge: 'Tặng +10%' },
  ];

  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('vi-VN') + 'đ';
  };

  const handleConfirm = () => {
    onConfirmTopup(selectedAmount);
    onClose();
  };

  return (
    <div className="topup-modal active" onClick={onClose}>
      <div className="topup-card" onClick={(e) => e.stopPropagation()}>
        <div className="topup-header">
          <h3>
            <i className="bi bi-wallet2 text-primary"></i> Nạp Tiền Vào Ví MzPic
          </h3>
          <button className="btn-close-modal" onClick={onClose} title="Đóng">
            &times;
          </button>
        </div>

        <div className="topup-body">
          <div className="topup-current-box">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Số dư hiện tại:</span>
            <strong id="modalCurrentBalance" style={{ fontSize: '1.1rem', color: 'var(--blue-primary)', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(currentBalance)}
            </strong>
          </div>

          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>
            Chọn gói nạp:
          </div>

          <div className="topup-packages-grid">
            {packages.map((pkg) => (
              <div
                key={pkg.amount}
                className={`package-item ${selectedAmount === pkg.amount ? 'active' : ''}`}
                onClick={() => setSelectedAmount(pkg.amount)}
              >
                {pkg.badge && <span className="pkg-badge">{pkg.badge}</span>}
                <span className="pkg-amount">{pkg.label}</span>
                <span className="pkg-gens">{pkg.gens}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              padding: '8px 12px',
              borderRadius: '6px',
              marginTop: '10px'
            }}
          >
            <i className="bi bi-shield-check text-success"></i> Chi phí chỉ <strong>2.000đ</strong> cho mỗi bức ảnh ấn phẩm in ấn phân giải cao 300 DPI.
          </div>
        </div>

        <div className="topup-footer">
          <button className="btn-cancel-auth" onClick={onClose}>
            Hủy
          </button>
          <button
            className="btn-download-toolx"
            onClick={handleConfirm}
            style={{ padding: '7px 20px' }}
          >
            <i className="bi bi-lightning-charge-fill"></i> Xác nhận nạp {formatCurrency(selectedAmount)}
          </button>
        </div>
      </div>
    </div>
  );
}
