/**
 * presets.js - Dữ liệu kích thước ấn phẩm chuẩn in ấn & Phong cách in ấn chuyên nghiệp ToolXPrint
 * Hỗ trợ các đơn vị: mm, cm, m, pt, px
 */

export const UNIT_CONVERSIONS = {
  toInches: {
    mm: (val) => val / 25.4,
    cm: (val) => val / 2.54,
    m: (val) => (val * 100) / 2.54,
    pt: (val) => val / 72,
    px: (val, dpi = 300) => val / dpi
  },
  fromInches: {
    mm: (inches) => +(inches * 25.4).toFixed(1),
    cm: (inches) => +(inches * 2.54).toFixed(2),
    m: (inches) => +(inches * 0.0254).toFixed(4),
    pt: (inches) => +(inches * 72).toFixed(1),
    px: (inches, dpi = 300) => Math.round(inches * dpi)
  }
};

export function convertDimension(value, fromUnit, toUnit, dpi = 300) {
  if (fromUnit === toUnit) return value;
  const inches = UNIT_CONVERSIONS.toInches[fromUnit](value, dpi);
  return UNIT_CONVERSIONS.fromInches[toUnit](inches, dpi);
}

export function calculatePixels(val, unit, dpi = 300) {
  if (unit === 'px') return Math.round(val);
  const inches = UNIT_CONVERSIONS.toInches[unit](val, dpi);
  return Math.round(inches * dpi);
}

