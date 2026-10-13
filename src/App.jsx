import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import BottomDock from './components/BottomDock';
import PromptCard from './components/PromptCard';
import ResultCard from './components/ResultCard';
import Mockup3DModal from './components/Mockup3DModal';
import GoogleAuthModal from './components/GoogleAuthModal';
import TopupModal from './components/TopupModal';
import EditImageModal from './components/EditImageModal';
import ImageLightboxModal from './components/ImageLightboxModal';
import AdminPromptModal from './components/AdminPromptModal';
import ToastStack from './components/ToastStack';
import GallerySection from './components/GallerySection';
import WorkersSection from './components/WorkersSection';
import BatchSection from './components/BatchSection';
import UpscaleSection from './components/UpscaleSection';
import ApiDocsSection from './components/ApiDocsSection';
import AdminSection from './components/AdminSection';
import { DESIGN_PRESETS, convertDimension, calculatePixels } from './data/presets';
import { getPromptTemplates, savePromptTemplates, getGeneralComment, saveGeneralComment } from './data/promptTemplates';
import { createRenderJob, formatReferenceImageUrl } from './utils/api';
import { getStoredUser, logoutUser, fetchMzPicSettings, fetchMzPicPrompts } from './utils/agentApi';

// Route synchronizer: mỗi tab là 1 route
const ROUTE_MAP = {
  '/': 'single',
  '/single': 'single',
  '/batch': 'batch',
  '/upscale': 'upscale',
  '/admin': 'admin',
  '/mzpic-admin': 'admin',
  '/library': 'library',
  '/devices': 'devices',
  '/workers': 'devices',
  '/docs': 'docs'
};

const TAB_TO_ROUTE = {
  single: '/single',
  batch: '/batch',
  upscale: '/upscale',
  admin: '/admin',
  library: '/library',
  devices: '/devices',
  docs: '/docs'
};

const getInitialTab = () => {
  const host = typeof window !== 'undefined' ? window.location.host.toLowerCase() : '';
  const path = typeof window !== 'undefined' ? (window.location.pathname.toLowerCase().replace(/\/$/, '') || '/') : '/';
  
  // Nếu mở trên agentapi.quanlymay.com hoặc path là /mzpic -> Vào thẳng tab Quản Trị
  if (host.includes('agentapi') || path.includes('mzpic') || path.includes('admin')) {
    return 'admin';
  }

  if (ROUTE_MAP[path]) return ROUTE_MAP[path];
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '/');
  if (ROUTE_MAP[hash]) return ROUTE_MAP[hash];
  return 'single';
};

