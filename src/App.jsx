import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import BottomDock from './components/BottomDock';
import PromptCard from './components/PromptCard';
import ResultCard from './components/ResultCard';
import Mockup3DModal from './components/Mockup3DModal';
import GoogleAuthModal from './components/GoogleAuthModal';
import TopupModal from './components/TopupModal';
import EditImageModal from './components/EditImageModal';
import AdminPromptModal from './components/AdminPromptModal';
import ToastStack from './components/ToastStack';
import GallerySection from './components/GallerySection';
import WorkersSection from './components/WorkersSection';
import BatchSection from './components/BatchSection';
import UpscaleSection from './components/UpscaleSection';
import ApiDocsSection from './components/ApiDocsSection';
import { DESIGN_PRESETS, convertDimension, calculatePixels } from './data/presets';
import { getPromptTemplates, savePromptTemplates, getGeneralComment, saveGeneralComment } from './data/promptTemplates';

// Route synchronizer: mỗi tab là 1 route
const ROUTE_MAP = {
  '/': 'single',
  '/single': 'single',
  '/batch': 'batch',
  '/upscale': 'upscale',
  '/library': 'library',
  '/devices': 'devices',
  '/workers': 'devices',
  '/docs': 'docs'
};

const TAB_TO_ROUTE = {
  single: '/single',
  batch: '/batch',
  upscale: '/upscale',
  library: '/library',
  devices: '/devices',
  docs: '/docs'
};

const getInitialTab = () => {
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (ROUTE_MAP[path]) return ROUTE_MAP[path];
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '/');
  if (ROUTE_MAP[hash]) return ROUTE_MAP[hash];
  return 'single';
};

export default function App() {
  // App States
  const [prompt, setPrompt] = useState('');
  const [width, setWidth] = useState(210);
  const [height, setHeight] = useState(297);
  const [unit, setUnit] = useState('mm');
  const [aspectRatio, setAspectRatio] = useState('portrait');
  const [transparentBg, setTransparentBg] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('flyer_a4');
  const [selectedStyleId, setSelectedStyleId] = useState('none');
  const [referenceImage, setReferenceImage] = useState(null);

  // Custom Prompt Templates & Admin
  const [promptTemplates, setPromptTemplates] = useState(getPromptTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    const list = getPromptTemplates();
    return list[0]?.id || 'tpl_voucher_gold';
  });
  const [generalComment, setGeneralComment] = useState(getGeneralComment);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  
  // Ví & Tài khoản
  const [walletBalance, setWalletBalance] = useState(50000);
  const costPerImage = 2000;
  const [user, setUser] = useState({
    name: 'Tony Nguyen',
    email: 'tony.nguyen@mzpic.design',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'
  });

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
    setWidth(preset.width);
    setHeight(preset.height);
    setUnit(preset.unit);

    if (preset.width === preset.height) {
      setAspectRatio('square');
    } else if (preset.width > preset.height) {
      setAspectRatio('landscape');
    } else {
      setAspectRatio('portrait');
    }

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
    showToast(`Đổi đơn vị đo: [${newUnit.toUpperCase()}]`, 'info');
  };

  // Handle Aspect Ratio Change
  const handleAspectRatioChange = (mode) => {
    setAspectRatio(mode);
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
    const found = promptTemplates.find((t) => t.id === tplId);
    if (found && found.presetId) {
      const preset = DESIGN_PRESETS.flatMap((c) => c.items).find((i) => i.id === found.presetId);
      if (preset) {
        setSelectedPresetId(preset.id);
        setWidth(preset.width);
        setHeight(preset.height);
        setUnit(preset.unit);
        if (preset.width === preset.height) setAspectRatio('square');
        else if (preset.width > preset.height) setAspectRatio('landscape');
        else setAspectRatio('portrait');
      }
    }
    showToast(`Đã chọn mẫu: ${found ? found.name : tplId}`, 'info');
  };

  // Handle saving customized templates from Admin Modal
  const handleSaveTemplates = (newTemplates) => {
    setPromptTemplates(newTemplates);
    savePromptTemplates(newTemplates);
    if (!newTemplates.some((t) => t.id === selectedTemplateId)) {
      setSelectedTemplateId(newTemplates[0]?.id || '');
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

  // Generate Image directly with ToolXPrint ChatGPT Workers (/api/jobs/create)
  const handleGenerate = async (overrideRefImage = null, overridePrompt = null) => {
    const activeRef = overrideRefImage !== null ? overrideRefImage : referenceImage;
    const rawPrompt = overridePrompt !== null ? overridePrompt : prompt;
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

    const payload = {
      prompt: finalPrompt,
      aspect_ratio: mappedRatio,
      reference_images: activeRef
        ? [
            {
              data: activeRef.url,
              name: activeRef.name || 'reference_image.png'
            }
          ]
        : [],
      style: selectedStyleId !== 'none' ? selectedStyleId : 'None',
      new_chat: false
    };

    try {
      // Gửi request tạo render job tới Worker Hub (/api/jobs/create)
      const resp = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        throw new Error(`Lỗi khởi tạo lệnh VPS (HTTP ${resp.status})`);
      }

      const createRes = await resp.json();
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

  // Handle 3D Mockup
  const handleOpenMockup3D = () => {
    if (!resultImage) {
      showToast('Chưa có ấn phẩm nào để tạo phối cảnh 3D!', 'info');
      return;
    }

    setMockup3DOpen(true);
    setIsRenderingMockup(true);

    setTimeout(() => {
      setMockupUrl(resultImage);
      setIsRenderingMockup(false);
      showToast('Đã tạo ảnh phối cảnh 3D ấn phẩm thực tế!', 'success');
    }, 600);
  };

  // Handle Remove Background
  const handleRemoveBg = async () => {
    if (!resultImage) return;
    setTransparentBg(true);
    showToast('✅ Đã kích hoạt chế độ tách nền trong suốt cho ấn phẩm!', 'success');
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

    showToast(`Đang tải ảnh được xử lý (${fileName})...`, 'info');

    const a = document.createElement('a');
    a.href = resultImage;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('✅ Đã tải ảnh chuẩn in 300 DPI từ VPS thành công!', 'success');
  };

  // Handle Open Image from Gallery or Batch into Studio
  const handleOpenInStudio = (imageUrl, promptText) => {
    setResultImage(imageUrl);
    if (promptText) setPrompt(promptText);
    setActiveTab('single');
    showToast('Đã nạp ấn phẩm vào Studio!', 'success');
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

  const handleLogout = () => {
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
              />

              {/* Prompt & Khổ In Unified 2-Tab Liquid Card */}
              <PromptCard
                prompt={prompt}
                setPrompt={setPrompt}
                onResetSession={handleResetSession}
                onGenerate={handleGenerate}
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
              />
            </>
          )}

          {/* Tab: BATCH */}
          {activeTab === 'batch' && (
            <BatchSection
              onOpenInStudio={handleOpenInStudio}
              showToast={showToast}
            />
          )}

          {/* Tab: KÍCH NÉT AI */}
          {activeTab === 'upscale' && (
            <UpscaleSection
              currentStudioImage={resultImage}
              showToast={showToast}
            />
          )}

          {/* Tab: THƯ VIỆN */}
          {activeTab === 'library' && (
            <GallerySection
              onOpenInStudio={handleOpenInStudio}
              showToast={showToast}
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
      <BottomDock
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

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

      {/* Toast Notifications */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
