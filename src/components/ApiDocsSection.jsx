import React, { useState } from 'react';

export default function ApiDocsSection({ showToast }) {
  const [activeEndpoint, setActiveEndpoint] = useState('job-create');
  const [lang, setLang] = useState('curl');
  const [copied, setCopied] = useState(false);

  const endpoints = [
    {
      id: 'job-create',
      name: 'Tạo ấn phẩm mới (Create Image)',
      method: 'POST',
      path: '/api/jobs/create',
      desc: 'Gửi prompt tạo ảnh tới cụm máy ChatGPT Plus / GPT Image của ToolXPrint',
      payload: {
        prompt: 'Tờ rơi A4 khai trương thẩm mỹ viện sang trọng',
        style: 'Photorealistic',
        aspect_ratio: '9:16',
        caller: 'MzPic App'
      }
    },
    {
      id: 'job-status',
      name: 'Kiểm tra trạng thái tác vụ (Get Job Status)',
      method: 'GET',
      path: '/api/jobs/:id',
      desc: 'Lấy tiến độ tạo ảnh, xem trước tức thì và link file CDN trên VPS',
      payload: null
    },
    {
      id: 'gallery',
      name: 'Lấy thư viện ảnh (Fetch Gallery)',
      method: 'GET',
      path: '/api/gallery',
      desc: 'Truy vấn toàn bộ danh sách ấn phẩm đã được tạo trên hệ thống',
      payload: null
    },
    {
      id: 'workers',
      name: 'Danh sách máy render (List Workers)',
      method: 'GET',
      path: '/api/workers',
      desc: 'Kiểm tra số lượng Chrome Worker và tài khoản ChatGPT Plus online',
      payload: null
    }
  ];

  const currentDef = endpoints.find((e) => e.id === activeEndpoint) || endpoints[0];

  const getCodeSnippet = () => {
    if (lang === 'curl') {
      if (currentDef.method === 'POST') {
        return `curl -X POST "https://genai.toolxprint.com${currentDef.path}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(currentDef.payload, null, 2)}'`;
      }
      return `curl -X GET "https://genai.toolxprint.com${currentDef.path.replace(':id', 'job_1791329000123')}"`;
    }

    if (lang === 'js') {
      if (currentDef.method === 'POST') {
        return `const res = await fetch("https://genai.toolxprint.com${currentDef.path}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${JSON.stringify(currentDef.payload, null, 2)})
});
const data = await res.json();
console.log("Job ID:", data.id);`;
      }
      return `const res = await fetch("https://genai.toolxprint.com${currentDef.path.replace(':id', 'job_1791329000123')}");
const data = await res.json();
console.log(data);`;
    }

    // Python
    if (currentDef.method === 'POST') {
      return `import requests

url = "https://genai.toolxprint.com${currentDef.path}"
payload = ${JSON.stringify(currentDef.payload, null, 2)}
r = requests.post(url, json=payload)
print(r.json())`;
    }
    return `import requests

url = "https://genai.toolxprint.com${currentDef.path.replace(':id', 'job_1791329000123')}"
r = requests.get(url)
print(r.json())`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    if (showToast) showToast('Đã sao chép mã nguồn API vào clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px' }}>
      {/* Header Bar */}
      <div className="card-header-bar" style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="bi bi-code-slash" style={{ fontSize: '1.4rem', color: 'var(--blue-primary)' }}></i>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Tài Liệu &amp; Test REST API (ToolXPrint GenAI Engine)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Kết nối trực tiếp dịch vụ tạo ảnh ấn phẩm từ hệ sinh thái ToolXPrint vào ứng dụng hoặc website bên ngoài
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Endpoints List */}
        <div className="toolx-card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px' }}>
            <i className="bi bi-list-ul text-primary"></i> Danh Sách Endpoints
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {endpoints.map((ep) => {
              const isActive = activeEndpoint === ep.id;
              return (
                <div
                  key={ep.id}
                  onClick={() => setActiveEndpoint(ep.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: isActive ? '2px solid var(--blue-primary)' : '1px solid var(--border-color)',
                    background: isActive ? 'var(--blue-light)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: ep.method === 'POST' ? '#dbeafe' : '#dcfce7',
                        color: ep.method === 'POST' ? '#1d4ed8' : '#15803d'
                      }}
                    >
                      {ep.method}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {ep.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    {ep.path}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Endpoint Details & Code Snippet */}
        <div className="toolx-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: currentDef.method === 'POST' ? '#dbeafe' : '#dcfce7',
                    color: currentDef.method === 'POST' ? '#1d4ed8' : '#15803d'
                  }}
                >
                  {currentDef.method}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>https://genai.toolxprint.com{currentDef.path}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {currentDef.desc}
              </div>
            </div>

            {/* Language tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {['curl', 'js', 'python'].map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`tab-pill-btn ${lang === l ? 'active' : ''}`}
                  onClick={() => setLang(l)}
                  style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Code Viewer */}
          <div style={{ position: 'relative', marginTop: '12px' }}>
            <button
              onClick={handleCopyCode}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <i className={`bi ${copied ? 'bi-check2 text-success' : 'bi-clipboard'}`}></i>
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>

            <pre
              style={{
                background: '#0f172a',
                color: '#f8fafc',
                padding: '16px 20px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
                lineHeight: '1.6'
              }}
            >
              <code>{getCodeSnippet()}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
