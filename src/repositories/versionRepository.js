import { one, rows, run } from '../database/connection.js';

export const versionRepository = {
  listWithNames: () => rows(`SELECT v.*, p.name product_name, pv.name parent_name FROM versions v JOIN products p ON p.id=v.product_id LEFT JOIN versions pv ON pv.id=v.parent_id ORDER BY v.id`),
  listByProduct: productId => rows('SELECT * FROM versions WHERE product_id=? ORDER BY id', [productId]),
  find: id => one('SELECT * FROM versions WHERE id=?', [id]),
  create: values => run('INSERT INTO versions(product_id,name,parent_id,note,branch_name) VALUES(?,?,?,?,?)', values),
  update: values => run('UPDATE versions SET name=?,parent_id=?,branch_name=?,note=? WHERE id=?', values),
  remove: id => run('DELETE FROM versions WHERE id=?', [id]),
  childCount: id => one('SELECT COUNT(*) count FROM versions WHERE parent_id=?', [id]).count,
  occurrenceCount: id => one('SELECT COUNT(*) count FROM issues WHERE occurrence_version_id=?', [id]).count
};
