import { issueRepository } from '../repositories/issueRepository.js';
import { fixRepository } from '../repositories/fixRepository.js';
import { versionRepository } from '../repositories/versionRepository.js';
import { versionService } from './versionService.js';
import { compareVersionNames } from '../utils/versionOrder.js';

const latestByBranch = versions => {
  const result = new Map();
  for (const version of versions) {
    const hasNewerOnSameBranch = versions.some(candidate => candidate.parent_id === version.id && candidate.branch_name === version.branch_name);
    if (!hasNewerOnSameBranch) result.set(version.branch_name, version);
  }
  return result;
};

export const assessmentService = {
  assess: targetVersionId => {
    const target = versionRepository.find(targetVersionId);
    if (!target) throw new Error('目标版本不存在');
    const ancestry = new Set(versionService.ancestors(targetVersionId));
    const versions = versionRepository.listByProduct(target.product_id);
    const currentBranchHeads = latestByBranch(versions);
    const items = [];
    for (const issue of issueRepository.listByProduct(target.product_id)) {
      if (!issue.occurrence_version_id) continue;
      const compared = compareVersionNames(target.name, issue.occurrence_version_name);
      if (!ancestry.has(issue.occurrence_version_id) && (compared === null || compared < 0)) continue;
      const fixes = fixRepository.listByIssue(issue.id);
      const effectiveFix = fixes.find(fix => ancestry.has(fix.version_id)) ?? null;
      items.push({...issue, resolved: Boolean(effectiveFix), effective_fix: effectiveFix, fix_locations: fixes.map(fix => ({...fix, latest_version_name: currentBranchHeads.get(fix.branch_name)?.name ?? fix.version_name, effective_for_target: ancestry.has(fix.version_id)}))});
    }
    return {target, items, summary: {unresolvedProblems: items.filter(item => item.category === '共性问题' && !item.resolved).length, pendingRequirements: items.filter(item => item.category === '共性需求' && !item.resolved).length, resolved: items.filter(item => item.resolved).length, total: items.length}};
  }
};
