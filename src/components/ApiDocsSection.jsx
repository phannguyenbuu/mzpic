import React, { useState } from 'react';
import Tooltip from './Tooltip';

export default function ApiDocsSection({ showToast }) {
  const [activeEndpoint, setActiveEndpoint] = useState('job-create');
  const [lang, setLang] = useState('curl');
  const [copied, setCopied] = useState(false);

  const endpoints = [
    {
      id: 'job-create',
      name: 'Tạo ấn phẩm',
      method: 'POST',
      path: '/render-job',
      desc: 'Gửi prompt và tham số tạo ảnh 300 DPI tới VPS ToolXPrint',
      payload: {
        prompt: 'Tờ rơi A4 khai trương thẩm mỹ viện',
        aspect_ratio: '9:16',
        resolution: '4k',
        engine: 'gpt',
        presets: { style: 'commercial_studio' }
      }
    },
    {
      id: 'job-status',
      name: 'Kiểm tra tiến độ',
      method: 'GET',
      path: '/render-job/:id',
      desc: 'Lấy trạng thái hoàn thành và link tải file ảnh chuẩn in 300 DPI',
      payload: null
    },
    {
      id: 'gallery',
      name: 'Thư viện ảnh',
      method: 'GET',
      path: '/api/gallery',
      desc: 'Truy vấn danh sách ấn phẩm đã được tạo trên hệ thống',
      payload: null
    },
    {
      id: 'workers',
      name: 'Danh sách Workers',
      method: 'GET',
      path: '/api/workers',
      desc: 'Kiểm tra trạng thái máy render Chrome tự động hóa',
      payload: null
    }
  ];

  const currentDef = endpoints.find((e) => e.id === activeEndpoint) || endpoints[0];

  const getCodeSnippet = () => {
    if (lang === 'curl') {
      if (currentDef.method === 'POST') {
        return `curl -X POST "https://render.toolxprint.com${currentDef.path}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(currentDef.payload, null, 2)}'`;
      }
      return `curl -X GET "https://render.toolxprint.com${currentDef.path.replace(':id', 'job_1791329000123')}"`;
    }

    if (lang === 'js') {
      if (currentDef.method === 'POST') {
        return `const res = await fetch("https://render.toolxprint.com${currentDef.path}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${JSON.stringify(currentDef.payload, null, 2)})
});
const data = await res.json();
console.log("Job ID:", data.job_id);`;
      }
      return `const res = await fetch("https://render.toolxprint.com${currentDef.path.replace(':id', 'job_1791329000123')}");
const data = await res.json();
console.log(data);`;
    }

    // Python
    if (currentDef.method === 'POST') {
      return `import requests
url = "https://render.toolxprint.com${currentDef.path}"
payload = ${JSON.stringify(currentDef.payload, null, 2)}
r = requests.post(url, json=payload)
print(r.json())`;
    }
    return `import requests
url = "https://render.toolxprint.com${currentDef.path.replace(':id', 'job_1791329000123')}"
r = requests.get(url)
print(r.json())`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    if (showToast) showToast('Đã sao chép mã nguồn API!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Endpoints Pill Selector */}
      <div className="liquid-card" style={{ padding: '12px' }}>
        <div className="liquid-card-glow"></div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>REST API ToolXPrint</span>
            <Tooltip text="Tích hợp API trực tiếp vào phần mềm thiết kế, website in ấn của bạn">
              <span className="tooltip-trigger-icon">?</span>
            </Tooltip>
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981' }}>v1.0 Live</span>
        </div>

        {/* Horizontal scroll pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {endpoints.map((ep) => (
            <button
              key={ep.id}
              type="button"
              className={`liquid-pill-btn ${activeEndpoint === ep.id ? 'active' : ''}`}
              style={{ fontSize: '0.7rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
              onClick={() => setActiveEndpoint(ep.id)}
            >
              <span style={{ fontWeight: 800, opacity: 0.85 }}>{ep.method}</span> {ep.name}
            </button>
          ))}
        </div>
      </div>

      {/* Code Snippet Card */}
      <div className="liquid-card" style={{ padding: '14px' }}>
        <div className="liquid-card-glow"></div>

        {/* Method & Path */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '6px',
                background: currentDef.method === 'POST' ? '#3b82f6' : '#10b981',
                color: '#ffffff'
              }}
            >
              {currentDef.method}
            </span>
            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#0f172a', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentDef.path}
            </span>
          </div>

          {/* Lang tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['curl', 'js', 'python'].map((l) => (
              <button
                key={l}
                type="button"
                className={`liquid-pill-btn ${lang === l ? 'active' : ''}`}
                style={{ fontSize: '0.65rem', padding: '2px 6px', textTransform: 'uppercase' }}
                onClick={() => setLang(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '10px' }}>
          {currentDef.desc}
        </div>

        {/* Code Box */}
        <div style={{ position: 'relative' }}>
          <Tooltip text="Sao chép code mẫu">
            <button
              onClick={handleCopyCode}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(255,255,255,0.18)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '0.65rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <i className={`bi ${copied ? 'bi-check2 text-emerald-400' : 'bi-clipboard'}`}></i>
              <span>{copied ? 'Đã chép' : 'Chép'}</span>
            </button>
          </Tooltip>

          <pre
            style={{
              background: 'rgba(15, 23, 42, 0.94)',
              color: '#f8fafc',
              padding: '12px 14px',
              borderRadius: '16px',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              overflowX: 'auto',
              lineHeight: '1.5'
            }}
          >
            <code>{getCodeSnippet()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
