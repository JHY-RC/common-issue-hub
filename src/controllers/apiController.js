import { productRepository } from '../repositories/productRepository.js';
import { versionRepository } from '../repositories/versionRepository.js';
import { issueRepository } from '../repositories/issueRepository.js';
import { fixRepository } from '../repositories/fixRepository.js';
import { versionService } from '../services/versionService.js';
import { assessmentService } from '../services/assessmentService.js';
import { createCsv } from '../utils/csv.js';
import { required, toId } from '../utils/validation.js';

const sameProduct = (left, right, message) => {
  if (!left || !right || left.product_id !== right.product_id) throw new Error(message);
};

export const apiController = {
  bootstrap: () => ({products: productRepository.list(), versions: versionRepository.listWithNames(), issues: issueRepository.listWithOccurrence(), fixes: fixRepository.listWithDetails()}),
  assess: versionId => assessmentService.assess(toId(versionId)),
  exportCsv: () => createCsv([['软件产品','问题编号','类别','描述','发生/提出版本','发生分支','修复/实现版本','修复分支','备注'], ...issueRepository.exportRows().map(item => [item.product, item.issue_id, item.category, item.description, item.occurrence_version, item.occurrence_branch, item.fix_version, item.fix_branch, item.note])]),
  createProduct: body => productRepository.create(required(body.name, '产品名称')),
  updateProduct: (id, body) => productRepository.update(toId(id), required(body.name, '产品名称')),
  deleteProduct: id => { const recordId = toId(id); if (productRepository.dependencyCount(recordId)) throw new Error('该产品仍包含版本或问题，请先删除相关资料'); return productRepository.remove(recordId); },
  createVersion: body => versionService.create(body),
  updateVersion: (id, body) => versionService.update(toId(id), body),
  deleteVersion: id => { const recordId = toId(id); if (versionRepository.childCount(recordId) || versionRepository.occurrenceCount(recordId) || fixRepository.versionCount(recordId)) throw new Error('该版本仍被子版本、问题或修复记录引用，请先调整关联'); return versionRepository.remove(recordId); },
  createIssue: body => { const productId = toId(body.productId); const occurrenceVersionId = toId(body.occurrenceVersionId); sameProduct({product_id: productId}, versionRepository.find(occurrenceVersionId), '发生版本不属于该产品'); return issueRepository.create([productId, body.category === '共性需求' ? '共性需求' : '共性问题', required(body.description, '问题描述'), occurrenceVersionId]); },
  updateIssue: (id, body) => { const recordId = toId(id); const issue = issueRepository.find(recordId); const occurrenceVersionId = toId(body.occurrenceVersionId); sameProduct(issue, versionRepository.find(occurrenceVersionId), '发生版本不属于该产品'); return issueRepository.update([body.category === '共性需求' ? '共性需求' : '共性问题', required(body.description, '问题描述'), occurrenceVersionId, recordId]); },
  deleteIssue: id => issueRepository.remove(toId(id)),
  createFix: body => { const issue = issueRepository.find(toId(body.issueId)); const version = versionRepository.find(toId(body.versionId)); sameProduct(issue, version, '修复版本必须与问题属于同一产品'); return fixRepository.create([issue.id, version.id, String(body.note ?? '').trim()]); },
  deleteFix: id => fixRepository.remove(toId(id))
};
