let data = {products: [], versions: [], issues: [], fixes: []};
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const html = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const versionsFor = productId => data.versions.filter(version => String(version.product_id) === String(productId));
const issuesFor = productId => data.issues.filter(issue => String(issue.product_id) === String(productId));
const fixesFor = issueId => data.fixes.filter(fix => fix.issue_id === issueId);
const itemById = (items, id) => items.find(item => item.id === Number(id));

async function request(url, options = {}) {
  const response = await fetch(url, {headers: {'Content-Type': 'application/json'}, ...options});
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || '操作失败');
  return result;
}
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2600);
}
function productOptions(selected = '') {
  return '<option value="">请选择产品</option>' + data.products.map(product =>
    `<option value="${product.id}" ${String(product.id) === String(selected) ? 'selected' : ''}>${html(product.name)}</option>`
  ).join('');
}
function versionOptions(productId, selected = '', excludedId = null) {
  return '<option value="">请选择版本</option>' + versionsFor(productId).filter(version => version.id !== excludedId).map(version =>
    `<option value="${version.id}" ${String(version.id) === String(selected) ? 'selected' : ''}>${html(version.name)} · ${html(version.branch_name)}</option>`
  ).join('');
}
function parentOptions(productId, selected = '', excludedId = null) {
  return '<option value="">无父版本（起点）</option>' + versionsFor(productId).filter(version => version.id !== excludedId).map(version =>
    `<option value="${version.id}" ${String(version.id) === String(selected) ? 'selected' : ''}>${html(version.name)} · ${html(version.branch_name)}</option>`
  ).join('');
}
async function reload() {
  data = await request('/api/v2/bootstrap');
  render();
}

function render() {
  const productSelectors = [
    '#assessment-product',
    '#version-form select[name=productId]',
    '#issue-form select[name=productId]'
  ];
  for (const selector of productSelectors) {
    const select = $(selector);
    const selected = select.value || data.products[0]?.id || '';
    select.innerHTML = productOptions(selected);
    if (selected) select.value = selected;
  }
  fillAssessmentVersions();
  fillVersionForm();
  fillIssueVersionOptions();
  renderProducts();
  renderBranches();
  renderIssues();
  renderBranchDatalist();
}

function renderProducts() {
  $('#product-list').innerHTML = data.products.map(product => `
    <div class="record-row">
      <div><strong>${html(product.name)}</strong><small>${versionsFor(product.id).length} 个版本</small></div>
      <div>
        <button class="text-action product-edit" data-id="${product.id}">改名</button>
        <button class="text-action danger product-delete" data-id="${product.id}">删除</button>
      </div>
    </div>
  `).join('') || '<div class="record-row"><small>尚未建立软件产品</small></div>';
  $$('.product-edit').forEach(button => button.addEventListener('click', () => editProduct(button.dataset.id)));
  $$('.product-delete').forEach(button => button.addEventListener('click', () => deleteRecord('products', button.dataset.id, '软件产品')));
}

function renderBranches() {
  const productId = $('#version-form select[name=productId]').value || data.products[0]?.id;
  const grouped = new Map();
  for (const version of versionsFor(productId)) {
    if (!grouped.has(version.branch_name)) grouped.set(version.branch_name, []);
    grouped.get(version.branch_name).push(version);
  }
  $('#branch-board').innerHTML = [...grouped.entries()].map(([branch, versions]) => {
    const latest = versions.filter(version =>
      !versions.some(candidate => candidate.parent_id === version.id)
    ).at(-1);
    return `
      <article class="branch-card">
        <div class="branch-card-head">
          <div><h3>${html(branch)}</h3><small>${versions.length} 个版本节点</small></div>
          <span class="latest-badge">最新 ${html(latest.name)}</span>
        </div>
        ${versions.map(version => `
          <div class="version-line">
            <strong>${html(version.name)}</strong>
            <small>来自 ${html(version.parent_name || '起点')}${version.note ? ` · ${html(version.note)}` : ''}</small>
            <div>
              <button class="text-action version-edit" data-id="${version.id}">编辑</button>
              <button class="text-action danger version-delete" data-id="${version.id}">删除</button>
            </div>
          </div>
        `).join('')}
      </article>
    `;
  }).join('') || '<div class="empty-state"><span>尚未建立版本</span><p>先新增一个起始版本，再从它创建主线或维护分支。</p></div>';
  $$('.version-edit').forEach(button => button.addEventListener('click', () => openVersionEdit(button.dataset.id)));
  $$('.version-delete').forEach(button => button.addEventListener('click', () => deleteRecord('versions', button.dataset.id, '版本')));
}

