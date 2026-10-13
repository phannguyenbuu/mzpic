import React, { useState, useEffect, useRef, useCallback } from 'react';
import Tooltip from './Tooltip';

export default function CropRotateModal({
  isOpen,
  imageUrl,
  imageName = 'Ảnh tham chiếu',
  onClose,
  onApply
}) {
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('free'); // 'free', '1:1', '4:5', '3:4', '16:9', 'a4'
  
  // Crop box in normalized [0..1] range: { x, y, w, h }
  const [crop, setCrop] = useState({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'move', 'nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState({ x: 0, y: 0, w: 1, h: 1 });

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setAspectRatio('free');
      setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
    }
  }, [isOpen, imageUrl]);

  // Load natural image size
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Rotate handlers
  const handleRotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const handleToggleFlipH = () => setFlipH((prev) => !prev);
  const handleToggleFlipV = () => setFlipV((prev) => !prev);
  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio('free');
    setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  };

  // Aspect ratio helper
  const getTargetRatioValue = (preset) => {
    switch (preset) {
      case '1:1': return 1.0;
      case '4:5': return 4 / 5;
      case '3:4': return 3 / 4;
      case '16:9': return 16 / 9;
      case 'a4': return 210 / 297;
      default: return null;
    }
  };

  const handleSelectAspect = (preset) => {
    setAspectRatio(preset);
    const ratio = getTargetRatioValue(preset);
    if (!ratio) {
      setCrop({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
      return;
    }

    // Is current transformed orientation swapped?
    const isSwapped = rotation === 90 || rotation === 270;
    const effW = isSwapped ? naturalSize.height : naturalSize.width;
    const effH = isSwapped ? naturalSize.width : naturalSize.height;
    if (!effW || !effH) return;

    const imgAspect = effW / effH;
    let newW, newH;

    if (imgAspect > ratio) {
      newH = 0.85;
      newW = (newH * effH * ratio) / effW;
    } else {
      newW = 0.85;
      newH = (newW * effW) / (ratio * effH);
    }

    newW = Math.min(0.95, Math.max(0.1, newW));
    newH = Math.min(0.95, Math.max(0.1, newH));

    setCrop({
      x: (1 - newW) / 2,
      y: (1 - newH) / 2,
      w: newW,
      h: newH
    });
  };

  // Mouse / Touch handlers for Crop Box
  const handleMouseDown = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragMode(mode);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop({ ...crop });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const deltaX = (e.clientX - dragStart.x) / rect.width;
    const deltaY = (e.clientY - dragStart.y) / rect.height;

    let { x, y, w, h } = initialCrop;

    if (dragMode === 'move') {
      x = Math.max(0, Math.min(1 - w, x + deltaX));
      y = Math.max(0, Math.min(1 - h, y + deltaY));
      setCrop({ x, y, w, h });
      return;
    }

    // Resizing
    const minSize = 0.08;
    const ratio = getTargetRatioValue(aspectRatio);

    if (dragMode.includes('e')) {
      w = Math.max(minSize, Math.min(1 - x, initialCrop.w + deltaX));
      if (ratio) h = Math.max(minSize, Math.min(1 - y, w / ratio));
    }
    if (dragMode.includes('s')) {
      h = Math.max(minSize, Math.min(1 - y, initialCrop.h + deltaY));
      if (ratio) w = Math.max(minSize, Math.min(1 - x, h * ratio));
    }
    if (dragMode.includes('w')) {
      const maxW = initialCrop.x + initialCrop.w;
      w = Math.max(minSize, Math.min(maxW, initialCrop.w - deltaX));
      x = maxW - w;
      if (ratio) {
        h = Math.max(minSize, Math.min(1 - y, w / ratio));
      }
    }
    if (dragMode.includes('n')) {
      const maxH = initialCrop.y + initialCrop.h;
      h = Math.max(minSize, Math.min(maxH, initialCrop.h - deltaY));
      y = maxH - h;
      if (ratio) {
        w = Math.max(minSize, Math.min(1 - x, h * ratio));
      }
    }

    // Clamp
    x = Math.max(0, Math.min(1 - minSize, x));
    y = Math.max(0, Math.min(1 - minSize, y));
    w = Math.max(minSize, Math.min(1 - x, w));
    h = Math.max(minSize, Math.min(1 - y, h));

    setCrop({ x, y, w, h });
  }, [isDragging, dragMode, dragStart, initialCrop, aspectRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragMode(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Execute Crop & Rotate onto Canvas
  const handleApplyCrop = () => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. Transform orientation (Rotate + Flip)
      const isSwapped = rotation === 90 || rotation === 270;
      const transW = isSwapped ? img.naturalHeight : img.naturalWidth;
      const transH = isSwapped ? img.naturalWidth : img.naturalHeight;

      const canvas1 = document.createElement('canvas');
      canvas1.width = transW;
      canvas1.height = transH;
      const ctx1 = canvas1.getContext('2d');

      ctx1.translate(transW / 2, transH / 2);
      ctx1.rotate((rotation * Math.PI) / 180);
      ctx1.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx1.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      // 2. Crop Bounding Box
      const cropPxX = Math.round(crop.x * transW);
      const cropPxY = Math.round(crop.y * transH);
      const cropPxW = Math.round(crop.w * transW);
      const cropPxH = Math.round(crop.h * transH);

      const canvasFinal = document.createElement('canvas');
      canvasFinal.width = Math.max(1, cropPxW);
      canvasFinal.height = Math.max(1, cropPxH);
      const ctxFinal = canvasFinal.getContext('2d');

      ctxFinal.drawImage(
        canvas1,
        cropPxX,
        cropPxY,
        cropPxW,
        cropPxH,
        0,
        0,
        cropPxW,
        cropPxH
      );

      const editedDataUrl = canvasFinal.toDataURL('image/png', 0.95);
      if (onApply) onApply(editedDataUrl);
      if (onClose) onClose();
    };
    img.src = imageUrl;
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="liquid-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          padding: '0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid #f1f5f9'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem'
              }}
            >
              <i className="bi bi-crop"></i>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                Cắt & Xoay Ảnh Tham Chiếu
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                {imageName} • {naturalSize.width}×{naturalSize.height} px
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#f1f5f9',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem'
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Interactive Workspace */}
        <div
          style={{
            flex: 1,
            minHeight: '320px',
            maxHeight: '440px',
            background: '#090d16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            padding: '20px'
          }}
        >
          {/* Transformed Image Preview Box */}
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'inline-block',
              userSelect: 'none',
              transform: `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
              transition: isDragging ? 'none' : 'transform 0.25s ease'
            }}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Edit Preview"
              style={{
                display: 'block',
                maxWidth: '460px',
                maxHeight: '340px',
                width: 'auto',
                height: 'auto',
                pointerEvents: 'none',
                borderRadius: '8px'
              }}
            />

            {/* Crop Overlay Mask */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.55)',
                pointerEvents: 'none'
              }}
            />

            {/* Draggable Active Crop Box */}
            <div
              style={{
                position: 'absolute',
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.w * 100}%`,
                height: `${crop.h * 100}%`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                border: '2px solid #38bdf8',
                cursor: 'move',
                boxSizing: 'border-box'
              }}
              onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
              {/* Rule of Thirds Grid Lines */}
              <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />

              {/* 4 Corner Handles */}
              <div
                style={{ position: 'absolute', top: '-6px', left: '-6px', width: '12px', height: '12px', background: '#38bdf8', borderRadius: '2px', cursor: 'nw-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
              />
              <div
                style={{ position: 'absolute', top: '-6px', right: '-6px', width: '12px', height: '12px', background: '#38bdf8', borderRadius: '2px', cursor: 'ne-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
              />
              <div
                style={{ position: 'absolute', bottom: '-6px', left: '-6px', width: '12px', height: '12px', background: '#38bdf8', borderRadius: '2px', cursor: 'sw-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
              />
              <div
                style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '12px', height: '12px', background: '#38bdf8', borderRadius: '2px', cursor: 'se-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'se')}
              />

              {/* 4 Edge Handles */}
              <div
                style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '8px', background: '#38bdf8', borderRadius: '2px', cursor: 'n-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'n')}
              />
              <div
                style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', width: '20px', height: '8px', background: '#38bdf8', borderRadius: '2px', cursor: 's-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 's')}
              />
              <div
                style={{ position: 'absolute', left: '-4px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '20px', background: '#38bdf8', borderRadius: '2px', cursor: 'w-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'w')}
              />
              <div
                style={{ position: 'absolute', right: '-4px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '20px', background: '#38bdf8', borderRadius: '2px', cursor: 'e-resize' }}
                onMouseDown={(e) => handleMouseDown(e, 'e')}
              />
            </div>
          </div>
        </div>

        {/* Toolbar & Ratio Options */}
        <div style={{ padding: '12px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Rotate & Flip Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tooltip text="Xoay trái 90°">
                <button
                  type="button"
                  onClick={handleRotateLeft}
                  className="liquid-pill-btn"
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                  <span>-90°</span>
                </button>
              </Tooltip>

              <Tooltip text="Xoay phải 90°">
                <button
                  type="button"
                  onClick={handleRotateRight}
                  className="liquid-pill-btn"
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-arrow-clockwise"></i>
                  <span>+90°</span>
                </button>
              </Tooltip>

              <Tooltip text="Lật ngang (Flip Horizontal)">
                <button
                  type="button"
                  onClick={handleToggleFlipH}
                  className={`liquid-pill-btn ${flipH ? 'active' : ''}`}
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-arrow-left-right"></i>
                  <span>Lật ngang</span>
                </button>
              </Tooltip>

              <Tooltip text="Lật dọc (Flip Vertical)">
                <button
                  type="button"
                  onClick={handleToggleFlipV}
                  className={`liquid-pill-btn ${flipV ? 'active' : ''}`}
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-arrow-down-up"></i>
                  <span>Lật dọc</span>
                </button>
              </Tooltip>

              <Tooltip text="Khôi phục trạng thái ban đầu">
                <button
                  type="button"
                  onClick={handleReset}
                  className="liquid-pill-btn"
                  style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#64748b' }}
                >
                  <i className="bi bi-arrow-repeat"></i>
                  <span>Reset</span>
                </button>
              </Tooltip>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
              Góc xoay: <strong>{rotation}°</strong>
            </div>
          </div>

          {/* Aspect Ratio Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Tỉ lệ cắt:</span>
            {[
              { id: 'free', label: 'Tự Do' },
              { id: '1:1', label: '1:1 (Vuông)' },
              { id: '4:5', label: '4:5 (Dọc)' },
              { id: '3:4', label: '3:4' },
              { id: '16:9', label: '16:9 (Ngang)' },
              { id: 'a4', label: 'A4 Chuẩn' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectAspect(p.id)}
                className={`liquid-pill-btn ${aspectRatio === p.id ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Bottom Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              className="liquid-pill-btn"
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              className="liquid-pill-btn active"
              style={{ padding: '8px 20px', fontSize: '0.8rem', fontWeight: 800, background: '#2563eb', color: '#ffffff' }}
            >
              <i className="bi bi-check2-circle"></i>
              <span>Áp Dụng & Lưu Ảnh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
