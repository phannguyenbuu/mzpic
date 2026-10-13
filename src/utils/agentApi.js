/**
 * agentApi.js - Quản lý kết nối tới agentapi.quanlymay.com
 * Đồng bộ toàn bộ Cài đặt (Settings), Mẫu Prompt, Người dùng (Users), và Xác thực Google Auth
 */

const BASE_URL = window.location.origin.includes('mzpic.com')
  ? '/agent-api'
  : 'https://agentapi.quanlymay.com';

const AUTH_TOKEN_KEY = 'mzpic_auth_token';
const USER_KEY = 'mzpic_user';

// Helper decode Google JWT credential token on client
export function decodeGoogleJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding Google JWT:', e);
    return null;
  }
}

export function getStoredAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function getStoredUser() {
  try {
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    const user = JSON.parse(data);
    if (user && user.expiresAt && Date.now() > user.expiresAt) {
      clearStoredAuth();
      return null;
    }
    return user;
  } catch (e) {
    return null;
  }
}

export function setStoredAuth(token, user) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── 1. GOOGLE LOGIN & LOGOUT ──

export async function loginWithGoogleCredential(credentialToken) {
  if (!credentialToken) {
    throw new Error('Thiếu mã xác thực Google');
  }

  // Decode profile info on client
  const clientProfile = decodeGoogleJwt(credentialToken);

  let serverResp = null;
  try {
    const res = await fetch(`${BASE_URL}/api/login/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: credentialToken })
    });
    if (res.ok) {
      serverResp = await res.json();
    }
  } catch (e) {
    console.warn('Backend google login notice, using client payload:', e);
  }

  const token = serverResp?.token || credentialToken;
  const user = {
    id: serverResp?.user?.id || (clientProfile?.sub ? clientProfile.sub.slice(-6) : Date.now()),
    name: clientProfile?.name || serverResp?.user?.full_name || 'Google User',
    email: clientProfile?.email || serverResp?.user?.email || '',
    avatar: clientProfile?.picture || serverResp?.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
    role: serverResp?.user?.role || 'admin',
    token
  };

  setStoredAuth(token, user);
  return { ok: true, token, user };
}

export async function logoutUser() {
  try {
    await fetch(`${BASE_URL}/logout`, { method: 'POST' }).catch(() => {});
  } catch (e) {}
  clearStoredAuth();
  return { ok: true };
}

// ── 2. MZPIC SETTINGS API ──

export async function fetchMzPicSettings() {
  try {
    const res = await fetch(`${BASE_URL}/api/mzpic/settings`);
    if (res.ok) {
      const data = await res.json();
      return data.settings || {};
    }
  } catch (err) {
    console.error('Error fetching settings from agentapi:', err);
  }
  return null;
}

export async function saveMzPicSettings(settings) {
  const token = getStoredAuthToken();
  const res = await fetch(`${BASE_URL}/api/mzpic/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(settings)
  });
  if (!res.ok) {
    throw new Error(`Lỗi lưu cài đặt (${res.status})`);
  }
  return await res.json();
}

// ── 3. MZPIC PROMPTS API ──

export async function fetchMzPicPrompts() {
  try {
    const res = await fetch(`${BASE_URL}/api/mzpic/prompts`);
    if (res.ok) {
      const data = await res.json();
      return data.prompts || { templates: [], generalComment: '' };
    }
  } catch (err) {
    console.error('Error fetching prompts from agentapi:', err);
  }
  return null;
}

export async function saveMzPicPrompts(promptsData) {
  const token = getStoredAuthToken();
  const res = await fetch(`${BASE_URL}/api/mzpic/prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(promptsData)
  });
  if (!res.ok) {
    throw new Error(`Lỗi lưu prompt (${res.status})`);
  }
  return await res.json();
}

// ── 4. MZPIC USERS API ──

export async function fetchMzPicUsers() {
  try {
    const token = getStoredAuthToken();
    const res = await fetch(`${BASE_URL}/api/mzpic/users`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data.users || [];
    }
  } catch (err) {
    console.error('Error fetching users from agentapi:', err);
  }
  return [];
}

export async function createOrUpdateMzPicUser(userData) {
  const token = getStoredAuthToken();
  const res = await fetch(`${BASE_URL}/api/mzpic/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const errText = await res.text();
    let msg = errText;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.error || errText;
    } catch (e) {}
    throw new Error(msg || 'Lỗi lưu thông tin người dùng');
  }
  return await res.json();
}

export async function deleteMzPicUser(userId) {
  const token = getStoredAuthToken();
  const res = await fetch(`${BASE_URL}/api/mzpic/users/${userId}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    throw new Error(`Lỗi xóa người dùng (${res.status})`);
  }
  return await res.json();
}
