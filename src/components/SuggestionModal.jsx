import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Tooltip from './Tooltip';
import { exportToA0Pdf } from '../utils/pdfExport';
import { WALLPAPER_COLOR_TONES } from '../data/colorTones';

// Curated sample images specifically for school wall newspapers (Báo Tường) from Downloads/refs (30 mẫu thực tế)
const CURATED_PAPER_IMAGES = [
  {
    id: 'ref_01',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Mặt Trời Trên Bục Giảng',
    description: 'Báo tường 20/11 lớp 11A5 với tranh phấn bảng, lời ngỏ, góc truyện cười, thanh âm mùa tri ân, khoảnh khắc vàng',
    url: '/refs/ref_01.jpg'
  },
  {
    id: 'ref_02',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Tri Ân Nguồn Sáng - Vững Bước Tương Lai',
    description: 'Mô hình 3D bản đồ Việt Nam, trống đồng, hoa sen, kỷ niệm 50 năm truyền thống',
    url: '/refs/ref_02.jpg'
  },
  {
    id: 'ref_03',
    category: 'header',
    categoryLabel: 'Đầu Báo (Header)',
    emoji: '🏷️',
    title: 'Header "Uống Nước Nhớ Nguồn"',
    description: 'Tiêu đề thư pháp xanh dương uốn lượn, cầu vồng, cá voi, cuốn sách tri thức mở',
    url: '/refs/ref_03.jpg'
  },
  {
    id: 'ref_04',
    category: 'body',
    categoryLabel: 'Thân Báo (Body)',
    emoji: '📄',
    title: 'Bố Cục Thân Báo Đa Năng',
    description: 'Phân chia ô xã luận, lời ngỏ, góc truyện tranh, cửa sổ kỷ niệm và dải phim ký ức',
    url: '/refs/ref_04.jpg'
  },
  {
    id: 'ref_05',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Người Lái Đò Tiếp Bước',
    description: 'Mô hình 3D rồng phượng, viền hoa tím, chân dung Bác Hồ, Đại tướng Võ Nguyên Giáp',
    url: '/refs/ref_05.jpg'
  },
  {
    id: 'ref_06',
    category: 'body',
    categoryLabel: 'Thân Báo (Body)',
    emoji: '📄',
    title: 'Cánh Buồm Tri Thức (Bút Chì Cổ Điển)',
    description: 'Bố cục thân báo hình con thuyền với từng cánh buồm là bài viết, phong cách mực tàu',
    url: '/refs/ref_06.jpg'
  },
  {
    id: 'ref_07',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Cánh Buồm Tri Thức Vượt Sóng',
    description: 'Cờ đỏ sao vàng, sóng biển nổi 3D, cánh buồm giấy bài viết và hoa văn tre trúc',
    url: '/refs/ref_07.jpg'
  },
  {
    id: 'ref_08',
    category: 'border',
    categoryLabel: 'Khung & Viền',
    emoji: '🌸',
    title: 'Khung Tán Bàng Xanh Mát & Bồ Câu',
    description: 'Viền chữ U tán lá bàng rợp bóng sân trường, chim bồ câu trắng chao liệng',
    url: '/refs/ref_08.jpg'
  },
  {
    id: 'ref_09',
    category: 'header',
    categoryLabel: 'Đầu Báo (Header)',
    emoji: '🏷️',
    title: 'Header "Nhớ Ơn Thầy Cô" & Cuốn Thư',
    description: 'Chữ thư pháp nghệ thuật, hai dải lụa chiếu chỉ vàng "Nhất tự vi sư, Bán tự vi sư"',
    url: '/refs/ref_09.jpg'
  },
  {
    id: 'ref_10',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Màu Thời Gian 12A8',
    description: 'Cuốn sách mở, đồng hồ cát, hộp thư góp ý, bó hoa hồng và các ô văn nghệ',
    url: '/refs/ref_10.jpg'
  },
  {
    id: 'ref_11',
    category: 'border',
    categoryLabel: 'Khung & Viền',
    emoji: '🌸',
    title: 'Khung Viền Hoa Hướng Dương "Ươm Mầm"',
    description: 'Viền bạc hoa văn, bông hướng dương lớn Tôn Sư Trọng Đạo, ô viết hình lá cây',
    url: '/refs/ref_11.jpg'
  },
  {
    id: 'ref_12',
    category: 'border',
    categoryLabel: 'Khung & Viền',
    emoji: '🌸',
    title: 'Khung Câu Đối Đỏ "Bến Đò Tri Ân"',
    description: 'Nền nhung đen hoa sen hồng tao nhã, hai câu đối thư pháp đỏ trang trọng',
    url: '/refs/ref_12.jpg'
  },
  {
    id: 'ref_13',
    category: 'border',
    categoryLabel: 'Khung & Viền',
    emoji: '🌸',
    title: 'Khung Viền Rặng Tre Xanh & Mai Vàng',
    description: 'Khung viền rặng tre Việt Nam xanh mát, hoa mai vàng và búp măng non',
    url: '/refs/ref_13.jpg'
  },
  {
    id: 'ref_14',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Tóc Xanh - Tà Áo Dài Thướt Tha',
    description: 'Tranh cô giáo tà áo dài trắng, hoa hướng dương rực rỡ, các ô lời ngỏ & tản văn',
    url: '/refs/ref_14.jpg'
  },
  {
    id: 'ref_15',
    category: 'body',
    categoryLabel: 'Thân Báo (Body)',
    emoji: '📄',
    title: 'Bố Cục 6 Ô "Ước Mơ Xanh"',
    description: 'Sắp xếp 6 ô giấy kẻ tiêu chuẩn chừa chỗ viết bài ngay ngắn, điểm xuyết hoa hồng & tulip',
    url: '/refs/ref_15.jpg'
  },
  {
    id: 'ref_16',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Biết Ơn Thầy Cô Giáo - Ánh Bình Minh',
    description: 'Ánh mặt trời rạng rỡ, viền quả trám câu đối hai bên, ô chữ 20/11 và nhạc Bụi Phấn',
    url: '/refs/ref_16.jpg'
  },
  {
    id: 'ref_17',
    category: 'border',
    categoryLabel: 'Khung & Viền',
    emoji: '🌸',
    title: 'Khung Viền 3D "Ơn Cô Nghĩa Thầy"',
    description: 'Hoa hướng dương nổi 3D đỉnh đầu, các khung viền hoa sen uốn lượn chừa chỗ viết bài',
    url: '/refs/ref_17.jpg'
  },
  {
    id: 'ref_18',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Sáng Tạo Mô Hình Báo Tường Thuyền Hải Quân',
    description: 'Mô hình con tàu khát vọng cống hiến, cột mốc Đảo Trường Sa, sóng biển 3D',
    url: '/refs/ref_18.jpg'
  },
  {
    id: 'ref_19',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Hiến Chương Nhà Giáo - Đầm Sen Thủy Mặc',
    description: 'Hoa sen trắng xanh tinh tế, câu đối thư pháp chữ Nôm hai bên, tranh trường xưa chân trang',
    url: '/refs/ref_19.jpg'
  },
  {
    id: 'ref_20',
    category: 'body',
    categoryLabel: 'Thân Báo (Body)',
    emoji: '📄',
    title: 'Bố Cục Cánh Sen Hồng Nở Xòe',
    description: 'Thiết kế các cánh hoa sen hồng nở xòe chính là từng ô bài viết: Thơ, Xã luận, Lời ngỏ',
    url: '/refs/ref_20.jpg'
  },
  {
    id: 'ref_21',
    category: 'body',
    categoryLabel: 'Thân Báo (Body)',
    emoji: '📄',
    title: 'Bố Cục Giấy Ô Ly "Nâng Cánh Ước Mơ"',
    description: 'Các khung bài viết giấy kẻ ô ly học trò được bo viền hoa hồng, hoa cúc thủ công tinh tế',
    url: '/refs/ref_21.jpg'
  },
  {
    id: 'ref_22',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Khởi Nguyên Hữu Nghị & Nghệ Thuật',
    description: 'Báo tường giao lưu văn hóa, nhịp cầu ngôn ngữ, tranh minh họa từ trái tim đến trái tim',
    url: '/refs/ref_22.jpg'
  },
  {
    id: 'ref_23',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Người Khai Sáng - Cô Giáo Đầm Sen',
    description: 'Tranh cô giáo áo dài xanh giữa đầm sen hồng, các ô Sóng ân, Xã luận, Tháng năm học trò',
    url: '/refs/ref_23.jpg'
  },
  {
    id: 'ref_24',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Khát Vọng Cống Hiến Đảo Trường Sa',
    description: 'Thiết kế đồ họa hiện đại hình cánh buồm tàu hải quân, cờ Tổ Quốc, người lính đảo',
    url: '/refs/ref_24.jpg'
  },
  {
    id: 'ref_25',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Cánh Buồm Ước Mơ Khối 5',
    description: 'Tranh màu nước con thuyền vượt sóng lớn, hoa hồng vàng rực rỡ, bài Người mẹ thứ hai',
    url: '/refs/ref_25.jpg'
  },
  {
    id: 'ref_26',
    category: 'border',
    categoryLabel: 'Khung & Viền',
    emoji: '🌸',
    title: 'Khung Hoa Đào Hồng "Thắp Sáng Ước Mơ"',
    description: 'Tán hoa đào nở rộ đỉnh đầu, hoa giấy 3D trắng, các ô giấy craft màu nâu viết chữ tay',
    url: '/refs/ref_26.jpg'
  },
  {
    id: 'ref_27',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Vạt Nắng Bên Thềm Cũ',
    description: 'Mái trường ngói đỏ, cờ đỏ sao vàng, mô hình sân trường 3D bật mở độc đáo',
    url: '/refs/ref_27.jpg'
  },
  {
    id: 'ref_28',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Tiến Bước Chi Đoàn 12A2',
    description: 'Báo tường mô hình tròn cánh buồm bản đồ Việt Nam, băng rôn Nhất tự vi sư đỏ',
    url: '/refs/ref_28.jpg'
  },
  {
    id: 'ref_29',
    category: 'header',
    categoryLabel: 'Đầu Báo (Header)',
    emoji: '🏷️',
    title: 'Header "Chuyến Đò Tri Ân" Thư Pháp',
    description: 'Dòng sông quê hương, cô lái đò áo hồng, cuốn sách mở Tấm lòng thầy cô',
    url: '/refs/ref_29.jpg'
  },
  {
    id: 'ref_30',
    category: 'full',
    categoryLabel: 'Báo Tường Hoàn Chỉnh',
    emoji: '📰',
    title: 'Vững Bước Tương Lai - Kỷ Niệm 50 Năm',
    description: 'Mô hình 3D hoa sen, biểu tượng 50 năm UED, bản đồ đất nước non sông gấm vóc',
    url: '/refs/ref_30.jpg'
  }
];

