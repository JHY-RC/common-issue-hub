import { one, rows, run } from '../database/connection.js';

export const productRepository = {
  list: () => rows('SELECT * FROM products ORDER BY id'),
  create: name => run('INSERT INTO products(name) VALUES(?)', [name]),
  update: (id, name) => run('UPDATE products SET name=? WHERE id=?', [name, id]),
  remove: id => run('DELETE FROM products WHERE id=?', [id]),
  dependencyCount: id => one(`SELECT (SELECT COUNT(*) FROM versions WHERE product_id=?) + (SELECT COUNT(*) FROM issues WHERE product_id=?) total`, [id, id]).total
};
