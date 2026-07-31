import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { PUBLIC_DIR } from './config.js';
import { handleApi } from './routes/apiRouter.js';
import { sendJson } from './utils/http.js';

const contentTypes = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8'};
export const createApp = () => http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      const handled = await handleApi(request, response, url);
      if (handled !== false) return;
      return sendJson(response, 404, {error: '接口不存在'});
    }
    const filePath = url.pathname === '/' ? join(PUBLIC_DIR, 'v2.html') : join(PUBLIC_DIR, url.pathname);
    if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath)) { response.writeHead(404); return response.end('未找到页面'); }
    response.writeHead(200, {'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream'});
    response.end(readFileSync(filePath));
  } catch (error) { sendJson(response, 400, {error: error.message || '操作失败'}); }
});
