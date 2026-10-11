#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
server.py - MzPic Backend API Server (ToolXPrint Engine)
--------------------------------------------------------
Cung cấp API REST cho ứng dụng ReactJS MzPic:
- Sinh ảnh AI (OpenAI gpt-image-1 / Gemini Imagen 3) từ prompt.
- Chuẩn hóa kích thước in ấn (mm, cm, m, pt, px) ở độ phân giải 300 DPI.
- Tách nền trong suốt (PNG) & Tạo ảnh Mockup 3D phối cảnh thực tế.
- Phục vụ file kết quả và quản lý ví số dư người dùng.
"""

import os
import sys
import io
import time
import json
import uuid
import base64
import logging
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from PIL import Image

# Import ai_engine
from ai_engine import (
    get_api_keys,
    enhance_print_prompt,
    generate_with_gpt,
    generate_with_gemini,
    process_print_upscale,
    apply_transparency_cutout,
    generate_3d_mockup,
    create_fallback_design,
    PRO_PRESETS
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [MzPicServer] %(message)s")
logger = logging.getLogger("MzPicServer")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

BASE_DIR = Path(__file__).parent.resolve()
RENDER_DIR = BASE_DIR / "renders"
THUMB_DIR = BASE_DIR / "renders" / ".thumbs"
RENDER_DIR.mkdir(parents=True, exist_ok=True)
THUMB_DIR.mkdir(parents=True, exist_ok=True)

# Khởi tạo ví người dùng mặc định
USER_WALLET = {
    "balance": 50000,
    "cost_per_image": 2000
}

# Đổi đơn vị sang pixel ở 300 DPI
UNIT_TO_INCH = {
    "mm": lambda val: val / 25.4,
    "cm": lambda val: val / 2.54,
    "m": lambda val: (val * 100) / 2.54,
    "pt": lambda val: val / 72.0,
    "px": lambda val, dpi=300: val / dpi
}

def convert_to_pixels(val: float, unit: str, dpi: int = 300) -> int:
    try:
        val = float(val)
        unit = unit.lower()
        if unit in UNIT_TO_INCH:
            inches = UNIT_TO_INCH[unit](val, dpi) if unit == "px" else UNIT_TO_INCH[unit](val)
            return max(64, int(round(inches * dpi)))
        return int(round(val))
    except Exception:
        return 1024

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "MzPic Print AI Studio Backend (ToolXPrint Engine)",
        "version": "1.0.0",
        "status": "online",
        "endpoints": [
            "/api/health",
            "/api/presets",
            "/api/enhance-prompt",
            "/api/generate",
            "/api/mockup-3d",
            "/api/remove-bg",
            "/api/wallet"
        ]
    })

@app.route("/api/health", methods=["GET"])
def health():
    gemini_key, gpt_key = get_api_keys()
    return jsonify({
        "status": "healthy",
        "engine": "ToolXPrint GenAI",
        "keys_detected": {
            "openai_gpt": bool(gpt_key),
            "google_gemini": bool(gemini_key)
        },
        "renders_count": len(list(RENDER_DIR.glob("*.png")) + list(RENDER_DIR.glob("*.jpg"))),
        "wallet_balance": USER_WALLET["balance"]
    })

@app.route("/api/enhance-prompt", methods=["POST"])
def api_enhance_prompt():
    data = request.get_json(silent=True) or {}
    raw_prompt = data.get("prompt", "")
    style_id = data.get("style_id", "none")
    transparent_bg = bool(data.get("transparent_bg", False))
    
    enhanced = enhance_print_prompt(raw_prompt, style_id, transparent_bg)
    return jsonify({"enhanced_prompt": enhanced})

@app.route("/api/generate", methods=["POST"])
def api_generate():
    data = request.get_json(silent=True) or {}
    raw_prompt = (data.get("prompt") or "").strip()
    if not raw_prompt:
        return jsonify({"error": "Vui lòng nhập nội dung mô tả hình ảnh (prompt)"}), 400

    width = data.get("width", 210)
    height = data.get("height", 297)
    unit = data.get("unit", "mm")
    aspect_ratio = data.get("aspect_ratio", "portrait") # portrait | landscape | square
    engine = data.get("engine", "gpt").lower() # gpt | gemini
    style_id = data.get("style_id", "none")
    preset_id = data.get("preset_id", "custom")
    preset_name = data.get("preset_name", "Ấn phẩm in ấn")
    transparent_bg = bool(data.get("transparent_bg", False))

    # Kiểm tra số dư ví
    if USER_WALLET["balance"] < USER_WALLET["cost_per_image"]:
        return jsonify({
            "error": "Số dư ví không đủ để tạo ấn phẩm. Vui lòng nạp thêm tiền!",
            "balance": USER_WALLET["balance"],
            "cost": USER_WALLET["cost_per_image"]
        }), 402

    # Tính pixel theo kích thước và đơn vị đo
    px_w = convert_to_pixels(width, unit, dpi=300)
    px_h = convert_to_pixels(height, unit, dpi=300)

    # Chuẩn hóa prompt với 5 tầng phong cách in ấn
    effective_prompt = enhance_print_prompt(raw_prompt, style_id, transparent_bg)
    logger.info(f"🎨 [Tạo ảnh] {preset_name} ({width}x{height} {unit} -> {px_w}x{px_h} px): '{raw_prompt[:60]}...'")

    gemini_key, gpt_key = get_api_keys()
    image = None
    usage = {"engine": engine, "tokens": 1000, "cost_vnd": 2000, "cost_usd": 0.08}
    is_mock = False

    # Thử gọi engine thực tế từ Toolx
    try:
        if engine == "gemini" and gemini_key:
            image, usage = generate_with_gemini(effective_prompt, aspect_ratio, gemini_key)
        elif gpt_key:
            image, usage = generate_with_gpt(effective_prompt, aspect_ratio, gpt_key)
        elif gemini_key:
            image, usage = generate_with_gemini(effective_prompt, aspect_ratio, gemini_key)
        else:
            raise Exception("Chưa cấu hình API Key trong D:/vps_go.md")
    except Exception as e:
        logger.warning(f"Không thể sinh ảnh qua API ({e}). Đang kích hoạt chế độ thiết kế dự phòng...")
        image = create_fallback_design(raw_prompt, px_w, px_h, preset_name, transparent_bg)
        is_mock = True
        usage["is_fallback"] = True

    # Nếu chọn tách nền
    if transparent_bg and image:
        image = apply_transparency_cutout(image)

    # Nâng cấp độ phân giải sắc nét chuẩn in 300 DPI
    if image:
        image = process_print_upscale(image, px_w, px_h)

    # Lưu file
    file_id = f"design_{uuid.uuid4().hex[:8]}"
    ext = "png" if transparent_bg else "jpg"
    filename = f"{file_id}_{px_w}x{px_h}.{ext}"
    filepath = RENDER_DIR / filename

    if transparent_bg:
        image.save(filepath, "PNG", dpi=(300, 300))
    else:
        image.convert("RGB").save(filepath, "JPEG", quality=95, dpi=(300, 300))

    # Tạo thumbnail nhẹ WebP
    thumb_filename = f"{file_id}_thumb.webp"
    thumb_path = THUMB_DIR / thumb_filename
    thumb_im = image.copy()
    thumb_im.thumbnail((500, 500), Image.Resampling.LANCZOS)
    if transparent_bg:
        thumb_im.save(thumb_path, "WEBP", quality=85)
    else:
        thumb_im.convert("RGB").save(thumb_path, "WEBP", quality=85)

    # Trừ ví
    USER_WALLET["balance"] -= USER_WALLET["cost_per_image"]
    filesize_mb = round(os.path.getsize(filepath) / (1024 * 1024), 2)

    return jsonify({
        "success": True,
        "filename": filename,
        "file_url": f"/render-files/{filename}",
        "thumb_url": f"/render-thumbnails/{thumb_filename}",
        "width": width,
        "height": height,
        "unit": unit,
        "px_w": px_w,
        "px_h": px_h,
        "dpi": 300,
        "filesize_mb": filesize_mb,
        "transparent_bg": transparent_bg,
        "aspect_ratio": aspect_ratio,
        "wallet_balance": USER_WALLET["balance"],
        "usage": usage,
        "is_fallback": is_mock
    })

@app.route("/api/mockup-3d", methods=["POST"])
def api_mockup_3d():
    data = request.get_json(silent=True) or {}
    filename = data.get("filename")
    preset_id = data.get("preset_id", "flyer_a4")

    if not filename:
        return jsonify({"error": "Thiếu tên file ấn phẩm"}), 400

    source_path = RENDER_DIR / filename
    if not source_path.exists():
        return jsonify({"error": "Không tìm thấy file ấn phẩm"}), 404

    try:
        with Image.open(source_path) as im:
            mockup = generate_3d_mockup(im, preset_id)
            mockup_name = f"mockup_3d_{filename}.png"
            mockup_path = RENDER_DIR / mockup_name
            mockup.save(mockup_path, "PNG")

        return jsonify({
            "success": True,
            "mockup_url": f"/render-files/{mockup_name}",
            "filename": mockup_name
        })
    except Exception as e:
        logger.error(f"Lỗi tạo 3D Mockup: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/remove-bg", methods=["POST"])
def api_remove_bg():
    data = request.get_json(silent=True) or {}
    filename = data.get("filename")
    if not filename:
        return jsonify({"error": "Thiếu tên file"}), 400

    source_path = RENDER_DIR / filename
    if not source_path.exists():
        return jsonify({"error": "File không tồn tại"}), 404

    try:
        with Image.open(source_path) as im:
            cutout = apply_transparency_cutout(im)
            out_filename = f"nobg_{Path(filename).stem}.png"
            out_path = RENDER_DIR / out_filename
            cutout.save(out_path, "PNG", dpi=(300, 300))

        return jsonify({
            "success": True,
            "file_url": f"/render-files/{out_filename}",
            "filename": out_filename
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/wallet", methods=["GET", "POST"])
def api_wallet():
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        amount = int(data.get("amount", 50000))
        USER_WALLET["balance"] += amount
        return jsonify({
            "success": True,
            "balance": USER_WALLET["balance"],
            "added": amount
        })

    return jsonify({
        "balance": USER_WALLET["balance"],
        "cost_per_image": USER_WALLET["cost_per_image"]
    })

@app.route("/render-files/<path:filename>", methods=["GET"])
def serve_render_file(filename):
    return send_from_directory(RENDER_DIR, filename)

@app.route("/render-thumbnails/<path:filename>", methods=["GET"])
def serve_render_thumbnail(filename):
    return send_from_directory(THUMB_DIR, filename)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    logger.info(f"🚀 MzPic Print Studio Server đang lắng nghe tại: http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
