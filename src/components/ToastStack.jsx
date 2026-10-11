import React from 'react';

export default function ToastStack({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-stack" id="toastStack">
      {toasts.map((toast) => {
        const icon = toast.type === 'success' ? 'bi-check-circle-fill' : (toast.type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill');
        return (
          <div
            key={toast.id}
            className={`toast-msg ${toast.type || 'info'}`}
            onClick={() => onDismiss(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            <i className={`bi ${icon}`}></i>
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
