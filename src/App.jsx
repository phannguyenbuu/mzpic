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
import CropRotateModal from './components/CropRotateModal';
import ExactResizeModal from './components/ExactResizeModal';
import ColorGradingModal from './components/ColorGradingModal';
import AdminPromptModal from './components/AdminPromptModal';
import ToastStack from './components/ToastStack';
import GallerySection from './components/GallerySection';
import WorkersSection from './components/WorkersSection';
import BatchSection from './components/BatchSection';
import UpscaleSection from './components/UpscaleSection';
import ApiDocsSection from './components/ApiDocsSection';
import AdminSection from './components/AdminSection';
import UserGalleryModal from './components/UserGalleryModal';
import { DESIGN_PRESETS, convertDimension, calculatePixels } from './data/presets';
import { getPromptTemplates, savePromptTemplates, getGeneralComment, saveGeneralComment } from './data/promptTemplates';
import { createRenderJob, formatReferenceImageUrl } from './utils/api';
import { getStoredUser, logoutUser, fetchMzPicSettings, fetchMzPicPrompts } from './utils/agentApi';

// Demo Before/After samples for initial User Gallery display
const DEFAULT_DEMO_GALLERY = [
  {
    id: 'demo_1',
    userId: 'default',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    beforeImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80',
    prompt: 'Thiết kế lại poster mỹ phẩm dưỡng trắng da cao cấp, ánh sáng studio sang trọng, tone pastel hiện đại',
    presetName: 'Poster Dọc A4',
    dimensions: '21 × 29.7 CM (300 DPI)',
    aspectRatio: 'poster_a4'
  },
  {
    id: 'demo_2',
    userId: 'default',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    beforeImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    afterImage: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    prompt: 'Banner quảng cáo tai nghe âm thanh cao cấp, công nghệ futuristic, ánh sáng neon cyberpunk',
    presetName: 'Banner Vuông 1:1',
    dimensions: '100 × 100 CM (300 DPI)',
    aspectRatio: 'square_100'
  }
];

// Helper lọc bỏ prompt kỹ thuật của app, không lưu prompt vào gallery để bảo mật
const extractUserPrompt = () => '';

