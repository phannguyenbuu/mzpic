/**
 * app.js - MzPic AI Design Studio (ToolXPrint Professional Edition)
 * Controller xử lý luồng tạo ảnh, kích thước ấn phẩm, tách nền, phối cảnh 3D và tải file
 */

document.addEventListener("DOMContentLoaded", () => {
  // App State
  const state = {
    prompt: "",
    width: 210,
    height: 297,
    unit: "mm",
    dpi: 300, // Tiêu chuẩn in ấn cố định
    aspectRatio: "portrait", // square (1:1) | landscape | portrait
    transparentBg: false,
    selectedPresetId: "flyer_a4",
    isGenerating: false,
    generatedImageSrc: null,
    // Ví & Chi phí
    walletBalance: 50000, // 50.000đ số dư mặc định
    costPerImage: 2000 // 2.000đ mỗi lượt tạo
  };

  // DOM Elements
  const el = {
    // Left Column Elements (Prompt & Parameters)
    promptTextArea: document.getElementById("promptTextArea"),
    charCountDisplay: document.getElementById("charCountDisplay"),
    btnResetSession: document.getElementById("btnResetSession"),
    progressFillBar: document.getElementById("progressFillBar"),
    progressTextLabel: document.getElementById("progressTextLabel"),
    btnGenerateAction: document.getElementById("btnGenerateAction"),

    presetCategoryTabs: document.getElementById("presetCategoryTabs"),
    presetsChipsGrid: document.getElementById("presetsChipsGrid"),
    selectedPresetName: document.getElementById("selectedPresetName"),
    inputWidth: document.getElementById("inputWidth"),
    inputHeight: document.getElementById("inputHeight"),
    selectUnit: document.getElementById("selectUnit"),
    badgeConvertedPx: document.getElementById("badgeConvertedPx"),
    aspectSquare: document.getElementById("aspectSquare"),
    aspectLandscape: document.getElementById("aspectLandscape"),
    aspectPortrait: document.getElementById("aspectPortrait"),
    switchTachNen: document.getElementById("switchTachNen"),
    tachNenStatusText: document.getElementById("tachNenStatusText"),

    // Right Column Elements (Result)
    resultDimensionBadge: document.getElementById("resultDimensionBadge"),
    resultImageStage: document.getElementById("resultImageStage"),
    resultPlaceholder: document.getElementById("resultPlaceholder"),
    resultImagePreview: document.getElementById("resultImagePreview"),
    metaFileSize: document.getElementById("metaFileSize"),
    metaDimensionText: document.getElementById("metaDimensionText"),
    btnEditThisImage: document.getElementById("btnEditThisImage"),
    btnCreateMockup3D: document.getElementById("btnCreateMockup3D"),
    btnDownloadProcessed: document.getElementById("btnDownloadProcessed"),

    // Floating & Top Nav Buttons
    btnTopDownload: document.getElementById("btnTopDownload"),
    btnFloatReload: document.getElementById("btnFloatReload"),
    btnFloatSend: document.getElementById("btnFloatSend"),

    // 3D Mockup Modal
    mockup3DModal: document.getElementById("mockup3DModal"),
    mockupPerspImage: document.getElementById("mockupPerspImage"),
    btnCloseMockupModal: document.getElementById("btnCloseMockupModal"),

    // Google Auth Elements
    btnGoogleAuth: document.getElementById("btnGoogleAuth"),
    userProfileBadge: document.getElementById("userProfileBadge"),
    btnLogoutGoogle: document.getElementById("btnLogoutGoogle"),
    googleAuthModal: document.getElementById("googleAuthModal"),
    btnConfirmGoogleLogin: document.getElementById("btnConfirmGoogleLogin"),
    btnCancelGoogleAuth: document.getElementById("btnCancelGoogleAuth"),

    // Ví (Wallet) & Nạp tiền (Topup)
    walletBadge: document.getElementById("walletBadge"),
    walletAmountDisplay: document.getElementById("walletAmountDisplay"),
    btnTopupWallet: document.getElementById("btnTopupWallet"),
    topupModal: document.getElementById("topupModal"),
    modalCurrentBalance: document.getElementById("modalCurrentBalance"),
    btnCloseTopupModal: document.getElementById("btnCloseTopupModal"),
    btnCancelTopup: document.getElementById("btnCancelTopup"),
    btnConfirmTopup: document.getElementById("btnConfirmTopup"),

    // Toast
    toastStack: document.getElementById("toastStack")
  };

  // 1. Khởi tạo danh mục ấn phẩm
  function initPresets() {
    el.presetCategoryTabs.innerHTML = "";
    DESIGN_PRESETS.forEach((cat, index) => {
      const chip = document.createElement("button");
      chip.className = `cat-chip ${index === 0 ? "active" : ""}`;
      chip.innerHTML = `<i class="bi ${cat.icon}"></i> ${cat.category}`;
      chip.addEventListener("click", () => {
        document.querySelectorAll(".cat-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        renderPresetChips(cat.category);
      });
      el.presetCategoryTabs.appendChild(chip);
    });

    renderPresetChips(DESIGN_PRESETS[0].category);
  }

  function renderPresetChips(categoryName) {
    const category = DESIGN_PRESETS.find(c => c.category === categoryName);
    if (!category) return;

    el.presetsChipsGrid.innerHTML = "";
    category.items.forEach(item => {
      const chip = document.createElement("div");
      chip.className = `preset-chip-item ${state.selectedPresetId === item.id ? "active" : ""}`;
      chip.innerHTML = `
        <div class="preset-chip-name">
          <span>${item.name}</span>
          ${item.badge ? `<span style="font-size:0.6rem; color:var(--blue-primary);">${item.badge}</span>` : ""}
        </div>
        <div class="preset-chip-dim">${item.width} × ${item.height} ${item.unit}</div>
      `;

      chip.addEventListener("click", () => {
        selectPreset(item);
      });
      el.presetsChipsGrid.appendChild(chip);
    });
  }

  function selectPreset(preset) {
    state.selectedPresetId = preset.id;
    state.width = preset.width;
    state.height = preset.height;
    state.unit = preset.unit;

    el.inputWidth.value = state.width;
    el.inputHeight.value = state.height;
    el.selectUnit.value = state.unit;
    el.selectedPresetName.textContent = `${preset.name} (${preset.width}×${preset.height} ${preset.unit})`;

    // Tự động chọn tỉ lệ phù hợp
    if (preset.width === preset.height) {
      setAspectRatio("square");
    } else if (preset.width > preset.height) {
      setAspectRatio("landscape");
    } else {
      setAspectRatio("portrait");
    }

    // Cập nhật active chip
    document.querySelectorAll(".preset-chip-item").forEach(c => c.classList.remove("active"));
    const activeChip = Array.from(el.presetsChipsGrid.children).find(c => c.textContent.includes(preset.name));
    if (activeChip) activeChip.classList.add("active");

    updateDimensionsBadge();
    showToast(`Đã chọn ấn phẩm: ${preset.name}`, "info");
  }

  // 2. Chuyển đổi đơn vị (mm, cm, m, pt, px)
  function handleUnitChange(newUnit) {
    const oldUnit = state.unit;
    if (oldUnit === newUnit) return;

    state.width = convertDimension(state.width, oldUnit, newUnit, state.dpi);
    state.height = convertDimension(state.height, oldUnit, newUnit, state.dpi);
    state.unit = newUnit;

    el.inputWidth.value = state.width;
    el.inputHeight.value = state.height;

    updateDimensionsBadge();
    showToast(`Đổi đơn vị đo: [${newUnit.toUpperCase()}]`, "info");
  }

  // 3. Tỉ lệ & Hướng (Vuông 1:1, Ngang, Dọc)
  function setAspectRatio(mode) {
    state.aspectRatio = mode;
    
    el.aspectSquare.classList.remove("active");
    el.aspectLandscape.classList.remove("active");
    el.aspectPortrait.classList.remove("active");

    if (mode === "square") {
      el.aspectSquare.classList.add("active");
      const size = Math.min(state.width, state.height);
      state.width = size;
      state.height = size;
    } else if (mode === "landscape") {
      el.aspectLandscape.classList.add("active");
      if (state.height > state.width) {
        const temp = state.width;
        state.width = state.height;
        state.height = temp;
      }
    } else if (mode === "portrait") {
      el.aspectPortrait.classList.add("active");
      if (state.width > state.height) {
        const temp = state.width;
        state.width = state.height;
        state.height = temp;
      }
    }

    el.inputWidth.value = state.width;
    el.inputHeight.value = state.height;

    updateDimensionsBadge();
  }

  // 4. Quy đổi kích thước hiển thị
  function updateDimensionsBadge() {
    const pxW = Math.round(UNIT_CONVERSIONS.toInches[state.unit](state.width, state.dpi) * state.dpi);
    const pxH = Math.round(UNIT_CONVERSIONS.toInches[state.unit](state.height, state.dpi) * state.dpi);

    el.badgeConvertedPx.textContent = `${pxW} × ${pxH} px`;
    const specStr = `${state.width} × ${state.height} ${state.unit.toUpperCase()} (${pxW} × ${pxH} px)`;
    el.resultDimensionBadge.textContent = specStr;
    el.metaDimensionText.textContent = `${state.width} × ${state.height} ${state.unit.toUpperCase()}`;
  }

  // 5. Tách nền (PNG) Switch
  function updateTransparentUI() {
    if (state.transparentBg) {
      el.tachNenStatusText.textContent = "Đang BẬT • Xuất PNG trong suốt không phông";
      el.tachNenStatusText.className = "tach-nen-status active";
      el.resultImageStage.classList.add("transparent-mode");
    } else {
      el.tachNenStatusText.textContent = "Đang tắt • Giữ nền màu chuẩn in";
      el.tachNenStatusText.className = "tach-nen-status";
      el.resultImageStage.classList.remove("transparent-mode");
    }
  }

  // Helper định dạng tiền tệ
  function formatCurrency(amount) {
    return amount.toLocaleString("vi-VN") + "đ";
  }

  function updateWalletUI(triggerFlash = false) {
    el.walletAmountDisplay.textContent = formatCurrency(state.walletBalance);
    el.modalCurrentBalance.textContent = formatCurrency(state.walletBalance);
    if (triggerFlash) {
      el.walletAmountDisplay.classList.remove("flash-deduct");
      void el.walletAmountDisplay.offsetWidth; // trigger reflow
      el.walletAmountDisplay.classList.add("flash-deduct");
    }
  }

  // 6. Xử lý tạo ảnh GenAI
  function generateImage() {
    const promptText = el.promptTextArea.value.trim();
    if (!promptText) {
      showToast("Vui lòng nhập mô tả bức ảnh bạn muốn tạo ra!", "info");
      el.promptTextArea.focus();
      return;
    }

    // Kiểm tra số dư ví
    if (state.walletBalance < state.costPerImage) {
      showToast(`Số dư ví không đủ (còn ${formatCurrency(state.walletBalance)}). Cần ${formatCurrency(state.costPerImage)} để tạo ảnh. Vui lòng nạp thêm!`, "info");
      updateWalletUI();
      el.topupModal.classList.add("active");
      return;
    }

    // Trừ tiền tạo ảnh
    state.walletBalance -= state.costPerImage;
    updateWalletUI(true);
    showToast(`Đã thanh toán ${formatCurrency(state.costPerImage)} cho lượt tạo ảnh (Số dư còn: ${formatCurrency(state.walletBalance)})`, "info");

    state.prompt = promptText;
    state.isGenerating = true;

    el.btnGenerateAction.disabled = true;
    el.btnGenerateAction.innerHTML = `<span class="btn-gen-text"><i class="bi bi-arrow-repeat spin"></i> Đang xử lý...</span><span class="btn-gen-cost-badge"><i class="bi bi-coin"></i> 2.000đ</span>`;

    // Giả lập tiến độ
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      el.progressFillBar.style.width = `${progress}%`;
      el.progressTextLabel.textContent = `Tiến độ xử lý: ${progress}%`;
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 250);

    setTimeout(() => {
      state.isGenerating = false;
      el.btnGenerateAction.disabled = false;
      el.btnGenerateAction.innerHTML = `<span class="btn-gen-text"><i class="bi bi-send-fill"></i> Tạo ấn phẩm ngay (Ctrl + Enter)</span><span class="btn-gen-cost-badge"><i class="bi bi-coin"></i> 2.000đ</span>`;
      el.progressFillBar.style.width = `100%`;
      el.progressTextLabel.textContent = `Tiến độ xử lý: Hoàn tất 100%`;

      // Chọn mẫu ảnh kết quả đẹp
      let resultImg = "";
      if (state.transparentBg) {
        resultImg = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
      } else if (state.selectedPresetId.includes("voucher")) {
        resultImg = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80";
      } else if (state.selectedPresetId.includes("standee")) {
        resultImg = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80";
      } else if (state.selectedPresetId.includes("namecard")) {
        resultImg = "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80";
      } else {
        resultImg = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80";
      }

      state.generatedImageSrc = resultImg;
      el.resultImagePreview.src = resultImg;
      el.mockupPerspImage.src = resultImg;

      el.resultPlaceholder.style.display = "none";
      el.resultImagePreview.classList.add("visible");

      el.btnDownloadProcessed.disabled = false;
      showToast("🎉 Đã tạo ấn phẩm thiết kế thành công!", "success");
    }, 1200);
  }

  // 7. Tạo Ảnh Phối Cảnh 3D Modal
  function openMockup3D() {
    if (!state.generatedImageSrc) {
      showToast("Chưa có ấn phẩm nào để tạo phối cảnh 3D. Hãy bấm Tạo ấn phẩm trước!", "info");
      return;
    }
    el.mockup3DModal.classList.add("active");
    showToast("Đã tạo ảnh phối cảnh 3D ấn phẩm thực tế!", "success");
  }

  function closeMockup3D() {
    el.mockup3DModal.classList.remove("active");
  }

  // 8. Nút Duy Nhất: TẢI ẢNH ĐƯỢC XỬ LÝ
  function downloadProcessedImage() {
    if (!state.generatedImageSrc) {
      showToast("Chưa có ảnh được xử lý để tải về!", "info");
      return;
    }

    const format = state.transparentBg ? "png" : "jpg";
    const pxW = Math.round(UNIT_CONVERSIONS.toInches[state.unit](state.width, state.dpi) * state.dpi);
    const pxH = Math.round(UNIT_CONVERSIONS.toInches[state.unit](state.height, state.dpi) * state.dpi);
    const fileName = `Design_${state.selectedPresetId}_${pxW}x${pxH}.${format}`;

    showToast(`Đang tải ảnh được xử lý (${fileName})...`, "info");

    setTimeout(() => {
      const a = document.createElement("a");
      a.href = state.generatedImageSrc;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("✅ Đã tải ảnh được xử lý thành công!", "success");
    }, 300);
  }

  // 9. Reset Session
  function resetSession() {
    el.promptTextArea.value = "";
    el.charCountDisplay.textContent = "0 ký tự";
    el.progressFillBar.style.width = "0%";
    el.progressTextLabel.textContent = "Tiến độ xử lý: 0%";
    el.resultPlaceholder.style.display = "flex";
    el.resultImagePreview.classList.remove("visible");
    el.btnDownloadProcessed.disabled = true;
    state.generatedImageSrc = null;
    showToast("Đã reset phiên làm việc!", "info");
  }

  // 10. Toast System
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast-msg ${type}`;
    const icon = type === "success" ? "bi-check-circle-fill" : "bi-info-circle-fill";
    toast.innerHTML = `<i class="bi ${icon}"></i> <span>${message}</span>`;

    el.toastStack.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(15px)";
      toast.style.transition = "all 0.2s ease";
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }

  // ================= EVENT LISTENERS =================

  // Live Prompt Char Count
  el.promptTextArea.addEventListener("input", (e) => {
    const len = e.target.value.length;
    el.charCountDisplay.textContent = `${len} ký tự`;
  });

  // Dimension inputs
  el.inputWidth.addEventListener("input", (e) => {
    state.width = parseFloat(e.target.value) || 10;
    updateDimensionsBadge();
  });

  el.inputHeight.addEventListener("input", (e) => {
    state.height = parseFloat(e.target.value) || 10;
    updateDimensionsBadge();
  });

  el.selectUnit.addEventListener("change", (e) => {
    handleUnitChange(e.target.value);
  });

  // Tỉ lệ / Khổ giấy
  el.aspectSquare.addEventListener("click", () => setAspectRatio("square"));
  el.aspectLandscape.addEventListener("click", () => setAspectRatio("landscape"));
  el.aspectPortrait.addEventListener("click", () => setAspectRatio("portrait"));

  // Tách nền
  el.switchTachNen.addEventListener("change", (e) => {
    state.transparentBg = e.target.checked;
    updateTransparentUI();
    showToast(state.transparentBg ? "Đã bật: Tách nền trong suốt PNG" : "Đã tắt tách nền (Giữ màu nền chuẩn)", "info");
  });

  // Generate Action
  el.btnGenerateAction.addEventListener("click", generateImage);
  el.btnFloatSend.addEventListener("click", generateImage);

  // Shortcut Ctrl + Enter
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      generateImage();
    }
  });

  // Reset Session
  el.btnResetSession.addEventListener("click", resetSession);
  el.btnFloatReload.addEventListener("click", resetSession);

  // 3D Mockup
  el.btnCreateMockup3D.addEventListener("click", openMockup3D);
  el.btnCloseMockupModal.addEventListener("click", closeMockup3D);

  // Download
  el.btnDownloadProcessed.addEventListener("click", downloadProcessedImage);
  el.btnTopDownload.addEventListener("click", downloadProcessedImage);

  // Sửa hình này
  el.btnEditThisImage.addEventListener("click", () => {
    if (state.generatedImageSrc) {
      el.promptTextArea.value = `Chỉnh sửa ảnh trước: ${state.prompt}`;
      el.promptTextArea.focus();
      showToast("Đã tải prompt vào ô soạn thảo để chỉnh sửa tiếp!", "info");
    }
  });

  // Google Auth Handlers
  el.btnGoogleAuth.addEventListener("click", () => {
    el.googleAuthModal.classList.add("active");
  });

  el.btnCancelGoogleAuth.addEventListener("click", () => {
    el.googleAuthModal.classList.remove("active");
  });

  el.btnConfirmGoogleLogin.addEventListener("click", () => {
    el.googleAuthModal.classList.remove("active");
    el.btnGoogleAuth.style.display = "none";
    el.userProfileBadge.classList.add("active");
    showToast("Đăng nhập thành công với tài khoản Google: Tony Nguyen", "success");
  });

  el.btnLogoutGoogle.addEventListener("click", (e) => {
    e.stopPropagation();
    el.userProfileBadge.classList.remove("active");
    el.btnGoogleAuth.style.display = "inline-flex";
    showToast("Đã đăng xuất tài khoản Google", "info");
  });

  // Wallet & Topup Handlers
  el.walletBadge.addEventListener("click", () => {
    updateWalletUI();
    el.topupModal.classList.add("active");
  });

  el.btnTopupWallet.addEventListener("click", (e) => {
    e.stopPropagation();
    updateWalletUI();
    el.topupModal.classList.add("active");
  });

  el.btnCloseTopupModal.addEventListener("click", () => {
    el.topupModal.classList.remove("active");
  });

  el.btnCancelTopup.addEventListener("click", () => {
    el.topupModal.classList.remove("active");
  });

  // Package item selection
  let selectedTopupAmount = 50000;
  document.querySelectorAll(".package-item").forEach(pkg => {
    pkg.addEventListener("click", () => {
      document.querySelectorAll(".package-item").forEach(p => p.classList.remove("active"));
      pkg.classList.add("active");
      selectedTopupAmount = parseInt(pkg.dataset.amount, 10);
    });
  });

  el.btnConfirmTopup.addEventListener("click", () => {
    state.walletBalance += selectedTopupAmount;
    updateWalletUI(true);
    el.topupModal.classList.remove("active");
    showToast(`Nạp thành công ${formatCurrency(selectedTopupAmount)} vào ví! Số dư hiện tại: ${formatCurrency(state.walletBalance)}`, "success");
  });

  // Khởi chạy
  initPresets();
  updateDimensionsBadge();
  updateTransparentUI();
  updateWalletUI();
});

