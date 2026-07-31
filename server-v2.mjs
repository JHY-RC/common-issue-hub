import { createApp } from './src/app.js';
import { PORT } from './src/config.js';

const server = createApp();
server.listen(PORT, '0.0.0.0', () => console.log(`共性问题平台 V2 已启动：http://0.0.0.0:${PORT}`));
