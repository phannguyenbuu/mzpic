from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request
from sqlalchemy import select

from models import UserAccount, UserType
from serializers import _serialize_user_model
from utils import _to_text

LOGGER = logging.getLogger(__name__)

STORAGE_DIR = Path(__file__).resolve().parent / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
SETTINGS_FILE = STORAGE_DIR / "mzpic_settings.json"
PROMPTS_FILE = STORAGE_DIR / "mzpic_prompts.json"

DEFAULT_SETTINGS = {
    "defaultPresetId": "flyer_a4",
    "defaultStyleId": "none",
    "defaultUnit": "mm",
    "defaultAspectRatio": "portrait",
    "costPerImage": 2000,
    "googleClientId": os.environ.get("GOOGLE_CLIENT_ID", "475773389104-4frju27uljiuj0mtihidgude16ghr39t.apps.googleusercontent.com"),
    "googleClientSecret": os.environ.get("GOOGLE_CLIENT_SECRET", ""),
    "apiEndpoint": "https://genai.toolxprint.com",
    "agentApiEndpoint": "https://agentapi.quanlymay.com"
}

def _load_json_file(file_path: Path, default_data: Any) -> Any:
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            LOGGER.warning("Could not read %s: %s", file_path, e)
    return default_data

def _save_json_file(file_path: Path, data: Any) -> bool:
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        LOGGER.error("Failed to write %s: %s", file_path, e)
        return False

def register_mzpic_routes(app: Flask, session_factory: Any) -> None:

    # ── MzPic Settings API ──
    @app.get("/api/mzpic/settings")
    def get_mzpic_settings() -> Any:
        data = _load_json_file(SETTINGS_FILE, DEFAULT_SETTINGS)
        return jsonify({"ok": True, "settings": data})

    @app.post("/api/mzpic/settings")
    def save_mzpic_settings() -> Any:
        body = request.get_json(silent=True) or {}
        current = _load_json_file(SETTINGS_FILE, DEFAULT_SETTINGS)
        current.update(body)
        if _save_json_file(SETTINGS_FILE, current):
            return jsonify({"ok": True, "settings": current})
        return jsonify({"ok": False, "error": "Could not save settings"}), 500

    # ── MzPic Prompts API ──
    @app.get("/api/mzpic/prompts")
    def get_mzpic_prompts() -> Any:
        data = _load_json_file(PROMPTS_FILE, {"templates": [], "generalComment": ""})
        return jsonify({"ok": True, "prompts": data})

    @app.post("/api/mzpic/prompts")
    def save_mzpic_prompts() -> Any:
        body = request.get_json(silent=True) or {}
        if _save_json_file(PROMPTS_FILE, body):
            return jsonify({"ok": True, "prompts": body})
        return jsonify({"ok": False, "error": "Could not save prompts"}), 500

    # ── MzPic User Management API ──
    @app.get("/api/mzpic/users")
    def list_mzpic_users() -> Any:
        with session_factory() as session:
            stmt = select(UserAccount).order_by(UserAccount.id.desc())
            rows = session.execute(stmt).scalars().all()
            return jsonify({
                "ok": True,
                "users": [_serialize_user_model(r) for r in rows]
            })

    @app.post("/api/mzpic/users")
    def create_or_update_mzpic_user() -> Any:
        body = request.get_json(silent=True) or {}
        user_id = body.get("id")
        email = _to_text(body.get("email")).strip()
        username = _to_text(body.get("username")).strip() or (email.split("@")[0] if email else "")
        full_name = _to_text(body.get("full_name") or body.get("name")).strip()
        role = _to_text(body.get("role") or body.get("user_type") or "tech").strip().lower()
        password = _to_text(body.get("password")).strip()
        is_active = bool(body.get("is_active", True))

        if not email and not username:
            return jsonify({"ok": False, "error": "Email hoặc Username là bắt buộc"}), 400

        with session_factory() as session:
            if user_id:
                user = session.get(UserAccount, int(user_id))
                if not user:
                    return jsonify({"ok": False, "error": f"Không tìm thấy user id={user_id}"}), 404
                if email: user.email = email
                if username: user.username = username
                if full_name: user.full_name = full_name
                if role:
                    user.role = role
                    user.user_type = role
                user.is_active = is_active
                if password:
                    user.password = password
                session.commit()
                session.refresh(user)
                return jsonify({"ok": True, "user": _serialize_user_model(user), "message": "Cập nhật người dùng thành công"})
            else:
                existing = session.execute(select(UserAccount).where(UserAccount.email == email)).scalar_one_or_none()
                if existing:
                    return jsonify({"ok": False, "error": f"Email '{email}' đã tồn tại"}), 400
                new_user = UserAccount(
                    lead="default",
                    username=username,
                    email=email,
                    full_name=full_name or username,
                    password=password or "MzPic2026!",
                    role=role or UserType.TECH.value,
                    user_type=role or UserType.TECH.value,
                    is_active=is_active,
                    notes=_to_text(body.get("notes") or "Created from MzPic Studio"),
                )
                session.add(new_user)
                session.commit()
                session.refresh(new_user)
                return jsonify({"ok": True, "user": _serialize_user_model(new_user), "message": "Tạo người dùng mới thành công"})

    @app.delete("/api/mzpic/users/<int:user_id>")
    def delete_mzpic_user(user_id: int) -> Any:
        with session_factory() as session:
            user = session.get(UserAccount, user_id)
            if not user:
                return jsonify({"ok": False, "error": f"Không tìm thấy user id={user_id}"}), 404
            session.delete(user)
            session.commit()
            return jsonify({"ok": True, "message": f"Đã xóa người dùng id={user_id}"})
