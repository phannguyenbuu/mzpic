import React, { useState } from 'react';

export default function Tooltip({ text, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  if (!text) return children;

  const getPositionStyle = () => {
    switch (position) {
      case 'bottom':
        return {
          top: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          right: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          left: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case 'top':
      default:
        return {
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
    }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onTouchStart={() => setVisible(!visible)}
    >
      {children}
      {visible && (
        <div
          className="liquid-tooltip"
          style={{
            position: 'absolute',
            zIndex: 9999,
            pointerEvents: 'none',
            whiteSpace: 'normal',
            maxWidth: '220px',
            minWidth: '120px',
            ...getPositionStyle(),
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
