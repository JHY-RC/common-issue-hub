import { apiController } from '../controllers/apiController.js';
import { readJsonBody, sendCsv, sendJson } from '../utils/http.js';

const created = (response, result) => sendJson(response, 201, {id: Number(result.lastInsertRowid)});
const ok = response => sendJson(response, 200, {ok: true});

export async function handleApi(request, response, url) {
  const {method} = request;
  const {pathname} = url;
  if (method === 'GET' && pathname === '/api/v2/bootstrap') return sendJson(response, 200, apiController.bootstrap());
  if (method === 'GET' && pathname === '/api/v2/assessment') return sendJson(response, 200, apiController.assess(url.searchParams.get('versionId')));
  if (method === 'GET' && pathname === '/api/v2/export.csv') return sendCsv(response, 'version-issues-export.csv', apiController.exportCsv());
  if (method === 'POST' && pathname === '/api/v2/products') return created(response, apiController.createProduct(await readJsonBody(request)));
  if (method === 'POST' && pathname === '/api/v2/versions') return created(response, apiController.createVersion(await readJsonBody(request)));
  if (method === 'POST' && pathname === '/api/v2/issues') return created(response, apiController.createIssue(await readJsonBody(request)));
  if (method === 'POST' && pathname === '/api/v2/fixes') return created(response, apiController.createFix(await readJsonBody(request)));
  const match = pathname.match(/^\/api\/v2\/(products|versions|issues|fixes)\/(\d+)$/);
  if (!match) return false;
  const [, resource, id] = match;
  if (method === 'PUT') {
    const body = await readJsonBody(request);
    if (resource === 'products') apiController.updateProduct(id, body);
    if (resource === 'versions') apiController.updateVersion(id, body);
    if (resource === 'issues') apiController.updateIssue(id, body);
    return ok(response);
  }
  if (method === 'DELETE') {
    if (resource === 'products') apiController.deleteProduct(id);
    if (resource === 'versions') apiController.deleteVersion(id);
    if (resource === 'issues') apiController.deleteIssue(id);
    if (resource === 'fixes') apiController.deleteFix(id);
    return ok(response);
  }
  return false;
}
