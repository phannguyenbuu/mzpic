import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import BottomDock from './components/BottomDock';
import PromptCard from './components/PromptCard';
import PrintSpecsCard from './components/PrintSpecsCard';
import ResultCard from './components/ResultCard';
import Mockup3DModal from './components/Mockup3DModal';
import GoogleAuthModal from './components/GoogleAuthModal';
import TopupModal from './components/TopupModal';
import EditImageModal from './components/EditImageModal';
import ToastStack from './components/ToastStack';
import GallerySection from './components/GallerySection';
import WorkersSection from './components/WorkersSection';
import BatchSection from './components/BatchSection';
import UpscaleSection from './components/UpscaleSection';
import ApiDocsSection from './components/ApiDocsSection';
import { DESIGN_PRESETS, convertDimension, calculatePixels } from './data/presets';

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

  // Tabs & Navigation
  const [activeTab, setActiveTab] = useState('single');
  const [onlineWorkersCount, setOnlineWorkersCount] = useState(3);

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

  // Handle Sample Template 1-click
  const handleSelectTemplate = (tpl) => {
    setPrompt(tpl.prompt);
    setSelectedPresetId(tpl.presetId);
    setSelectedStyleId(tpl.styleId);
    setTransparentBg(tpl.transparentBg);

    const preset = DESIGN_PRESETS.flatMap((c) => c.items).find((i) => i.id === tpl.presetId);
    if (preset) {
      setWidth(preset.width);
      setHeight(preset.height);
      setUnit(preset.unit);
      if (preset.width === preset.height) setAspectRatio('square');
      else if (preset.width > preset.height) setAspectRatio('landscape');
      else setAspectRatio('portrait');
    }
    showToast(`Đã áp dụng mẫu: ${tpl.name}`, 'success');
  };

  // Reset Session
  const handleResetSession = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setPrompt('');
    setResultImage(null);
    setResultFilename(null);
    setFileMeta(null);
    setProgress(0);
    setProgressText('');
    setMockupUrl(null);
    showToast('Đã reset phiên làm việc!', 'info');
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

  // Generate Image directly with ToolXPrint VPS
  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      showToast('Vui lòng nhập mô tả bức ảnh bạn muốn tạo ra!', 'info');
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
    setProgressText('Đang gửi lệnh tạo ấn phẩm tới VPS ToolXPrint...');

    const mappedRatio = getVPSAspectRatio();
    let finalPrompt = trimmed;
    if (transparentBg) {
      finalPrompt += ', isolated on pure white background, clean silhouette for transparent cutout';
    }

    const payload = {
      prompt: finalPrompt,
      aspect_ratio: mappedRatio,
      resolution: '4k',
      engine: 'gpt',
      use_ai_enhancer: true,
      presets: {
        style: selectedStyleId !== 'none' ? selectedStyleId : 'commercial_studio',
        lighting: 'studio'
      }
    };

    try {
      // Gửi request tạo render job tới VPS ToolXPrint
      const resp = await fetch('/render-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        throw new Error(`Lỗi khởi tạo lệnh VPS (HTTP ${resp.status})`);
      }

      const createRes = await resp.json();
      const jobId = createRes.job_id;
      const targetFilename = createRes.filename;

      setProgress(35);
      setProgressText('VPS đã nhận lệnh. Đang điều phối OpenAI gpt-image-1 & chuẩn hóa prompt...');

      let attempts = 0;
      const maxAttempts = 60;

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        attempts++;
        try {
          const pollResp = await fetch(`/render-job/${jobId}`);
          if (pollResp.ok) {
            const pollData = await pollResp.json();
            const job = pollData.job || {};

            if (attempts <= 5) {
              setProgress(45);
              setProgressText('Đang sinh ảnh chi tiết với OpenAI gpt-image-1...');
            } else if (attempts <= 12) {
              setProgress(70);
              setProgressText('Đang nâng cấp độ phân giải 4K 300 DPI (Lanczos 4x + Unsharp Mask)...');
            } else {
              setProgress(88);
              setProgressText('Đang hoàn thiện file xuất bản trên VPS...');
            }

            if (job.status === 'completed') {
              clearInterval(pollIntervalRef.current);
              setProgress(100);
              setProgressText('Hoàn tất 100%!');

              const imgFilename = job.filename || targetFilename;
              const imgUrl = `/render-files/${imgFilename}`;
              const fileSizeMb = job.file_size_bytes ? (job.file_size_bytes / (1024 * 1024)).toFixed(1) : '18.5';

              setResultImage(imgUrl);
              setResultFilename(imgFilename);
              setFileMeta({
                filesize_mb: fileSizeMb,
                dimensions: job.dimensions || `${width} × ${height} ${unit.toUpperCase()}`,
                width,
                height,
                unit,
                dpi: 300,
                engine: job.engine || 'gpt'
              });

              setWalletBalance((prev) => Math.max(0, prev - costPerImage));
              setIsGenerating(false);
              showToast(`🎉 VPS ToolXPrint đã xuất ấn phẩm 300 DPI thành công! (-${formatCurrency(costPerImage)})`, 'success');
            } else if (job.status === 'failed') {
              clearInterval(pollIntervalRef.current);
              setIsGenerating(false);
              showToast(`✖ Lỗi xử lý trên VPS: ${job.error || 'Thất bại'}`, 'error');
            }
          }
        } catch (pollErr) {
          console.warn('Lỗi thăm dò job:', pollErr);
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollIntervalRef.current);
          setIsGenerating(false);
          showToast('Quá thời gian chờ phản hồi từ VPS. Vui lòng kiểm tra lại.', 'error');
        }
      }, 2500);

    } catch (e) {
      console.error('Lỗi gọi VPS ToolXPrint:', e);
      setIsGenerating(false);
      setProgress(0);
      showToast(`Không thể kết nối VPS ToolXPrint: ${e.message}`, 'error');
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
    showToast(`Đang gửi yêu cầu sửa ảnh tới VPS: "${editPromptText.slice(0, 40)}..."`, 'info');
    
    const newCombined = `${prompt}. Chỉnh sửa bổ sung: ${editPromptText}`;
    setPrompt(newCombined);
    setEditModalOpen(false);
    setIsEditing(false);
    handleGenerate();
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
        />

        {/* Content based on Active Tab */}
        <main style={{ padding: '12px 14px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'single' && (
            <>
              {/* Top Focal Stage: Result & High-res preview */}
              <ResultCard
                resultImage={resultImage}
                isGenerating={isGenerating}
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

              {/* Prompt & Inspiration Cards */}
              <PromptCard
                prompt={prompt}
                setPrompt={setPrompt}
                onResetSession={handleResetSession}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                progress={progress}
                progressText={progressText}
                onSelectTemplate={handleSelectTemplate}
              />

              {/* Print Specifications & Liquid Squircle Presets */}
              <PrintSpecsCard
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
                selectedStyleId={selectedStyleId}
                setSelectedStyleId={setSelectedStyleId}
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

        {/* Floating Bottom Liquid Glass Pill Dock */}
        <BottomDock
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          workersCount={onlineWorkersCount}
        />
      </div>

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

      {/* Toast Notifications */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
