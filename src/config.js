import { join } from 'node:path';

export const ROOT_DIR = process.cwd();
export const DATA_DIR = join(ROOT_DIR, 'data');
export const PUBLIC_DIR = join(ROOT_DIR, 'public');
export const PORT = Number(process.env.COMMON_ISSUES_PORT || 4170);