function renderIssues() {
  const productId = $('#issue-form select[name=productId]').value || data.products[0]?.id;
  const filter = $('#issue-filter').value;
  const all = issuesFor(productId);
  const list = filter === 'all' ? all : all.filter(issue => issue.category === filter);
  $('#issue-count').textContent = `${all.length} 条`;
  $('#issue-list').innerHTML = list.map(issue => {
    const fixes = fixesFor(issue.id);
    const isProblem = issue.category === '共性问题';
    return `
      <article class="issue-card">
        <div>
          <div class="issue-title">
            <span class="type-badge ${isProblem ? 'problem' : 'requirement'}">${html(issue.category)}</span>
            <p>${html(issue.description)}</p>
          </div>
          <div class="issue-meta">${isProblem ? '发生' : '提出'}于 ${html(issue.occurrence_version_name || '未设置')} · ${html(issue.occurrence_branch_name || '')}</div>
        </div>
        <div class="fixes">
          ${fixes.length ? fixes.map(fix => `
            <span class="fix-chip">${html(fix.branch_name)} · ${html(fix.version_name)}
              <button class="fix-delete" title="删除此修复记录" data-id="${fix.id}">×</button>
            </span>
          `).join('') : `<span class="no-fix">${isProblem ? '尚无修复版本' : '尚无实现版本'}</span>`}
        </div>
        <div class="issue-actions">
          <button class="button small add-fix" data-id="${issue.id}">${isProblem ? '+ 修复版本' : '+ 实现版本'}</button>
          <button class="button small secondary issue-edit" data-id="${issue.id}">编辑</button>
          <button class="button small danger issue-delete" data-id="${issue.id}">删除</button>
        </div>
      </article>
    `;
  }).join('') || '<div class="empty-state"><span>尚未录入共性事项</span><p>录入问题或需求，并指定它从哪个版本开始需要被跟踪。</p></div>';
  $$('.add-fix').forEach(button => button.addEventListener('click', () => openFixDialog(button.dataset.id)));
  $$('.issue-edit').forEach(button => button.addEventListener('click', () => openIssueEdit(button.dataset.id)));
  $$('.issue-delete').forEach(button => button.addEventListener('click', () => deleteRecord('issues', button.dataset.id, '共性事项')));
  $$('.fix-delete').forEach(button => button.addEventListener('click', () => deleteFix(button.dataset.id)));
}

function renderBranchDatalist() {
  const productId = $('#version-form select[name=productId]').value;
  const branches = [...new Set(versionsFor(productId).map(version => version.branch_name))];
  $('#branch-options').innerHTML = branches.map(branch => `<option value="${html(branch)}"></option>`).join('');
}
function fillAssessmentVersions() {
  const productId = $('#assessment-product').value;
  const select = $('#assessment-version');
  const selected = select.value;
  select.innerHTML = versionOptions(productId, selected);
}
function fillVersionForm() {
  const form = $('#version-form');
  form.parentId.innerHTML = parentOptions(form.productId.value, form.parentId.value);
  renderBranchDatalist();
}
function fillIssueVersionOptions() {
  const form = $('#issue-form');
  form.occurrenceVersionId.innerHTML = versionOptions(form.productId.value, form.occurrenceVersionId.value);
}

