import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';
import { calculatePixels, convertDimension, DESIGN_PRESETS } from '../data/presets';

import { requestAiUpscale, downloadFile } from '../utils/upscale';

export default function ExactResizeModal({
  isOpen,
  mode = 'result', // 'result' (hậu kỳ) | 'input' (lúc nhập ảnh)
  imageUrl,
  currentWidth,
  currentHeight,
  currentUnit = 'mm',
  onClose,
  onApplyResize,
  onDownloadResized
}) {
  const [width, setWidth] = useState(currentWidth || 210);
  const [height, setHeight] = useState(currentHeight || 297);
  const [unit, setUnit] = useState(currentUnit || 'mm');
  const [dpi, setDpi] = useState(300);
  const [lockRatio, setLockRatio] = useState(true);
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  const [aspectRatioValue, setAspectRatioValue] = useState(1);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState('');

  // Load natural dimensions of the image if available
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatioValue(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Sync with props when modal opens
  useEffect(() => {
    if (isOpen) {
      setWidth(currentWidth || 210);
      setHeight(currentHeight || 297);
      setUnit(currentUnit || 'mm');
      setDpi(300);
      setLockRatio(true);
      setIsUpscaling(false);
      setProgress(0);
      setStepText('');
      if (currentWidth && currentHeight && currentHeight > 0) {
        setAspectRatioValue(currentWidth / currentHeight);
      }
    }
  }, [isOpen, currentWidth, currentHeight, currentUnit]);

  // Handle Width change with locked ratio
  const handleWidthChange = (newW) => {
    const val = parseFloat(newW) || 0;
    setWidth(val);
    if (lockRatio && aspectRatioValue > 0) {
      const newH = +(val / aspectRatioValue).toFixed(unit === 'px' ? 0 : 1);
      setHeight(newH);
    }
  };

  // Handle Height change with locked ratio
  const handleHeightChange = (newH) => {
    const val = parseFloat(newH) || 0;
    setHeight(val);
    if (lockRatio && aspectRatioValue > 0) {
      const newW = +(val * aspectRatioValue).toFixed(unit === 'px' ? 0 : 1);
      setWidth(newW);
    }
  };

  // Handle Unit change (convert current values)
  const handleUnitChange = (newUnit) => {
    if (newUnit === unit) return;
    const convertedW = convertDimension(width, unit, newUnit, dpi);
    const convertedH = convertDimension(height, unit, newUnit, dpi);
    setWidth(convertedW);
    setHeight(convertedH);
    setUnit(newUnit);
  };

  // Preset quick picker
  const handleSelectPreset = (pW, pH, pUnit) => {
    setWidth(pW);
    setHeight(pH);
    setUnit(pUnit);
    if (pH > 0) setAspectRatioValue(pW / pH);
  };

  // Target resulting pixels
  const targetPxW = calculatePixels(width, unit, dpi);
  const targetPxH = calculatePixels(height, unit, dpi);

  const handleApply = async () => {
    if (mode === 'result' && imageUrl) {
      setIsUpscaling(true);
      setProgress(10);
      setStepText('Đang gửi yêu cầu lên GPU AI Kích Nét (genai.toolxprint)...');
      try {
        const upscaled = await requestAiUpscale(imageUrl, {
          scale: 4,
          customWidth: targetPxW,
          printDpi: dpi,
          modelId: 'digital-art-4x',
          onProgress: ({ progress: p, current_step }) => {
            setProgress(p);
            setStepText(current_step);
          }
        });
        const finalUrl = upscaled.downloadUrl || upscaled.url;
        if (onApplyResize) {
          onApplyResize({
            width,
            height,
            unit,
            dpi,
            pixelsW: targetPxW,
            pixelsH: targetPxH,
            resizedDataUrl: finalUrl
          });
        }
        if (onClose) onClose();
      } catch (err) {
        alert('Lỗi kích nét AI GPU: ' + err.message);
      } finally {
        setIsUpscaling(false);
      }
    } else {
      if (onApplyResize) {
        onApplyResize({
          width,
          height,
          unit,
          dpi,
          pixelsW: targetPxW,
          pixelsH: targetPxH
        });
      }
      if (onClose) onClose();
    }
  };

  const handleDownloadDirect = async () => {
    if (!imageUrl) return;
    setIsUpscaling(true);
    setProgress(10);
    setStepText('Đang gửi ảnh tới GPU AI Kích Nét (genai.toolxprint)...');
    try {
      const upscaled = await requestAiUpscale(imageUrl, {
        scale: 4,
        customWidth: targetPxW,
        printDpi: dpi,
        modelId: 'digital-art-4x',
        onProgress: ({ progress: p, current_step }) => {
          setProgress(p);
          setStepText(current_step);
        }
      });
      const finalUrl = upscaled.downloadUrl || upscaled.url;
      const fileName = `SchoolPaper_${width}x${height}${unit}_${dpi}DPI_GPU_${Date.now()}.png`;
      downloadFile(finalUrl, fileName);
    } catch (err) {
      alert('Lỗi kích nét AI GPU: ' + err.message);
    } finally {
      setIsUpscaling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
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
          maxWidth: '540px',
          background: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          padding: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem'
              }}
            >
              <i className="bi bi-aspect-ratio"></i>
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                {mode === 'result' ? 'Chỉnh Kích Thước & Kích Nét AI Chuẩn In' : 'Cài Đặt Kích Thước Chuẩn In'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {naturalDimensions.width > 0 && `Gốc: ${naturalDimensions.width}×${naturalDimensions.height} px • `}
                Xử lý siêu phân giải qua GPU AI Kích Nét (genai.toolxprint)
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

        {/* Quick Presets Picker */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
            Kích thước ấn phẩm thông dụng:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { label: '📰 Báo Tường A0 (841×1189 mm)', w: 841, h: 1189, u: 'mm' },
              { label: '📰 Báo Tường A1 (594×841 mm)', w: 594, h: 841, u: 'mm' },
              { label: 'A4 (210×297 mm)', w: 210, h: 297, u: 'mm' },
              { label: 'A5 (148×210 mm)', w: 148, h: 210, u: 'mm' },
              { label: 'A3 (297×420 mm)', w: 297, h: 420, u: 'mm' },
              { label: 'Voucher (18×8 cm)', w: 18, h: 8, u: 'cm' },
              { label: 'Standee (60×160 cm)', w: 60, h: 160, u: 'cm' },
              { label: 'Ảnh Vuông (1080×1080 px)', w: 1080, h: 1080, u: 'px' },
              { label: 'Full HD (1920×1080 px)', w: 1920, h: 1080, u: 'px' }
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p.w, p.h, p.u)}
                className="liquid-pill-btn"
                style={{ padding: '4px 10px', fontSize: '0.72rem' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dimension Inputs Card */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '10px', alignItems: 'center' }}>
            {/* Width */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Chiều rộng (W)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Lock Aspect Ratio Button */}
            <div style={{ paddingTop: '18px' }}>
              <Tooltip text={lockRatio ? 'Khóa tỉ lệ khung hình (Bấm để mở)' : 'Tỉ lệ tự do (Bấm để khóa)'}>
                <button
                  type="button"
                  onClick={() => setLockRatio(!lockRatio)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: lockRatio ? '#dbeafe' : '#f1f5f9',
                    border: '1px solid',
                    borderColor: lockRatio ? '#93c5fd' : '#cbd5e1',
                    color: lockRatio ? '#2563eb' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem'
                  }}
                >
                  <i className={`bi ${lockRatio ? 'bi-lock-fill' : 'bi-unlock'}`}></i>
                </button>
              </Tooltip>
            </div>

            {/* Height */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Chiều cao (H)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Unit Dropdown */}
            <div style={{ paddingTop: '18px' }}>
              <select
                value={unit}
                onChange={(e) => handleUnitChange(e.target.value)}
                style={{
                  padding: '9px 10px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#2563eb',
                  cursor: 'pointer'
                }}
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="in">inch</option>
                <option value="px">px</option>
              </select>
            </div>
          </div>

          {/* DPI Chooser */}
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Độ phân giải DPI:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { val: 300, label: '300 DPI (Chuẩn in ấn)' },
                { val: 150, label: '150 DPI (Bạt/Standee)' },
                { val: 72, label: '72 DPI (Màn hình)' }
              ].map((d) => (
                <button
                  key={d.val}
                  type="button"
                  onClick={() => setDpi(d.val)}
                  className={`liquid-pill-btn ${dpi === d.val ? 'active' : ''}`}
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calculated Pixel Output Summary Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
            border: '1px solid #bfdbfe',
            borderRadius: '14px',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af' }}>
              Điểm ảnh xuất xưởng (Output Pixels):
            </div>
            <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '2px' }}>
              Xử lý siêu phân giải qua GPU AI Kích Nét (NVIDIA GeForce GTX 1080 Ti)
            </div>
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono, monospace)',
              color: '#047857',
              background: 'rgba(255, 255, 255, 0.85)',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid #a7f3d0'
            }}
          >
            {targetPxW} × {targetPxH} px
          </div>
        </div>

        {/* GPU Upscale Progress Bar */}
        {isUpscaling && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
              <span>🚀 {stepText || 'GPU AI đang kết xuất...'}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#dcfce7', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div>
            {mode === 'result' && imageUrl && (
              <button
                type="button"
                onClick={handleDownloadDirect}
                disabled={isUpscaling}
                className="liquid-pill-btn"
                style={{
                  fontSize: '0.78rem',
                  padding: '8px 14px',
                  color: '#047857',
                  borderColor: '#a7f3d0',
                  background: '#ecfdf5',
                  opacity: isUpscaling ? 0.6 : 1,
                  cursor: isUpscaling ? 'not-allowed' : 'pointer'
                }}
              >
                <i className="bi bi-cpu"></i>
                <span>{isUpscaling ? 'Đang Kích Nét GPU...' : 'Kích Nét & Tải Về Ngay'}</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isUpscaling}
              className="liquid-pill-btn"
              style={{ fontSize: '0.8rem', padding: '8px 16px' }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isUpscaling}
              className="liquid-pill-btn active"
              style={{
                fontSize: '0.8rem',
                padding: '8px 20px',
                fontWeight: 800,
                background: '#2563eb',
                color: '#ffffff',
                opacity: isUpscaling ? 0.6 : 1,
                cursor: isUpscaling ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="bi bi-check2-circle"></i>
              <span>
                {isUpscaling
                  ? 'Đang Kích Nét...'
                  : mode === 'result'
                  ? 'Kích Nét GPU & Áp Dụng'
                  : 'Áp Dụng Kích Thước'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