// Danh mục ấn phẩm và kích thước chuẩn
export const DESIGN_PRESETS = [
  {
    category: "Báo Tường & Bích Báo",
    icon: "bi-newspaper",
    items: [
      {
        id: "wall_newspaper_a0",
        name: "Báo Tường A0 (841 × 1189 mm)",
        desc: "841 × 1189 mm, chuẩn khổ báo tường A0, viền hoa văn chữ U ngược",
        width: 841,
        height: 1189,
        unit: "mm",
        orientation: "portrait",
        popular: true,
        recommendedDpi: 300,
        badge: "Báo Tường A0",
        promptHint: "Tôi muốn tạo viền hình vuông, viền hoa văn màu hồng, lưu ý viền hình chữ u (u ngược). Viền dày tối đa 1% chiều rộng của ảnh, sau khi tạo xong ảnh thì upscale về kích thước 841 *1189mm, báo tường hay có header và footer, cho phép chèn cái này vào để tạo luôn"
      },
      {
        id: "wall_newspaper_a1",
        name: "Báo Tường A1 (594 × 841 mm)",
        desc: "594 × 841 mm, chuẩn khổ báo tường A1 nhỏ gọn",
        width: 594,
        height: 841,
        unit: "mm",
        orientation: "portrait",
        popular: false,
        recommendedDpi: 300,
        badge: "Báo Tường A1",
        promptHint: "Báo tường khổ A1 594×841 mm, viền hoa văn màu hồng chữ U ngược, viền dày tối đa 1% chiều rộng ảnh, có tiêu đề Header và chân trang Footer"
      }
    ]
  },
  {
    category: "Ấn phẩm quảng cáo & Tiếp thị",
    icon: "bi-megaphone",
    items: [
      {
        id: "flyer_a4",
        name: "Tờ rơi A4 (Flyer)",
        desc: "Chuẩn in ấn 210 × 297 mm, phát tay hoặc kẹp catalogue",
        width: 210,
        height: 297,
        unit: "mm",
        orientation: "portrait",
        popular: true,
        recommendedDpi: 300,
        badge: "Chuẩn in A4",
        promptHint: "Bố cục tờ rơi quảng cáo in ấn chuyên nghiệp A4, phân cấp tiêu đề rõ ràng, thông tin sản phẩm và khuyến mãi sắc nét, hình ảnh trung tâm ấn tượng"
      },
      {
        id: "flyer_a5",
        name: "Tờ rơi A5",
        desc: "Kích thước 148 × 210 mm, nhỏ gọn, tiết kiệm chi phí in",
        width: 148,
        height: 210,
        unit: "mm",
        orientation: "portrait",
        popular: true,
        recommendedDpi: 300,
        badge: "A5",
        promptHint: "Tờ rơi A5 phát sự kiện, bố cục tinh gọn, khối ưu đãi nổi bật, khoảng trắng cân đối, sẵn sàng in offset 300 DPI"
      },
      {
        id: "voucher_std",
        name: "Voucher / Gift Card Chuẩn",
        desc: "18 × 8 cm, kích thước tiêu chuẩn ngành in phiếu quà tặng",
        width: 18,
        height: 8,
        unit: "cm",
        orientation: "landscape",
        popular: true,
        recommendedDpi: 300,
        badge: "Phiếu giảm giá",
        promptHint: "Voucher quà tặng cao cấp, viền dập chìm, thông tin giá trị ưu đãi sắc nét, khu vực mã vạch / QR và điều kiện áp dụng trang nhã"
      },
      {
        id: "voucher_mini",
        name: "Voucher Thẻ ATM Mini",
        desc: "90 × 54 mm, bỏ vừa bóp ví khách hàng",
        width: 90,
        height: 54,
        unit: "mm",
        orientation: "landscape",
        recommendedDpi: 300,
        badge: "Bỏ ví",
        promptHint: "Thẻ voucher quà tặng nhỏ gọn kích thước card visit, thiết kế sang trọng tối giản, nhận diện thương hiệu mạnh mẽ"
      },
      {
        id: "standee_std",
        name: "Standee Đứng Chuẩn (0.6 × 1.6m)",
        desc: "Standee chữ X hoặc cuốn nhôm đặt sảnh, showroom",
        width: 0.6,
        height: 1.6,
        unit: "m",
        orientation: "portrait",
        popular: true,
        recommendedDpi: 150,
        badge: "Sự kiện",
        promptHint: "Standee đứng sự kiện khổ 0.6x1.6m, thông điệp chính đặt ở tầm mắt, logo ở đỉnh, màu sắc thu hút tầm nhìn từ xa"
      },
      {
        id: "standee_large",
        name: "Standee Khổ Lớn (0.8 × 2.0m)",
        desc: "Banner cuộn triển lãm, hội chợ thương mại lớn",
        width: 0.8,
        height: 2.0,
        unit: "m",
        orientation: "portrait",
        recommendedDpi: 150,
        badge: "Hội chợ",
        promptHint: "Standee cuốn nhôm cỡ lớn 0.8x2m, hình ảnh sản phẩm hoành tráng độ nét cao, tiêu đề thông điệp mạch lạc"
      },
      {
        id: "poster_a3",
        name: "Poster Dán Tường A3",
        desc: "297 × 420 mm, poster thông báo, chương trình tại điểm bán",
        width: 297,
        height: 420,
        unit: "mm",
        orientation: "portrait",
        recommendedDpi: 300,
        badge: "Poster A3",
        promptHint: "Poster quảng cáo dán tường A3, nghệ thuật sắp đặt hình ảnh và chữ công phu, tạo ấn tượng thị giác mạnh mẽ"
      }
    ]
  },
  {
    category: "Ấn phẩm bộ nhận diện & Bao bì",
    icon: "bi-card-heading",
    items: [
      {
        id: "namecard_vn",
        name: "Danh thiếp (Namecard)",
        desc: "90 × 54 mm, quy chuẩn in danh thiếp tiêu chuẩn Việt Nam",
        width: 90,
        height: 54,
        unit: "mm",
        orientation: "landscape",
        popular: true,
        recommendedDpi: 300,
        badge: "Card visit",
        promptHint: "Danh thiếp giám đốc điều hành cao cấp, logo tối giản dập nổi, bố cục thông tin liên hệ chuẩn mực, mặt sau hoa văn thương hiệu tinh tế"
      },
      {
        id: "invitation_card",
        name: "Thiệp mời / Thiệp cưới",
        desc: "12 × 17 cm, phong cách thiệp trang trọng",
        width: 12,
        height: 17,
        unit: "cm",
        orientation: "portrait",
        popular: true,
        recommendedDpi: 300,
        badge: "Thiệp trang trọng",
        promptHint: "Thiệp mời sự kiện trang trọng 12x17cm, họa tiết viền hoa văn dập nổi thanh lịch, font chữ calligraphy nghệ thuật kết hợp serif"
      },
      {
        id: "sticker_round",
        name: "Tem / Nhãn Dán Tròn",
        desc: "5 × 5 cm, dán nắp hộp quà, ly trà, túi niêm phong",
        width: 5,
        height: 5,
        unit: "cm",
        orientation: "portrait",
        popular: true,
        recommendedDpi: 300,
        badge: "Tem bế tròn",
        promptHint: "Tem nhãn tròn bế dán bao bì sản phẩm đường kính 5cm, logo trung tâm sắc nét, viền tròn bo cong thanh thoát, bế khuôn chuẩn xác"
      },
      {
        id: "sticker_rect",
        name: "Nhãn Phụ / Tem Sản Phẩm",
        desc: "70 × 40 mm, dán chai lọ mỹ phẩm, tinh dầu, thực phẩm",
        width: 70,
        height: 40,
        unit: "mm",
        orientation: "landscape",
        recommendedDpi: 300,
        badge: "Tem chữ nhật",
        promptHint: "Nhãn dán chai lọ sản phẩm organic cao cấp 70x40mm, khối thông tin thành phần và công dụng rõ ràng, chuẩn in decal sữa"
      },
      {
        id: "menu_table",
        name: "Menu Để Bàn",
        desc: "10 × 20 cm, kẹp mica đứng cho nhà hàng, quán cà phê",
        width: 10,
        height: 20,
        unit: "cm",
        orientation: "portrait",
        recommendedDpi: 300,
        badge: "Menu F&B",
        promptHint: "Thực đơn để bàn 10x20cm, bố cục phân mục đồ uống và món ăn khoa học, giá tiền ngay hàng thẳng lối, phong cách nhà hàng trang nhã"
      }
    ]
  },
  {
    category: "Mạng xã hội & Kỹ thuật số",
    icon: "bi-laptop",
    items: [
      {
        id: "fb_post",
        name: "Bài Đăng Mạng Xã Hội (Vuông)",
        desc: "1200 × 1200 px, hình vuông chuẩn Facebook & Instagram",
        width: 1200,
        height: 1200,
        unit: "px",
        orientation: "portrait",
        recommendedDpi: 72,
        badge: "1:1 Vuông",
        promptHint: "Ấn phẩm truyền thông số vuông 1200x1200px, tiêu đề chính thu hút tương tác, thông tin ngắn gọn dễ đọc trên màn hình điện thoại"
      },
      {
        id: "fb_cover",
        name: "Banner / Ảnh Bìa Fanpage",
        desc: "1640 × 924 px, tối ưu vùng hiển thị an toàn trên mobile",
        width: 1640,
        height: 924,
        unit: "px",
        orientation: "landscape",
        recommendedDpi: 72,
        badge: "Banner Cover",
        promptHint: "Banner ngang ảnh bìa Fanpage, thông điệp chiến dịch nằm giữa vùng an toàn, hình ảnh thương hiệu trải rộng cuốn hút"
      }
    ]
  }
];

