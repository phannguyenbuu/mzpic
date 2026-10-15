import React, { useState } from 'react';
import Tooltip from './Tooltip';

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
    <div className="liquid-modal-backdrop" onClick={onClose}>
      <div className="liquid-modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <i className="bi bi-wallet2"></i>
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                Nạp Tiền Vào Ví School Paper
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Số dư hiện tại: <strong style={{ color: '#2563eb' }}>{formatCurrency(currentBalance)}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
          >
            &times;
          </button>
        </div>

        {/* Packages Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {packages.map((pkg) => {
            const isSelected = selectedAmount === pkg.amount;
            return (
              <div
                key={pkg.amount}
                onClick={() => setSelectedAmount(pkg.amount)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  border: isSelected ? '2px solid #2563eb' : '1px solid rgba(226, 232, 240, 0.8)',
                  background: isSelected ? '#eff6ff' : 'rgba(255, 255, 255, 0.65)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                    {pkg.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {pkg.gens}
                  </div>
                </div>

                {pkg.badge && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      background: '#3b82f6',
                      padding: '3px 8px',
                      borderRadius: '9999px'
                    }}
                  >
                    {pkg.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          type="button"
          className="btn-liquid-primary"
          onClick={handleConfirm}
        >
          <i className="bi bi-lightning-charge-fill"></i>
          <span>Xác nhận nạp {formatCurrency(selectedAmount)}</span>
        </button>
      </div>
    </div>
  );
}
