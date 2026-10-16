import React, { useState, useEffect, useRef } from 'react';
import Tooltip from './Tooltip';
import SuggestionModal from './SuggestionModal';
import { calculatePixels } from '../data/presets';
import { extractImageFromPasteEvent, readImageFromClipboard } from '../utils/clipboard';

export default function PromptCard({
  prompt,
  setPrompt,
  onResetSession,
  onGenerate,
  isGenerating,
  progress,
  progressText,
  templates = [],
  selectedTemplateId,
  onSelectTemplateId,
  onOpenAdmin,
  referenceImage,
  referenceImages = [],
  onUploadReferenceImage,
  onUploadReferenceImages,
  onRemoveReferenceImage,
  // Khổ in specs props
  selectedPresetId,
  onSelectPreset,
  width = 841,
  height = 1189,
  setWidth,
  setHeight,
  unit = 'mm',
  onUnitChange,
  aspectRatio = 'portrait',
  onAspectRatioChange,
  transparentBg = false,
  setTransparentBg,
  onOpenLightbox,
  onOpenCropRotate,
  onOpenExactResize,
  onOpenEdit,
  onOpenResize,
  onOpenColorGrading,
  onOpenMockup3D,
  onRemoveBg,
  onDownload,
  onDownloadPdf,
  onDownloadWithGenAiUpscale,
  aiUpscaleState,
  resultImage,
  // 4 Tabs Báo Tường: Đường Viền, Header, Footer, Body
  borderPrompt = '',
  setBorderPrompt,
  borderImages = [],
  borderTransparency = 0,
  setBorderTransparency,
  headerPrompt = '',
  setHeaderPrompt,
  headerImages = [],
  headerTransparency = 0,
  setHeaderTransparency,
  footerPrompt = '',
  setFooterPrompt,
  footerImages = [],
  footerTransparency = 0,
  setFooterTransparency,
  bodyPrompt = '',
  setBodyPrompt,
  bodyImages = [],
  bodyTransparency = 0,
  setBodyTransparency,
  activePromptSection = 'border',
  setActivePromptSection,
  onUploadSectionImages,
  onRemoveSectionImage,
  onSelectSampleImage,
  showToast,
  autoUpscaleA0 = true,
  setAutoUpscaleA0
}) {
  const [localSection, setLocalSection] = useState('border');
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const currentSection = activePromptSection || localSection;
  const setSection = setActivePromptSection || setLocalSection;
  const fileInputRef = useRef(null);

  const sections = [
    {
      id: 'border',
      label: 'Border (Đường Viền)',
      shortLabel: 'Border',
      icon: 'bi-border-style',
      emoji: '🌸',
      accentColor: '#f43f5e',
      gradientClass: 'gradient-peach-rose',
      glowColor: 'rgba(244, 63, 94, 0.55)',
      activeBg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      borderColor: '#fecdd3',
      badgeText: 'Border U ngược ≤ 1%',
      prompt: borderPrompt,
      setPrompt: setBorderPrompt,
      images: borderImages || [],
      transparency: borderTransparency,
      setTransparency: setBorderTransparency,
      placeholder: 'Mô tả Border đường viền (hoa văn màu hồng, viền chữ U ngược, độ dày tối đa ≤ 1% chiều rộng ảnh)...',
      tags: [
        'Border hoa văn chữ U ngược màu hồng',
        'Độ dày border tối đa ≤ 1% chiều rộng',
        'Border hoa hồng leo uốn lượn u ngược',
        'Họa tiết hoa sen hồng thanh lịch',
        'Border ren pastel nhẹ nhàng học trò'
      ]
    },
    {
      id: 'header',
      label: 'Header (Đầu Báo)',
      shortLabel: 'Header',
      icon: 'bi-layout-text-window-reverse',
      emoji: '🏷️',
      accentColor: '#8b5cf6',
      gradientClass: 'gradient-neon-violet',
      glowColor: 'rgba(139, 92, 246, 0.55)',
      activeBg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      borderColor: '#ddd6fe',
      badgeText: 'Tiêu đề đầu trang',
      prompt: headerPrompt,
      setPrompt: setHeaderPrompt,
      images: headerImages || [],
      transparency: headerTransparency,
      setTransparency: setHeaderTransparency,
      placeholder: 'Mô tả tiêu đề đầu báo tường (tên báo, kiểu chữ thư pháp nghệ thuật, biểu ngữ, trang trí...)...',
      tags: [
        'TRI ÂN THẦY CÔ',
        'CHẮP CÁNH ƯỚC MƠ',
        'MÁI TRƯỜNG MẾN YÊU',
        'BÁO TƯỜNG 20/11',
        'NẮNG SÂN TRƯỜNG',
        'Chữ thư pháp nghệ thuật mạ vàng viền đỏ nổi bật'
      ]
    },
    {
      id: 'footer',
      label: 'Footer (Chân Báo)',
      shortLabel: 'Footer',
      icon: 'bi-layout-text-window',
      emoji: '📝',
      accentColor: '#06b6d4',
      gradientClass: 'gradient-deep-cyan',
      glowColor: 'rgba(6, 182, 212, 0.55)',
      activeBg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
      borderColor: '#a5f3fc',
      badgeText: 'Chân trang báo',
      prompt: footerPrompt,
      setPrompt: setFooterPrompt,
      images: footerImages || [],
      transparency: footerTransparency,
      setTransparency: setFooterTransparency,
      placeholder: 'Mô tả chân trang báo (thông tin chi đoàn, ngày tháng, hoa văn chân trang, lời ngỏ...)...',
      tags: [
        'Chi đoàn Thanh niên • Báo tường 20/11',
        'Tập thể Lớp 12A1 thân tặng',
        'Báo tường chào mừng Ngày Nhà Giáo Việt Nam',
        'Băng rôn mềm mại & hoa sen góc chân trang'
      ]
    },
    {
      id: 'body',
      label: 'Body Trang (Thân Báo)',
      shortLabel: 'Body',
      icon: 'bi-newspaper',
      emoji: '📄',
      accentColor: '#f59e0b',
      gradientClass: 'gradient-solar-gold',
      glowColor: 'rgba(245, 158, 11, 0.6)',
      activeBg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      borderColor: '#fde68a',
      badgeText: 'Nội dung thân báo',
      prompt: bodyPrompt,
      setPrompt: setBodyPrompt,
      images: bodyImages || [],
      transparency: bodyTransparency,
      setTransparency: setBodyTransparency,
      placeholder: 'Mô tả thân báo (bố cục các ô bài xã luận, góc thơ ca, tranh minh họa, khoảng trống viết bài...)...',
      tags: [
        'Bố cục chia 3 khung: Xã luận, góc thơ, tranh ảnh',
        'Khung giấy kẻ ô cổ điển chừa chỗ viết bài học trò',
        'Minh họa phấn trắng, bút mực, mái trường xưa',
        'Bố cục thoáng đãng, hài hòa, dễ đọc'
      ]
    }
  ];

  const curSec = sections.find((s) => s.id === currentSection) || sections[0];
  const totalTabImages = (borderImages?.length || 0) + (headerImages?.length || 0) + (footerImages?.length || 0) + (bodyImages?.length || 0);

  const handleSectionUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (onUploadSectionImages) {
      onUploadSectionImages(currentSection, files);
    } else if (onUploadReferenceImages) {
      onUploadReferenceImages(files);
    } else if (onUploadReferenceImage) {
      Array.from(files).forEach((f) => onUploadReferenceImage(f));
    }
    e.target.value = '';
  };

  const handleSectionPaste = async () => {
    try {
      const file = await readImageFromClipboard();
      if (file) {
        if (onUploadSectionImages) {
          onUploadSectionImages(currentSection, [file]);
        } else if (onUploadReferenceImage) {
          onUploadReferenceImage(file);
        }
      } else {
        alert('Không tìm thấy hình ảnh trong bộ nhớ tạm! Hãy chụp màn hình hoặc copy ảnh rồi bấm Paste.');
      }
    } catch (err) {
      alert(err.message || 'Không thể dán ảnh từ Clipboard. Hãy bấm phím Ctrl + V!');
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      const file = extractImageFromPasteEvent(e);
      if (file) {
        e.preventDefault();
        if (onUploadSectionImages) {
          onUploadSectionImages(currentSection, [file]);
        } else if (onUploadReferenceImage) {
          onUploadReferenceImage(file);
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [currentSection, onUploadSectionImages, onUploadReferenceImage]);

  const handleRemoveImage = (targetIdOrIndex) => {
    if (onRemoveSectionImage) {
      onRemoveSectionImage(currentSection, targetIdOrIndex);
    } else if (onRemoveReferenceImage) {
      onRemoveReferenceImage(targetIdOrIndex);
    }
  };

  const handleImageUpload = (e) => {
    handleSectionUpload(e);
  };

  const handlePasteClick = () => {
    handleSectionPaste();
  };

  const handleTagClick = (tag) => {
    if (!curSec.setPrompt) return;
    const currentVal = curSec.prompt || '';
    if (!currentVal.trim()) {
      curSec.setPrompt(tag);
    } else if (!currentVal.includes(tag)) {
      curSec.setPrompt(`${currentVal.trim()}, ${tag}`);
    }
  };

  const handleApplyPrompt = (sectionKey, promptText) => {
    if (sectionKey === 'border' && setBorderPrompt) setBorderPrompt(promptText);
    else if (sectionKey === 'header' && setHeaderPrompt) setHeaderPrompt(promptText);
    else if (sectionKey === 'footer' && setFooterPrompt) setFooterPrompt(promptText);
    else if (sectionKey === 'body' && setBodyPrompt) setBodyPrompt(promptText);
    else if (curSec.setPrompt) curSec.setPrompt(promptText);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onGenerate();
    }
  };

  const formatTemplateDisplayName = (name, id) => {
    if (id === 'tpl_free_style' || (name && name.startsWith('Tự Do'))) {
      return 'Tự Do';
    }
    return name || 'Tự Do';
  };
  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates.find((t) => t.id === 'tpl_free_style' || (t.name && t.name.startsWith('Tự Do'))) || templates[0];
  const currentTemplateDisplayName = formatTemplateDisplayName(currentTemplate?.name, currentTemplate?.id);
  const pxW = calculatePixels(width, unit, 300);
  const pxH = calculatePixels(height, unit, 300);

  const primaryPresets = [
    {
      id: 'wall_newspaper_a0',
      name: 'Báo Tường',
      fullName: 'Báo Tường A0',
      desc: '841 × 1189 mm',
      width: 841,
      height: 1189,
      unit: 'mm',
      gradientClass: 'gradient-peach-rose',
      bubbleGlow: 'rgba(244, 63, 94, 0.75)',
      animationBob: 'playfulBubbleBob1 4.2s ease-in-out infinite',
      icon: 'bi-newspaper',
      ratio: 'portrait',
      hint: 'Khổ Báo Tường A0 841×1189 mm, viền hoa văn chữ U ngược màu hồng'
    },
    {
      id: 'flyer_a4',
      name: 'A4',
      fullName: 'Tờ rơi A4',
      desc: '210 × 297 mm',
      width: 210,
      height: 297,
      unit: 'mm',
      gradientClass: 'gradient-peach-rose',
      bubbleGlow: 'rgba(244, 63, 94, 0.65)',
      animationBob: 'playfulBubbleBob1 4.2s ease-in-out infinite',
      icon: 'bi-file-earmark-text',
      ratio: 'portrait',
      hint: 'Khổ A4 tiêu chuẩn 210×297 mm cho tờ rơi, kẹp file'
    },
    {
      id: 'flyer_a5',
      name: 'A5',
      fullName: 'Tờ rơi A5',
      desc: '148 × 210 mm',
      width: 148,
      height: 210,
      unit: 'mm',
      gradientClass: 'gradient-deep-cyan',
      bubbleGlow: 'rgba(2, 132, 199, 0.65)',
      animationBob: 'playfulBubbleBob2 3.8s ease-in-out infinite',
      icon: 'bi-file-text',
      ratio: 'portrait',
      hint: 'Khổ A5 nhỏ gọn 148×210 mm, tiết kiệm chi phí in'
    },
    {
      id: 'voucher_std',
      name: 'Voucher',
      fullName: 'Voucher VIP',
      desc: '18 × 8 cm',
      width: 18,
      height: 8,
      unit: 'cm',
      gradientClass: 'gradient-solar-gold',
      bubbleGlow: 'rgba(245, 158, 11, 0.65)',
      animationBob: 'playfulBubbleBob3 4.5s ease-in-out infinite',
      icon: 'bi-ticket-perforated',
      ratio: 'landscape',
      hint: 'Phiếu quà tặng 18×8 cm chuẩn in offset'
    },
    {
      id: 'standee_std',
      name: 'Standee',
      fullName: 'Standee',
      desc: '0.6 × 1.6 m',
      width: 0.6,
      height: 1.6,
      unit: 'm',
      gradientClass: 'gradient-cyber-emerald',
      bubbleGlow: 'rgba(16, 185, 129, 0.65)',
      animationBob: 'playfulBubbleBob4 3.9s ease-in-out infinite',
      icon: 'bi-badge-ad',
      ratio: 'portrait',
      hint: 'Standee đứng chữ X / cuốn nhôm sự kiện'
    },
    {
      id: 'namecard_vn',
      name: 'Card',
      fullName: 'Namecard',
      desc: '90 × 54 mm',
      width: 90,
      height: 54,
      unit: 'mm',
      gradientClass: 'gradient-sunset-amber',
      bubbleGlow: 'rgba(236, 72, 153, 0.65)',
      animationBob: 'playfulBubbleBob5 4.1s ease-in-out infinite',
      icon: 'bi-person-badge',
      ratio: 'landscape',
      hint: 'Danh thiếp tiêu chuẩn Việt Nam 90×54 mm'
    }
  ];

  return (
    <div className="liquid-card" style={{ marginBottom: '14px' }}>
      <div className="liquid-card-glow"></div>

      {/* Curved / Notched Floating Tab Bar (Modern Minimalist UI - Image 3 style) */}
      <div className="curved-tab-wrapper">
        <div className="curved-tab-bar">
          {sections.map((sec) => {
            const isActive = currentSection === sec.id;
            const imgCount = sec.images?.length || 0;
            const hasPrompt = Boolean(sec.prompt && sec.prompt.trim());

            return (
              <button
                key={sec.id}
                type="button"
                className={`curved-tab-item ${isActive ? 'active' : ''}`}
                onClick={() => setSection(sec.id)}
                aria-label={sec.label}
              >
                {isActive ? (
                  <>
                    {/* Vết khoét lõm sóng mượt Notched Scoop */}
                    <div className="curved-notch-scoop">
                      <svg width="74" height="20" viewBox="0 0 74 20" fill="none">
                        <path
                          d="M 0,0 C 14,0 18,20 37,20 C 56,20 60,0 74,0 Z"
                          fill="rgba(248, 250, 252, 0.98)"
                        />
                      </svg>
                    </div>

                    {/* Quả cầu tròn nổi Liquid 3D Bubble (Bộ icon Liquid Active) */}
                    <div
                      className={`curved-active-bubble liquid-style ${sec.gradientClass}`}
                      style={{
                        '--tab-glow': sec.glowColor,
                        boxShadow: `0 10px 24px -2px ${sec.glowColor}, 0 3px 8px rgba(0, 0, 0, 0.12)`
                      }}
                    >
                      <div className="bubble-specular-shine"></div>
                      <i className={`bi ${sec.icon}`}></i>
                      {/* Image count badge */}
                      {imgCount > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-3px',
                            right: '-3px',
                            background: '#0f172a',
                            color: '#ffffff',
                            fontSize: '0.58rem',
                            fontWeight: 900,
                            minWidth: '16px',
                            height: '16px',
                            borderRadius: '9999px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1.5px solid #ffffff',
                            zIndex: 5
                          }}
                        >
                          {imgCount}
                        </span>
                      )}
                    </div>

                    {/* Label Active */}
                    <span className="curved-label" style={{ color: sec.accentColor, fontWeight: 800 }}>
                      {sec.shortLabel}
                    </span>
                  </>
                ) : (
                  <>
                    {/* Inactive Liquid Glass Squircle (Bộ icon Liquid Inactive) */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div
                        className={`liquid-tab-icon ${sec.gradientClass}`}
                        style={{
                          '--tab-glow': sec.glowColor
                        }}
                      >
                        <div className="liquid-tab-icon-shine"></div>
                        <i className={`bi ${sec.icon}`}></i>
                      </div>
                      {(hasPrompt || imgCount > 0) && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-3px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: sec.accentColor,
                            boxShadow: `0 0 8px ${sec.accentColor}`,
                            border: '1.5px solid #ffffff',
                            zIndex: 4
                          }}
                        />
                      )}
                    </div>

                    {/* Inactive Label */}
                    <span className="curved-label" style={{ color: '#475569', fontWeight: 700 }}>
                      {sec.shortLabel}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hidden File Input for Active Section */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleSectionUpload}
        style={{ display: 'none' }}
      />

          {/* Multi-Image Strip or Upload Button */}
          {curSec.images && curSec.images.length > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                background: 'rgba(255, 255, 255, 0.92)',
                border: `1.5px solid ${curSec.borderColor}`,
                borderRadius: '16px',
                marginBottom: '8px',
                overflowX: 'auto',
                scrollbarWidth: 'thin'
              }}
            >
              {curSec.images.map((img, idx) => {
                const url = img?.url || img;
                return (
                  <div
                    key={img?.id || url || idx}
                    style={{
                      position: 'relative',
                      width: '76px',
                      height: '76px',
                      flexShrink: 0,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: `1.5px solid ${curSec.accentColor}`,
                      background: '#f1f5f9',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                    }}
                  >
                    <img
                      src={url}
                      alt={`${curSec.shortLabel} #${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        cursor: 'pointer'
                      }}
                      onClick={() => onOpenCropRotate && onOpenCropRotate(img, idx)}
                      title="Bấm để Cắt & Xoay / Chỉnh sửa ảnh mẫu này"
                    />

                    {/* Crop tool icon badge at bottom-left */}
                    <div
                      onClick={() => onOpenCropRotate && onOpenCropRotate(img, idx)}
                      style={{
                        position: 'absolute',
                        bottom: '3px',
                        left: '3px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        background: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(3px)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        cursor: 'pointer'
                      }}
                      title="Cắt & Xoay ảnh"
                    >
                      <i className="bi bi-crop"></i>
                    </div>

                    {/* Delete button at top-right */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(img?.id !== undefined ? img.id : idx);
                      }}
                      style={{
                        position: 'absolute',
                        top: '3px',
                        right: '3px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                      }}
                      title={`Gỡ ảnh mẫu khỏi phần ${curSec.shortLabel}`}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                );
              })}

              {/* Add more ref images button slot */}
              <Tooltip text={`Thêm ảnh mẫu tham chiếu cho ${curSec.label} (+)`}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '76px',
                    height: '76px',
                    flexShrink: 0,
                    borderRadius: '12px',
                    border: `1.5px dashed ${curSec.accentColor}`,
                    background: curSec.activeBg,
                    color: curSec.accentColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    gap: '2px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <i className="bi bi-plus-lg" style={{ fontSize: '1.25rem', lineHeight: 1 }}></i>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800 }}>Thêm ảnh</span>
                </button>
              </Tooltip>

              {/* Paste Button slot */}
              <Tooltip text={`Dán thêm ảnh từ Clipboard vào ${curSec.label} (Ctrl + V)`}>
                <button
                  type="button"
                  onClick={handleSectionPaste}
                  style={{
                    width: '42px',
                    height: '76px',
                    flexShrink: 0,
                    borderRadius: '12px',
                    border: `1px solid ${curSec.borderColor}`,
                    background: '#ffffff',
                    color: curSec.accentColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    gap: '3px'
                  }}
                >
                  <i className="bi bi-clipboard-plus" style={{ fontSize: '0.95rem' }}></i>
                  <span style={{ fontSize: '0.55rem', fontWeight: 700 }}>Paste</span>
                </button>
              </Tooltip>

              {/* Suggestion Library Button slot */}
              <Tooltip text={`Mở Thư viện hình ảnh mẫu & Gợi ý prompt cho ${curSec.label}`}>
                <button
                  type="button"
                  onClick={() => setSuggestionModalOpen(true)}
                  style={{
                    width: '48px',
                    height: '76px',
                    flexShrink: 0,
                    borderRadius: '12px',
                    border: '1.5px solid #f59e0b',
                    background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                    color: '#b45309',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    gap: '3px'
                  }}
                >
                  <i className="bi bi-lightbulb-fill" style={{ fontSize: '1rem', color: '#d97706' }}></i>
                  <span style={{ fontSize: '0.58rem', fontWeight: 800 }}>Gợi ý</span>
                </button>
              </Tooltip>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="liquid-pill-btn"
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  justifyContent: 'center',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  border: `1.5px dashed ${curSec.accentColor}`,
                  background: curSec.activeBg,
                  color: curSec.accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="bi bi-cloud-arrow-up" style={{ fontSize: '0.95rem' }}></i>
                <span>Up Nhiều Ảnh Mẫu [{curSec.shortLabel}]</span>
              </button>

              <Tooltip text={`Dán ảnh từ bộ nhớ tạm vào phần ${curSec.label} (Ctrl + V)`}>
                <button
                  type="button"
                  onClick={handleSectionPaste}
                  className="liquid-pill-btn"
                  style={{
                    width: 'auto',
                    padding: '7px 12px',
                    justifyContent: 'center',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    border: `1.5px solid ${curSec.borderColor}`,
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: curSec.accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <i className="bi bi-clipboard-plus" style={{ fontSize: '0.95rem' }}></i>
                  <span>Paste (Ctrl+V)</span>
                </button>
              </Tooltip>

              <button
                type="button"
                onClick={() => setSuggestionModalOpen(true)}
                className="liquid-pill-btn"
                style={{
                  width: 'auto',
                  padding: '7px 14px',
                  justifyContent: 'center',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  border: '1.5px solid #f59e0b',
                  background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)',
                  cursor: 'pointer'
                }}
                title="Mở Thư viện hình ảnh mẫu báo tường & Gợi ý prompt"
              >
                <i className="bi bi-lightbulb-fill" style={{ color: '#d97706' }}></i>
                <span>Gợi ý</span>
              </button>
            </div>
          )}

          {/* Textarea for current section */}
          <div style={{ position: 'relative', marginBottom: '6px' }}>
            <textarea
              rows={3}
              value={curSec.prompt || ''}
              onChange={(e) => curSec.setPrompt && curSec.setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={curSec.placeholder}
              className="liquid-pill-input"
              style={{
                width: '100%',
                borderRadius: '16px',
                resize: 'none',
                fontSize: '0.84rem',
                lineHeight: '1.45',
                padding: '10px 14px',
                minHeight: '76px',
                border: `1.5px solid ${curSec.borderColor}`
              }}
            />
          </div>



          {/* Slim Liquid Progress Bar */}
          {isGenerating && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ height: '4px', background: 'rgba(226, 232, 240, 0.7)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #ec4899, #db2777)',
                    transition: 'width 0.3s ease'
                  }}
                ></div>
              </div>
              {progressText && (
                <div style={{ fontSize: '0.68rem', color: '#64748b', textAlign: 'center', marginTop: '4px', fontWeight: 600 }}>
                  {progressText}
                </div>
              )}
            </div>
          )}

      {/* Modal Gợi Ý Thiết Kế: 2 Tabs (1. Thư viện hình ảnh mẫu báo tường, 2. Prompt gợi ý tương ứng từng tab) */}
      <SuggestionModal
        isOpen={suggestionModalOpen}
        onClose={() => setSuggestionModalOpen(false)}
        activeSection={currentSection}
        onApplyPrompt={handleApplyPrompt}
        onSelectSampleImage={onSelectSampleImage}
        showToast={showToast}
        onOpenLightbox={onOpenLightbox}
        onOpenEdit={onOpenEdit}
        onOpenResize={onOpenResize}
        onOpenColorGrading={onOpenColorGrading}
        onOpenMockup3D={onOpenMockup3D}
        onRemoveBg={onRemoveBg}
        onDownload={onDownload}
        onDownloadPdf={onDownloadPdf}
        onDownloadWithGenAiUpscale={onDownloadWithGenAiUpscale}
        aiUpscaleState={aiUpscaleState}
        resultImage={resultImage}
        transparentBg={transparentBg}
      />
    </div>
  );
}
