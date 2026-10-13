import React, { useState, useEffect, useRef, useCallback } from 'react';
import Tooltip from './Tooltip';

export default function ColorGradingModal({
  isOpen,
  imageUrl,
  onClose,
  onApply
}) {
  // Tabs: 'basic' | 'balance' | 'curves'
  const [activeTab, setActiveTab] = useState('basic');

  // Basic Adjustments (-100 to +100)
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [hue, setHue] = useState(0); // -180 to +180
  const [saturation, setSaturation] = useState(0);
  const [lightness, setLightness] = useState(0);

  // Color Balance (-100 to +100)
  const [cyanRed, setCyanRed] = useState(0); // Red vs Cyan
  const [magentaGreen, setMagentaGreen] = useState(0); // Green vs Magenta
  const [yellowBlue, setYellowBlue] = useState(0); // Blue vs Yellow

  // Curves State: Control Points per channel [{x: 0, y: 0}, {x: 128, y: 128}, {x: 255, y: 255}]
  const [curveChannel, setCurveChannel] = useState('rgb'); // 'rgb', 'red', 'green', 'blue'
  const [curvesPoints, setCurvesPoints] = useState({
    rgb: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }],
    red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }]
  });

  const [activePointIdx, setActivePointIdx] = useState(null);
  const [isComparing, setIsComparing] = useState(false); // Hold to compare

  // Canvas refs
  const previewCanvasRef = useRef(null);
  const curveCanvasRef = useRef(null);
  const originalImageRef = useRef(null);
  const histogramRef = useRef(new Uint32Array(256));

  // Reset all adjustments
  const handleResetAll = () => {
    setBrightness(0);
    setContrast(0);
    setHue(0);
    setSaturation(0);
    setLightness(0);
    setCyanRed(0);
    setMagentaGreen(0);
    setYellowBlue(0);
    setCurvesPoints({
      rgb: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }],
      red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
      green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
      blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }]
    });
  };

  // Load image & compute base histogram
  useEffect(() => {
    if (!imageUrl || !isOpen) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      originalImageRef.current = img;

      // Compute grayscale histogram for curves background
      const c = document.createElement('canvas');
      const sampleW = Math.min(400, img.naturalWidth);
      const sampleH = Math.min(400, img.naturalHeight);
      c.width = sampleW;
      c.height = sampleH;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, sampleW, sampleH);
      const idata = ctx.getImageData(0, 0, sampleW, sampleH);
      const d = idata.data;
      const hist = new Uint32Array(256);
      for (let i = 0; i < d.length; i += 4) {
        const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
        hist[lum]++;
      }
      histogramRef.current = hist;
      renderAdjustedPreview();
    };
    img.src = imageUrl;
  }, [imageUrl, isOpen]);

  // Compute Look-Up Table (LUT) for Curves using Catmull-Rom or Monotone Cubic Spline
  const computeCurveLut = useCallback((points) => {
    const lut = new Uint8Array(256);
    if (!points || points.length === 0) {
      for (let i = 0; i < 256; i++) lut[i] = i;
      return lut;
    }

    const sorted = [...points].sort((a, b) => a.x - b.x);

    // Linear interpolation between sorted control points
    for (let i = 0; i < 256; i++) {
      if (i <= sorted[0].x) {
        lut[i] = Math.max(0, Math.min(255, Math.round(sorted[0].y)));
      } else if (i >= sorted[sorted.length - 1].x) {
        lut[i] = Math.max(0, Math.min(255, Math.round(sorted[sorted.length - 1].y)));
      } else {
        // Find segment
        for (let j = 0; j < sorted.length - 1; j++) {
          const p0 = sorted[j];
          const p1 = sorted[j + 1];
          if (i >= p0.x && i <= p1.x) {
            const t = (i - p0.x) / (p1.x - p0.x || 1);
            // Smooth Hermite interpolation
            const smoothT = t * t * (3 - 2 * t);
            const val = p0.y + smoothT * (p1.y - p0.y);
            lut[i] = Math.max(0, Math.min(255, Math.round(val)));
            break;
          }
        }
      }
    }
    return lut;
  }, []);

  // RGB <-> HSL conversions
  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [h, s, l];
  };

  const hslToRgb = (h, s, l) => {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  // Render Image Preview with all filters applied
  const renderAdjustedPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    const maxW = 520;
    const maxH = 420;
    let targetW = img.naturalWidth;
    let targetH = img.naturalHeight;

    const scale = Math.min(maxW / targetW, maxH / targetH, 1);
    targetW = Math.round(targetW * scale);
    targetH = Math.round(targetH * scale);

    canvas.width = targetW;
    canvas.height = targetH;

    // Draw original
    ctx.drawImage(img, 0, 0, targetW, targetH);

    if (isComparing) {
      // User is holding compare -> show raw image
      return;
    }

    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;

    // LUTs for curves
    const rgbLut = computeCurveLut(curvesPoints.rgb);
    const redLut = computeCurveLut(curvesPoints.red);
    const greenLut = computeCurveLut(curvesPoints.green);
    const blueLut = computeCurveLut(curvesPoints.blue);

    // Precalculate brightness / contrast multipliers
    // Brightness: -100..100 -> -100..100 delta
    // Contrast: -100..100 -> factor
    const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const bDelta = brightness * 1.5;

    // HSL factors
    const hShift = hue / 360; // -0.5 .. +0.5
    const sFactor = (saturation + 100) / 100;
    const lFactor = (lightness + 100) / 100;

    // Color balance deltas
    const rBalance = cyanRed * 1.2;
    const gBalance = magentaGreen * 1.2;
    const bBalance = yellowBlue * 1.2;

    const hasHsl = hue !== 0 || saturation !== 0 || lightness !== 0;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 1. Color Balance
      r += rBalance;
      g += gBalance;
      b += bBalance;

      // 2. Brightness & Contrast
      r = cFactor * (r + bDelta - 128) + 128;
      g = cFactor * (g + bDelta - 128) + 128;
      b = cFactor * (b + bDelta - 128) + 128;

      // Clamp before HSL
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      // 3. HSL Adjustments
      if (hasHsl) {
        let [h, s, l] = rgbToHsl(r, g, b);
        h = (h + hShift + 1) % 1;
        s = Math.max(0, Math.min(1, s * sFactor));
        l = Math.max(0, Math.min(1, l * lFactor));
        [r, g, b] = hslToRgb(h, s, l);
      }

      // 4. Tone Curves
      // Channel curves first
      r = redLut[r];
      g = greenLut[g];
      b = blueLut[b];
      // Master RGB curve
      r = rgbLut[r];
      g = rgbLut[g];
      b = rgbLut[b];

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imgData, 0, 0);
  }, [
    brightness,
    contrast,
    hue,
    saturation,
    lightness,
    cyanRed,
    magentaGreen,
    yellowBlue,
    curvesPoints,
    isComparing,
    computeCurveLut
  ]);

  // Re-render preview whenever any adjustment changes
  useEffect(() => {
    renderAdjustedPreview();
  }, [renderAdjustedPreview]);

  // Draw Interactive Curve Graph
  useEffect(() => {
    const canvas = curveCanvasRef.current;
    if (!canvas || activeTab !== 'curves') return;
    const ctx = canvas.getContext('2d');
    const w = 256;
    const h = 256;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Histogram in background
    const hist = histogramRef.current;
    if (hist) {
      let maxVal = 0;
      for (let i = 0; i < 256; i++) if (hist[i] > maxVal) maxVal = hist[i];
      if (maxVal > 0) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let i = 0; i < 256; i++) {
          const barH = (hist[i] / maxVal) * (h * 0.85);
          ctx.lineTo(i, h - barH);
        }
        ctx.lineTo(255, h);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 2. Draw 4x4 Grid
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
    ctx.lineWidth = 1;
    for (let step = 64; step < 256; step += 64) {
      ctx.beginPath();
      ctx.moveTo(step, 0);
      ctx.lineTo(step, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, step);
      ctx.lineTo(w, step);
      ctx.stroke();
    }

    // Diagonal reference line
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw Channel Curve Spline
    const currentPoints = curvesPoints[curveChannel] || [];
    const lut = computeCurveLut(currentPoints);

    let curveStrokeColor = '#2563eb';
    if (curveChannel === 'red') curveStrokeColor = '#ef4444';
    if (curveChannel === 'green') curveStrokeColor = '#10b981';
    if (curveChannel === 'blue') curveStrokeColor = '#3b82f6';

    ctx.strokeStyle = curveStrokeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, h - lut[0]);
    for (let x = 1; x < 256; x++) {
      ctx.lineTo(x, h - lut[x]);
    }
    ctx.stroke();

    // 4. Draw Control Points
    currentPoints.forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x, h - pt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = idx === activePointIdx ? '#ffffff' : curveStrokeColor;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
    });
  }, [curvesPoints, curveChannel, activePointIdx, activeTab, computeCurveLut]);

  // Curve Mouse Interaction (Add/Drag points)
  const handleCurveMouseDown = (e) => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.round(e.clientX - rect.left);
    const clickY = Math.round(256 - (e.clientY - rect.top));

    const currentPoints = [...(curvesPoints[curveChannel] || [])];

    // Check if clicked existing point
    let foundIdx = -1;
    for (let i = 0; i < currentPoints.length; i++) {
      const dx = currentPoints[i].x - clickX;
      const dy = currentPoints[i].y - clickY;
      if (Math.sqrt(dx * dx + dy * dy) <= 8) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx >= 0) {
      setActivePointIdx(foundIdx);
    } else {
      // Add new point (up to 8 points)
      if (currentPoints.length < 8) {
        const newPoint = {
          x: Math.max(0, Math.min(255, clickX)),
          y: Math.max(0, Math.min(255, clickY))
        };
        currentPoints.push(newPoint);
        currentPoints.sort((a, b) => a.x - b.x);
        const newIdx = currentPoints.indexOf(newPoint);
        setCurvesPoints({
          ...curvesPoints,
          [curveChannel]: currentPoints
        });
        setActivePointIdx(newIdx);
      }
    }
  };

  const handleCurveMouseMove = useCallback((e) => {
    if (activePointIdx === null || !curveCanvasRef.current) return;
    const rect = curveCanvasRef.current.getBoundingClientRect();
    const curX = Math.round(Math.max(0, Math.min(255, e.clientX - rect.left)));
    const curY = Math.round(Math.max(0, Math.min(255, 256 - (e.clientY - rect.top))));

    setCurvesPoints((prev) => {
      const pts = [...(prev[curveChannel] || [])];
      // Keep boundary X fixed for black and white points
      if (activePointIdx === 0 && pts[0].x === 0) {
        pts[0] = { x: 0, y: curY };
      } else if (activePointIdx === pts.length - 1 && pts[pts.length - 1].x === 255) {
        pts[pts.length - 1] = { x: 255, y: curY };
      } else {
        pts[activePointIdx] = { x: curX, y: curY };
      }
      return { ...prev, [curveChannel]: pts };
    });
  }, [activePointIdx, curveChannel]);

  const handleCurveMouseUp = useCallback(() => {
    setActivePointIdx(null);
  }, []);

  useEffect(() => {
    if (activePointIdx !== null) {
      window.addEventListener('mousemove', handleCurveMouseMove);
      window.addEventListener('mouseup', handleCurveMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleCurveMouseMove);
        window.removeEventListener('mouseup', handleCurveMouseUp);
      };
    }
  }, [activePointIdx, handleCurveMouseMove, handleCurveMouseUp]);

  // Curve Presets
  const applyCurvePreset = (type) => {
    if (type === 'linear') {
      setCurvesPoints((prev) => ({
        ...prev,
        [curveChannel]: [{ x: 0, y: 0 }, { x: 255, y: 255 }]
      }));
    } else if (type === 'contrast') {
      // S-Curve
      setCurvesPoints((prev) => ({
        ...prev,
        [curveChannel]: [{ x: 0, y: 0 }, { x: 64, y: 48 }, { x: 192, y: 208 }, { x: 255, y: 255 }]
      }));
    } else if (type === 'brighten') {
      setCurvesPoints((prev) => ({
        ...prev,
        [curveChannel]: [{ x: 0, y: 0 }, { x: 128, y: 155 }, { x: 255, y: 255 }]
      }));
    } else if (type === 'darken') {
      setCurvesPoints((prev) => ({
        ...prev,
        [curveChannel]: [{ x: 0, y: 0 }, { x: 128, y: 100 }, { x: 255, y: 255 }]
      }));
    }
  };

  // Full-Resolution Apply Handler
  const handleApplyFullResolution = () => {
    const img = originalImageRef.current;
    if (!img) return;

    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = img.naturalWidth;
    fullCanvas.height = img.naturalHeight;
    const ctx = fullCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
    const data = imgData.data;

    const rgbLut = computeCurveLut(curvesPoints.rgb);
    const redLut = computeCurveLut(curvesPoints.red);
    const greenLut = computeCurveLut(curvesPoints.green);
    const blueLut = computeCurveLut(curvesPoints.blue);

    const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const bDelta = brightness * 1.5;
    const hShift = hue / 360;
    const sFactor = (saturation + 100) / 100;
    const lFactor = (lightness + 100) / 100;
    const rBalance = cyanRed * 1.2;
    const gBalance = magentaGreen * 1.2;
    const bBalance = yellowBlue * 1.2;
    const hasHsl = hue !== 0 || saturation !== 0 || lightness !== 0;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i] + rBalance;
      let g = data[i + 1] + gBalance;
      let b = data[i + 2] + bBalance;

      r = cFactor * (r + bDelta - 128) + 128;
      g = cFactor * (g + bDelta - 128) + 128;
      b = cFactor * (b + bDelta - 128) + 128;

      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      if (hasHsl) {
        let [h, s, l] = rgbToHsl(r, g, b);
        h = (h + hShift + 1) % 1;
        s = Math.max(0, Math.min(1, s * sFactor));
        l = Math.max(0, Math.min(1, l * lFactor));
        [r, g, b] = hslToRgb(h, s, l);
      }

      r = redLut[r];
      g = greenLut[g];
      b = blueLut[b];
      r = rgbLut[r];
      g = rgbLut[g];
      b = rgbLut[b];

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imgData, 0, 0);
    const finalDataUrl = fullCanvas.toDataURL('image/png', 0.95);
    if (onApply) onApply(finalDataUrl);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
          maxWidth: '860px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          padding: '0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: 'linear-gradient(90deg, #f8fafc, #ffffff)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
              }}
            >
              <i className="bi bi-sliders2-vertical"></i>
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                Hậu Kỳ Chuyên Sâu • Chỉnh Màu & Curves Chuẩn In
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Tinh chỉnh HSL, Độ sáng/Tương phản, Cân bằng màu & Tone Curves tương tự Photoshop
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Hold to Compare Button */}
            <button
              type="button"
              onMouseDown={() => setIsComparing(true)}
              onMouseUp={() => setIsComparing(false)}
              onMouseLeave={() => setIsComparing(false)}
              onTouchStart={() => setIsComparing(true)}
              onTouchEnd={() => setIsComparing(false)}
              className="liquid-pill-btn"
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                background: isComparing ? '#2563eb' : '#f1f5f9',
                color: isComparing ? '#ffffff' : '#334155'
              }}
              title="Nhấn giữ để so sánh với ảnh gốc"
            >
              <i className="bi bi-eye"></i>
              <span>{isComparing ? 'Đang xem ảnh gốc' : 'Giữ xem gốc'}</span>
            </button>

            <Tooltip text="Đặt lại toàn bộ về mặc định">
              <button
                type="button"
                onClick={handleResetAll}
                className="liquid-pill-btn"
                style={{ fontSize: '0.75rem', padding: '6px 10px', color: '#64748b' }}
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                <span>Đặt lại</span>
              </button>
            </Tooltip>

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
        </div>

        {/* Modal Body: Two Columns (Left Preview, Right Controls) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.1fr) minmax(320px, 1fr)', flex: 1, minHeight: '380px', maxHeight: '520px', overflow: 'hidden' }}>
          
          {/* Left Column: Live Canvas Preview */}
          <div
            style={{
              background: '#090d16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <canvas
              ref={previewCanvasRef}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                objectFit: 'contain'
              }}
            />
            {isComparing && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backdropFilter: 'blur(4px)'
                }}
              >
                ẢNH GỐC
              </div>
            )}
          </div>

          {/* Right Column: Controls & Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', borderLeft: '1px solid #e2e8f0', overflowY: 'auto' }}>
            
            {/* Subtabs Selector */}
            <div style={{ display: 'flex', padding: '10px 14px', gap: '6px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`liquid-pill-btn ${activeTab === 'basic' ? 'active' : ''}`}
                style={{ flex: 1, padding: '6px 8px', fontSize: '0.74rem', justifyContent: 'center' }}
              >
                <span>Sắc Thái & HSL</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('balance')}
                className={`liquid-pill-btn ${activeTab === 'balance' ? 'active' : ''}`}
                style={{ flex: 1, padding: '6px 8px', fontSize: '0.74rem', justifyContent: 'center' }}
              >
                <span>Cân Bằng Màu</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('curves')}
                className={`liquid-pill-btn ${activeTab === 'curves' ? 'active' : ''}`}
                style={{ flex: 1, padding: '6px 8px', fontSize: '0.74rem', justifyContent: 'center' }}
              >
                <span>Tone Curves</span>
              </button>
            </div>

            {/* TAB 1: BASIC & HSL */}
            {activeTab === 'basic' && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Brightness */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    <span>Độ Sáng (Brightness)</span>
                    <span style={{ fontFamily: 'monospace' }}>{brightness > 0 ? `+${brightness}` : brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#3b82f6' }}
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    <span>Độ Tương Phản (Contrast)</span>
                    <span style={{ fontFamily: 'monospace' }}>{contrast > 0 ? `+${contrast}` : contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#3b82f6' }}
                  />
                </div>

                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />

                {/* Hue */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    <span>Tông Màu (Hue)</span>
                    <span style={{ fontFamily: 'monospace' }}>{hue > 0 ? `+${hue}°` : `${hue}°`}</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={hue}
                    onChange={(e) => setHue(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#8b5cf6' }}
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    <span>Độ Bão Hòa Màu (Saturation)</span>
                    <span style={{ fontFamily: 'monospace' }}>{saturation > 0 ? `+${saturation}` : saturation}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={saturation}
                    onChange={(e) => setSaturation(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#ec4899' }}
                  />
                </div>

                {/* Lightness */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    <span>Độ Tươi Sáng (Lightness)</span>
                    <span style={{ fontFamily: 'monospace' }}>{lightness > 0 ? `+${lightness}` : lightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={lightness}
                    onChange={(e) => setLightness(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#10b981' }}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: COLOR BALANCE */}
            {activeTab === 'balance' && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Cân bằng sắc thái 3 trục quang phổ (RGB / CMY) để ấn phẩm có tông ấm hoặc lạnh theo yêu cầu in:
                </div>

                {/* Cyan vs Red */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px' }}>
                    <span style={{ color: '#0284c7' }}>Cyan (Xanh Lơ)</span>
                    <span style={{ color: '#dc2626' }}>Red (Đỏ) {cyanRed > 0 ? `+${cyanRed}` : cyanRed}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={cyanRed}
                    onChange={(e) => setCyanRed(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#ef4444' }}
                  />
                </div>

                {/* Magenta vs Green */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px' }}>
                    <span style={{ color: '#c026d3' }}>Magenta (Tím Hồng)</span>
                    <span style={{ color: '#16a34a' }}>Green (Xanh Lá) {magentaGreen > 0 ? `+${magentaGreen}` : magentaGreen}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={magentaGreen}
                    onChange={(e) => setMagentaGreen(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#22c55e' }}
                  />
                </div>

                {/* Yellow vs Blue */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px' }}>
                    <span style={{ color: '#d97706' }}>Yellow (Vàng)</span>
                    <span style={{ color: '#2563eb' }}>Blue (Xanh Lam) {yellowBlue > 0 ? `+${yellowBlue}` : yellowBlue}</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={yellowBlue}
                    onChange={(e) => setYellowBlue(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#3b82f6' }}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: PHOTOSHOP CURVES */}
            {activeTab === 'curves' && (
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Channel Selector & Presets */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                      { id: 'rgb', label: 'RGB' },
                      { id: 'red', label: 'Red' },
                      { id: 'green', label: 'Green' },
                      { id: 'blue', label: 'Blue' }
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => { setCurveChannel(ch.id); setActivePointIdx(null); }}
                        className={`liquid-pill-btn ${curveChannel === ch.id ? 'active' : ''}`}
                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => applyCurvePreset('contrast')}
                      className="liquid-pill-btn"
                      style={{ padding: '3px 6px', fontSize: '0.68rem' }}
                      title="S-Curve tăng tương phản"
                    >
                      Tương phản
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCurvePreset('brighten')}
                      className="liquid-pill-btn"
                      style={{ padding: '3px 6px', fontSize: '0.68rem' }}
                      title="Tăng sáng vùng trung tính"
                    >
                      Sáng
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCurvePreset('linear')}
                      className="liquid-pill-btn"
                      style={{ padding: '3px 6px', fontSize: '0.68rem' }}
                      title="Khôi phục đường thẳng gốc"
                    >
                      Thẳng
                    </button>
                  </div>
                </div>

                {/* Curve Graph Canvas Box */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '8px',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
                  }}
                >
                  <canvas
                    ref={curveCanvasRef}
                    width={256}
                    height={256}
                    style={{
                      width: '256px',
                      height: '256px',
                      cursor: 'crosshair',
                      display: 'block'
                    }}
                    onMouseDown={handleCurveMouseDown}
                  />
                  <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '6px' }}>
                    Bấm vào đường cong để thêm điểm neo • Kéo để uốn nắn sắc thái
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Áp dụng trực tiếp vào ấn phẩm hiện tại trong Studio
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="liquid-pill-btn"
              style={{ fontSize: '0.8rem', padding: '8px 16px' }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApplyFullResolution}
              className="liquid-pill-btn active"
              style={{
                fontSize: '0.8rem',
                padding: '8px 22px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.28)'
              }}
            >
              <i className="bi bi-check2-circle"></i>
              <span>Áp Dụng Hậu Kỳ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