// Làm sạch các tác phẩm đã lưu trước đó trong localStorage: xóa bỏ toàn bộ prompt
const cleanStoredGallery = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({ ...item, prompt: '' }));
};

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
  const [referenceImages, setReferenceImages] = useState([]);
  const referenceImage = referenceImages[0] || null;
  const setReferenceImage = useCallback((val) => {
    if (!val) {
      setReferenceImages([]);
    } else if (Array.isArray(val)) {
      setReferenceImages(val);
    } else {
      const item = typeof val === 'string'
        ? { id: 'ref_' + Date.now(), url: val, name: 'Ảnh mẫu' }
        : (val.id ? val : { ...val, id: 'ref_' + Date.now() });
      setReferenceImages([item]);
    }
  }, []);

  // Custom Prompt Templates & Admin
  const [promptTemplates, setPromptTemplates] = useState(getPromptTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    const saved = localStorage.getItem('mzpic_selected_template_id') || localStorage.getItem('mzpic_default_template_id');
    const list = getPromptTemplates();
    if (saved && list.some(t => t.id === saved)) return saved;
    const freeTpl = list.find(t => t.id === 'tpl_free_style' || (t.name && t.name.startsWith('Tự Do')));
    if (freeTpl) return freeTpl.id;
    return list[0]?.id || 'tpl_free_style';
  });
  const [generalComment, setGeneralComment] = useState(getGeneralComment);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  
  // Ví & Tài khoản
  const [walletBalance, setWalletBalance] = useState(50000);
  const costPerImage = 2000;
  const [user, setUser] = useState(() => {
    return getStoredUser() || null;
  });

  // User Gallery Modal & Items State
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [userGallery, setUserGallery] = useState(() => {
    const key = 'mzpic_user_gallery_' + (getStoredUser()?.id || getStoredUser()?.email || 'guest');
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return cleanStoredGallery(parsed);
      } catch (e) {}
    }
    return DEFAULT_DEMO_GALLERY;
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
        const cleaned = p.templates.map(t => {
          if (t.id === 'tpl_free_style' || (t.name && t.name.startsWith('Tự Do'))) {
            return { ...t, name: 'Tự Do' };
          }
          return t;
        });
        setPromptTemplates(cleaned);
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
  const [googleAuthOpen, setGoogleAuthOpen] = useState(() => !getStoredUser());
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

  // 1. Crop & Rotate Modal State
  const [cropModalState, setCropModalState] = useState({
    isOpen: false,
    imageUrl: null,
    imageName: 'Ảnh mẫu cần sửa',
    targetId: null
  });

  const handleOpenCropRotate = (img, index) => {
    if (!user) {
      setGoogleAuthOpen(true);
      showToast('🔒 Vui lòng đăng nhập để sử dụng tính năng này!', 'warning');
      return;
    }
    const url = img?.url || (typeof img === 'string' ? img : null);
    const name = img?.name || 'Ảnh mẫu cần sửa';
    const targetId = img?.id || (typeof index === 'number' ? index : null);
    if (!url) return;
    setCropModalState({
      isOpen: true,
      imageUrl: url,
      imageName: name,
      targetId
    });
  };

  const handleApplyCropRotate = (editedDataUrl) => {
    const targetId = cropModalState.targetId;
    setReferenceImages((prev) => {
      if (prev.length === 0) {
        return [{ id: 'ref_' + Date.now(), url: editedDataUrl, name: 'Ảnh đã sửa' }];
      }
      let found = false;
      const next = prev.map((item, idx) => {
        if (
          (targetId !== null && targetId !== undefined && (item.id === targetId || idx === targetId)) ||
          item.url === cropModalState.imageUrl
        ) {
          found = true;
          return {
            ...item,
            url: editedDataUrl,
            sizeMb: ((editedDataUrl.length * 0.75) / (1024 * 1024)).toFixed(2)
          };
        }
        return item;
      });
      if (!found && next.length > 0) {
        next[0] = {
          ...next[0],
          url: editedDataUrl,
          sizeMb: ((editedDataUrl.length * 0.75) / (1024 * 1024)).toFixed(2)
        };
      }
      return next;
    });
    showToast('✓ Đã cập nhật ảnh sau khi cắt & xoay!', 'success');
  };

  // 2. Exact Resize Modal State
  const [resizeModalState, setResizeModalState] = useState({
    isOpen: false,
    mode: 'result'
  });

  const handleOpenResize = (mode = 'result') => {
    if (!user) {
      setGoogleAuthOpen(true);
      showToast('🔒 Vui lòng đăng nhập để sử dụng tính năng này!', 'warning');
      return;
    }
    setResizeModalState({
      isOpen: true,
      mode
    });
  };

  const handleApplyResize = ({ width: newW, height: newH, unit: newU, dpi: newDpi, resizedDataUrl }) => {
    setWidth(newW);
    setHeight(newH);
    setUnit(newU);
    if (resizedDataUrl) {
      setResultImage(resizedDataUrl);
      showToast(`✓ Đã cập nhật kích thước chuẩn in: ${newW}×${newH} ${newU} (${newDpi} DPI)!`, 'success');
    } else {
      showToast(`✓ Đã áp dụng kích thước chuẩn in: ${newW}×${newH} ${newU}!`, 'success');
    }
  };

  // 3. Color Grading & Curves Modal State
  const [colorGradingOpen, setColorGradingOpen] = useState(false);

  const handleOpenColorGrading = () => {
    if (!user) {
      setGoogleAuthOpen(true);
      showToast('🔒 Vui lòng đăng nhập để sử dụng tính năng này!', 'warning');
      return;
    }
    if (!resultImage) {
      showToast('Chưa có ảnh kết quả để chỉnh màu!', 'warning');
      return;
    }
    setColorGradingOpen(true);
  };

  const handleApplyColorGrading = (adjustedDataUrl) => {
    setResultImage(adjustedDataUrl);
    showToast('✓ Đã áp dụng các thông số hậu kỳ màu sắc & Tone Curves!', 'success');
  };

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

  // Đồng bộ gallery khi user thay đổi
  useEffect(() => {
    const key = 'mzpic_user_gallery_' + (user?.id || user?.email || 'guest');
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserGallery(cleanStoredGallery(parsed));
          return;
        }
      } catch (e) {}
    }
    setUserGallery(DEFAULT_DEMO_GALLERY);
  }, [user]);

  const handleDeleteGalleryItem = useCallback((itemId) => {
    setUserGallery((prev) => {
      const next = prev.filter((item) => item.id !== itemId);
      const key = 'mzpic_user_gallery_' + (user?.id || user?.email || 'guest');
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    showToast('Đã xóa tác phẩm khỏi Gallery', 'info');
  }, [user, showToast]);

  const handleClearUserGallery = useCallback(() => {
    setUserGallery([]);
    const key = 'mzpic_user_gallery_' + (user?.id || user?.email || 'guest');
    try {
      localStorage.removeItem(key);
    } catch (e) {}
    showToast('Đã xóa toàn bộ lịch sử Gallery của bạn', 'info');
  }, [user, showToast]);

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
    localStorage.setItem('mzpic_selected_template_id', tplId);
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
    const displayName = (found?.id === 'tpl_free_style' || found?.name?.startsWith('Tự Do')) ? 'Tự Do' : (found?.name || tplId);
    showToast(`Đã chọn mẫu: ${displayName}`, 'info');
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
    setReferenceImages([]);
    setProgress(0);
    setProgressText('');
    setMockupUrl(null);
    showToast('Đã reset phiên làm việc!', 'info');
  };

  // Handle Reference Image Upload (Ảnh cũ để AI sửa - hỗ trợ nhiều ảnh)
  const handleUploadReferenceImage = (file) => {
    if (!user) {
      setGoogleAuthOpen(true);
      showToast('🔒 Vui lòng đăng nhập để tải ảnh lên!', 'warning');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)!', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const newImg = {
        id: 'ref_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        url: event.target.result,
        name: file.name,
        sizeMb: (file.size / (1024 * 1024)).toFixed(2)
      };
      setReferenceImages((prev) => [...prev, newImg]);
      showToast(`Đã thêm ảnh tham chiếu: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadReferenceImages = (files) => {
    if (!user) {
      setGoogleAuthOpen(true);
      showToast('🔒 Vui lòng đăng nhập để tải ảnh lên!', 'warning');
      return;
    }

    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      showToast('Vui lòng chọn file hình ảnh!', 'error');
      return;
    }
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImg = {
          id: 'ref_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          url: event.target.result,
          name: file.name,
          sizeMb: (file.size / (1024 * 1024)).toFixed(2)
        };
        setReferenceImages((prev) => [...prev, newImg]);
      };
      reader.readAsDataURL(file);
    });
    showToast(`Đã thêm ${fileList.length} ảnh tham chiếu!`, 'success');
  };

  const handleRemoveReferenceImage = (targetIdOrIndex) => {
    if (targetIdOrIndex === undefined || targetIdOrIndex === null) {
      setReferenceImages([]);
      showToast('Đã gỡ tất cả ảnh tham chiếu', 'info');
      return;
    }
    setReferenceImages((prev) => {
      if (typeof targetIdOrIndex === 'number') {
        return prev.filter((_, idx) => idx !== targetIdOrIndex);
      }
      return prev.filter((img) => img.id !== targetIdOrIndex && img.url !== targetIdOrIndex);
    });
    showToast('Đã gỡ ảnh tham chiếu', 'info');
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
    if (!user) {
      setGoogleAuthOpen(true);
      showToast('🔒 Vui lòng đăng nhập để bắt đầu thiết kế ấn phẩm!', 'warning');
      return;
    }

    // Chống nhận nhầm React Event object khi trigger từ onClick
    const isImageRef = overrideRefImage && (
      typeof overrideRefImage === 'string' ||
      Boolean(overrideRefImage.url) ||
      Boolean(overrideRefImage.data) ||
      Array.isArray(overrideRefImage)
    );
    const activeRef = isImageRef ? overrideRefImage : referenceImage;
    const activeRefs = Array.isArray(overrideRefImage)
      ? overrideRefImage
      : (referenceImages.length > 0 ? referenceImages : (activeRef ? [activeRef] : []));
    const rawPrompt = typeof overridePrompt === 'string' ? overridePrompt : prompt;
    const trimmed = (rawPrompt || '').trim();

    if (!trimmed && !activeRef && activeRefs.length === 0) {
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
        referenceImages: activeRefs,
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

              // Tự động lưu vào Gallery của user kèm Before (ảnh mẫu gốc) / After (kết quả)
              // Không lưu prompt mặc định của app, chỉ lưu lại nội dung prompt nếu người dùng có nhập thêm
              const currentPreset = DESIGN_PRESETS.flatMap((c) => c.items).find((i) => i.id === selectedPresetId);
              const galPrompt = extractUserPrompt(prompt, overridePrompt);
              const newGalItem = {
                id: 'gal_' + Date.now(),
                userId: user?.id || user?.email || 'guest',
                timestamp: new Date().toISOString(),
                beforeImage: activeRef?.url || referenceImage?.url || null,
                afterImage: imgUrl,
                prompt: galPrompt,
                presetName: currentPreset?.name || 'Ấn phẩm',
                dimensions: `${width} × ${height} ${unit.toUpperCase()} (300 DPI)`,
                aspectRatio: selectedPresetId,
                style: selectedStyleId
              };
              setUserGallery((prev) => {
                const next = [newGalItem, ...prev];
                const key = 'mzpic_user_gallery_' + (user?.id || user?.email || 'guest');
                try {
                  localStorage.setItem(key, JSON.stringify(next));
                } catch (e) {}
                return next;
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
    if (!user) {
      setGoogleAuthOpen(true);
      showToast('🔒 Vui lòng đăng nhập để đặt trong không gian thực tế!', 'warning');
      return;
    }
    if (!resultImage) {
      showToast('Chưa có ấn phẩm nào để đặt trong không gian thực tế!', 'info');
      return;
    }

    const newRefImage = {
      url: resultImage,
      name: resultFilename || 'previous_design.png'
    };
    setReferenceImage(newRefImage);

    const baseDesc = prompt ? prompt.trim() : 'Ấn phẩm thiết kế';
    const mockupPrompt = `${baseDesc}. Tạo phối cảnh 3D thực tế (realistic 3D mockup display presentation): đặt ấn phẩm này trong không gian thực tế hoặc trên bàn làm việc sang trọng, góc nghiêng 3D chuyên nghiệp, đổ bóng tự nhiên, ánh sáng studio sắc nét, giữ nguyên vẹn nội dung thiết kế gốc của ấn phẩm`;
    
    // Che nội dung prompt trên UI: xóa trắng ô nhập để người dùng nhìn vào thấy rỗng
    setPrompt('');

    showToast('🚀 Đang gửi ấn phẩm sang render đặt trong không gian thực tế...', 'info');
    handleGenerate(newRefImage, mockupPrompt);
  };

  // Handle Remove Background: đưa ảnh mới thành reference images, ghép prompt tách nền, gửi về render sửa tiếp
  const handleRemoveBg = async () => {
    if (!user) {
      setGoogleAuthOpen(true);
      showToast('🔒 Vui lòng đăng nhập để tách nền ấn phẩm!', 'warning');
      return;
    }
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
    setPrompt('');

    showToast('✂ Đang gửi yêu cầu tách nền ấn phẩm...', 'info');
    handleGenerate(newRefImage, transparentPrompt);
  };

  // Handle Edit Image
  const handleConfirmEdit = async (editPromptText) => {
    if (!user) {
      setGoogleAuthOpen(true);
      showToast('🔒 Vui lòng đăng nhập để chỉnh sửa ấn phẩm!', 'warning');
      return;
    }
    setIsEditing(true);
    showToast(`Đang gửi yêu cầu sửa ảnh: "${editPromptText.slice(0, 40)}..."`, 'info');
    
    const newCombined = `${prompt ? prompt + '. ' : ''}Yêu cầu chỉnh sửa chi tiết: ${editPromptText}`;
    setPrompt(''); // Che nội dung prompt, làm rỗng ô nhập để giao diện sạch sẽ
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
    if (!user) {
      setGoogleAuthOpen(true);
      showToast('🔒 Vui lòng đăng nhập để tải ảnh chuẩn in!', 'warning');
      return;
    }
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
  const handleOpenInStudio = (imageUrl, promptText, beforeImageUrl) => {
    setResultImage(imageUrl);
    const filename = imageUrl ? imageUrl.split('/').pop() : 'gallery_image.png';
    if (beforeImageUrl) {
      setReferenceImage({
        url: beforeImageUrl,
        name: 'Ảnh mẫu gốc',
        sizeMb: '1.2'
      });
    } else {
      setReferenceImage({
        url: imageUrl,
        name: filename,
        sizeMb: '1.5'
      });
    }
    if (
      promptText &&
      promptText !== 'Đặt trong không gian thực tế' &&
      promptText !== 'Phối cảnh 3D thực tế' &&
      promptText !== 'Tách nền trong suốt' &&
      !promptText.includes('realistic 3D mockup')
    ) {
      setPrompt(promptText);
    } else {
      setPrompt('');
    }
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
    setGoogleAuthOpen(true);
    showToast('Đã đăng xuất tài khoản. Vui lòng đăng nhập để tiếp tục làm việc.', 'info');
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
          onOpenGalleryModal={() => {
            if (!user) {
              setGoogleAuthOpen(true);
              showToast('🔒 Vui lòng đăng nhập để xem Gallery cá nhân!', 'warning');
            } else {
              setGalleryModalOpen(true);
            }
          }}
          galleryCount={userGallery.length}
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
                onOpenEdit={() => {
                  if (!user) {
                    setGoogleAuthOpen(true);
                    showToast('🔒 Vui lòng đăng nhập để chỉnh sửa ấn phẩm!', 'warning');
                  } else {
                    setEditModalOpen(true);
                  }
                }}
                onOpenMockup3D={handleOpenMockup3D}
                onDownload={handleDownload}
                onRemoveBg={handleRemoveBg}
                onOpenLightbox={handleOpenLightbox}
                onOpenResize={() => handleOpenResize('result')}
                onOpenColorGrading={handleOpenColorGrading}
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
                referenceImages={referenceImages}
                onUploadReferenceImage={handleUploadReferenceImage}
                onUploadReferenceImages={handleUploadReferenceImages}
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
                onOpenCropRotate={handleOpenCropRotate}
                onOpenExactResize={() => handleOpenResize('input')}
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
        isOpen={googleAuthOpen || !user}
        isRequired={!user}
        onClose={() => {
          if (user) setGoogleAuthOpen(false);
          else showToast('🔒 Bạn cần đăng nhập để bắt đầu làm việc trong Studio!', 'warning');
        }}
        onLogin={handleGoogleLogin}
        showToast={showToast}
      />

      {/* User Personal Transformation Gallery Modal with Before/After Slider */}
      <UserGalleryModal
        isOpen={galleryModalOpen}
        onClose={() => setGalleryModalOpen(false)}
        user={user}
        galleryItems={userGallery}
        onDeleteItem={handleDeleteGalleryItem}
        onClearAll={handleClearUserGallery}
        onOpenInStudio={handleOpenInStudio}
        onOpenLightbox={handleOpenLightbox}
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

      {/* Crop & Rotate Modal for Reference Image */}
      {cropModalState.isOpen && (
        <CropRotateModal
          isOpen={cropModalState.isOpen}
          imageUrl={cropModalState.imageUrl}
          imageName={cropModalState.imageName}
          onClose={() => setCropModalState((prev) => ({ ...prev, isOpen: false }))}
          onApply={handleApplyCropRotate}
        />
      )}

      {/* Exact Resize & Dimensions Modal */}
      {resizeModalState.isOpen && (
        <ExactResizeModal
          isOpen={resizeModalState.isOpen}
          mode={resizeModalState.mode}
          imageUrl={resizeModalState.mode === 'result' ? resultImage : (referenceImage?.url || null)}
          currentWidth={width}
          currentHeight={height}
          currentUnit={unit}
          onClose={() => setResizeModalState((prev) => ({ ...prev, isOpen: false }))}
          onApplyResize={handleApplyResize}
        />
      )}

      {/* Photoshop-like Color Grading & Tone Curves Modal */}
      {colorGradingOpen && (
        <ColorGradingModal
          isOpen={colorGradingOpen}
          imageUrl={resultImage}
          onClose={() => setColorGradingOpen(false)}
          onApply={handleApplyColorGrading}
        />
      )}

      {/* Toast Notifications */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
