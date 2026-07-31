import { one, rows, run } from '../database/connection.js';

export const issueRepository = {
  listWithOccurrence: () => rows(`SELECT i.*, v.name occurrence_version_name, v.branch_name occurrence_branch_name FROM issues i LEFT JOIN versions v ON v.id=i.occurrence_version_id ORDER BY i.id DESC`),
  listByProduct: productId => rows(`SELECT i.*, ov.name occurrence_version_name, ov.branch_name occurrence_branch_name FROM issues i LEFT JOIN versions ov ON ov.id=i.occurrence_version_id WHERE i.product_id=? ORDER BY i.id DESC`, [productId]),
  find: id => one('SELECT * FROM issues WHERE id=?', [id]),
  create: values => run('INSERT INTO issues(product_id,category,description,occurrence_version_id) VALUES(?,?,?,?)', values),
  update: values => run('UPDATE issues SET category=?,description=?,occurrence_version_id=? WHERE id=?', values),
  remove: id => run('DELETE FROM issues WHERE id=?', [id]),
  exportRows: () => rows(`SELECT p.name product, i.id issue_id, i.category, i.description, ov.name occurrence_version, ov.branch_name occurrence_branch, fv.name fix_version, fv.branch_name fix_branch, f.note FROM issues i JOIN products p ON p.id=i.product_id LEFT JOIN versions ov ON ov.id=i.occurrence_version_id LEFT JOIN issue_fixes f ON f.issue_id=i.id LEFT JOIN versions fv ON fv.id=f.version_id ORDER BY i.id, f.id`)
};
