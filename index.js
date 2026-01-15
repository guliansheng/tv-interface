/**
 * TV接口管理系统 - Cloudflare Worker
 * 功能：添加、删除、查询TV接口列表
 */

export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      const path = url.pathname;
  
      // 从环境变量获取访问码
      const ACCESS_CODE = env.ACCESS_CODE || 'default_code';
  
      // 解析路径，提取访问码
      const pathParts = path.split('/').filter(p => p);
  
      // 路由处理
      if (pathParts.length === 0) {
        return new Response('TV接口管理系统', { status: 200 });
      }
  
      // API路由: /api/{访问码}
      if (pathParts[0] === 'api' && pathParts.length === 2) {
        const code = pathParts[1];
        if (code !== ACCESS_CODE) {
          return jsonResponse({ error: '访问码错误' }, 403);
        }
        return await handleApiRequest(request, env);
      }
  
      // 管理页面路由: /{访问码}
      if (pathParts.length === 1) {
        const code = pathParts[0];
        if (code !== ACCESS_CODE) {
          return new Response('访问码错误', { status: 403 });
        }
        return htmlResponse(getAdminHTML(code));
      }
  
      return new Response('Not Found', { status: 404 });
    }
  };
  
  /**
   * 处理API请求
   */
  async function handleApiRequest(request, env) {
    const method = request.method;
  
    if (method === 'GET') {
      // 获取接口列表
      return await getUrlList(env);
    } else if (method === 'POST') {
      // 添加接口
      return await addUrl(request, env);
    } else if (method === 'DELETE') {
      // 删除接口
      return await deleteUrl(request, env);
    }
  
    return jsonResponse({ error: '不支持的请求方法' }, 405);
  }
  
  /**
   * 获取接口列表
   */
  async function getUrlList(env) {
    try {
      const data = await env.TV_KV.get('url_list', { type: 'json' });
      if (!data) {
        return jsonResponse({ urls: [] });
      }
      return jsonResponse(data);
    } catch (error) {
      return jsonResponse({ error: '获取列表失败', message: error.message }, 500);
    }
  }
  
  /**
   * 添加接口
   */
  async function addUrl(request, env) {
    try {
      const body = await request.json();
      const { url, name } = body;
  
      if (!url || !name) {
        return jsonResponse({ error: '缺少必要参数：url 和 name' }, 400);
      }
  
      // 获取现有列表
      let data = await env.TV_KV.get('url_list', { type: 'json' });
      if (!data) {
        data = { urls: [] };
      }
  
      // 添加新接口（包含添加时间）
      const newUrl = {
        url,
        name,
        addedAt: new Date().toISOString()
      };
  
      data.urls.push(newUrl);
  
      // 保存到KV
      await env.TV_KV.put('url_list', JSON.stringify(data));
  
      return jsonResponse({ success: true, data: newUrl });
    } catch (error) {
      return jsonResponse({ error: '添加失败', message: error.message }, 500);
    }
  }
  
  /**
   * 删除接口
   */
  async function deleteUrl(request, env) {
    try {
      const body = await request.json();
      const { url } = body;
  
      if (!url) {
        return jsonResponse({ error: '缺少必要参数：url' }, 400);
      }
  
      // 获取现有列表
      let data = await env.TV_KV.get('url_list', { type: 'json' });
      if (!data || !data.urls) {
        return jsonResponse({ error: '列表为空' }, 404);
      }
  
      // 删除指定URL
      const originalLength = data.urls.length;
      data.urls = data.urls.filter(item => item.url !== url);
  
      if (data.urls.length === originalLength) {
        return jsonResponse({ error: '未找到该接口' }, 404);
      }
  
      // 保存到KV
      await env.TV_KV.put('url_list', JSON.stringify(data));
  
      return jsonResponse({ success: true, message: '删除成功' });
    } catch (error) {
      return jsonResponse({ error: '删除失败', message: error.message }, 500);
    }
  }
  
  /**
   * 返回JSON响应
   */
  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data, null, 2), {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  /**
   * 返回HTML响应
   */
  function htmlResponse(html) {
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }
  
  /**
   * 管理页面HTML
   */
  function getAdminHTML(accessCode) {
    return `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TV接口管理系统</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 20px;
          }
          .container {
              max-width: 1000px;
              margin: 0 auto;
          }
          .header {
              text-align: center;
              color: white;
              margin-bottom: 30px;
          }
          .header h1 {
              font-size: 2.5em;
              margin-bottom: 10px;
          }
          .card {
              background: white;
              border-radius: 10px;
              padding: 25px;
              margin-bottom: 20px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }
          .form-group {
              margin-bottom: 15px;
          }
          .form-group label {
              display: block;
              margin-bottom: 5px;
              font-weight: 600;
              color: #333;
          }
          .form-group input {
              width: 100%;
              padding: 10px;
              border: 2px solid #e0e0e0;
              border-radius: 5px;
              font-size: 14px;
              transition: border-color 0.3s;
          }
          .form-group input:focus {
              outline: none;
              border-color: #667eea;
          }
          .btn {
              padding: 10px 20px;
              border: none;
              border-radius: 5px;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.3s;
              font-weight: 600;
          }
          .btn-primary {
              background: #667eea;
              color: white;
          }
          .btn-primary:hover {
              background: #5568d3;
              transform: translateY(-2px);
              box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
          }
          .btn-danger {
              background: #f56565;
              color: white;
              padding: 5px 10px;
              font-size: 12px;
          }
          .btn-danger:hover {
              background: #e53e3e;
          }
          .url-list {
              margin-top: 20px;
          }
          .url-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 15px;
              border: 2px solid #e0e0e0;
              border-radius: 5px;
              margin-bottom: 10px;
              transition: all 0.3s;
          }
          .url-item:hover {
              border-color: #667eea;
              box-shadow: 0 3px 10px rgba(102, 126, 234, 0.2);
          }
          .url-info {
              flex: 1;
          }
          .url-name {
              font-weight: 600;
              color: #333;
              margin-bottom: 5px;
          }
          .url-link {
              color: #667eea;
              font-size: 14px;
              word-break: break-all;
          }
          .url-time {
              color: #999;
              font-size: 12px;
              margin-top: 5px;
          }
          .empty-state {
              text-align: center;
              padding: 40px;
              color: #999;
          }
          .api-info {
              background: #f7fafc;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
          }
          .api-info h3 {
              margin-bottom: 10px;
              color: #333;
          }
          .api-info code {
              background: #e2e8f0;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 13px;
              word-break: break-all;
          }
          .message {
              padding: 10px;
              border-radius: 5px;
              margin-bottom: 15px;
              display: none;
          }
          .message.success {
              background: #c6f6d5;
              color: #22543d;
              border: 1px solid #9ae6b4;
          }
          .message.error {
              background: #fed7d7;
              color: #742a2a;
              border: 1px solid #fc8181;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>📺 TV接口管理系统</h1>
              <p>轻松管理您的TV接口列表</p>
          </div>
  
          <div class="card">
              <h2>添加新接口</h2>
              <div id="message" class="message"></div>
              <form id="addForm">
                  <div class="form-group">
                      <label for="name">接口名称</label>
                      <input type="text" id="name" placeholder="接口名称" required>
                  </div>
                  <div class="form-group">
                      <label for="url">接口地址</label>
                      <input type="url" id="url" placeholder="https://example.com/api.json" required>
                  </div>
                  <button type="submit" class="btn btn-primary">添加接口</button>
              </form>
          </div>
  
          <div class="card">
              <h2>接口列表</h2>
              <div id="urlList" class="url-list">
                  <div class="empty-state">加载中...</div>
              </div>
          </div>
  
          <div class="card">
              <div class="api-info">
                  <h3>API 访问地址</h3>
                  <p>通过以下地址获取接口列表（JSON格式）：</p>
                  <p style="margin-top: 10px;"><code id="apiUrl"></code></p>
              </div>
          </div>
      </div>
  
      <script>
          const accessCode = '${accessCode}';
          const apiBase = window.location.origin + '/api/' + accessCode;
  
          // 显示API地址
          document.getElementById('apiUrl').textContent = apiBase;
  
          // 显示消息
          function showMessage(text, type) {
              const msg = document.getElementById('message');
              msg.textContent = text;
              msg.className = 'message ' + type;
              msg.style.display = 'block';
              setTimeout(() => {
                  msg.style.display = 'none';
              }, 3000);
          }
  
          // 格式化时间
          function formatTime(isoString) {
              if (!isoString) return '';
              const date = new Date(isoString);
              return date.toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
              });
          }
  
          // 加载接口列表
          async function loadUrls() {
              try {
                  const response = await fetch(apiBase);
                  const data = await response.json();
  
                  const listDiv = document.getElementById('urlList');
  
                  if (!data.urls || data.urls.length === 0) {
                      listDiv.innerHTML = '<div class="empty-state">暂无接口，请添加</div>';
                      return;
                  }
  
                  listDiv.innerHTML = data.urls.map(item => \`
                      <div class="url-item">
                          <div class="url-info">
                              <div class="url-name">\${item.name}</div>
                              <div class="url-link">\${item.url}</div>
                              <div class="url-time">添加时间：\${formatTime(item.addedAt)}</div>
                          </div>
                          <button class="btn btn-danger" onclick="deleteUrl('\${item.url}')">删除</button>
                      </div>
                  \`).join('');
              } catch (error) {
                  console.error('加载失败:', error);
                  showMessage('加载列表失败', 'error');
              }
          }
  
          // 添加接口
          document.getElementById('addForm').addEventListener('submit', async (e) => {
              e.preventDefault();
  
              const name = document.getElementById('name').value;
              const url = document.getElementById('url').value;
  
              try {
                  const response = await fetch(apiBase, {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ name, url })
                  });
  
                  const result = await response.json();
  
                  if (result.success) {
                      showMessage('添加成功', 'success');
                      document.getElementById('addForm').reset();
                      loadUrls();
                  } else {
                      showMessage(result.error || '添加失败', 'error');
                  }
              } catch (error) {
                  console.error('添加失败:', error);
                  showMessage('添加失败', 'error');
              }
          });
  
          // 删除接口
          async function deleteUrl(url) {
              if (!confirm('确定要删除这个接口吗？')) {
                  return;
              }
  
              try {
                  const response = await fetch(apiBase, {
                      method: 'DELETE',
                      headers: {
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ url })
                  });
  
                  const result = await response.json();
  
                  if (result.success) {
                      showMessage('删除成功', 'success');
                      loadUrls();
                  } else {
                      showMessage(result.error || '删除失败', 'error');
                  }
              } catch (error) {
                  console.error('删除失败:', error);
                  showMessage('删除失败', 'error');
              }
          }
  
          // 页面加载时获取列表
          loadUrls();
      </script>
  </body>
  </html>`;
  }
  