// Phong cách thiết kế chuyên sâu theo KỸ THUẬT VÀ PHONG CÁCH ẤN PHẨM IN ẤN THỰC TẾ
export const DESIGN_STYLES = [
  {
    id: "style_foil_luxury",
    name: "Ép Kim Vàng & Cán Màng Mờ",
    category: "In cao cấp",
    tag: "Gold Foil & Matte",
    color: "#b45309",
    icon: "bi-award",
    promptAddon: "phong cách ấn phẩm in ấn cao cấp, hiệu ứng ép kim nhũ vàng (gold foil stamping), giấy mỹ thuật cán màng mờ sang trọng, viền dập chìm tinh xảo, phối màu trang nhã chuẩn in offset",
    bgClass: "style-foil",
    previewImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "style_kraft_vintage",
    name: "Giấy Kraft & Dập Bản Gỗ",
    category: "Mộc mạc",
    tag: "Eco Kraft & Letterpress",
    color: "#78350f",
    icon: "bi-tree",
    promptAddon: "phong cách in ấn mộc mạc trên nền giấy Kraft nâu tái chế, kỹ thuật dập nổi chữ bản khắc gỗ (letterpress), mực in đơn sắc tự nhiên, phong cách thủ công artisan ấm cúng",
    bgClass: "style-kraft",
    previewImage: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "style_swiss_minimal",
    name: "Tối Giản Thụy Sĩ (Swiss Editorial)",
    category: "Hiện đại",
    tag: "Grid & Clean Typography",
    color: "#0f172a",
    icon: "bi-grid-3x3",
    promptAddon: "phong cách thiết kế in ấn Thụy Sĩ (Swiss Style), hệ thống lưới đồ họa chặt chẽ, font chữ Sans-Serif sắc nét, khoảng trắng thoáng đãng, phân cấp thị giác chuẩn mực tạp chí xuất bản",
    bgClass: "style-swiss",
    previewImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "style_artistic_watercolor",
    name: "Màu Nước Nghệ Thuật & Giấy Vân",
    category: "Mỹ thuật",
    tag: "Watercolor On Cotton Paper",
    color: "#059669",
    icon: "bi-palette",
    promptAddon: "ấn phẩm in tranh màu nước vẽ tay tinh tế, loang màu pastel hữu cơ trên nền giấy vân mỹ thuật cotton trắng ngà, nét cọ mềm mại, cảm giác thiệp mời trang nhã",
    bgClass: "style-watercolor",
    previewImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "style_corporate_clean",
    name: "Doanh Nghiệp & Hồ Sơ Năng Lực",
    category: "Thương mại",
    tag: "Corporate Blueprint",
    color: "#1d4ed8",
    icon: "bi-briefcase",
    promptAddon: "phong cách ấn phẩm doanh nghiệp chuyên nghiệp (corporate annual report), mảng màu xanh Navy và xám bạc thanh lịch, khối biểu đồ và icon sắc sảo, tạo niềm tin thương hiệu vững chắc",
    bgClass: "style-corporate",
    previewImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: "style_pop_label",
    name: "Tem Nhãn Trẻ Trung & Bế Khuôn",
    category: "Bao bì",
    tag: "Die-Cut Vibrant Label",
    color: "#ea580c",
    icon: "bi-tag",
    promptAddon: "phong cách tem nhãn bao bì sản phẩm hiện đại, màu sắc tươi vui bắt mắt, đường viền bế khuôn sticker sắc sảo, minh họa hình khối sắc nét phù hợp in decal nhựa hoặc giấy cút bóng",
    bgClass: "style-pop",
    previewImage: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=500&q=80"
  }
];

