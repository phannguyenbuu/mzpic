import React from 'react';

/**
 * Tooltip component - Bỏ hết tooltip popup theo yêu cầu người dùng, chỉ trả về children
 */
export default function Tooltip({ children, className = '', style = {} }) {
  if (className || (style && Object.keys(style).length > 0)) {
    return (
      <span className={className} style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
        {children}
      </span>
    );
  }
  return children;
}