// Curated prompt suggestions for each of the 4 tabs
const PROMPT_SUGGESTIONS = {
  border: {
    label: 'Đường Viền (Border)',
    emoji: '🌸',
    accentColor: '#f43f5e',
    items: [
      {
        id: 'p_b_1',
        title: 'Viền chữ U ngược hoa văn hồng pastel',
        badge: 'Khuyên Dùng',
        text: 'Tôi muốn tạo viền hình vuông, viền hoa văn màu hồng, lưu ý viền hình chữ u (u ngược). Viền dày tối đa 1% chiều rộng của ảnh. Toàn bộ phần thân giữa để trống màu trắng tinh.',
        tags: ['Chữ U ngược', 'Màu hồng', 'Độ dày ≤ 1%', 'Trống giữa']
      },
      {
        id: 'p_b_2',
        title: 'Viền hoa hồng leo uốn lượn chữ U',
        badge: 'Học Trò',
        text: 'Đường viền hoa hồng leo uốn lượn chữ U ngược màu hồng phấn nhẹ nhàng, nét vẽ thanh lịch mỏng nhẹ ôm quanh đỉnh và 2 cạnh bên, chừa toàn bộ khoảng trống ở giữa để viết bài.',
        tags: ['Hoa hồng leo', 'Uốn lượn', 'Hồng phấn', 'Mỏng nhẹ']
      },
      {
        id: 'p_b_3',
        title: 'Viền hoa sen hồng truyền thống Việt Nam',
        badge: 'Trang Trọng',
        text: 'Đường viền hoa văn hoa sen hồng thanh tao cách điệu chữ U ngược, phong cách nghệ thuật trang trọng truyền thống Việt Nam dọc theo 2 bên và đỉnh báo tường, nét viền mỏng ≤ 1%.',
        tags: ['Hoa sen', 'Truyền thống', 'Trang trọng', '20/11']
      },
      {
        id: 'p_b_4',
        title: 'Viền pastel tối giản hiện đại',
        badge: 'Hiện Đại',
        text: 'Đường viền chữ U ngược phong cách tối giản màu pastel, viền đôi thanh mảnh mạ vàng hồng nhẹ nhàng, các góc bo tròn mềm mại, để trống không gian bên trong.',
        tags: ['Tối giản', 'Vàng hồng', 'Pastel', 'Bo góc']
      }
    ]
  },
  header: {
    label: 'Header (Đầu Báo)',
    emoji: '🏷️',
    accentColor: '#8b5cf6',
    items: [
      {
        id: 'p_h_beautify',
        title: 'Làm Đẹp Hệ Thống (Header 1/4 & Cổ Động)',
        badge: 'Hệ Thống Làm Đẹp',
        text: 'Dựa theo nội dung hãy tạo hình ảnh cổ động phù hợp vào. Kích thước header chiếm 1/4 kích thước',
        tags: ['Hệ Thống', 'Header 1/4', 'Hình ảnh cổ động', 'Chuẩn báo tường']
      },
      {
        id: 'p_h_1',
        title: 'Tiêu đề "TRI ÂN THẦY CÔ" Thư pháp',
        badge: 'Khuyên Dùng',
        text: 'Tiêu đề đầu báo tường nổi bật: "TRI ÂN THẦY CÔ", kiểu chữ thư pháp nghệ thuật uốn lượn trang trọng, trang trí hoa văn mềm mại, điểm xuyết hoa sen và ánh sáng rực rỡ.',
        tags: ['TRI ÂN THẦY CÔ', 'Thư pháp', 'Trang trọng', 'Hoa sen']
      },
      {
        id: 'p_h_2',
        title: 'Tiêu đề "CHẮP CÁNH ƯỚC MƠ"',
        badge: 'Nghệ Thuật',
        text: 'Tiêu đề đầu báo tường: "CHẮP CÁNH ƯỚC MƠ", chữ nghệ thuật 3D uốn lượn cách điệu hình cánh chim bồ câu trắng và trang sách mở, sắc màu tươi sáng rạng rỡ.',
        tags: ['CHẮP CÁNH ƯỚC MƠ', 'Chim bồ câu', 'Trang sách', '3D']
      },
      {
        id: 'p_h_3',
        title: 'Tiêu đề "NẮNG SÂN TRƯỜNG"',
        badge: 'Tuổi Học Trò',
        text: 'Tiêu đề đầu báo tường: "NẮNG SÂN TRƯỜNG", kiểu chữ thư pháp học trò thanh thoát, điểm xuyết hoa phượng đỏ, hoa điệp vàng và tia nắng ban mai mềm mại.',
        tags: ['NẮNG SÂN TRƯỜNG', 'Hoa phượng', 'Điệp vàng', 'Ánh nắng']
      },
      {
        id: 'p_h_4',
        title: 'Tiêu đề "MÁI TRƯỜNG MẾN YÊU"',
        badge: 'Ấm Áp',
        text: 'Tiêu đề nghệ thuật: "MÁI TRƯỜNG MẾN YÊU", biểu tượng chiếc bảng đen, phấn trắng, bình hoa và trang vở học trò, viền chữ ánh kim trang trọng chào mừng ngày 20/11.',
        tags: ['MÁI TRƯỜNG MẾN YÊU', 'Bảng đen', 'Phấn trắng', '20/11']
      }
    ]
  },
  footer: {
    label: 'Footer (Chân Báo)',
    emoji: '📝',
    accentColor: '#06b6d4',
    items: [
      {
        id: 'p_f_beautify',
        title: 'Làm Đẹp Hệ Thống (Cổ Động 2 Bên)',
        badge: 'Hệ Thống Làm Đẹp',
        text: 'Dựa theo nội dung hãy tạo hình ảnh cổ động phù hợp vào 2 bên.',
        tags: ['Hệ Thống', 'Cổ động 2 bên', 'Chân báo', 'Cân đối']
      },
      {
        id: 'p_f_1',
        title: 'Dải ruy băng Chi đoàn 20/11',
        badge: 'Khuyên Dùng',
        text: 'Chân trang báo: "Chi đoàn Thanh niên • Báo tường Chào mừng ngày 20/11", dải ruy băng mềm mại và hoa góc đáy thanh lịch nhẹ nhàng.',
        tags: ['Chi đoàn', 'Băng rôn', '20/11', 'Góc đáy']
      },
      {
        id: 'p_f_2',
        title: 'Tập thể Lớp thân tặng',
        badge: 'Lớp Học',
        text: 'Chân trang báo tường: "Tập thể Học sinh thân tặng Thầy Cô kính yêu", hoa văn trang trí đối xứng ở hai góc đáy trang nhã, màu sắc pastel thanh thoát.',
        tags: ['Tập thể lớp', 'Thân tặng', 'Đối xứng', 'Pastel']
      },
      {
        id: 'p_f_3',
        title: 'Kỷ niệm Ngày Nhà giáo Việt Nam',
        badge: 'Trang Trọng',
        text: 'Dải chân trang báo tường trang trọng với dòng chữ "Kỷ niệm Ngày Nhà giáo Việt Nam 20/11", biểu tượng ngọn đuốc tri thức và cánh hoa sen ở góc đáy.',
        tags: ['Ngày Nhà giáo', 'Ngọn đuốc', 'Cánh sen', 'Trang trọng']
      }
    ]
  },
  body: {
    label: 'Body Trang (Thân Báo)',
    emoji: '📄',
    accentColor: '#f59e0b',
    items: [
      {
        id: 'p_b_1',
        title: 'Bố cục 4 ô tiêu chuẩn trên nền giấy trắng',
        badge: 'Khuyên Dùng',
        text: 'Thân báo tường ở giữa: phân bố các ô bài xã luận, góc thơ ca, lời ngỏ và tranh ảnh, bố cục thoáng đãng sạch sẽ trên nền giấy trắng để trình bày nội dung bài viết.',
        tags: ['4 ô tiêu chuẩn', 'Xã luận', 'Góc thơ', 'Lời ngỏ', 'Nền trắng']
      },
      {
        id: 'p_b_2',
        title: 'Bố cục 6 ô học trò sinh động',
        badge: 'Phong Phú',
        text: 'Bố cục thân báo tường học trò sinh động 6 ô: Ô bài Xã luận trang trọng, Góc thơ ca học trò, Ô Lời ngỏ tâm tình, Góc câu đố vui học tập, Khung dán ảnh kỷ niệm và Lời chúc thầy cô.',
        tags: ['6 ô sinh động', 'Câu đố', 'Ảnh kỷ niệm', 'Lời chúc']
      },
      {
        id: 'p_b_3',
        title: 'Khung giấy kẻ ô chừa chỗ viết tay',
        badge: 'Dễ Viết Bài',
        text: 'Thân báo tường phân chia các khung bài viết giấy kẻ ngang ngay ngắn, chừa nhiều khoảng trắng sạch sẽ thoáng đãng để học sinh dán ảnh kỷ niệm và viết tay chữ đẹp.',
        tags: ['Giấy kẻ ngang', 'Viết tay', 'Khoảng trắng', 'Dán ảnh']
      },
      {
        id: 'p_b_4',
        title: 'Bố cục nghệ thuật kết hợp tranh minh họa',
        badge: 'Sáng Tạo',
        text: 'Bố cục thân báo tường nghệ thuật: các ô bài viết lồng ghép các hình vẽ minh họa học trò, hoa phượng, ngọn bút và con thuyền tri thức nhẹ nhàng trên nền giấy trắng tinh khiết.',
        tags: ['Tranh minh họa', 'Con thuyền', 'Ngọn bút', 'Nghệ thuật']
      }
    ]
  }
};