// Mẫu thiết kế chuẩn in ấn thực tế (Realistic Print Layout Templates)
export const SAMPLE_TEMPLATES = [
  {
    id: "tpl_spa_voucher",
    name: "Voucher Spa & Trị Liệu",
    presetId: "voucher_std",
    styleId: "style_foil_luxury",
    transparentBg: false,
    prompt: "Voucher quà tặng trị giá 500.000đ dành cho liệu trình chăm sóc da thư giãn tại Viện Thẩm Mỹ Hoàng Gia. Nền giấy mỹ thuật màu xanh ngọc bích viền ép kim nhũ vàng, bố cục thông tin ưu đãi trang nhã, kèm ô mã QR và điều kiện áp dụng",
    badge: "Voucher VIP"
  },
  {
    id: "tpl_cafe_opening",
    name: "Tờ Rơi Khai Trương Cà Phê Mộc",
    presetId: "flyer_a5",
    styleId: "style_kraft_vintage",
    transparentBg: false,
    prompt: "Tờ rơi A5 mừng khai trương tiệm cà phê rang xay thủ công. Thiết kế trên nền giấy Kraft nâu cổ điển, ưu đãi Mua 1 Tặng 1 tuần lễ đầu, minh họa hạt cà phê vẽ tay dập bản gỗ, địa chỉ và khung giờ mở cửa rõ ràng",
    badge: "Tờ rơi A5"
  },
  {
    id: "tpl_event_standee",
    name: "Standee Khai Trương Showroom",
    presetId: "standee_std",
    styleId: "style_swiss_minimal",
    transparentBg: false,
    prompt: "Standee đứng 0.6x1.6m sự kiện ra mắt bộ sưu tập nội thất Bắc Âu 2026. Bố cục tối giản phong cách Thụy Sĩ, hình ảnh không gian phòng khách hiện đại tinh tế, tiêu đề thông điệp rõ ràng dễ đọc từ khoảng cách 5 mét",
    badge: "Standee 0.6m"
  },
  {
    id: "tpl_drink_label",
    name: "Tem Dán Ly Trà (Tách Nền)",
    presetId: "sticker_round",
    styleId: "style_pop_label",
    transparentBg: true,
    prompt: "Tem nhãn tròn bế dán nắp ly trà sen vàng quả mọng. Minh họa trái cây tươi ngon nét vẽ phẳng tươi sáng, chữ tên quán uốn lượn theo vòng cung tròn, tách nền hoàn toàn trong suốt chuẩn bị xuất file in decal trong suốt",
    badge: "Tem dán tách nền"
  },
  {
    id: "tpl_director_card",
    name: "Danh Thiếp Giám Đốc Dập Nổi",
    presetId: "namecard_vn",
    styleId: "style_corporate_clean",
    transparentBg: false,
    prompt: "Danh thiếp giám đốc điều hành công ty tài chính công nghệ. Giấy mỹ thuật trắng ngà dập nổi logo, màu chữ xanh Navy đậm tinh giản, mặt sau in hoa văn chìm nhận diện thương hiệu trang trọng",
    badge: "Danh thiếp"
  }
];