export default function App() {
  // App States
  const [prompt, setPrompt] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState(() => {
    return localStorage.getItem('mzpic_default_preset_id') || 'flyer_a4';
  });

  const [unit, setUnit] = useState(() => {
    return localStorage.getItem('mzpic_default_unit') || 'mm';
  });
  const [width, setWidth] = useState(() => {
    const savedPresetId = localStorage.getItem('mzpic_default_preset_id') || 'flyer_a4';
    const p = DESIGN_PRESETS.flatMap((c) => c.items).find((i) => i.id === savedPresetId);
    return p ? p.width : 210;
  });
  const [height, setHeight] = useState(() => {
    const savedPresetId = localStorage.getItem('mzpic_default_preset_id') || 'flyer_a4';
    const p = DESIGN_PRESETS.flatMap((c) => c.items).find((i) => i.id === savedPresetId);
    return p ? p.height : 297;
  });
  const [aspectRatio, setAspectRatio] = useState(() => {
    return localStorage.getItem('mzpic_default_aspect_ratio') || 'portrait';
  });
  const [transparentBg, setTransparentBg] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState(() => {
    return localStorage.getItem('mzpic_default_style_id') || 'none';
  });
  const [referenceImage, setReferenceImage] = useState(null);

  // Custom Prompt Templates & Admin
  const [promptTemplates, setPromptTemplates] = useState(getPromptTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    const saved = localStorage.getItem('mzpic_default_template_id');
    const list = getPromptTemplates();
    if (saved && list.some(t => t.id === saved)) return saved;
    return list[0]?.id || 'tpl_voucher_gold';
  });
  const [generalComment, setGeneralComment] = useState(getGeneralComment);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  
  // Ví & Tài khoản
  const [walletBalance, setWalletBalance] = useState(50000);
  const costPerImage = 2000;
  const [user, setUser] = useState(() => {
    return getStoredUser() || {
      name: 'GoPrinx Admin',
      email: 'gox@quanlymay.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
      role: 'admin'
    };
  });

  // Đồng bộ cài đặt & Mẫu Prompt từ agentapi.quanlymay.com khi mở ứng dụng
  useEffect(() => {
    fetchMzPicSettings().then((s) => {
      if (s) {
        if (s.defaultPresetId) setSelectedPresetId(s.defaultPresetId);
        if (s.defaultUnit) setUnit(s.defaultUnit);
        if (s.defaultStyleId) setSelectedStyleId(s.defaultStyleId);
      }
    }).catch((err) => console.warn('Sync settings notice:', err));

    fetchMzPicPrompts().then((p) => {
      if (p && p.templates && p.templates.length > 0) {
        setPromptTemplates(p.templates);
      }
      if (p && p.generalComment) {
        setGeneralComment(p.generalComment);
      }
    }).catch((err) => console.warn('Sync prompts notice:', err));
  }, []);

  // Result & Processing
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [resultImage, setResultImage] = useState(null);
  const [resultFilename, setResultFilename] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);

  // Tabs & Routing
  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [onlineWorkersCount, setOnlineWorkersCount] = useState(3);

  const setActiveTab = useCallback((newTab) => {
    setActiveTabState(newTab);
    const targetRoute = TAB_TO_ROUTE[newTab] || '/single';
    if (window.location.pathname !== targetRoute) {
      window.history.pushState({ tab: newTab }, '', targetRoute);
    }
  }, []);

  useEffect(() => {
    const handlePopState = (e) => {
      const tabFromState = e.state?.tab;
      if (tabFromState) {
        setActiveTabState(tabFromState);
      } else {
        const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
        const tab = ROUTE_MAP[path] || 'single';
        setActiveTabState(tab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Modals
  const [topupOpen, setTopupOpen] = useState(false);
  const [googleAuthOpen, setGoogleAuthOpen] = useState(false);
  const [mockup3DOpen, setMockup3DOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    imageUrl: null,
    title: ''
  });

  const handleOpenLightbox = (imageUrl, title = 'Ảnh Gốc') => {
    if (!imageUrl) return;
    setLightboxState({
      isOpen: true,
      imageUrl,
      title
    });
  };

  const handleCloseLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };
  
  // 3D Mockup
  const [mockupUrl, setMockupUrl] = useState(null);
  const [isRenderingMockup, setIsRenderingMockup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Polling ref
  const pollIntervalRef = useRef(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync health & status from VPS ToolXPrint on load
  useEffect(() => {
    fetch('/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'healthy') {
          showToast(`⚡ Đã kết nối VPS ToolXPrint (${data.service || 'Render Bridge'} - 300 DPI)`, 'success');
        }
      })
      .catch(() => {});

    // Fetch active workers count
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.online_workers !== undefined) {
          setOnlineWorkersCount(data.online_workers);
        }
      })
      .catch(() => {});

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [showToast]);

  // Handle Preset Selection
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    localStorage.setItem('mzpic_default_preset_id', preset.id);
    setWidth(preset.width);
    setHeight(preset.height);
    setUnit(preset.unit);
    localStorage.setItem('mzpic_default_unit', preset.unit);

    let newRatio = 'portrait';
    if (preset.width === preset.height) {
      newRatio = 'square';
    } else if (preset.width > preset.height) {
      newRatio = 'landscape';
    } else {
      newRatio = 'portrait';
    }
    setAspectRatio(newRatio);
    localStorage.setItem('mzpic_default_aspect_ratio', newRatio);

    if (preset.promptHint && !prompt) {
      setPrompt(preset.promptHint);
    }

    showToast(`Đã chọn ấn phẩm: ${preset.name}`, 'info');
  };

  // Handle Unit Change
  const handleUnitChange = (newUnit) => {
    if (newUnit === unit) return;
    const newW = convertDimension(width, unit, newUnit, 300);
    const newH = convertDimension(height, unit, newUnit, 300);
    setWidth(newW);
    setHeight(newH);
    setUnit(newUnit);
    localStorage.setItem('mzpic_default_unit', newUnit);
    showToast(`Đổi đơn vị đo: [${newUnit.toUpperCase()}]`, 'info');
  };

  // Handle Aspect Ratio Change
  const handleAspectRatioChange = (mode) => {
    setAspectRatio(mode);
    localStorage.setItem('mzpic_default_aspect_ratio', mode);
    if (mode === 'square') {
      const size = Math.min(width, height);
      setWidth(size);
      setHeight(size);
    } else if (mode === 'landscape') {
      if (height > width) {
        const tmp = width;
        setWidth(height);
        setHeight(tmp);
      }
    } else if (mode === 'portrait') {
      if (width > height) {
        const tmp = width;
        setWidth(height);
        setHeight(tmp);
      }
    }
  };

  // Handle dropdown selection (chọn mẫu prompt ẩn)
  const handleSelectTemplateId = (tplId) => {
    setSelectedTemplateId(tplId);
    localStorage.setItem('mzpic_default_template_id', tplId);
    const found = promptTemplates.find((t) => t.id === tplId);
    if (found && found.presetId) {
      const preset = DESIGN_PRESETS.flatMap((c) => c.items).find((i) => i.id === found.presetId);
      if (preset) {
        setSelectedPresetId(preset.id);
        localStorage.setItem('mzpic_default_preset_id', preset.id);
        setWidth(preset.width);
        setHeight(preset.height);
        setUnit(preset.unit);
        localStorage.setItem('mzpic_default_unit', preset.unit);
        let r = 'portrait';
        if (preset.width === preset.height) r = 'square';
        else if (preset.width > preset.height) r = 'landscape';
        setAspectRatio(r);
        localStorage.setItem('mzpic_default_aspect_ratio', r);
      }
    }
    showToast(`Đã chọn mẫu: ${found ? found.name : tplId}`, 'info');
  };

  // Handle saving customized templates from Admin Modal
  const handleSaveTemplates = (newTemplates) => {
    setPromptTemplates(newTemplates);
    savePromptTemplates(newTemplates);
    if (!newTemplates.some((t) => t.id === selectedTemplateId)) {
      const fallbackId = newTemplates[0]?.id || '';
      setSelectedTemplateId(fallbackId);
      localStorage.setItem('mzpic_default_template_id', fallbackId);
    }
  };

  // Handle saving general comment from Admin Modal
  const handleSaveGeneralComment = (newComment) => {
    setGeneralComment(newComment);
    saveGeneralComment(newComment);
  };

  // Reset Session
  const handleResetSession = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setPrompt('');
    setResultImage(null);
    setResultFilename(null);
    setFileMeta(null);
    setReferenceImage(null);
    setProgress(0);
    setProgressText('');
    setMockupUrl(null);
    showToast('Đã reset phiên làm việc!', 'info');
  };

  // Handle Reference Image Upload (Ảnh cũ để AI sửa)
  const handleUploadReferenceImage = (file) => {
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage({
        url: event.target.result,
        name: file.name,
        sizeMb: (file.size / (1024 * 1024)).toFixed(2)
      });
      showToast(`Đã tải ảnh cũ lên: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReferenceImage = () => {
    setReferenceImage(null);
    showToast('Đã gỡ ảnh cũ tham chiếu', 'info');
  };

  // Format Currency
  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('vi-VN') + 'đ';
  };

  // Mapping aspect ratio to ToolXPrint VPS format
  const getVPSAspectRatio = () => {
    if (aspectRatio === 'square') return '1:1';
    if (aspectRatio === 'landscape') return '16:9';
    return '9:16';
  };

  const handleGenerate = async (overrideRefImage = null, overridePrompt = null) => {
    // Chống nhận nhầm React Event object khi trigger từ onClick
    const isImageRef = overrideRefImage && (
      typeof overrideRefImage === 'string' ||
      Boolean(overrideRefImage.url) ||
      Boolean(overrideRefImage.data)
    );
    const activeRef = isImageRef ? overrideRefImage : referenceImage;
    const rawPrompt = typeof overridePrompt === 'string' ? overridePrompt : prompt;
    const trimmed = (rawPrompt || '').trim();

    if (!trimmed && !activeRef) {
      showToast('Vui lòng nhập mô tả bức ảnh bạn muốn tạo ra hoặc tải ảnh cũ lên!', 'info');
      return;
    }

    if (walletBalance < costPerImage) {
      showToast(
        `Số dư ví không đủ (còn ${formatCurrency(walletBalance)}). Cần ${formatCurrency(costPerImage)} để tạo ảnh. Vui lòng nạp thêm!`,
        'error'
      );
      setTopupOpen(true);
      return;
    }

    setIsGenerating(true);
    setProgress(15);
    setProgressText('Đang kết nối tới máy chủ tạo ấn phẩm...');

    const mappedRatio = getVPSAspectRatio();
    let finalPrompt = trimmed || 'Làm mới và nâng cấp chất lượng ấn phẩm';

    // Ghép ngầm nội dung prompt mẫu ẩn từ dropdown (giấu đi nội dung này chỉ gửi đi thôi)
    const activeTpl = promptTemplates.find((t) => t.id === selectedTemplateId);
    if (activeTpl && activeTpl.hiddenPrompt && activeTpl.hiddenPrompt.trim()) {
      finalPrompt += `, ${activeTpl.hiddenPrompt.trim()}`;
    }

    // Ghép ngầm nội dung comment chung (General Comment) từ Admin
    if (generalComment && generalComment.trim()) {
      finalPrompt += `, ${generalComment.trim()}`;
    }

    if (transparentBg) {
      finalPrompt += ', isolated on pure white background, clean silhouette for transparent cutout';
    }

    try {
      // Gửi request tạo render job tới Worker Hub theo chuẩn API genai.toolxprint.com
      const createRes = await createRenderJob({
        prompt: finalPrompt,
        aspectRatio: mappedRatio,
        style: selectedStyleId,
        referenceImage: activeRef,
        preserveSurroundings: true
      });

      const jobId = createRes.id || createRes.job_id;

      setProgress(25);
      setProgressText(createRes.current_step || 'Đã vào hàng đợi xử lý xuất bản...');

      let attempts = 0;
      const maxAttempts = 75;

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const pollResp = await fetch(`/api/jobs/${jobId}`);
          if (pollResp.ok) {
            const job = await pollResp.json();

            if (job.progress && job.progress > 0) {
              setProgress(job.progress);
            }
            if (job.current_step) {
              setProgressText(job.current_step);
            }

            if (job.status === 'completed') {
              clearInterval(pollIntervalRef.current);
              setProgress(100);
              setProgressText('Hoàn tất 100%!');

              const imgUrl = job.result_image_url || (job.filename ? `/images/${job.filename}` : '');
              const fileSizeMb = job.file_size_bytes ? (job.file_size_bytes / (1024 * 1024)).toFixed(1) : '18.5';

              setResultImage(imgUrl);
              setResultFilename(job.filename || `mzpic_${Date.now()}.png`);
              setFileMeta({
                filesize_mb: fileSizeMb,
                dimensions: `${width} × ${height} ${unit.toUpperCase()}`,
                width,
                height,
                unit,
                dpi: 300,
                engine: 'vps'
              });

              setWalletBalance((prev) => Math.max(0, prev - costPerImage));
              setIsGenerating(false);
              showToast(`🎉 Đã xuất ấn phẩm 300 DPI thành công! (-${formatCurrency(costPerImage)})`, 'success');
            } else if (job.status === 'failed') {
              clearInterval(pollIntervalRef.current);
              setIsGenerating(false);
              showToast(`✖ Lỗi xử lý ấn phẩm: ${job.error || 'Thất bại'}`, 'error');
            }
          }
        } catch (pollErr) {
          console.warn('Lỗi thăm dò job:', pollErr);
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollIntervalRef.current);
          setIsGenerating(false);
          showToast('Quá thời gian chờ phản hồi từ máy chủ. Vui lòng kiểm tra lại.', 'error');
        }
      }, 2000);

    } catch (e) {
      console.error('Lỗi gọi máy chủ xử lý:', e);
      setIsGenerating(false);
      setProgress(0);
      showToast(`Không thể kết nối máy chủ: ${e.message}`, 'error');
    }
  };

  // Handle 3D Mockup: đưa ảnh mới thành reference images, ghép prompt 3D mockup, gửi về render sửa tiếp và nhận ảnh mới tiếp
  const handleOpenMockup3D = () => {
    if (!resultImage) {
      showToast('Chưa có ấn phẩm nào để tạo phối cảnh 3D!', 'info');
      return;
    }

    const newRefImage = {
      url: resultImage,
      name: resultFilename || 'previous_design.png'
    };
    setReferenceImage(newRefImage);

    const baseDesc = prompt ? prompt.trim() : 'Ấn phẩm thiết kế';
    const mockupPrompt = `${baseDesc}. Tạo phối cảnh 3D thực tế (realistic 3D mockup display presentation): đặt ấn phẩm này trong không gian thực tế hoặc trên bàn làm việc sang trọng, góc nghiêng 3D chuyên nghiệp, đổ bóng tự nhiên, ánh sáng studio sắc nét, giữ nguyên vẹn nội dung thiết kế gốc của ấn phẩm`;
    setPrompt(mockupPrompt);

    showToast('🚀 Đang gửi ấn phẩm sang render Phối Cảnh 3D thực tế...', 'info');
    handleGenerate(newRefImage, mockupPrompt);
  };

  // Handle Remove Background: đưa ảnh mới thành reference images, ghép prompt tách nền, gửi về render sửa tiếp
  const handleRemoveBg = async () => {
    if (!resultImage) {
      showToast('Chưa có ấn phẩm nào để tách nền!', 'info');
      return;
    }

    const newRefImage = {
      url: resultImage,
      name: resultFilename || 'previous_design.png'
    };
    setReferenceImage(newRefImage);
    setTransparentBg(true);

    const baseDesc = prompt ? prompt.trim() : 'Ấn phẩm thiết kế';
    const transparentPrompt = `${baseDesc}. Tách nền ấn phẩm trong suốt hoàn toàn (isolated transparent cutout on pure background), giữ nguyên vẹn đường nét thiết kế`;
    setPrompt(transparentPrompt);

    showToast('✂ Đang gửi yêu cầu tách nền ấn phẩm...', 'info');
    handleGenerate(newRefImage, transparentPrompt);
  };

  // Handle Edit Image
  const handleConfirmEdit = async (editPromptText) => {
    setIsEditing(true);
    showToast(`Đang gửi yêu cầu sửa ảnh: "${editPromptText.slice(0, 40)}..."`, 'info');
    
    const newCombined = `${prompt ? prompt + '. ' : ''}Yêu cầu chỉnh sửa chi tiết: ${editPromptText}`;
    setPrompt(newCombined);
    setEditModalOpen(false);
    setIsEditing(false);

    const refImage = resultImage
      ? { url: resultImage, name: resultFilename || 'previous_design.png' }
      : referenceImage;

    if (refImage) {
      setReferenceImage(refImage);
    }

    handleGenerate(refImage, newCombined);
  };

  // Handle Download Processed
  const handleDownload = () => {
    if (!resultImage) {
      showToast('Chưa có ảnh được xử lý để tải về!', 'info');
      return;
    }

    const format = transparentBg ? 'png' : 'png';
    const pxW = calculatePixels(width, unit, 300);
    const pxH = calculatePixels(height, unit, 300);
    const fileName = `Design_ToolXPrint_${selectedPresetId}_${pxW}x${pxH}_300DPI.${format}`;

    showToast(`Đang mở tải ảnh chuẩn in (${fileName})...`, 'info');

    // Mở ảnh sang tab mới (không mở đè tab hiện tại)
    window.open(resultImage, '_blank', 'noopener,noreferrer');

    try {
      const a = document.createElement('a');
      a.href = resultImage;
      a.download = fileName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {}

    showToast('✅ Đã mở tải ảnh chuẩn in 300 DPI trên tab mới!', 'success');
  };

  // Handle Open Image from Gallery or Batch into Studio
  const handleOpenInStudio = (imageUrl, promptText) => {
    setResultImage(imageUrl);
    const filename = imageUrl ? imageUrl.split('/').pop() : 'gallery_image.png';
    setReferenceImage({
      url: imageUrl,
      name: filename,
      sizeMb: '1.5'
    });
    if (promptText) setPrompt(promptText);
    setActiveTab('single');
    showToast('Đã nạp ấn phẩm vào Studio để tạo hoặc sửa!', 'success');
  };

  // Topup Wallet
  const handleConfirmTopup = (amount) => {
    setWalletBalance((prev) => prev + amount);
    showToast(`🎉 Nạp thành công +${formatCurrency(amount)} vào ví MzPic!`, 'success');
  };

  // Google Login
  const handleGoogleLogin = (account) => {
    setUser(account);
    setGoogleAuthOpen(false);
    showToast(`Xin chào ${account.name}! Đã kết nối với ToolXPrint Studio.`, 'success');
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    showToast('Đã đăng xuất tài khoản.', 'info');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Ambient Fluid Glow Mesh behind the mobile shell (Image 1 & 4) */}
      <div className="ambient-canvas" aria-hidden="true">
        <div className="ambient-blob-1"></div>
        <div className="ambient-blob-2"></div>
        <div className="ambient-blob-3"></div>
      </div>

      {/* Mobile & Narrow PC App Shell (max-width: 440px) */}
      <div className="liquid-app-shell">
        {/* Top Dynamic Island / Capsule Bar */}
        <Navbar
          walletBalance={walletBalance}
          onOpenTopup={() => setTopupOpen(true)}
          user={user}
          onOpenGoogleAuth={() => setGoogleAuthOpen(true)}
          onLogout={handleLogout}
          onResetSession={handleResetSession}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onlineWorkersCount={onlineWorkersCount}
          onOpenAdmin={() => setAdminModalOpen(true)}
        />

        {/* Content based on Active Tab */}
        <main style={{ padding: '12px 14px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'single' && (
            <>
              {/* Top Focal Stage: Result & High-res preview */}
              <ResultCard
                resultImage={resultImage}
                isGenerating={isGenerating}
                referenceImage={referenceImage}
                width={width}
                height={height}
                unit={unit}
                transparentBg={transparentBg}
                presetId={selectedPresetId}
                fileMeta={fileMeta}
                onOpenEdit={() => setEditModalOpen(true)}
                onOpenMockup3D={handleOpenMockup3D}
                onDownload={handleDownload}
                onRemoveBg={handleRemoveBg}
                onOpenLightbox={handleOpenLightbox}
              />

              {/* Prompt & Khổ In Unified 2-Tab Liquid Card */}
              <PromptCard
                prompt={prompt}
                setPrompt={setPrompt}
                onResetSession={handleResetSession}
                onGenerate={() => handleGenerate()}
                isGenerating={isGenerating}
                progress={progress}
                progressText={progressText}
                templates={promptTemplates}
                selectedTemplateId={selectedTemplateId}
                onSelectTemplateId={handleSelectTemplateId}
                onOpenAdmin={() => setAdminModalOpen(true)}
                referenceImage={referenceImage}
                onUploadReferenceImage={handleUploadReferenceImage}
                onRemoveReferenceImage={handleRemoveReferenceImage}
                selectedPresetId={selectedPresetId}
                onSelectPreset={handleSelectPreset}
                width={width}
                height={height}
                setWidth={setWidth}
                setHeight={setHeight}
                unit={unit}
                onUnitChange={handleUnitChange}
                aspectRatio={aspectRatio}
                onAspectRatioChange={handleAspectRatioChange}
                transparentBg={transparentBg}
                setTransparentBg={setTransparentBg}
                onOpenLightbox={handleOpenLightbox}
              />
            </>
          )}

          {/* Tab: BATCH */}
          {activeTab === 'batch' && (
            <BatchSection
              onOpenInStudio={handleOpenInStudio}
              showToast={showToast}
              onOpenLightbox={handleOpenLightbox}
            />
          )}

          {/* Tab: KÍCH NÉT AI */}
          {activeTab === 'upscale' && (
            <UpscaleSection
              currentStudioImage={resultImage}
              showToast={showToast}
              onOpenLightbox={handleOpenLightbox}
            />
          )}

          {/* Tab: THƯ VIỆN */}
          {activeTab === 'library' && (
            <GallerySection
              onOpenInStudio={handleOpenInStudio}
              showToast={showToast}
              onOpenLightbox={handleOpenLightbox}
            />
          )}

          {/* Tab: QUẢN TRỊ MZPIC (User, Prompt & Settings) */}
          {activeTab === 'admin' && (
            <AdminSection
              user={user}
              onLogout={handleLogout}
              onOpenGoogleAuth={() => setGoogleAuthOpen(true)}
              showToast={showToast}
              promptTemplates={promptTemplates}
              setPromptTemplates={setPromptTemplates}
              generalComment={generalComment}
              setGeneralComment={setGeneralComment}
            />
          )}

          {/* Tab: MÁY & EXTENSION */}
          {activeTab === 'devices' && (
            <WorkersSection
              showToast={showToast}
            />
          )}

          {/* Tab: API DOCS */}
          {activeTab === 'docs' && (
            <ApiDocsSection
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Floating Bottom Liquid Glass Pill Dock (Fixed to viewport bottom) */}
      {activeTab !== 'admin' && (
        <BottomDock
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {/* Modals */}
      <Mockup3DModal
        isOpen={mockup3DOpen}
        onClose={() => setMockup3DOpen(false)}
        mockupUrl={mockupUrl}
        originalImage={resultImage}
        isRenderingMockup={isRenderingMockup}
      />

      <GoogleAuthModal
        isOpen={googleAuthOpen}
        onClose={() => setGoogleAuthOpen(false)}
        onLogin={handleGoogleLogin}
        showToast={showToast}
      />

      <TopupModal
        isOpen={topupOpen}
        onClose={() => setTopupOpen(false)}
        currentBalance={walletBalance}
        onConfirmTopup={handleConfirmTopup}
      />

      <EditImageModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        originalImage={resultImage}
        onConfirmEdit={handleConfirmEdit}
        isEditing={isEditing}
      />

      {/* Admin Custom Prompts & General Comment Modal */}
      <AdminPromptModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        templates={promptTemplates}
        onSaveTemplates={handleSaveTemplates}
        generalComment={generalComment}
        onSaveGeneralComment={handleSaveGeneralComment}
        showToast={showToast}
      />

      {/* Lightbox Modal with Zoom / Pan / Download */}
      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        imageUrl={lightboxState.imageUrl}
        title={lightboxState.title}
        onClose={handleCloseLightbox}
      />

      {/* Toast Notifications */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
