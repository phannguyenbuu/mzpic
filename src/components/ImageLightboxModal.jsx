import React, { useState, useEffect, useRef } from 'react';
import Tooltip from './Tooltip';

export default function ImageLightboxModal({ isOpen, imageUrl, title = 'Ảnh Gốc', onClose, onOpenEdit }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Reset viewport when opening a new image
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, imageUrl]);

  // Handle Esc key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  // Zoom controls
  const handleZoomIn = (e) => {
    if (e) e.stopPropagation();
    setScale((s) => Math.min(Number((s + 0.35).toFixed(2)), 6));
  };

  const handleZoomOut = (e) => {
    if (e) e.stopPropagation();
    setScale((s) => {
      const next = Math.max(Number((s - 0.35).toFixed(2)), 0.5);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e) => {
    if (e) e.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Double click toggles zoom
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2.2);
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0012;
    setScale((prevScale) => {
      const newScale = Math.min(Math.max(0.5, prevScale + delta * prevScale), 8);
      if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return Number(newScale.toFixed(2));
    });
  };

  // Mouse drag pan
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only primary mouse button
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag pan & pinch zoom
  const lastTouchRef = useRef(null);
  const initialPinchDistRef = useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      lastTouchRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = { dist, startScale: scale };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging && lastTouchRef.current) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - lastTouchRef.current.x,
        y: touch.clientY - lastTouchRef.current.y
      });
    } else if (e.touches.length === 2 && initialPinchDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialPinchDistRef.current.dist;
      const nextScale = Math.min(Math.max(0.5, initialPinchDistRef.current.startScale * ratio), 8);
      setScale(Number(nextScale.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchRef.current = null;
    initialPinchDistRef.current = null;
  };

  // Download handler (trực tiếp không mở tab mới)
  const handleDownload = async (e) => {
    if (e) e.stopPropagation();
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `SchoolPaper_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `SchoolPaper_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(8, 12, 22, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        overflow: 'hidden'
      }}
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        style={{
          height: '56px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.65)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 10
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
              fontSize: '1rem'
            }}
          >
            <i className="bi bi-arrows-fullscreen"></i>
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              {title}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              Cuộn chuột để Phóng to/Thu nhỏ • Kéo chuột để Di chuyển (Pan) • Nhấp đúp để đặt lại
            </div>
          </div>
        </div>

        {/* Right Header Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#38bdf8',
              fontFamily: 'monospace'
            }}
          >
            {Math.round(scale * 100)}%
          </span>

          {onOpenEdit && (
            <Tooltip text="Chỉnh sửa hoặc tạo lại chỉ riêng ảnh này">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEdit(imageUrl);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(109, 40, 217, 0.35)'
                }}
              >
                <i className="bi bi-pencil-square"></i>
                <span>Sửa / Tạo lại</span>
              </button>
            </Tooltip>
          )}

          <Tooltip text="Tải trực tiếp ảnh về máy">
            <button
              type="button"
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
              }}
            >
              <i className="bi bi-download"></i>
              <span>Tải về</span>
            </button>
          </Tooltip>

          <Tooltip text="Đóng (Phím Esc)">
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                transition: 'all 0.2s'
              }}
            >
              &times;
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Main Interactive Stage for Zoom & Pan */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          width: '100%',
          height: 'calc(100% - 56px)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in'),
          overflow: 'hidden'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={imageUrl}
          alt={title}
          draggable={false}
          style={{
            maxWidth: '92%',
            maxHeight: '88vh',
            objectFit: 'contain',
            borderRadius: '12px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.65)',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            pointerEvents: 'none'
          }}
        />

        {/* Floating Bottom Toolbar */}
        <div
          style={{
            position: 'absolute',
            bottom: '22px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '9999px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
            zIndex: 20
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip text="Thu nhỏ (-)">
            <button
              type="button"
              onClick={handleZoomOut}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem'
              }}
            >
              <i className="bi bi-zoom-out"></i>
            </button>
          </Tooltip>

          <Tooltip text="Đặt lại kích thước chuẩn 100%">
            <button
              type="button"
              onClick={handleResetZoom}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#38bdf8',
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontWeight: 700,
                fontFamily: 'monospace'
              }}
            >
              {Math.round(scale * 100)}%
            </button>
          </Tooltip>

          <Tooltip text="Phóng to (+)">
            <button
              type="button"
              onClick={handleZoomIn}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem'
              }}
            >
              <i className="bi bi-zoom-in"></i>
            </button>
          </Tooltip>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.15)' }} />

          <Tooltip text="Tải ảnh về máy">
            <button
              type="button"
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: '#2563eb',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '0.74rem',
                fontWeight: 700
              }}
            >
              <i className="bi bi-download"></i>
              <span>Tải về</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
