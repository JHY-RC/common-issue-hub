import { one, rows, run } from '../database/connection.js';

export const fixRepository = {
  listWithDetails: () => rows(`SELECT f.*, v.name version_name, v.branch_name, i.product_id FROM issue_fixes f JOIN versions v ON v.id=f.version_id JOIN issues i ON i.id=f.issue_id ORDER BY f.id`),
  listByIssue: issueId => rows(`SELECT f.*, v.name version_name, v.branch_name FROM issue_fixes f JOIN versions v ON v.id=f.version_id WHERE f.issue_id=? ORDER BY f.id`, [issueId]),
  create: values => run('INSERT INTO issue_fixes(issue_id,version_id,note) VALUES(?,?,?)', values),
  remove: id => run('DELETE FROM issue_fixes WHERE id=?', [id]),
  versionCount: id => one('SELECT COUNT(*) count FROM issue_fixes WHERE version_id=?', [id]).count
};
