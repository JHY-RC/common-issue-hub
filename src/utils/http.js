export const sendJson = (response, status, value) => {
  response.writeHead(status, {'Content-Type': 'application/json; charset=utf-8'});
  response.end(JSON.stringify(value));
};

export const readJsonBody = request => new Promise((resolve, reject) => {
  let content = '';
  request.on('data', chunk => content += chunk);
  request.on('end', () => {
    try { resolve(content ? JSON.parse(content) : {}); }
    catch { reject(new Error('请求数据格式错误')); }
  });
});

export const sendCsv = (response, filename, content) => {
  response.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`
  });
  response.end(content);
};