async function submitForm(form, url) {
  const body = Object.fromEntries(new FormData(form));
  await request(url, {method: 'POST', body: JSON.stringify(body)});
  form.reset();
  await reload();
  toast('已保存');
}

async function runAssessment() {
  const versionId = $('#assessment-version').value;
  if (!versionId) return toast('请先选择目标版本');
  try {
    const result = await request(`/api/v2/assessment?versionId=${versionId}`);
    renderAssessment(result);
  } catch (error) { toast(error.message); }
}
function renderAssessment(result) {
  const {summary, target, items} = result;
  $('#assessment-result').className = '';
  $('#assessment-result').innerHTML = `
    <div class="summary-grid">
      <div class="metric"><b>${summary.unresolvedProblems}</b><span>未修复共性问题</span></div>
      <div class="metric"><b>${summary.pendingRequirements}</b><span>未添加共性需求</span></div>
      <div class="metric"><b>${summary.resolved}</b><span>已进入该版本</span></div>
      <div class="metric"><b>${summary.total}</b><span>该版本涉及事项</span></div>
    </div>
    <div class="panel-title">
      <div><p class="eyebrow">ASSESSMENT RESULT</p><h2>${html(target.name)} · ${html(target.branch_name)}</h2></div>
      <span class="hint">早于发生版本的不纳入；只认定目标版本祖先链上的修复</span>
    </div>
    <table class="risk-table">
      <thead><tr><th>共性事项</th><th>发生 / 提出版本</th><th>当前判断</th><th>其他分支修复与最新版本</th></tr></thead>
      <tbody>
        ${items.map(item => {
          const otherFixes = item.fix_locations.filter(fix => !fix.effective_for_target);
          return `
            <tr>
              <td><span class="type-badge ${item.category === '共性问题' ? 'problem' : 'requirement'}">${html(item.category)}</span><div class="issue-meta">${html(item.description)}</div></td>
              <td><strong>${html(item.occurrence_version_name)}</strong><div class="issue-meta">${html(item.occurrence_branch_name)}</div></td>
              <td>${item.resolved
                ? `<span class="status-badge done">${item.category === '共性问题' ? '已修复' : '已实现'}</span><div class="issue-meta">${html(item.effective_fix.version_name)} · ${html(item.effective_fix.branch_name)}</div>`
                : `<span class="status-badge pending">${item.category === '共性问题' ? '未修复' : '未添加'}</span>`}
              </td>
              <td>${otherFixes.length
                ? otherFixes.map(fix => `<div class="cross-fix"><strong>${html(fix.branch_name)} ${html(fix.version_name)}</strong> 已处理；该分支最新为 ${html(fix.latest_version_name)}</div>`).join('')
                : '<span class="issue-meta">没有其他分支修复记录</span>'}
              </td>
            </tr>
          `;
        }).join('') || '<tr><td colspan="4">该版本暂未涉及任何已录入事项。</td></tr>'}
      </tbody>
    </table>
  `;
}

