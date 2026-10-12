/**
 * promptTemplates.js - Quản lý danh sách các tùy chọn Dropdown và Prompt mẫu ẩn cho MzPic
 * Nội dung hiddenPrompt sẽ được giấu kín khỏi ô nhập prompt và chỉ được ghép ngầm khi gửi lệnh tới VPS ToolXPrint.
 */

export const DEFAULT_PROMPT_TEMPLATES = [
  {
    id: "tpl_voucher_gold",
    name: "Voucher VIP Ép Kim Vàng",
    badge: "Voucher VIP",
    presetId: "voucher_std",
    hiddenPrompt: "phong cách ấn phẩm in ấn cao cấp, hiệu ứng ép kim nhũ vàng (gold foil stamping), giấy mỹ thuật cán màng mờ sang trọng, viền dập chìm tinh xảo, phối màu trang nhã chuẩn in offset 300 DPI, bố cục thông tin ưu đãi trang nhã kèm ô mã QR và điều kiện áp dụng"
  },
  {
    id: "tpl_flyer_a4",
    name: "Tờ Rơi A4 Khai Trương",
    badge: "Flyer A4",
    presetId: "flyer_a4",
    hiddenPrompt: "bố cục tờ rơi quảng cáo in ấn chuyên nghiệp A4, phân cấp tiêu đề rõ ràng, thông tin sản phẩm và khuyến mãi sắc nét, hình ảnh trung tâm ấn tượng, 300 DPI CMYK ready for offset printing, tương phản bắt mắt"
  },
  {
    id: "tpl_flyer_a5",
    name: "Tờ Rơi A5 Sự Kiện Cà Phê Mộc",
    badge: "Flyer A5",
    presetId: "flyer_a5",
    hiddenPrompt: "tờ rơi A5 phát sự kiện, thiết kế trên nền giấy Kraft nâu cổ điển, phong cách mộc mạc thủ công dập bản gỗ letterpress, bố cục tinh gọn, khối ưu đãi nổi bật, khoảng trắng cân đối, sẵn sàng in offset 300 DPI"
  },
  {
    id: "tpl_standee_event",
    name: "Standee Khai Trương (0.6 × 1.6m)",
    badge: "Standee",
    presetId: "standee_std",
    hiddenPrompt: "standee đứng sự kiện khổ 0.6x1.6m, phong cách Thụy Sĩ tối giản, thông điệp chính đặt ở tầm mắt, logo ở đỉnh, hình ảnh không gian hiện đại tinh tế, tiêu đề thông điệp rõ ràng dễ đọc từ khoảng cách 5 mét, độ phân giải cao 300 DPI"
  },
  {
    id: "tpl_sticker_round",
    name: "Tem Nhãn Bế Tròn (Tách Nền)",
    badge: "Tem Tròn",
    presetId: "sticker_round",
    hiddenPrompt: "tem nhãn tròn bế dán nắp ly trà sen vàng quả mọng, logo trung tâm sắc nét, viền tròn bo cong thanh thoát, bế khuôn chuẩn xác, tách nền hoàn toàn trong suốt chuẩn bị xuất file in decal trong suốt 300 DPI"
  },
  {
    id: "tpl_namecard_lux",
    name: "Danh Thiếp Giám Đốc Dập Nổi",
    badge: "Danh thiếp",
    presetId: "namecard_vn",
    hiddenPrompt: "danh thiếp giám đốc điều hành công ty tài chính công nghệ, giấy mỹ thuật trắng ngà dập nổi logo, màu chữ xanh Navy đậm tinh giản, mặt sau in hoa văn chìm nhận diện thương hiệu trang trọng chuẩn in 90x54mm 300 DPI"
  },
  {
    id: "tpl_menu_table",
    name: "Menu Bàn F&B Nhà Hàng",
    badge: "Menu F&B",
    presetId: "menu_table",
    hiddenPrompt: "thực đơn để bàn 10x20cm, bố cục phân mục đồ uống và món ăn khoa học, giá tiền ngay hàng thẳng lối, phong cách nhà hàng trang nhã, màu sắc kích thích vị giác, chuẩn in offset 300 DPI"
  },
  {
    id: "tpl_free_style",
    name: "Tự Do (Không Ghép Mẫu Ẩn)",
    badge: "Tự do",
    presetId: null,
    hiddenPrompt: ""
  }
];

const STORAGE_KEY = 'mzpic_custom_prompt_templates_v2';

export function getPromptTemplates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Lỗi nạp prompt templates:', e);
  }
  return DEFAULT_PROMPT_TEMPLATES;
}

export function savePromptTemplates(templates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Lỗi lưu prompt templates:', e);
  }
}

export function resetPromptTemplates() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
  return DEFAULT_PROMPT_TEMPLATES;
}
