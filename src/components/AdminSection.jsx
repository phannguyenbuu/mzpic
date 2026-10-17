import React, { useState, useEffect } from 'react';
import Tooltip from './Tooltip';
import {
  fetchMzPicSettings,
  saveMzPicSettings,
  fetchMzPicPrompts,
  saveMzPicPrompts,
  fetchMzPicUsers,
  createOrUpdateMzPicUser,
  deleteMzPicUser,
  logoutUser
} from '../utils/agentApi';
import { DESIGN_PRESETS, DESIGN_STYLES } from '../data/presets';
import { DEFAULT_PROMPT_TEMPLATES, DEFAULT_GENERAL_COMMENT } from '../data/promptTemplates';

export default function AdminSection({
  user,
  onLogout,
  onOpenGoogleAuth,
  showToast,
  promptTemplates,
  setPromptTemplates,
  generalComment,
  setGeneralComment
}) {
  const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' | 'prompts' | 'settings'

  // Users State
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    id: null,
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'tech',
    is_active: true
  });

  // Settings State
  const [settings, setSettings] = useState({
    googleClientId: '475773389104-4frju27uljiuj0mtihidgude16ghr39t.apps.googleusercontent.com',
    googleClientSecret: '',
    agentApiEndpoint: 'https://adm.toolxprint.com',
    apiEndpoint: 'https://genai.toolxprint.com',
    defaultPresetId: 'flyer_a4',
    defaultStyleId: 'none',
    defaultUnit: 'mm',
    costPerImage: 2000
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Template Form State
  const [isTplModalOpen, setIsTplModalOpen] = useState(false);
  const [tplFormData, setTplFormData] = useState({
    id: '',
    name: '',
    badge: '',
    presetId: 'flyer_a4',
    hiddenPrompt: ''
  });
  const [isSavingPrompts, setIsSavingPrompts] = useState(false);

  // Load Users from agentapi
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await fetchMzPicUsers();
      setUsersList(users);
    } catch (e) {
      if (showToast) showToast('Không thể tải danh sách người dùng từ agentapi', 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load Settings from agentapi
  const loadSettings = async () => {
    try {
      const remoteSettings = await fetchMzPicSettings();
      if (remoteSettings) {
        setSettings((prev) => ({ ...prev, ...remoteSettings }));
      }
    } catch (e) {
      console.warn('Could not load remote settings:', e);
    }
  };

  // Load Prompts from agentapi
  const loadPrompts = async () => {
    try {
      const remote = await fetchMzPicPrompts();
      if (remote && remote.templates && remote.templates.length > 0) {
        if (setPromptTemplates) setPromptTemplates(remote.templates);
      }
      if (remote && remote.generalComment) {
        if (setGeneralComment) setGeneralComment(remote.generalComment);
      }
    } catch (e) {
      console.warn('Could not load remote prompts:', e);
    }
  };

  useEffect(() => {
    loadUsers();
    loadSettings();
    loadPrompts();
  }, []);

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await saveMzPicSettings(settings);
      if (showToast) showToast('✅ Đã lưu cài đặt lên adm.toolxprint.com!', 'success');
    } catch (err) {
      if (showToast) showToast(`Lỗi lưu cài đặt: ${err.message}`, 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Save Prompts & Comment to agentapi
  const handleSaveAllPrompts = async () => {
    setIsSavingPrompts(true);
    try {
      await saveMzPicPrompts({
        templates: promptTemplates,
        generalComment: generalComment
      });
      if (showToast) showToast('✅ Đã đồng bộ mẫu Prompt lên adm.toolxprint.com!', 'success');
    } catch (err) {
      if (showToast) showToast(`Lỗi lưu prompt: ${err.message}`, 'error');
    } finally {
      setIsSavingPrompts(false);
    }
  };

  // Save User
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userFormData.email && !userFormData.username) {
      if (showToast) showToast('Vui lòng nhập Email hoặc Tên đăng nhập!', 'warning');
      return;
    }

    try {
      await createOrUpdateMzPicUser(userFormData);
      if (showToast) showToast('✅ Đã lưu thông tin người dùng thành công!', 'success');
      setIsUserModalOpen(false);
      loadUsers();
    } catch (err) {
      if (showToast) showToast(`Lỗi: ${err.message}`, 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${userName}"?`)) return;
    try {
      await deleteMzPicUser(userId);
      if (showToast) showToast(`Đã xóa người dùng "${userName}"!`, 'info');
      loadUsers();
    } catch (err) {
      if (showToast) showToast(`Lỗi xóa người dùng: ${err.message}`, 'error');
    }
  };

  // Open Edit User
  const handleOpenEditUser = (u) => {
    setUserFormData({
      id: u.id,
      username: u.username || '',
      full_name: u.full_name || '',
      email: u.email || '',
      password: '',
      role: u.role || u.user_type || 'tech',
      is_active: u.is_active !== false
    });
    setIsUserModalOpen(true);
  };

  // Open Create User
  const handleOpenCreateUser = () => {
    setUserFormData({
      id: null,
      username: '',
      full_name: '',
      email: '',
      password: 'User@2026',
      role: 'tech',
      is_active: true
    });
    setIsUserModalOpen(true);
  };

  // Prompt Templates Management
  const handleOpenAddTemplate = () => {
    setTplFormData({
      id: `tpl_${Date.now()}`,
      name: '',
      badge: 'Mẫu Mới',
      presetId: 'flyer_a4',
      hiddenPrompt: ''
    });
    setIsTplModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl) => {
    setTplFormData({ ...tpl });
    setIsTplModalOpen(true);
  };

  const handleSaveTemplateForm = (e) => {
    e.preventDefault();
    if (!tplFormData.name.trim()) {
      if (showToast) showToast('Vui lòng nhập tên mẫu prompt!', 'warning');
      return;
    }

    let updatedList = [];
    const exists = promptTemplates.some((t) => t.id === tplFormData.id);
    if (exists) {
      updatedList = promptTemplates.map((t) => (t.id === tplFormData.id ? tplFormData : t));
    } else {
      updatedList = [...promptTemplates, tplFormData];
    }

    if (setPromptTemplates) setPromptTemplates(updatedList);
    saveMzPicPrompts({ templates: updatedList, generalComment });
    setIsTplModalOpen(false);
    if (showToast) showToast('Đã lưu mẫu prompt!', 'success');
  };

  const handleDeleteTemplate = (id, name) => {
    if (!window.confirm(`Xóa mẫu prompt "${name}"?`)) return;
    const updated = promptTemplates.filter((t) => t.id !== id);
    if (setPromptTemplates) setPromptTemplates(updated);
    saveMzPicPrompts({ templates: updated, generalComment });
    if (showToast) showToast(`Đã xóa mẫu "${name}"!`, 'info');
  };

  const handleResetDefaultPrompts = () => {
    if (!window.confirm('Khôi phục danh sách mẫu Prompt và Ghi chú chung về mặc định?')) return;
    if (setPromptTemplates) setPromptTemplates(DEFAULT_PROMPT_TEMPLATES);
    if (setGeneralComment) setGeneralComment(DEFAULT_GENERAL_COMMENT);
    saveMzPicPrompts({ templates: DEFAULT_PROMPT_TEMPLATES, generalComment: DEFAULT_GENERAL_COMMENT });
    if (showToast) showToast('Đã khôi phục mẫu Prompt mặc định!', 'success');
  };

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '90px' }}>
      
      {/* User Header / Session Card */}
      <div className="liquid-card" style={{ padding: '16px' }}>
        <div className="liquid-card-glow"></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <img
                src={user.avatar}
                alt="Avatar"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #3b82f6',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}
              >
                <i className="bi bi-person"></i>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                  {user ? user.name : 'Khách vãng lai'}
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: user ? '#dcfce7' : '#f1f5f9',
                    color: user ? '#15803d' : '#64748b'
                  }}
                >
                  {user ? (user.role?.toUpperCase() || 'GOOGLE AUTH') : 'CHƯA ĐĂNG NHẬP'}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                {user ? user.email : 'Đăng nhập Google để đồng bộ dữ liệu và quyền truy cập'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <a
              href="https://mzpic.com"
              className="liquid-pill-btn"
              style={{ fontSize: '0.75rem', padding: '6px 14px', textDecoration: 'none', color: '#1e293b' }}
              title="Quay lại Studio School Paper"
            >
              <i className="bi bi-arrow-left"></i>
              <span>Về Studio</span>
            </a>
            {!user ? (
              <button
                type="button"
                onClick={onOpenGoogleAuth}
                className="liquid-pill-btn active"
                style={{ fontSize: '0.75rem', padding: '6px 14px' }}
              >
                <i className="bi bi-google"></i>
                <span>Đăng nhập Google</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="liquid-pill-btn"
                style={{ fontSize: '0.75rem', padding: '6px 14px', color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5' }}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nav Sub-Tabs Switcher */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          padding: '4px',
          border: '1px solid rgba(226, 232, 240, 0.8)'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('users')}
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.76rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeSubTab === 'users' ? '#2563eb' : 'transparent',
            color: activeSubTab === 'users' ? '#ffffff' : '#64748b',
            boxShadow: activeSubTab === 'users' ? '0 4px 12px rgba(37, 99, 235, 0.28)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <i className="bi bi-people-fill"></i>
          <span>Người Dùng</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('prompts')}
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.76rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeSubTab === 'prompts' ? '#2563eb' : 'transparent',
            color: activeSubTab === 'prompts' ? '#ffffff' : '#64748b',
            boxShadow: activeSubTab === 'prompts' ? '0 4px 12px rgba(37, 99, 235, 0.28)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <i className="bi bi-chat-square-quote-fill"></i>
          <span>Mẫu Prompt</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('settings')}
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.76rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeSubTab === 'settings' ? '#2563eb' : 'transparent',
            color: activeSubTab === 'settings' ? '#ffffff' : '#64748b',
            boxShadow: activeSubTab === 'settings' ? '0 4px 12px rgba(37, 99, 235, 0.28)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <i className="bi bi-sliders"></i>
          <span>Cài Đặt</span>
        </button>
      </div>

      {/* ── SUBTAB 1: QUẢN LÝ NGƯỜI DÙNG (USERS) ── */}
      {activeSubTab === 'users' && (
        <div className="liquid-card" style={{ padding: '16px' }}>
          <div className="liquid-card-glow"></div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                Quản Trị Người Dùng ({usersList.length} tài khoản)
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Dữ liệu được lưu trữ trực tiếp trên PostgreSQL của adm.toolxprint.com
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <Tooltip text="Tải lại từ server">
                <button
                  type="button"
                  onClick={loadUsers}
                  className="liquid-pill-btn"
                  style={{ padding: '6px 10px', fontSize: '0.72rem' }}
                >
                  <i className={`bi bi-arrow-clockwise ${isLoadingUsers ? 'spin' : ''}`}></i>
                </button>
              </Tooltip>

              <button
                type="button"
                onClick={handleOpenCreateUser}
                className="liquid-pill-btn active"
                style={{ padding: '6px 12px', fontSize: '0.74rem' }}
              >
                <i className="bi bi-person-plus-fill"></i>
                <span>Thêm Mới</span>
              </button>
            </div>
          </div>

          {/* Users List */}
          {isLoadingUsers && usersList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.8rem' }}>
              <i className="bi bi-arrow-repeat spin" style={{ fontSize: '1.4rem', color: '#2563eb', display: 'block', marginBottom: '8px' }}></i>
              Đang tải danh sách người dùng...
            </div>
          ) : usersList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.8rem' }}>
              Chưa có tài khoản nào được đăng ký
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {usersList.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}
                    >
                      {(u.full_name || u.username || 'U')[0].toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                          {u.full_name || u.username}
                        </span>
                        <span
                          style={{
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '9999px',
                            background: u.role === 'admin' ? '#fee2e2' : '#dbeafe',
                            color: u.role === 'admin' ? '#dc2626' : '#1d4ed8'
                          }}
                        >
                          {u.role || u.user_type || 'tech'}
                        </span>
                        {!u.is_active && (
                          <span style={{ fontSize: '0.58rem', padding: '1px 5px', borderRadius: '4px', background: '#f1f5f9', color: '#94a3b8' }}>
                            Đã khóa
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {u.email || u.username} • ID: #{u.id}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tooltip text="Chỉnh sửa người dùng">
                      <button
                        type="button"
                        onClick={() => handleOpenEditUser(u)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#334155',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem'
                        }}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                    </Tooltip>

                    <Tooltip text="Xóa người dùng">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id, u.full_name || u.username)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#fee2e2',
                          color: '#dc2626',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem'
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUBTAB 2: QUẢN LÝ MẪU PROMPT & COMMENT ── */}
      {activeSubTab === 'prompts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* General Comment Card */}
          <div className="liquid-card" style={{ padding: '16px' }}>
            <div className="liquid-card-glow"></div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                  Ghi Chú Chung (General Comment Ẩn)
                </span>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                  Nội dung này được tự động ghép ngầm vào TẤT CẢ các câu lệnh gửi sang ToolXPrint VPS.
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAllPrompts}
                disabled={isSavingPrompts}
                className="liquid-pill-btn active"
                style={{ fontSize: '0.72rem', padding: '6px 12px' }}
              >
                <i className="bi bi-cloud-arrow-up-fill"></i>
                <span>Lưu Ghi Chú</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              className="liquid-pill-input"
              style={{ width: '100%', borderRadius: '14px', resize: 'none', fontSize: '0.78rem', padding: '8px 12px' }}
              placeholder="Nhập ghi chú chung chuẩn in ấn..."
            />
          </div>

          {/* Prompt Templates Card */}
          <div className="liquid-card" style={{ padding: '16px' }}>
            <div className="liquid-card-glow"></div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  Danh Sách Mẫu Prompt Dropdown ({promptTemplates.length} mẫu)
                </span>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                  Hiển thị trong dropdown Studio để người dùng chọn nhanh phong cách ấn phẩm
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleResetDefaultPrompts}
                  className="liquid-pill-btn"
                  style={{ fontSize: '0.72rem', padding: '6px 10px', color: '#64748b' }}
                >
                  Mặc định
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddTemplate}
                  className="liquid-pill-btn active"
                  style={{ fontSize: '0.74rem', padding: '6px 12px' }}
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Thêm Mẫu</span>
                </button>
              </div>
            </div>

            <div className="admin-prompts-grid">
              {promptTemplates.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '14px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          background: '#dbeafe',
                          color: '#1d4ed8'
                        }}
                      >
                        {t.badge || 'Template'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                        {t.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditTemplate(t)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#2563eb',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          padding: '2px 6px'
                        }}
                      >
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(t.id, t.name)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          padding: '2px 6px'
                        }}
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.3 }}>
                    <b>Prompt ẩn:</b> {t.hiddenPrompt || '<i>(Không ghép mẫu ẩn)</i>'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 3: CÀI ĐẶT HỆ THỐNG (SETTINGS) ── */}
      {activeSubTab === 'settings' && (
        <div className="liquid-card" style={{ padding: '16px' }}>
          <div className="liquid-card-glow"></div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                Cài Đặt Hệ Thống School Paper
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Đồng bộ cấu hình trung tâm tại adm.toolxprint.com
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="liquid-pill-btn active"
              style={{ fontSize: '0.75rem', padding: '7px 16px' }}
            >
              <i className="bi bi-check-lg"></i>
              <span>{isSavingSettings ? 'Đang lưu...' : 'Lưu Cài Đặt'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Google Client ID */}
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Google OAuth Client ID
              </label>
              <input
                type="text"
                value={settings.googleClientId}
                onChange={(e) => setSettings({ ...settings, googleClientId: e.target.value })}
                className="liquid-pill-input"
                style={{ width: '100%', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* Google Client Secret */}
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Google OAuth Client Secret
              </label>
              <input
                type="password"
                value={settings.googleClientSecret}
                onChange={(e) => setSettings({ ...settings, googleClientSecret: e.target.value })}
                className="liquid-pill-input"
                style={{ width: '100%', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* Agent API Server */}
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Máy Chủ Quản Lý & Xác Thực (Agent API)
              </label>
              <input
                type="text"
                value={settings.agentApiEndpoint}
                onChange={(e) => setSettings({ ...settings, agentApiEndpoint: e.target.value })}
                className="liquid-pill-input"
                style={{ width: '100%', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* GenAI Server */}
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Máy Chủ Render GPU (ToolXPrint GenAI Hub)
              </label>
              <input
                type="text"
                value={settings.apiEndpoint}
                onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
                className="liquid-pill-input"
                style={{ width: '100%', fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* Phí tạo ảnh */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Phí tạo ảnh (VNĐ / Lượt)
                </label>
                <input
                  type="number"
                  value={settings.costPerImage}
                  onChange={(e) => setSettings({ ...settings, costPerImage: Number(e.target.value) || 2000 })}
                  className="liquid-pill-input"
                  style={{ width: '100%', fontSize: '0.78rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Đơn vị đo mặc định
                </label>
                <select
                  value={settings.defaultUnit}
                  onChange={(e) => setSettings({ ...settings, defaultUnit: e.target.value })}
                  className="liquid-pill-input"
                  style={{ width: '100%', fontSize: '0.78rem' }}
                >
                  <option value="mm">Milimet (mm)</option>
                  <option value="cm">Centimet (cm)</option>
                  <option value="px">Pixels (px)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: THÊM / SỬA USER ── */}
      {isUserModalOpen && (
        <div className="liquid-modal-backdrop" onClick={() => setIsUserModalOpen(false)}>
          <div className="liquid-modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '20px', maxWidth: '380px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
              {userFormData.id ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng Mới'}
            </div>

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Email</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="liquid-pill-input"
                  style={{ width: '100%', fontSize: '0.78rem' }}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Họ và Tên</label>
                <input
                  type="text"
                  value={userFormData.full_name}
                  onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                  className="liquid-pill-input"
                  style={{ width: '100%', fontSize: '0.78rem' }}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className="liquid-pill-input"
                  style={{ width: '100%', fontSize: '0.78rem' }}
                  placeholder="nguyenvana"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>
                  {userFormData.id ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu'}
                </label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="liquid-pill-input"
                  style={{ width: '100%', fontSize: '0.78rem' }}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Quyền hạn (Role)</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="liquid-pill-input"
                  style={{ width: '100%', fontSize: '0.78rem' }}
                >
                  <option value="admin">Quản Trị Viên (Admin)</option>
                  <option value="tech">Kỹ Thuật Viên (Tech)</option>
                  <option value="support">Nhân Viên Hỗ Trợ (Support)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="liquid-pill-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-liquid-primary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem' }}
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: THÊM / SỬA MẪU PROMPT ── */}
      {isTplModalOpen && (
        <div className="liquid-modal-backdrop" onClick={() => setIsTplModalOpen(false)}>
          <div className="liquid-modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '20px', maxWidth: '420px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
              {tplFormData.id ? 'Sửa Mẫu Prompt' : 'Thêm Mẫu Prompt Mới'}
            </div>

            <form onSubmit={handleSaveTemplateForm} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Tên mẫu</label>
                <input
                  type="text"
                  value={tplFormData.name}
                  onChange={(e) => setTplFormData({ ...tplFormData, name: e.target.value })}
                  className="liquid-pill-input"
                  style={{ width: '100%', fontSize: '0.78rem' }}
                  placeholder="Ví dụ: Banner Quảng Cáo Spa"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Nhãn Badge</label>
                  <input
                    type="text"
                    value={tplFormData.badge}
                    onChange={(e) => setTplFormData({ ...tplFormData, badge: e.target.value })}
                    className="liquid-pill-input"
                    style={{ width: '100%', fontSize: '0.78rem' }}
                    placeholder="Banner Spa"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Khổ in liên kết</label>
                  <select
                    value={tplFormData.presetId || ''}
                    onChange={(e) => setTplFormData({ ...tplFormData, presetId: e.target.value || null })}
                    className="liquid-pill-input"
                    style={{ width: '100%', fontSize: '0.78rem' }}
                  >
                    <option value="">(Không gắn khổ)</option>
                    {DESIGN_PRESETS.flatMap((c) => c.items).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Nội dung Prompt Mẫu Ẩn</label>
                <textarea
                  rows={4}
                  value={tplFormData.hiddenPrompt}
                  onChange={(e) => setTplFormData({ ...tplFormData, hiddenPrompt: e.target.value })}
                  className="liquid-pill-input"
                  style={{ width: '100%', fontSize: '0.78rem', resize: 'none' }}
                  placeholder="phong cách sang trọng, bố cục hài hòa, chuẩn in offset 300 DPI..."
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsTplModalOpen(false)}
                  className="liquid-pill-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-liquid-primary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem' }}
                >
                  Lưu Mẫu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