function editProduct(productId) {
  const product = itemById(data.products, productId);
  const name = prompt('修改软件产品名称', product.name);
  if (name === null || !name.trim()) return;
  request(`/api/v2/products/${product.id}`, {method: 'PUT', body: JSON.stringify({name})})
    .then(reload).then(() => toast('产品名称已修改')).catch(error => toast(error.message));
}
function openVersionEdit(versionId) {
  const version = itemById(data.versions, versionId);
  const form = $('#version-edit-form');
  form.elements.id.value = version.id;
  form.name.value = version.name;
  form.branchName.value = version.branch_name;
  form.parentId.innerHTML = parentOptions(version.product_id, version.parent_id, version.id);
  form.note.value = version.note || '';
  $('#version-dialog').showModal();
}
function openIssueEdit(issueId) {
  const issue = itemById(data.issues, issueId);
  const form = $('#issue-edit-form');
  form.elements.id.value = issue.id;
  form.category.value = issue.category;
  form.occurrenceVersionId.innerHTML = versionOptions(issue.product_id, issue.occurrence_version_id);
  form.description.value = issue.description;
  $('#issue-dialog').showModal();
}
function openFixDialog(issueId) {
  const issue = itemById(data.issues, issueId);
  const form = $('#fix-form');
  form.issueId.value = issue.id;
  form.versionId.innerHTML = versionOptions(issue.product_id);
  form.note.value = '';
  $('#fix-title').textContent = issue.category === '共性问题' ? '登记修复版本' : '登记实现版本';
  $('#fix-dialog').showModal();
}
async function deleteRecord(kind, recordId, label) {
  if (!confirm(`确定删除这条${label}吗？此操作无法恢复。`)) return;
  try {
    await request(`/api/v2/${kind}/${recordId}`, {method: 'DELETE'});
    await reload();
    toast('已删除');
  } catch (error) { toast(error.message); }
}
async function deleteFix(fixId) {
  if (!confirm('确定删除这条修复 / 实现记录吗？')) return;
  try {
    await request(`/api/v2/fixes/${fixId}`, {method: 'DELETE'});
    await reload();
    toast('修复记录已删除');
  } catch (error) { toast(error.message); }
}

const pageText = {
  assessment: ['迭代评估', '选择准备迭代的版本，立即查看尚未解决的共性事项。'],
  versions: ['版本与分支', '维护真实的版本来源关系，主线和并行分支互不误判。'],
  issues: ['问题与需求', '记录发生版本，并允许在多个分支分别登记修复或实现版本。']
};
function showView(view) {
  $$('.view').forEach(section => section.classList.toggle('active', section.id === view));
  $$('.nav').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  $('#page-title').textContent = pageText[view][0];
  $('#page-subtitle').textContent = pageText[view][1];
}

$$('.nav').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
$$('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('#assessment-product').addEventListener('change', fillAssessmentVersions);
$('#version-form select[name=productId]').addEventListener('change', () => { fillVersionForm(); renderBranches(); });
$('#issue-form select[name=productId]').addEventListener('change', () => { fillIssueVersionOptions(); renderIssues(); });
$('#issue-filter').addEventListener('change', renderIssues);
$('#run-assessment').addEventListener('click', runAssessment);
$('#product-form').addEventListener('submit', event => {
  event.preventDefault();
  submitForm(event.currentTarget, '/api/v2/products').catch(error => toast(error.message));
});
$('#version-form').addEventListener('submit', event => {
  event.preventDefault();
  submitForm(event.currentTarget, '/api/v2/versions').catch(error => toast(error.message));
});
$('#issue-form').addEventListener('submit', event => {
  event.preventDefault();
  submitForm(event.currentTarget, '/api/v2/issues').catch(error => toast(error.message));
});
$('#version-edit-form').addEventListener('submit', async event => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget));
  try {
    await request(`/api/v2/versions/${body.id}`, {method: 'PUT', body: JSON.stringify(body)});
    $('#version-dialog').close();
    await reload();
    toast('版本已修改');
  } catch (error) { toast(error.message); }
});
$('#issue-edit-form').addEventListener('submit', async event => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget));
  try {
    await request(`/api/v2/issues/${body.id}`, {method: 'PUT', body: JSON.stringify(body)});
    $('#issue-dialog').close();
    await reload();
    toast('共性事项已修改');
  } catch (error) { toast(error.message); }
});
$('#fix-form').addEventListener('submit', async event => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget));
  try {
    await request('/api/v2/fixes', {method: 'POST', body: JSON.stringify(body)});
    $('#fix-dialog').close();
    await reload();
    toast('修复版本已登记');
  } catch (error) { toast(error.message); }
});

reload().catch(error => toast(error.message));
