import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
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
import { createRenderJob, formatReferenceImageUrl, extractJobImageUrl } from './utils/api';
import { requestAiUpscale, upscaleImageToHighRes, downloadFile } from './utils/upscale';
import { compositeLayersToDataUrl } from './utils/compositeLayers';
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

// Làm sạch các tác phẩm đã lưu trước đó trong localStorage: xóa bỏ prompt, khôi phục ảnh thiếu link và loại bỏ item hỏng
const cleanStoredGallery = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item) return null;
      let after = item.afterImage;
      if (!after || (typeof after === 'string' && after.trim() === '')) {
        if (item.dimensions && item.dimensions.includes('841 × 1189')) {
          after = 'https://genai.toolxprint.com/images/preview_job_1792021568518.png';
        } else if (item.dimensions && item.dimensions.includes('18 × 8')) {
          after = 'https://genai.toolxprint.com/images/preview_job_1792021305394.png';
        }
      }
      return {
        ...item,
        afterImage: after,
        prompt: ''
      };
    })
    .filter((item) => item && item.afterImage && typeof item.afterImage === 'string' && item.afterImage.trim() !== '');
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
  const DEFAULT_PROMPT_BAO_TUONG = 'Tôi muốn tạo viền hình vuông, viền hoa văn màu hồng, lưu ý viền hình chữ u (u ngược)';
  const [prompt, setPrompt] = useState(() => {
    return localStorage.getItem('schoolpaper_current_prompt') || localStorage.getItem('inforpaper_current_prompt') || DEFAULT_PROMPT_BAO_TUONG;
  });
  const [selectedPresetId, setSelectedPresetId] = useState(() => {
    return localStorage.getItem('mzpic_default_preset_id') || 'wall_newspaper_a0';
  });

  const [unit, setUnit] = useState(() => {
    return localStorage.getItem('mzpic_default_unit') || 'mm';
  });
  const [width, setWidth] = useState(() => {
    const savedPresetId = localStorage.getItem('mzpic_default_preset_id') || 'wall_newspaper_a0';
    const p = DESIGN_PRESETS.flatMap((c) => c.items).find((i) => i.id === savedPresetId);
    return p ? p.width : 841;
  });
  const [height, setHeight] = useState(() => {
    const savedPresetId = localStorage.getItem('mzpic_default_preset_id') || 'wall_newspaper_a0';
    const p = DESIGN_PRESETS.flatMap((c) => c.items).find((i) => i.id === savedPresetId);
    return p ? p.height : 1189;
  });
  const [aspectRatio, setAspectRatio] = useState(() => {
    return localStorage.getItem('mzpic_default_aspect_ratio') || 'portrait';
  });
  const [transparentBg, setTransparentBg] = useState(false);
  const [selectedStyleId, setSelectedStyleId] = useState(() => {
    return localStorage.getItem('mzpic_default_style_id') || 'none';
  });

  // 4 Tabs: Đường Viền, Header, Footer, Body Trang (Mỗi tab có prompt, multi-ảnh và độ trong suốt transparency riêng)
  const [borderPrompt, setBorderPrompt] = useState(
    'Tôi muốn tạo viền hình vuông, viền hoa văn màu hồng, lưu ý viền hình chữ u (u ngược). Viền dày tối đa 1% chiều rộng của ảnh.'
  );
  const [borderImages, setBorderImages] = useState([]);
  const [borderTransparency, setBorderTransparency] = useState(0); // 0% - 100%

  const [headerPrompt, setHeaderPrompt] = useState(
    'Tiêu đề đầu báo tường nổi bật: "TRI ÂN THẦY CÔ", kiểu chữ thư pháp nghệ thuật uốn lượn trang trọng, trang trí hoa văn mềm mại.'
  );
  const [headerImages, setHeaderImages] = useState([]);
  const [headerTransparency, setHeaderTransparency] = useState(0); // 0% - 100%

  const [footerPrompt, setFooterPrompt] = useState(
    'Chân trang báo: "Chi đoàn Thanh niên • Báo tường Chào mừng ngày 20/11", hoa văn góc đáy thanh lịch nhẹ nhàng.'
  );
  const [footerImages, setFooterImages] = useState([]);
  const [footerTransparency, setFooterTransparency] = useState(0); // 0% - 100%

  const [bodyPrompt, setBodyPrompt] = useState(
    'Thân báo tường ở giữa: phân bố các ô bài xã luận, góc thơ ca, lời ngỏ và tranh ảnh, bố cục thoáng đãng sạch sẽ để trình bày nội dung bài viết.'
  );
  const [bodyImages, setBodyImages] = useState([]);
  const [bodyTransparency, setBodyTransparency] = useState(90); // Mặc định 90% theo yêu cầu // 0% - 100%

  const [activePromptSection, setActivePromptSection] = useState('border'); // 'border' | 'header' | 'footer' | 'body'
  const [autoUpscaleA0, setAutoUpscaleA0] = useState(true);

  // 2 Layer Architecture (Khung Trang Trí + Thân Báo Tường) cho Hậu Kỳ Báo Tường
  const [layers, setLayers] = useState({
    frame: {
      id: 'frame',
      label: 'Khung (Viền • Header • Footer)',
      shortLabel: 'Khung',
      emoji: '🌸',
      accentColor: '#ec4899',
      image: null,
      opacity: 100,
      visible: true,
      zIndex: 2,
      blendMode: 'multiply'
    },
    body: {
      id: 'body',
      label: 'Thân Báo Tường (Nội dung • Ô kẻ)',
      shortLabel: 'Thân Báo',
      emoji: '📄',
      accentColor: '#f59e0b',
      image: null,
      opacity: 11, // Mặc định 11% theo yêu cầu của user
      visible: true,
      zIndex: 1
    }
  });

  const handleUpdateLayer = useCallback((layerId, updates) => {
    setLayers((prev) => {
      const target = prev[layerId];
      if (!target) return prev;
      return {
        ...prev,
        [layerId]: {
          ...target,
          ...updates
        }
      };
    });
  }, []);

  const handleReplaceLayerImage = useCallback((layerId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setLayers((prev) => ({
        ...prev,
        [layerId]: {
          ...(prev[layerId] || { id: layerId, opacity: 100, zIndex: 1 }),
          image: dataUrl,
          visible: true
        }
      }));
      showToast(`Đã tải ảnh mới cho layer ${layerId.toUpperCase()}!`, 'success');
    };
    reader.readAsDataURL(file);
  }, []);

  // Đồng bộ ảnh từ các tab sang các layer tương ứng
  useEffect(() => {
    const frameImg = borderImages[0]?.url || headerImages[0]?.url || footerImages[0]?.url;
    if (frameImg) {
      setLayers((prev) => ({
        ...prev,
        frame: { ...prev.frame, image: prev.frame.image || frameImg }
      }));
    }
  }, [borderImages, headerImages, footerImages]);

  useEffect(() => {
    if (bodyImages && bodyImages[0]?.url) {
      setLayers((prev) => ({
        ...prev,
        body: { ...prev.body, image: prev.body.image || bodyImages[0].url }
      }));
    }
  }, [bodyImages]);

  // Đồng bộ độ trong suốt của tab Body sang layer Body (VD: 90% transparent -> 10% opacity)
  useEffect(() => {
    if (bodyTransparency > 0) {
      setLayers((prev) => ({
        ...prev,
        body: {
          ...prev.body,
          opacity: Math.max(0, 100 - bodyTransparency)
        }
      }));
    }
  }, [bodyTransparency]);

  // Backward-compatible single ref image & ref images
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
    const saved = localStorage.getItem('schoolpaper_selected_template_id') || localStorage.getItem('mzpic_selected_template_id');
    const list = getPromptTemplates();
    if (saved && list.some(t => t.id === saved && t.id.includes('wall_newspaper'))) return saved;
    return 'tpl_wall_newspaper';
  });
  const [generalComment, setGeneralComment] = useState(getGeneralComment);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  
  // Ví & Tài khoản
  const [walletBalance, setWalletBalance] = useState(50000);
  const costPerImage = 2000;
  const [user, setUser] = useState(() => {
    return getStoredUser() || {
      id: 'studio_user',
      name: 'Người dùng Studio',
      email: 'user@schoolpaper.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
      isPro: true
    };
  });

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
  const upscaledImageRef = useRef(null);
  const upscalePromiseRef = useRef(null);
  const [aiUpscaleState, setAiUpscaleState] = useState({
    isUpscaling: false,
    progress: 0,
    stepText: '',
    jobId: null
  });

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

  // 1. Crop & Rotate Modal State
  const [cropModalState, setCropModalState] = useState({
    isOpen: false,
    imageUrl: null,
    imageName: 'Ảnh mẫu cần sửa',
    targetId: null
  });

  const handleOpenCropRotate = (img, index) => {
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

  // 1-Click Upscale trực tiếp về Báo Tường A0 qua API genai.toolxprint (GPU NVIDIA GTX 1080 Ti)
  const handleUpscaleA0 = useCallback(async () => {
    if (!resultImage) {
      showToast('Chưa có ảnh kết quả để kích nét / upscale!', 'warning');
      return;
    }
    showToast('🚀 Đang gửi yêu cầu Kích Nét AI lên GPU worker (genai.toolxprint)...', 'info');
    setAiUpscaleState({
      isUpscaling: true,
      progress: 5,
      stepText: 'Đang kích nét...',
      jobId: null
    });

    try {
      const upscaled = await requestAiUpscale(resultImage, {
        scale: 4,
        modelId: 'digital-art-4x',
        printDpi: 300,
        onProgress: ({ progress, jobId }) => {
          setAiUpscaleState({
            isUpscaling: true,
            progress,
            stepText: 'Đang kích nét...',
            jobId
          });
        }
      });

      const finalUrl = upscaled.downloadUrl || upscaled.url;
      upscaledImageRef.current = finalUrl;
      setResultImage(finalUrl);
      setWidth(841);
      setHeight(1189);
      setUnit('mm');
      setFileMeta((prev) => ({
        ...prev,
        dimensions: upscaled.targetDimensions
          ? `${upscaled.targetDimensions} PX (A0 300 DPI - GPU AI Kich Net)`
          : '841 × 1189 MM (300 DPI)',
        filesize_mb: upscaled.fileSizeMb || '25.0 MB',
        width: 841,
        height: 1189,
        unit: 'mm',
        dpi: 300,
        engine: 'gpu-upscayl'
      }));
      setAiUpscaleState({
        isUpscaling: false,
        progress: 100,
        stepText: 'Hoàn tất kích nét!',
        jobId: upscaled.id
      });
      showToast(`🎉 Kích nét AI hoàn tất bằng GPU (${upscaled.targetDimensions || 'Chuẩn A0 300 DPI'})!`, 'success');
    } catch (err) {
      setAiUpscaleState({
        isUpscaling: false,
        progress: 0,
        stepText: '',
        jobId: null
      });
      showToast(`❌ Lỗi kích nét AI: ${err.message}`, 'error');
    }
  }, [resultImage, showToast]);

  // 3. Color Grading & Curves Modal State
  const [colorGradingOpen, setColorGradingOpen] = useState(false);

  const handleOpenColorGrading = () => {
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
    setPrompt(DEFAULT_PROMPT_BAO_TUONG);
    setBorderPrompt('Tôi muốn tạo viền hình vuông, viền hoa văn màu hồng, lưu ý viền hình chữ u (u ngược). Viền dày tối đa 1% chiều rộng của ảnh.');
    setBorderImages([]);
    setBorderTransparency(0);
    setHeaderPrompt('Tiêu đề đầu báo tường nổi bật: "TRI ÂN THẦY CÔ", kiểu chữ thư pháp nghệ thuật uốn lượn trang trọng, trang trí hoa văn mềm mại.');
    setHeaderImages([]);
    setHeaderTransparency(0);
    setFooterPrompt('Chân trang báo: "Chi đoàn Thanh niên • Báo tường Chào mừng ngày 20/11", hoa văn góc đáy thanh lịch nhẹ nhàng.');
    setFooterImages([]);
    setFooterTransparency(0);
    setBodyPrompt('Thân báo tường ở giữa: phân bố các ô bài xã luận, góc thơ ca, lời ngỏ và tranh ảnh, bố cục thoáng đãng sạch sẽ để trình bày nội dung bài viết.');
    setBodyImages([]);
    setBodyTransparency(90);
    setResultImage(null);
    setLayers({
      frame: {
        id: 'frame',
        label: 'Khung (Viền • Header • Footer)',
        shortLabel: 'Khung',
        emoji: '🌸',
        accentColor: '#ec4899',
        image: null,
        opacity: 100,
        visible: true,
        zIndex: 2,
        blendMode: 'multiply'
      },
      body: {
        id: 'body',
        label: 'Thân Báo Tường (Nội dung • Ô kẻ)',
        shortLabel: 'Thân Báo',
        emoji: '📄',
        accentColor: '#f59e0b',
        image: null,
        opacity: 11,
        visible: true,
        zIndex: 1
      }
    });
    setResultFilename(null);
    setFileMeta(null);
    setReferenceImages([]);
    setProgress(0);
    setProgressText('');
    setMockupUrl(null);
    showToast('Đã reset toàn bộ 4 phần báo tường về mặc định!', 'info');
  };

  // Quản lý Upload đa ảnh riêng cho từng Tab (Đường viền, Header, Footer, Body)
  const handleUploadSectionImages = (section, files) => {
    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP)!', 'error');
      return;
    }
    const sectionNames = {
      border: 'Đường Viền',
      header: 'Header',
      footer: 'Footer',
      body: 'Body Trang'
    };
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImg = {
          id: `ref_${section}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          url: event.target.result,
          name: file.name,
          section,
          sizeMb: (file.size / (1024 * 1024)).toFixed(2)
        };
        if (section === 'border') setBorderImages((prev) => [...prev, newImg]);
        else if (section === 'header') setHeaderImages((prev) => [...prev, newImg]);
        else if (section === 'footer') setFooterImages((prev) => [...prev, newImg]);
        else if (section === 'body') setBodyImages((prev) => [...prev, newImg]);
      };
      reader.readAsDataURL(file);
    });
    showToast(`Đã thêm ${fileList.length} ảnh vào phần [${sectionNames[section] || section}]!`, 'success');
  };

  const handleRemoveSectionImage = (section, targetIdOrIndex) => {
    const filterFn = (img, idx) => {
      if (typeof targetIdOrIndex === 'number') return idx !== targetIdOrIndex;
      return img.id !== targetIdOrIndex && img.url !== targetIdOrIndex;
    };
    if (section === 'border') setBorderImages((prev) => prev.filter(filterFn));
    else if (section === 'header') setHeaderImages((prev) => prev.filter(filterFn));
    else if (section === 'footer') setFooterImages((prev) => prev.filter(filterFn));
    else if (section === 'body') setBodyImages((prev) => prev.filter(filterFn));
    showToast('Đã gỡ ảnh tham chiếu', 'info');
  };

  // Handle Reference Image Upload (Ảnh cũ để AI sửa - hỗ trợ nhiều ảnh)
  const handleUploadReferenceImage = (file) => {
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

  // Helper thăm dò 1 render job tới khi hoàn thành
  const pollJobUntilComplete = (jobId, onProgress) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 80;
      const interval = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(interval);
          reject(new Error(`Quá thời gian chờ render (job ${jobId})`));
          return;
        }
        try {
          const resp = await fetch(`/api/jobs/${jobId}`);
          if (!resp.ok) return;
          const job = await resp.json();
          if (onProgress) onProgress(job);
          if (job.status === 'completed') {
            clearInterval(interval);
            const img = extractJobImageUrl(job);
            if (img) resolve({ job, img });
            else reject(new Error('Máy chủ hoàn thành nhưng không tìm thấy ảnh'));
          } else if (job.status === 'failed') {
            clearInterval(interval);
            reject(new Error(job.error || 'Quá trình render thất bại'));
          }
        } catch (err) {
          // continue polling
        }
      }, 2000);
    });
  };

  // Hàm tạo prompt cho Layer Khung (Border + Header + Footer)
  const buildFramePrompt = () => {
    const parts = [];
    if (borderPrompt && borderPrompt.trim()) {
      parts.push(`[1. ĐƯỜNG VIỀN BÁO TƯỜNG]: ${borderPrompt.trim()}`);
    } else {
      parts.push(`[1. ĐƯỜNG VIỀN BÁO TƯỜNG]: Viền hoa văn màu hồng pastel dáng chữ U ngược (inverted U-shape pink ornamental border on top and both sides), độ dày đường viền tối đa không quá 1% chiều rộng bức ảnh.`);
    }

    if (headerPrompt && headerPrompt.trim()) {
      parts.push(`[2. TIÊU ĐỀ ĐẦU BÁO (HEADER)]: ${headerPrompt.trim()}`);
    } else {
      parts.push(`[2. TIÊU ĐỀ ĐẦU BÁO (HEADER)]: "TRI ÂN THẦY CÔ", kiểu chữ thư pháp nghệ thuật uốn lượn trang trọng, trang trí hoa văn mềm mại ở đỉnh báo.`);
    }

    if (footerPrompt && footerPrompt.trim()) {
      parts.push(`[3. CHÂN TRANG BÁO (FOOTER)]: ${footerPrompt.trim()}`);
    }

    parts.push(
      `[YÊU CẦU ĐẶC BIỆT BẮT BUỘC]: Chỉ vẽ khung trang trí viền hoa văn chữ U ngược, tiêu đề đầu báo nổi bật ở đỉnh, dải chân trang ở đáy. Toàn bộ phần thân giữa (body center) hoàn toàn trống màu trắng tinh khiết (pure solid white empty center), không vẽ ô kẻ, không có chữ hay tranh ở giữa để chừa không gian ghép layer thân báo vào sau.`
    );

    return parts.join('\n\n');
  };

  // Hàm tạo prompt cho Layer Thân Báo (Body)
  const buildBodyPrompt = () => {
    const parts = [];
    if (bodyPrompt && bodyPrompt.trim()) {
      parts.push(`[THÂN BÁO TƯỜNG (BODY TRANG)]: ${bodyPrompt.trim()}`);
    } else {
      parts.push(`[THÂN BÁO TƯỜNG (BODY TRANG)]: Bố cục thân báo tường học trò: phân chia các ô bài xã luận, góc thơ ca, lời ngỏ và tranh ảnh học trò, các khung giấy kẻ ô ngay ngắn chừa trống để học sinh viết bài.`);
    }

    parts.push(
      `[YÊU CẦU ĐẶC BIỆT]: Bố cục các ô nội dung thân báo tường trình bày trên nền giấy trắng tinh khiết (pure white background), bao gồm các ô bài viết, góc thơ, lời ngỏ, tranh vui học tập và dòng kẻ ô để học sinh viết bài. Tuyệt đối không vẽ khung viền chữ U ngược to bên ngoài hay tiêu đề lớn ở đỉnh báo (phần khung và tiêu đề đã được tách sang layer khác).`
    );

    return parts.join('\n\n');
  };

  // Tạo lại chỉ 1 layer riêng biệt (Khung hoặc Thân Báo)
  const handleRegenerateLayer = async (layerId) => {
    if (walletBalance < costPerImage) {
      showToast('Số dư ví không đủ để tạo lại layer này!', 'error');
      setTopupOpen(true);
      return;
    }

    const mappedRatio = getVPSAspectRatio();
    const isFrame = layerId === 'frame';
    showToast(`Đang tạo lại riêng layer [${isFrame ? 'KHUNG' : 'THÂN BÁO'}]...`, 'info');

    let targetPrompt = isFrame ? buildFramePrompt() : buildBodyPrompt();
    const activeTpl = promptTemplates.find((t) => t.id === selectedTemplateId);
    if (activeTpl && activeTpl.hiddenPrompt && activeTpl.hiddenPrompt.trim()) {
      targetPrompt += `\n\n${activeTpl.hiddenPrompt.trim()}`;
    }
    if (generalComment && generalComment.trim()) {
      targetPrompt += `, ${generalComment.trim()}`;
    }

    const targetRefs = isFrame
      ? [...borderImages, ...headerImages, ...footerImages]
      : [...bodyImages];

    try {
      const jobRes = await createRenderJob({
        prompt: targetPrompt,
        aspectRatio: mappedRatio,
        style: selectedStyleId,
        referenceImages: targetRefs,
        preserveSurroundings: true
      });

      const { img } = await pollJobUntilComplete(jobRes.id || jobRes.job_id);
      if (img) {
        setLayers((prev) => {
          const updated = {
            ...prev,
            [layerId]: {
              ...prev[layerId],
              image: img,
              visible: true
            }
          };

          // Tự động re-composite sang resultImage
          const targetW = calculatePixels(width || 841, unit || 'mm', 300);
          const targetH = calculatePixels(height || 1189, unit || 'mm', 300);
          compositeLayersToDataUrl(Object.values(updated), img, targetW, targetH)
            .then((data) => setResultImage(data))
            .catch(() => {});

          return updated;
        });

        showToast(`✓ Đã tạo lại thành công layer [${isFrame ? 'KHUNG' : 'THÂN BÁO'}]!`, 'success');
      }
    } catch (err) {
      showToast(`Lỗi tạo lại layer: ${err.message}`, 'error');
    }
  };

  // Main Generate Handler: Tách thành 2 Layer (Lần 1: Khung chung border/header/footer, Lần 2: Thân báo) rồi ghép lại
  const handleGenerate = async (overrideRefImage = null, overridePrompt = null) => {
    upscaledImageRef.current = null;
    upscalePromiseRef.current = null;

    if (walletBalance < costPerImage) {
      showToast(
        `Số dư ví không đủ (còn ${formatCurrency(walletBalance)}). Cần ${formatCurrency(costPerImage)} để tạo ảnh. Vui lòng nạp thêm!`,
        'error'
      );
      setTopupOpen(true);
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    setProgressText('Đang khởi tạo 2 render job: Layer Khung & Layer Thân Báo...');

    const mappedRatio = getVPSAspectRatio();

    let framePromptText = buildFramePrompt();
    let bodyPromptText = buildBodyPrompt();

    // Ghép ngầm nội dung prompt mẫu ẩn từ dropdown (giấu đi nội dung này chỉ gửi đi thôi)
    const activeTpl = promptTemplates.find((t) => t.id === selectedTemplateId);
    if (activeTpl && activeTpl.hiddenPrompt && activeTpl.hiddenPrompt.trim()) {
      framePromptText += `\n\n${activeTpl.hiddenPrompt.trim()}`;
      bodyPromptText += `\n\n${activeTpl.hiddenPrompt.trim()}`;
    }

    // Ghép ngầm nội dung comment chung (General Comment) từ Admin
    if (generalComment && generalComment.trim()) {
      framePromptText += `, ${generalComment.trim()}`;
      bodyPromptText += `, ${generalComment.trim()}`;
    }

    if (transparentBg) {
      framePromptText += ', isolated on pure white background, clean silhouette';
      bodyPromptText += ', isolated on pure white background';
    }

    const frameRefs = [
      ...borderImages,
      ...headerImages,
      ...footerImages
    ];
    const bodyRefs = [
      ...bodyImages
    ];

    try {
      // Gửi đồng thời 2 Render Job tới Worker Hub (1 cho Khung, 1 cho Thân Báo)
      setProgress(15);
      setProgressText('Đang gửi 2 layer (Khung & Thân Báo) tới máy chủ GPU...');

      const [frameJobRes, bodyJobRes] = await Promise.all([
        createRenderJob({
          prompt: framePromptText,
          aspectRatio: mappedRatio,
          style: selectedStyleId,
          referenceImages: frameRefs,
          preserveSurroundings: true
        }),
        createRenderJob({
          prompt: bodyPromptText,
          aspectRatio: mappedRatio,
          style: selectedStyleId,
          referenceImages: bodyRefs,
          preserveSurroundings: true
        })
      ]);

      const frameJobId = frameJobRes.id || frameJobRes.job_id;
      const bodyJobId = bodyJobRes.id || bodyJobRes.job_id;

      setProgress(25);
      setProgressText('2 Layer đã vào hàng đợi render song song...');

      let frameImgUrl = null;
      let bodyImgUrl = null;

      const framePollPromise = pollJobUntilComplete(frameJobId, (j) => {
        if (j.current_step) setProgressText(`[Khung] ${j.current_step}`);
      }).then(({ img }) => {
        frameImgUrl = img;
        setLayers((prev) => ({
          ...prev,
          frame: { ...prev.frame, image: img, visible: true }
        }));
        showToast('✓ Đã tạo xong Layer Khung (Viền • Header • Footer)!', 'info');
        return img;
      });

      const bodyPollPromise = pollJobUntilComplete(bodyJobId, (j) => {
        if (j.current_step) setProgressText(`[Thân báo] ${j.current_step}`);
      }).then(({ img }) => {
        bodyImgUrl = img;
        setLayers((prev) => ({
          ...prev,
          body: { ...prev.body, image: img, visible: true }
        }));
        showToast('✓ Đã tạo xong Layer Thân Báo!', 'info');
        return img;
      });

      await Promise.allSettled([framePollPromise, bodyPollPromise]);

      const finalFrame = frameImgUrl || layers.frame.image;
      const finalBody = bodyImgUrl || layers.body.image;

      if (!finalFrame && !finalBody) {
        setIsGenerating(false);
        showToast('Không nhận được ảnh từ máy chủ. Vui lòng bấm tạo lại!', 'warning');
        return;
      }

      setProgress(100);
      setProgressText('Đang ghép 2 layer hoàn thiện...');

      // Ghép composite preview chất lượng cao
      const targetW = calculatePixels(width || 841, unit || 'mm', 300);
      const targetH = calculatePixels(height || 1189, unit || 'mm', 300);

      const activeLayerList = [
        { id: 'body', image: finalBody, opacity: layers.body.opacity ?? 11, visible: true, zIndex: 1 },
        { id: 'frame', image: finalFrame, opacity: layers.frame.opacity ?? 100, visible: true, zIndex: 2, blendMode: 'multiply' }
      ].filter((l) => Boolean(l.image));

      const compositePreview = await compositeLayersToDataUrl(
        activeLayerList,
        finalFrame || finalBody,
        targetW,
        targetH
      );

      setResultImage(compositePreview);
      setResultFilename(`schoolpaper_${Date.now()}.png`);
      setFileMeta({
        filesize_mb: '18.5',
        dimensions: `${width} × ${height} ${unit.toUpperCase()}`,
        width,
        height,
        unit,
        dpi: 300,
        engine: 'vps-2layers'
      });

      // Tự động lưu vào Gallery của user
      const currentPreset = DESIGN_PRESETS.flatMap((c) => c.items).find((i) => i.id === selectedPresetId);
      const newGalItem = {
        id: 'gal_' + Date.now(),
        userId: user?.id || user?.email || 'guest',
        timestamp: new Date().toISOString(),
        beforeImage: (frameRefs[0]?.url || bodyRefs[0]?.url) || null,
        afterImage: compositePreview,
        prompt: '',
        presetName: currentPreset?.name || 'Báo Tường (2 Layer)',
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
      showToast('🎉 Đã tạo thành công ấn phẩm Báo Tường với 2 Layer độc lập!', 'success');

      // Chạy ngầm API kích nét genai.toolxprint (GPU worker NVIDIA GTX 1080 Ti) nếu autoUpscaleA0 bật
      if (autoUpscaleA0 && compositePreview) {
        setWidth(841);
        setHeight(1189);
        setUnit('mm');

        setAiUpscaleState({
          isUpscaling: true,
          progress: 5,
          stepText: 'Đang kích nét...',
          jobId: null
        });

        upscalePromiseRef.current = requestAiUpscale(compositePreview, {
          scale: 4,
          modelId: 'digital-art-4x',
          printDpi: 300,
          onProgress: ({ progress, jobId }) => {
            setAiUpscaleState({
              isUpscaling: true,
              progress,
              stepText: 'Đang kích nét...',
              jobId
            });
          }
        })
          .then((upscaled) => {
            if (upscaled && (upscaled.downloadUrl || upscaled.url)) {
              const finalUrl = upscaled.downloadUrl || upscaled.url;
              upscaledImageRef.current = finalUrl;
              setResultImage(finalUrl);
              setFileMeta({
                filesize_mb: upscaled.fileSizeMb || '25.0 MB',
                dimensions: upscaled.targetDimensions
                  ? `${upscaled.targetDimensions} PX (A0 300 DPI - GPU AI Kich Net)`
                  : '841 × 1189 MM (300 DPI)',
                width: 841,
                height: 1189,
                unit: 'mm',
                dpi: 300,
                engine: 'gpu-upscayl'
              });
              setAiUpscaleState({
                isUpscaling: false,
                progress: 100,
                stepText: 'Hoàn tất kích nét!',
                jobId: upscaled.id
              });
              showToast(`⚡ GPU AI (GTX 1080 Ti) đã kích nét xong (${upscaled.targetDimensions || 'Chuẩn A0'})! File tải về đã sẵn sàng ở độ phân giải cao nhất.`, 'info');
            }
            return upscaled;
          })
          .catch((err) => {
            console.warn('Background AI upscale notice:', err);
            setAiUpscaleState({
              isUpscaling: false,
              progress: 0,
              stepText: '',
              jobId: null
            });
          });
      }
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

  // Tải ảnh và kích nét GenAI tự động tổng hợp 4 layer hậu kỳ
  const handleDownloadWithGenAiUpscale = async () => {
    try {
      setAiUpscaleState({ isUpscaling: true, progress: 10, stepText: 'Đang kích nét...' });

      const targetW = calculatePixels(width || 841, unit || 'mm', 300);
      const targetH = calculatePixels(height || 1189, unit || 'mm', 300);

      const compositeDataUrl = await compositeLayersToDataUrl(
        Object.values(layers),
        resultImage,
        targetW,
        targetH
      );

      setAiUpscaleState({ isUpscaling: true, progress: 25, stepText: 'Đang kích nét...' });

      const upscaled = await requestAiUpscale(compositeDataUrl, {
        scale: 4,
        modelId: 'digital-art-4x',
        printDpi: 300,
        customWidth: targetW,
        onProgress: (p) => {
          setAiUpscaleState({
            isUpscaling: true,
            progress: Math.min(95, Math.max(25, p.progress || 35)),
            stepText: 'Đang kích nét...'
          });
        }
      });

      const finalUrl = upscaled.downloadUrl || compositeDataUrl;
      const fileName = `SchoolPaper_A0_300DPI_${Date.now()}.png`;

      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setAiUpscaleState({ isUpscaling: false, progress: 100, stepText: 'Hoàn tất kích nét!' });
      showToast('🎉 Đã kích nét AI chuẩn in A0 300 DPI và tải file về máy thành công!', 'success');
    } catch (err) {
      console.warn('Lỗi kích nét AI khi download:', err);
      showToast(`Máy chủ GPU bận: ${err.message}. Đang tải trực tiếp bản tổng hợp 4 layer...`, 'warning');
      try {
        const fallbackData = await compositeLayersToDataUrl(
          Object.values(layers),
          resultImage,
          calculatePixels(width || 841, unit || 'mm', 300),
          calculatePixels(height || 1189, unit || 'mm', 300)
        );
        const a = document.createElement('a');
        a.href = fallbackData;
        a.download = `SchoolPaper_Layers_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e2) {
        showToast('Lỗi khi xuất ảnh: ' + e2.message, 'error');
      }
    } finally {
      setTimeout(() => {
        setAiUpscaleState({ isUpscaling: false, progress: 0, stepText: '' });
      }, 2500);
    }
  };

  // Handle Download Processed (Tải ngay tức thì nếu đã kích nét ngầm xong, hoặc hoàn tất luồng kích nét AI)
  const handleDownload = async () => {
    if (!resultImage) {
      showToast('Chưa có ảnh được xử lý để tải về!', 'info');
      return;
    }

    const fileName = `BaoTuong_A0_841x1189mm_KichNetAI_300DPI_${Date.now()}.png`;

    // 1. Nếu luồng kích nét AI ngầm đã hoàn tất sẵn -> Tải tức thì 0 giây chờ đợi!
    if (upscaledImageRef.current) {
      downloadFile(upscaledImageRef.current, fileName);
      showToast('✅ Đã tải file ảnh Báo Tường A0 siêu nét đã qua GPU AI Kích Nét!', 'success');
      return;
    }

    // 2. Nếu luồng kích nét AI ngầm vẫn đang chạy -> Chờ GPU AI hoàn thành và tải ngay
    if (upscalePromiseRef.current && aiUpscaleState.isUpscaling) {
      showToast(`⚡ Đang chờ GPU AI hoàn tất kích nét (${aiUpscaleState.progress}%: ${aiUpscaleState.stepText || 'AI đang xử lý'})...`, 'info');
      try {
        const upscaled = await upscalePromiseRef.current;
        if (upscaled && (upscaled.downloadUrl || upscaled.url)) {
          const downloadUrl = upscaled.downloadUrl || upscaled.url;
          downloadFile(downloadUrl, fileName);
          showToast('✅ Đã tải file ảnh Báo Tường A0 đã kích nét AI thành công!', 'success');
          return;
        }
      } catch (e) {
        console.warn('Lỗi chờ upscale ngầm:', e);
      }
    }

    // 3. Dự phòng gọi trực tiếp API kích nét AI
    showToast('🚀 Đang gửi yêu cầu Kích Nét AI lên GPU worker (genai.toolxprint) & tải về...', 'info');

    try {
      const upscaled = await requestAiUpscale(resultImage, {
        scale: 4,
        modelId: 'digital-art-4x',
        printDpi: 300,
        onProgress: ({ progress, current_step }) => {
          setAiUpscaleState((prev) => ({
            ...prev,
            isUpscaling: true,
            progress,
            stepText: current_step
          }));
        }
      });

      const finalUrl = upscaled.downloadUrl || upscaled.url;
      upscaledImageRef.current = finalUrl;
      setResultImage(finalUrl);
      downloadFile(finalUrl, fileName);

      setFileMeta((prev) => ({
        ...prev,
        filesize_mb: upscaled.fileSizeMb || '25.0 MB',
        dimensions: upscaled.targetDimensions
          ? `${upscaled.targetDimensions} PX (A0 300 DPI - GPU AI Kich Net)`
          : '841 × 1189 MM (300 DPI)',
        width: 841,
        height: 1189,
        unit: 'mm',
        dpi: 300,
        engine: 'gpu-upscayl'
      }));

      showToast(`✅ Đã tải file ảnh Báo Tường A0 đã kích nét AI (${upscaled.targetDimensions || 'Chuẩn in A0'})!`, 'success');
    } catch (e) {
      console.warn('Lỗi API kích nét GPU, tải ảnh kết quả hiện tại:', e);
      downloadFile(resultImage, fileName);
      showToast('✅ Đã tải file ảnh!', 'success');
    }
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
    showToast(`🎉 Nạp thành công +${formatCurrency(amount)} vào ví School Paper!`, 'success');
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
          onOpenGalleryModal={() => setGalleryModalOpen(true)}
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
                onOpenEdit={() => setEditModalOpen(true)}
                onOpenMockup3D={handleOpenMockup3D}
                onDownload={handleDownload}
                onRemoveBg={handleRemoveBg}
                onOpenLightbox={handleOpenLightbox}
                onOpenResize={() => handleOpenResize('result')}
                onOpenColorGrading={handleOpenColorGrading}
                onUpscaleA0={handleUpscaleA0}
                aiUpscaleState={aiUpscaleState}
                layers={layers}
                onUpdateLayer={handleUpdateLayer}
                onReplaceLayerImage={handleReplaceLayerImage}
                onRegenerateLayer={handleRegenerateLayer}
                onDownloadWithGenAiUpscale={handleDownloadWithGenAiUpscale}
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
                // 4 Tabs: Đường Viền, Header, Footer, Body
                borderPrompt={borderPrompt}
                setBorderPrompt={setBorderPrompt}
                borderImages={borderImages}
                borderTransparency={borderTransparency}
                setBorderTransparency={setBorderTransparency}
                headerPrompt={headerPrompt}
                setHeaderPrompt={setHeaderPrompt}
                headerImages={headerImages}
                headerTransparency={headerTransparency}
                setHeaderTransparency={setHeaderTransparency}
                footerPrompt={footerPrompt}
                setFooterPrompt={setFooterPrompt}
                footerImages={footerImages}
                footerTransparency={footerTransparency}
                setFooterTransparency={setFooterTransparency}
                bodyPrompt={bodyPrompt}
                setBodyPrompt={setBodyPrompt}
                bodyImages={bodyImages}
                bodyTransparency={bodyTransparency}
                setBodyTransparency={setBodyTransparency}
                activePromptSection={activePromptSection}
                setActivePromptSection={setActivePromptSection}
                onUploadSectionImages={handleUploadSectionImages}
                onRemoveSectionImage={handleRemoveSectionImage}
                autoUpscaleA0={autoUpscaleA0}
                setAutoUpscaleA0={setAutoUpscaleA0}
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

      {/* Modals */}
      <Mockup3DModal
        isOpen={mockup3DOpen}
        onClose={() => setMockup3DOpen(false)}
        mockupUrl={mockupUrl}
        originalImage={resultImage}
        isRenderingMockup={isRenderingMockup}
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
        onOpenEdit={(imgToEdit) => {
          handleCloseLightbox();
          if (imgToEdit) {
            setReferenceImage({ url: imgToEdit, name: 'Ảnh cần sửa' });
          }
          setEditModalOpen(true);
        }}
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

      {/* Floating Circular CTA Button (Fixed to Viewport Screen - align bottom: 100px) */}
      {activeTab === 'single' && (
        <button
          type="button"
          className="btn-liquid-primary fab-generate-cta"
          onClick={() => handleGenerate()}
          disabled={isGenerating}
          title="Tạo ấn phẩm ngay (Ctrl + Enter)"
          style={{
            position: 'fixed',
            bottom: '100px',
            right: 'max(20px, calc(50% - 220px + 20px))',
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            border: '2px solid rgba(255, 255, 255, 0.95)',
            background: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 45%, #2563eb 100%)',
            boxShadow: '0 12px 30px -2px rgba(6, 182, 212, 0.75), 0 4px 14px rgba(37, 99, 235, 0.5), inset 0 2px 2px rgba(255, 255, 255, 0.95)',
            zIndex: 9999,
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating ? (
            <i className="bi bi-arrow-repeat spin" style={{ fontSize: '1.35rem', color: '#ffffff' }}></i>
          ) : (
            <i
              className="bi bi-send-fill"
              style={{
                fontSize: '1.35rem',
                color: '#ffffff',
                transform: 'translate(1px, -1px)',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25))'
              }}
            ></i>
          )}
        </button>
      )}

      {/* Toast Notifications */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
