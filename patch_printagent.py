import re

# 1. Patch app.py
with open('/opt/printagent/app.py', 'r', encoding='utf-8') as f:
    app_code = f.read()

if 'path.startswith("/api/mzpic/")' not in app_code:
    app_code = app_code.replace(
        'if path in ("/login", "/logout", "/api/login", "/api/login/google"):',
        'if path in ("/login", "/logout", "/api/login", "/api/login/google") or path.startswith("/api/mzpic/"):',
        1
    )

if 'register_mzpic_routes' not in app_code:
    app_code = app_code.replace(
        'register_ui_routes(app, session_factory)',
        'register_ui_routes(app, session_factory)\n    from mzpic_routes import register_mzpic_routes\n    register_mzpic_routes(app, session_factory)',
        1
    )

with open('/opt/printagent/app.py', 'w', encoding='utf-8') as f:
    f.write(app_code)
print("Updated /opt/printagent/app.py successfully")

# 2. Patch auth_routes.py to include avatar in google login response
with open('/opt/printagent/auth_routes.py', 'r', encoding='utf-8') as f:
    auth_code = f.read()

if 'user_dict["avatar"]' not in auth_code:
    old_block = '''                resp = jsonify({
                    "ok": True,
                    "token": jwt_tkn,
                    "expires_in": JWT_EXPIRATION_SECONDS,
                    "user": _serialize_user_model(user),
                })'''

    new_block = '''                user_dict = _serialize_user_model(user)
                if picture:
                    user_dict["avatar"] = picture
                resp = jsonify({
                    "ok": True,
                    "token": jwt_tkn,
                    "expires_in": JWT_EXPIRATION_SECONDS,
                    "user": user_dict,
                })'''
    
    if old_block in auth_code:
        auth_code = auth_code.replace(old_block, new_block, 1)
        with open('/opt/printagent/auth_routes.py', 'w', encoding='utf-8') as f:
            f.write(auth_code)
        print("Updated /opt/printagent/auth_routes.py with avatar support")
    else:
        print("Notice: old_block not found in auth_routes.py, checking alternative")
