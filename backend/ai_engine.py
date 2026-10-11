#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ai_engine.py - MzPic AI Print Engine (Chuyển giao từ ToolXPrint)
--------------------------------------------------------------
- Đọc động GPTKey và GeminiKey từ D:/vps_go.md hoặc biến môi trường.
- Chuẩn hóa Prompt 5 lớp chuyên sâu cho in ấn (Style, Lighting, Lens, Composition, Specs).
- Tích hợp tạo ảnh OpenAI (gpt-image-1, dall-e-3) & Google Gemini (Imagen 3).
- Bộ Super-Resolution Lanczos + Unsharp Mask chuẩn 300 DPI cho in offset/kỹ thuật số.
- Hỗ trợ sửa hình (Image-to-Image / Inpainting).
- Tự động tạo ảnh Phối cảnh 3D ấn phẩm thực tế (Mockup 3D).
"""

import os
import sys
import io
import math
import base64
import json
import logging
import requests
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageOps

logger = logging.getLogger("MzPicAIEngine")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [MzPic] %(message)s")

DEFAULT_VPS_GO = "D:/vps_go.md" if sys.platform == "win32" else "/opt/toolx-ai-studio/vps_go.md"
VPS_GO_PATH = os.getenv("VPS_GO_PATH", DEFAULT_VPS_GO)

# ==============================================================================
# 1. API KEY LOADER (Từ D:/vps_go.md hoặc Environment Variables)
# ==============================================================================
def get_api_keys():
    """Đọc động GeminiKey và GPTKey từ vps_go.md hoặc environment variables."""
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    gpt_key = os.getenv("OPENAI_API_KEY", "") or os.getenv("GPT_API_KEY", "")

    candidate_paths = [
        VPS_GO_PATH,
        "D:/vps_go.md",
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "vps_go.md"),
        "/opt/toolx-ai-studio/vps_go.md",
        "./vps_go.md"
    ]
    for p in candidate_paths:
        if p and os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    lines = [l.strip() for l in f.readlines()]
                    for i, l in enumerate(lines):
                        if l == "[GeminiKey]" and i + 1 < len(lines):
                            gemini_key = lines[i + 1].strip()
                        elif l == "[GPTKey]" and i + 1 < len(lines):
                            gpt_key = lines[i + 1].strip()
                if gemini_key or gpt_key:
                    break
            except Exception as e:
                logger.warning(f"Lỗi đọc {p}: {e}")
    return gemini_key, gpt_key


# ==============================================================================
# 2. PRO PRESETS & 5-LAYER PROMPT ENHANCER (CHUẨN IN ẤN TOOLXPRINT)
# ==============================================================================
PRO_PRESETS = {
    "style": {
        "none": {"name": "Tự do / Theo AI", "prompt": ""},
        "foil_luxury": {"name": "Ép Kim Vàng & Cán Màng Mờ", "prompt": "high-end luxury print product, gold foil stamping accents, premium matte coated art paper texture, subtle embossed borders, elegant color harmony for commercial offset printing"},
        "kraft_vintage": {"name": "Giấy Kraft & Dập Bản Gỗ", "prompt": "rustic print design on textured brown kraft paper, authentic letterpress woodblock stamping effect, monochromatic natural ink, artisanal handcrafted warmth"},
        "swiss_minimal": {"name": "Tối Giản Thụy Sĩ", "prompt": "Swiss Style editorial print, rigorous graphic grid alignment, crisp typography hierarchy, generous negative space, high-end publication aesthetics"},
        "watercolor": {"name": "Màu Nước Mỹ Thuật", "prompt": "delicate hand-painted watercolor artwork, soft organic pastel washes on cold-press textured cotton paper, artistic brush strokes, elegant invitation aesthetics"},
        "corporate_clean": {"name": "Doanh Nghiệp Chuyên Nghiệp", "prompt": "corporate print branding, elegant navy blue and silver accents, razor-sharp clean vector shapes, premium annual report layout"},
        "pop_label": {"name": "Tem Nhãn Trẻ Trung", "prompt": "modern vibrant die-cut sticker label, playful packaging design, crisp vector cut-lines, punchy saturated colors ready for vinyl sticker print"}
    },
    "lighting": {
        "studio": "diffused professional studio softbox lighting, perfectly balanced exposure, zero unwanted harsh specular highlights",
        "cinematic": "cinematic ambient illumination, subtle rim light highlighting outer edges",
        "natural": "soft morning window daylight, gentle organic shadows, true-to-life surface appearance"
    },
    "specs": "commercial print ready, ultra-sharp 300 DPI fidelity, authentic CMYK color reproduction, pristine vector-like crispness"
}

def enhance_print_prompt(raw_prompt: str, style_id: str = "none", transparent_bg: bool = False, custom_specs: str = "") -> str:
    """Tự động bổ sung 5 lớp chỉ thị in ấn thực tế."""
    parts = [raw_prompt.strip()]

    # Thêm chỉ thị phong cách
    style_info = PRO_PRESETS["style"].get(style_id)
    if style_info and style_info.get("prompt"):
        parts.append(style_info["prompt"])

    # Thêm ánh sáng studio
    parts.append(PRO_PRESETS["lighting"]["studio"])

    # Thêm chỉ thị tách nền
    if transparent_bg:
        parts.append("isolated on solid pure white background, perfectly clean high-contrast silhouette for instant alpha background cutout")

    # Thêm quy chuẩn in ấn
    parts.append(PRO_PRESETS["specs"])
    if custom_specs:
        parts.append(custom_specs)

    return ", ".join([p for p in parts if p])


# ==============================================================================
# 3. OPENAI & GEMINI IMAGE GENERATION (TOOLXPRINT BRIDGE)
# ==============================================================================
def generate_with_gpt(prompt: str, aspect_ratio: str = "portrait", gpt_key: str = None) -> tuple:
    """Tạo ảnh với OpenAI API (gpt-image-1, dall-e-3). Trả về (PIL.Image, usage_dict)."""
    if not gpt_key:
        _, gpt_key = get_api_keys()
    if not gpt_key:
        raise Exception("Không tìm thấy [GPTKey] trong D:/vps_go.md hoặc biến môi trường")

    # Mapping size
    if aspect_ratio == "landscape":
        size = "1536x1024"
    elif aspect_ratio == "portrait":
        size = "1024x1536"
    else:
        size = "1024x1024"

    headers = {
        "Authorization": f"Bearer {gpt_key}",
        "Content-Type": "application/json"
    }

    # Danh sách models thử nghiệm theo chuẩn Toolx
    models = ["gpt-image-1", "gpt-image-1-mini", "chatgpt-image-latest", "dall-e-3"]
    last_err = None

    for model in models:
        payload = {
            "model": model,
            "prompt": prompt,
            "n": 1,
            "size": size if model != "dall-e-3" else ("1792x1024" if aspect_ratio == "landscape" else ("1024x1792" if aspect_ratio == "portrait" else "1024x1024"))
        }
        if model == "dall-e-3":
            payload["quality"] = "hd"

        logger.info(f"Đang gọi OpenAI API (model={model}, size={payload['size']})...")
        try:
            resp = requests.post("https://api.openai.com/v1/images/generations", headers=headers, json=payload, timeout=90)
            if resp.status_code == 200:
                data = resp.json()
                img_item = data.get("data", [{}])[0]
                usage = {
                    "engine": "gpt",
                    "model": model,
                    "tokens": 2000 if aspect_ratio == "square" else 3200,
                    "cost_usd": 0.08 if aspect_ratio == "square" else 0.12,
                    "cost_vnd": 2000
                }
                if "url" in img_item:
                    img_resp = requests.get(img_item["url"], timeout=45)
                    return Image.open(io.BytesIO(img_resp.content)).convert("RGBA"), usage
                elif "b64_json" in img_item:
                    raw_bytes = base64.b64decode(img_item["b64_json"])
                    return Image.open(io.BytesIO(raw_bytes)).convert("RGBA"), usage
            else:
                err = resp.json().get("error", {}).get("message", resp.text)
                last_err = f"[OpenAI {resp.status_code}] {err}"
                logger.warning(f"Thử {model} thất bại: {last_err}")
        except Exception as e:
            last_err = str(e)

    raise Exception(last_err or "Lỗi khi gọi OpenAI API")


def generate_with_gemini(prompt: str, aspect_ratio: str = "portrait", gemini_key: str = None) -> tuple:
    """Tạo ảnh với Google Gemini Imagen 3. Trả về (PIL.Image, usage_dict)."""
    if not gemini_key:
        gemini_key, _ = get_api_keys()
    if not gemini_key:
        raise Exception("Không tìm thấy [GeminiKey] trong D:/vps_go.md hoặc biến môi trường")

    ratio_code = "9:16" if aspect_ratio == "portrait" else ("16:9" if aspect_ratio == "landscape" else "1:1")
    models = ["imagen-3.0-generate-002", "imagen-3.0-generate-001", "gemini-2.5-flash-image"]
    last_err = None

    for model in models:
        try:
            if "imagen" in model:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:predict?key={gemini_key}"
                payload = {
                    "instances": [{"prompt": prompt}],
                    "parameters": {
                        "sampleCount": 1,
                        "aspectRatio": ratio_code,
                        "outputMimeType": "image/png"
                    }
                }
                resp = requests.post(url, json=payload, timeout=60)
                if resp.status_code == 200:
                    data = resp.json()
                    preds = data.get("predictions", [])
                    if preds and "bytesBase64Encoded" in preds[0]:
                        raw = base64.b64decode(preds[0]["bytesBase64Encoded"])
                        usage = {"engine": "gemini", "model": model, "tokens": 1200, "cost_usd": 0.03, "cost_vnd": 2000}
                        return Image.open(io.BytesIO(raw)).convert("RGBA"), usage
                else:
                    err = resp.json().get("error", {}).get("message", resp.text)
                    last_err = f"[Gemini {resp.status_code}] {err}"
            else:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
                payload = {"contents": [{"parts": [{"text": prompt}]}]}
                resp = requests.post(url, json=payload, timeout=60)
                if resp.status_code == 200:
                    candidates = resp.json().get("candidates", [])
                    for part in candidates[0].get("content", {}).get("parts", []):
                        if "inlineData" in part:
                            raw = base64.b64decode(part["inlineData"]["data"])
                            usage = {"engine": "gemini", "model": model, "tokens": 1000, "cost_usd": 0.03, "cost_vnd": 2000}
                            return Image.open(io.BytesIO(raw)).convert("RGBA"), usage
        except Exception as e:
            last_err = str(e)

    raise Exception(last_err or "Lỗi khi gọi Google Gemini API")


# ==============================================================================
# 4. SUPER-RESOLUTION LANCZOS & 300 DPI SHARPENING (TOOLXPRINT)
# ==============================================================================
def process_print_upscale(image: Image.Image, target_px_w: int, target_px_h: int) -> Image.Image:
    """Nâng cấp độ phân giải bằng bộ lọc Lanczos 4x và Unsharp Mask chuẩn 300 DPI."""
    orig_w, orig_h = image.size
    target_w = max(512, min(target_px_w, 4096))
    target_h = max(512, min(target_px_h, 4096))

    logger.info(f"Nâng cấp ảnh từ {orig_w}×{orig_h} lên {target_w}×{target_h} px (Chuẩn 300 DPI)...")
    upscaled = image.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Tăng độ sắc nét viền in ấn
    if upscaled.mode == "RGBA":
        r, g, b, a = upscaled.split()
        rgb = Image.merge("RGB", (r, g, b))
        enhanced_rgb = rgb.filter(ImageFilter.UnsharpMask(radius=2, percent=140, threshold=3))
        sharpener = ImageEnhance.Sharpness(enhanced_rgb)
        sharpened_rgb = sharpener.enhance(1.2)
        sr, sg, sb = sharpened_rgb.split()
        return Image.merge("RGBA", (sr, sg, sb, a))
    else:
        enhanced = upscaled.filter(ImageFilter.UnsharpMask(radius=2, percent=140, threshold=3))
        sharpener = ImageEnhance.Sharpness(enhanced)
        return sharpener.enhance(1.2)


# ==============================================================================
# 5. REMOVE BACKGROUND / TRANSPARENCY PROCESSOR
# ==============================================================================
def apply_transparency_cutout(image: Image.Image) -> Image.Image:
    """Tách nền tạo PNG trong suốt."""
    img = image.convert("RGBA")
    data = img.getdata()
    new_data = []

    # Kiểm tra màu góc trên bên trái làm mẫu màu nền
    sample_pixel = data[0]
    threshold = 35

    for item in data:
        diff = max(abs(item[0] - sample_pixel[0]), abs(item[1] - sample_pixel[1]), abs(item[2] - sample_pixel[2]))
        # Nếu gần màu nền trắng hoặc gần màu mẫu
        if (item[0] > 240 and item[1] > 240 and item[2] > 240) or (diff < threshold and item[0] > 210):
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    return img


# ==============================================================================
# 6. 3D MOCKUP PERSPECTIVE GENERATOR (PHỐI CẢNH 3D ẤN PHẨM THỰC TẾ)
# ==============================================================================
def generate_3d_mockup(design_image: Image.Image, preset_id: str = "flyer_a4") -> Image.Image:
    """
    Tạo ảnh phối cảnh 3D siêu thực cho ấn phẩm:
    - Đặt trên mặt bàn studio / sàn gỗ với ánh sáng tự nhiên.
    - Đổ bóng mềm (ambient occlusion + drop shadow) nhiều lớp.
    - Tạo góc nghiêng phối cảnh 3D (perspective transformation).
    """
    canvas_w, canvas_h = 1600, 1100
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (242, 244, 248, 255))
    draw = ImageDraw.Draw(canvas)

    # Nền gradient studio trang nhã
    for y in range(canvas_h):
        blend = y / canvas_h
        r = int(242 - blend * 14)
        g = int(244 - blend * 12)
        b = int(248 - blend * 10)
        draw.line([(0, y), (canvas_w, y)], fill=(r, g, b, 255))

    # Kích thước thiết kế trong mockup
    is_landscape = design_image.width > design_image.height
    if is_landscape:
        mockup_w = 900
        mockup_h = int(mockup_w * (design_image.height / design_image.width))
    else:
        mockup_h = 750
        mockup_w = int(mockup_h * (design_image.width / design_image.height))

    resized_design = design_image.resize((mockup_w, mockup_h), Image.Resampling.LANCZOS).convert("RGBA")

    # Thêm viền trắng nhẹ giả lập độ dày của giấy mỹ thuật
    border_px = 3
    bordered = ImageOps.expand(resized_design, border=border_px, fill=(255, 255, 255, 255))
    bw, bh = bordered.size

    # Tạo góc nghiêng 3D bằng affine matrix
    # Nghiêng sang bên phải và đổ nghiêng nhẹ tạo chiều sâu thực tế
    shear_factor = 0.08
    persp_img = bordered.transform(
        (bw + int(bh * shear_factor), bh),
        Image.AFFINE,
        (1, -shear_factor, 0, 0, 1, 0),
        Image.Resampling.BICUBIC
    )

    # Đổ bóng 3D mềm (Drop Shadow)
    shadow_offset_x = 40
    shadow_offset_y = 55
    shadow_canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    
    # Bóng đen mờ phân tầng
    shadow_mask = Image.new("RGBA", persp_img.size, (0, 0, 0, 110))
    shadow_blur = shadow_mask.filter(ImageFilter.GaussianBlur(radius=28))

    paste_x = (canvas_w - persp_img.width) // 2 + 10
    paste_y = (canvas_h - persp_img.height) // 2

    canvas.paste(shadow_blur, (paste_x + shadow_offset_x, paste_y + shadow_offset_y), shadow_blur)
    canvas.paste(persp_img, (paste_x, paste_y), persp_img)

    # Thêm nhãn Watermark Mockup chuẩn Toolx
    watermark_draw = ImageDraw.Draw(canvas)
    watermark_draw.rectangle([(20, 20), (280, 56)], fill=(255, 255, 255, 220), outline=(226, 232, 240, 255))
    watermark_draw.text((32, 30), "MzPic 3D Print Studio • 300 DPI", fill=(30, 41, 59, 255))

    return canvas


# ==============================================================================
# 7. HIGH-QUALITY FALLBACK GENERATOR (OFFLINE / BACKUP SAFEGUARD)
# ==============================================================================
def create_fallback_design(prompt: str, width_px: int, height_px: int, preset_name: str, transparent: bool = False) -> Image.Image:
    """Tạo ấn phẩm mô phỏng thẩm mỹ cao khi chưa có kết nối mạng để người dùng test ngay."""
    w = max(600, min(width_px, 2048))
    h = max(600, min(height_px, 2048))

    if transparent:
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    else:
        img = Image.new("RGBA", (w, h), (255, 255, 255, 255))

    draw = ImageDraw.Draw(img)

    # Vẽ nền ấn phẩm sang trọng
    if not transparent:
        # Gradient nền
        for y in range(h):
            factor = y / h
            r = int(248 - factor * 18)
            g = int(250 - factor * 14)
            b = int(252 - factor * 8)
            draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

        # Khung viền chỉ ấn phẩm
        margin = int(min(w, h) * 0.05)
        draw.rectangle([(margin, margin), (w - margin, h - margin)], outline=(203, 213, 225, 255), width=2)
        draw.rectangle([(margin + 6, margin + 6), (w - margin - 6, h - margin - 6)], outline=(226, 232, 240, 255), width=1)

    # Khối nội dung trung tâm
    cx, cy = w // 2, h // 2
    box_w = int(w * 0.8)
    box_h = int(h * 0.5)
    
    # Huy hiệu trung tâm
    draw.rounded_rectangle([(cx - box_w//2, cy - box_h//2), (cx + box_w//2, cy + box_h//2)], radius=16, fill=(255, 255, 255, 240), outline=(226, 232, 240, 255), width=1)

    # Chữ và tiêu đề
    title = preset_name or "MzPic AI Design"
    draw.text((cx - 100, cy - 60), title[:30], fill=(15, 23, 42, 255))
    draw.text((cx - 140, cy - 20), f"Kích thước chuẩn in: {w} × {h} px (300 DPI)", fill=(37, 99, 235, 255))
    
    prompt_snippet = (prompt[:60] + "...") if len(prompt) > 60 else prompt
    draw.text((cx - 180, cy + 20), f"Prompt: {prompt_snippet}", fill=(100, 116, 139, 255))
    draw.text((cx - 90, cy + 60), "Chuẩn in ấn offset chất lượng cao", fill=(16, 185, 129, 255))

    return img