export default function SuggestionModal({
  isOpen,
  onClose,
  activeSection = 'border',
  onApplyPrompt,
  onSelectSampleImage,
  showToast,
  onOpenLightbox,
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
  transparentBg = false,
  systemBeautify = true,
  setSystemBeautify,
  selectedColorTones = [],
  setSelectedColorTones
}) {
  const [modalTab, setModalTab] = useState('images'); // 'images' | 'prompts'
  const [imageCategory, setImageCategory] = useState('all'); // 'all' | 'border' | 'header' | 'body' | 'full'
  const [promptCategory, setPromptCategory] = useState(activeSection || 'border');
  const [selectedImage, setSelectedImage] = useState(CURATED_PAPER_IMAGES[0] || null);
  const [apiImages, setApiImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Sync initial tab when opening
  useEffect(() => {
    if (isOpen) {
      if (activeSection && PROMPT_SUGGESTIONS[activeSection]) {
        setPromptCategory(activeSection);
      }
    }
  }, [isOpen, activeSection]);

  // Fetch recent images from VPS gallery if available
  useEffect(() => {
    if (!isOpen) return;
    setLoadingImages(true);
    fetch('/api/gallery')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const vpsMapped = data.slice(0, 16).map((item, idx) => ({
            id: 'vps_' + (item.id || idx),
            category: 'full',
            categoryLabel: 'Từ Thư Viện VPS',
            emoji: '☁️',
            title: item.prompt ? item.prompt.slice(0, 40) + '...' : `Tác phẩm VPS #${idx + 1}`,
            description: item.style || 'Chuẩn in 300 DPI',
            url: item.vpsUrl || item.thumbnail || (item.filename ? `/images/${item.filename}` : '')
          })).filter((i) => Boolean(i.url));
          setApiImages(vpsMapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingImages(false));
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filtered images list
  const allImages = [...CURATED_PAPER_IMAGES, ...apiImages];
  const filteredImages = imageCategory === 'all'
    ? allImages
    : allImages.filter((img) => img.category === imageCategory);

  const handleCopyPrompt = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (showToast) showToast('Đã sao chép nội dung prompt vào clipboard!', 'success');
  };

  const handleApply = (sectionKey, promptText) => {
    if (onApplyPrompt) {
      onApplyPrompt(sectionKey, promptText);
    }
    if (showToast) {
      const sectionName = PROMPT_SUGGESTIONS[sectionKey]?.label || sectionKey;
      showToast(`✓ Đã áp dụng mẫu prompt vào phần [${sectionName}]!`, 'success');
    }
    onClose();
  };

  const handlePickImage = (imgUrl, title) => {
    if (!imgUrl) return;
    if (onSelectSampleImage) {
      onSelectSampleImage(activeSection || 'border', imgUrl, title);
    }
    if (showToast) {
      const sectionName = PROMPT_SUGGESTIONS[activeSection]?.label || activeSection;
      showToast(`✓ Đã chọn ảnh mẫu cho phần [${sectionName}]!`, 'success');
    }
    onClose();
  };

  const targetImageUrl = selectedImage?.url || resultImage;

  const handleActionEdit = () => {
    if (!targetImageUrl) return;
    if (selectedImage?.url && onSelectSampleImage) {
      onSelectSampleImage(activeSection || 'border', selectedImage.url, selectedImage.title);
    }
    if (onOpenEdit) onOpenEdit(targetImageUrl);
    onClose();
  };

  const handleActionResize = () => {
    if (onOpenResize) onOpenResize(targetImageUrl);
  };

  const handleActionColorGrading = () => {
    if (onOpenColorGrading) onOpenColorGrading(targetImageUrl);
  };

  const handleActionMockup3D = () => {
    if (!targetImageUrl) return;
    if (selectedImage?.url && onSelectSampleImage) {
      onSelectSampleImage(activeSection || 'border', selectedImage.url, selectedImage.title);
    }
    if (onOpenMockup3D) onOpenMockup3D(targetImageUrl);
    onClose();
  };

  const handleActionRemoveBg = () => {
    if (onRemoveBg) onRemoveBg(targetImageUrl);
  };

  const handleActionDownload = async () => {
    if (selectedImage?.url) {
      try {
        const res = await fetch(selectedImage.url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${selectedImage.id || 'bao_tuong_mau'}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        if (showToast) showToast(`✓ Đã tải ảnh mẫu "${selectedImage.title}" về máy!`, 'success');
      } catch {
        window.open(selectedImage.url, '_blank');
      }
    } else if (onDownloadWithGenAiUpscale) {
      onDownloadWithGenAiUpscale();
    } else if (onDownload) {
      onDownload();
    }
  };

  const handleActionDownloadPdf = async () => {
    const targetUrl = selectedImage?.url || resultImage;
    if (!targetUrl) return;

    if (showToast) showToast('📄 Đang chuẩn bị file PDF chuẩn in A0 (841 × 1189 mm)...', 'info');

    try {
      await exportToA0Pdf(targetUrl, {
        width: 841,
        height: 1189,
        filename: `${selectedImage?.id || 'BaoTuong'}_A0_841x1189mm.pdf`,
        title: selectedImage?.title || 'Báo Tường Mẫu A0 (841 × 1189 mm)'
      });
      if (showToast) showToast(`🎉 Đã tải file PDF A0 "${selectedImage?.title || 'Báo Tường'}" thành công!`, 'success');
    } catch (e) {
      console.error('Lỗi xuất PDF mẫu:', e);
      if (showToast) showToast('Lỗi xuất PDF: ' + e.message, 'error');
    }
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '0',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #ffffff 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
              }}
            >
              <i className="bi bi-lightbulb-fill"></i>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Gợi Ý Thiết Kế Báo Tường
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                Thư viện hình ảnh mẫu báo tường & các bộ prompt gợi ý tương ứng từng tab
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(0, 0, 0, 0.06)',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.15s ease'
            }}
            title="Đóng (Phím Esc)"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* 2 Primary Mode Tabs: [Thư Viện Ảnh] vs [Prompt Gợi Ý] */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            padding: '4px 16px',
            gap: '8px'
          }}
        >
          <button
            type="button"
            onClick={() => setModalTab('images')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: modalTab === 'images' ? '3px solid #f59e0b' : '3px solid transparent',
              color: modalTab === 'images' ? '#b45309' : '#64748b',
              fontWeight: modalTab === 'images' ? 800 : 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="bi bi-images" style={{ fontSize: '1rem', color: modalTab === 'images' ? '#d97706' : '#94a3b8' }}></i>
            <span>1. Thư Viện Hình Ảnh Báo Tường</span>
            <span
              style={{
                fontSize: '0.68rem',
                background: modalTab === 'images' ? '#fde68a' : '#e2e8f0',
                color: modalTab === 'images' ? '#92400e' : '#64748b',
                padding: '1px 8px',
                borderRadius: '9999px',
                fontWeight: 700
              }}
            >
              {allImages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('prompts')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: modalTab === 'prompts' ? '3px solid #8b5cf6' : '3px solid transparent',
              color: modalTab === 'prompts' ? '#6d28d9' : '#64748b',
              fontWeight: modalTab === 'prompts' ? 800 : 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="bi bi-card-text" style={{ fontSize: '1rem', color: modalTab === 'prompts' ? '#8b5cf6' : '#94a3b8' }}></i>
            <span>2. Prompt Gợi Ý Từng Tab</span>
            <span
              style={{
                fontSize: '0.68rem',
                background: modalTab === 'prompts' ? '#ede9fe' : '#e2e8f0',
                color: modalTab === 'prompts' ? '#6d28d9' : '#64748b',
                padding: '1px 8px',
                borderRadius: '9999px',
                fontWeight: 700
              }}
            >
              4 Phần
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: '380px' }}>
          {/* TAB 1: THƯ VIỆN HÌNH ẢNH MẪU */}
          {modalTab === 'images' && (
            <div>
              {/* Image Category Filter Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {[
                  { key: 'all', label: 'Tất cả mẫu', emoji: '🌟' },
                  { key: 'border', label: 'Khung & Viền Chữ U', emoji: '🌸' },
                  { key: 'header', label: 'Tiêu Đề Đầu Báo', emoji: '🏷️' },
                  { key: 'body', label: 'Thân Báo Tường', emoji: '📄' },
                  { key: 'full', label: 'Báo Tường Hoàn Chỉnh', emoji: '📰' }
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setImageCategory(cat.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      border: imageCategory === cat.key ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                      background: imageCategory === cat.key ? '#fffbeb' : '#ffffff',
                      color: imageCategory === cat.key ? '#b45309' : '#475569',
                      fontSize: '0.74rem',
                      fontWeight: imageCategory === cat.key ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Grid of Sample Images */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                  gap: '12px'
                }}
              >
                {filteredImages.map((img) => {
                  const isSelected = selectedImage?.id === img.id;
                  return (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImage(img)}
                      style={{
                        background: '#ffffff',
                        border: isSelected ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: isSelected ? '0 0 0 3px rgba(37, 99, 235, 0.2), 0 4px 12px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Thumbnail Image */}
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '140px',
                          background: '#f1f5f9',
                          overflow: 'hidden',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(img);
                          onOpenLightbox && onOpenLightbox(img.url, img.title);
                        }}
                        title="Bấm để phóng to xem chi tiết"
                      >
                        <img
                          src={img.url}
                          alt={img.title}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            background: '#ffffff'
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            background: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(4px)',
                            color: '#ffffff',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px'
                          }}
                        >
                          {img.emoji} {img.categoryLabel}
                        </div>

                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '6px',
                              left: '6px',
                              background: '#2563eb',
                              color: '#ffffff',
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
                            }}
                          >
                            ✓ Đang chọn
                          </div>
                        )}

                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(15, 23, 42, 0.65)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem'
                        }}
                        title="Xem phóng to"
                      >
                        <i className="bi bi-arrows-fullscreen"></i>
                      </div>
                    </div>

                    {/* Image details & Pick CTA */}
                    <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                        {img.title}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', lineHeight: 1.3, flex: 1 }}>
                        {img.description}
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePickImage(img.url, img.title)}
                        style={{
                          marginTop: '6px',
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
                        }}
                      >
                        <i className="bi bi-plus-circle-fill"></i>
                        <span>Chọn làm ảnh mẫu</span>
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PROMPT GỢI Ý THEO TỪNG PHẦN */}
          {modalTab === 'prompts' && (
            <div>
              {/* Box Làm Đẹp Từ Hệ Thống & Tông Màu Báo Tường */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #fff7ed 0%, #fef2f2 50%, #faf5ff 100%)',
                  border: '1.5px solid #fecdd3',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Hàng 1: Checkbox Làm đẹp từ hệ thống */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(systemBeautify)}
                      onChange={(e) => setSystemBeautify && setSystemBeautify(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#ec4899', cursor: 'pointer' }}
                    />
                    <i className="bi bi-stars" style={{ color: '#ec4899', fontSize: '1rem' }}></i>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                      Làm đẹp từ hệ thống
                    </span>
                    <span
                      style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: systemBeautify ? '#fce7f3' : '#f1f5f9',
                        color: systemBeautify ? '#be185d' : '#64748b'
                      }}
                    >
                      {systemBeautify ? 'Đang bật' : 'Đang tắt'}
                    </span>
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Header 1/4 & Footer cổ động 2 bên
                  </span>
                </div>

                {/* Hàng 2: Tông màu báo tường (chọn nhiều màu) */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="bi bi-palette2" style={{ color: '#8b5cf6', fontSize: '0.85rem' }}></i>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155' }}>
                        Tông màu sử dụng cho báo tường:
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        (chọn nhiều màu)
                      </span>
                      {selectedColorTones && selectedColorTones.length > 0 && (
                        <span style={{ fontSize: '0.64rem', background: '#ede9fe', color: '#6d28d9', fontWeight: 800, padding: '1px 6px', borderRadius: '9999px' }}>
                          {selectedColorTones.length} màu
                        </span>
                      )}
                    </div>
                    {selectedColorTones && selectedColorTones.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedColorTones && setSelectedColorTones([])}
                        style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {WALLPAPER_COLOR_TONES.map((color) => {
                      const isSelected = selectedColorTones && (selectedColorTones.includes(color.id) || selectedColorTones.includes(color.name));
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            if (!setSelectedColorTones) return;
                            if (isSelected) {
                              setSelectedColorTones(selectedColorTones.filter((c) => c !== color.id && c !== color.name));
                            } else {
                              setSelectedColorTones([...(selectedColorTones || []), color.id]);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            border: isSelected ? `1.5px solid ${color.hex}` : '1px solid #e2e8f0',
                            background: isSelected ? color.bgLight : '#ffffff',
                            color: isSelected ? color.textHex : '#475569',
                            fontSize: '0.7rem',
                            fontWeight: isSelected ? 800 : 600,
                            cursor: 'pointer',
                            boxShadow: isSelected ? `0 1px 4px ${color.hex}44` : 'none'
                          }}
                          title={color.desc}
                        >
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: color.hex,
                              border: color.id === 'white' ? '1px solid #cbd5e1' : 'none'
                            }}
                          />
                          <span>{color.shortName}</span>
                          {isSelected && <i className="bi bi-check" style={{ fontSize: '0.8rem', lineHeight: 1 }}></i>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4 Section Tabs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px',
                  marginBottom: '16px'
                }}
              >
                {['border', 'header', 'footer', 'body'].map((secKey) => {
                  const sec = PROMPT_SUGGESTIONS[secKey];
                  const isActive = promptCategory === secKey;
                  return (
                    <button
                      key={secKey}
                      type="button"
                      onClick={() => setPromptCategory(secKey)}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '12px',
                        border: isActive ? `2px solid ${sec.accentColor}` : '1px solid #e2e8f0',
                        background: isActive ? '#f8fafc' : '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{sec.emoji}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: isActive ? 800 : 600,
                          color: isActive ? sec.accentColor : '#64748b',
                          textAlign: 'center',
                          lineHeight: 1.2
                        }}
                      >
                        {sec.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Suggestions List for Selected Section */}
              {PROMPT_SUGGESTIONS[promptCategory] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{PROMPT_SUGGESTIONS[promptCategory].emoji}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: PROMPT_SUGGESTIONS[promptCategory].accentColor }}>
                        Các mẫu prompt cho phần {PROMPT_SUGGESTIONS[promptCategory].label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Bấm "Chèn vào ô nhập" để tự động áp dụng
                    </span>
                  </div>

                  {PROMPT_SUGGESTIONS[promptCategory].items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        transition: 'border-color 0.15s ease'
                      }}
                    >
                      {/* Item Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                            {item.title}
                          </span>
                          <span
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe'
                            }}
                          >
                            {item.badge}
                          </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleCopyPrompt(item.text)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#475569',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Sao chép nội dung prompt"
                          >
                            <i className="bi bi-clipboard"></i>
                            <span>Chép</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApply(promptCategory, item.text)}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: `linear-gradient(135deg, ${PROMPT_SUGGESTIONS[promptCategory].accentColor} 0%, #db2777 100%)`,
                              color: '#ffffff',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}
                          >
                            <i className="bi bi-arrow-down-left-square-fill"></i>
                            <span>Chèn vào ô nhập</span>
                          </button>
                        </div>
                      </div>

                      {/* Prompt Text Box */}
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '8px 10px',
                          fontSize: '0.78rem',
                          color: '#334155',
                          lineHeight: '1.45',
                          fontFamily: 'inherit'
                        }}
                      >
                        {item.text}
                      </div>

                      {/* Tag pills */}
                      {item.tags && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontSize: '0.64rem',
                                color: '#64748b',
                                background: '#f1f5f9',
                                padding: '1px 6px',
                                borderRadius: '6px'
                              }}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Cloned Primary Action Capsule Bar */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          {/* Cloned Action Glass Capsule Bar */}
          <div
            style={{
              padding: '5px 8px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '18px',
              border: '1px solid rgba(226, 232, 240, 0.95)',
              boxShadow: '0 4px 16px -3px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'nowrap'
            }}
          >
            <button
              type="button"
              className="liquid-icon-btn"
              onClick={handleActionEdit}
              disabled={!targetImageUrl}
              title="Chỉnh sửa bổ sung ấn phẩm trong Studio"
              style={{ flexShrink: 0 }}
            >
              <i className="bi bi-pencil-fill"></i>
            </button>
            <button
              type="button"
              className="liquid-icon-btn"
              onClick={handleActionResize}
              disabled={!targetImageUrl}
              title="Chỉnh kích thước chính xác (mm, cm, px, DPI)"
              style={{ flexShrink: 0 }}
            >
              <i className="bi bi-aspect-ratio"></i>
            </button>
            <button
              type="button"
              className="liquid-icon-btn"
              onClick={handleActionColorGrading}
              disabled={!targetImageUrl}
              title="Hậu kỳ màu HSL & Curves"
              style={{ flexShrink: 0 }}
            >
              <i className="bi bi-sliders2-vertical"></i>
            </button>
            <button
              type="button"
              className="liquid-icon-btn"
              onClick={handleActionMockup3D}
              disabled={!targetImageUrl}
              title="Render Mockup 3D trong không gian thực tế"
              style={{ flexShrink: 0 }}
            >
              <i className="bi bi-box-seam-fill"></i>
            </button>
            {!transparentBg && (
              <button
                type="button"
                className="liquid-icon-btn"
                onClick={handleActionRemoveBg}
                disabled={!targetImageUrl}
                title="Xóa phông tách nền PNG trong suốt"
                style={{ flexShrink: 0 }}
              >
                <i className="bi bi-transparency"></i>
              </button>
            )}

            {/* Nút Tải file PDF chuẩn in A0 (841 x 1189 mm) */}
            <button
              type="button"
              onClick={handleActionDownloadPdf}
              disabled={!targetImageUrl}
              className="liquid-icon-btn"
              title="Tải ảnh mẫu này dưới dạng PDF chuẩn in A0 (841 × 1189 mm)"
              style={{
                marginLeft: 'auto',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0 9px',
                height: '32px',
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)'
              }}
            >
              <i className="bi bi-file-earmark-pdf-fill" style={{ fontSize: '0.85rem' }}></i>
              <span>PDF A0</span>
            </button>

            {/* Nút Tải về (Không có chữ, chỉ dùng icon, cùng hàng ngang, đẩy sang phải) */}
            <button
              type="button"
              onClick={handleActionDownload}
              disabled={!targetImageUrl}
              className="liquid-icon-btn primary-download"
              title="Tải về ảnh đang chọn (Kích nét AI / HD)"
              style={{
                marginLeft: '6px',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #4f46e5 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 14px -2px rgba(37, 99, 235, 0.45)'
              }}
            >
              <i className="bi bi-cloud-arrow-down-fill" style={{ fontSize: '1.15rem' }}></i>
            </button>
          </div>

          {/* Right side: Selected target info + Close button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedImage && (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#475569',
                  fontWeight: 700,
                  maxWidth: '220px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={selectedImage.title}
              >
                {selectedImage.emoji} {selectedImage.title}
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
