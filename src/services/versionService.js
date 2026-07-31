import { versionRepository } from '../repositories/versionRepository.js';
import { required, toId } from '../utils/validation.js';

const ancestryFor = versionId => {
  const result = [];
  const seen = new Set();
  let current = versionRepository.find(versionId);
  while (current && !seen.has(current.id)) {
    result.push(current.id);
    seen.add(current.id);
    current = current.parent_id ? versionRepository.find(current.parent_id) : null;
  }
  return result;
};

const validateParent = (productId, parentId, recordId = null) => {
  if (!parentId) return;
  if (parentId === recordId) throw new Error('版本不能以自身作为父版本');
  const parent = versionRepository.find(parentId);
  if (!parent || parent.product_id !== productId) throw new Error('父版本不属于该产品');
  if (recordId && ancestryFor(parentId).includes(recordId)) throw new Error('该设置会形成循环版本关系');
};

export const versionService = {
  ancestors: ancestryFor,
  create: body => {
    const productId = toId(body.productId);
    const parentId = body.parentId ? toId(body.parentId) : null;
    validateParent(productId, parentId);
    return versionRepository.create([productId, required(body.name, '版本号'), parentId, String(body.note ?? '').trim(), required(body.branchName, '分支名称')]);
  },
  update: (recordId, body) => {
    const current = versionRepository.find(recordId);
    if (!current) throw new Error('版本不存在');
    const parentId = body.parentId ? toId(body.parentId) : null;
    validateParent(current.product_id, parentId, recordId);
    return versionRepository.update([required(body.name, '版本号'), parentId, required(body.branchName, '分支名称'), String(body.note ?? '').trim(), recordId]);
  }
};
