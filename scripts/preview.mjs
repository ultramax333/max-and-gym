import {preview} from 'vite';
import viteConfig from '../vite.config.ts';

const port = Number(process.argv[2] ?? process.env.PORT ?? 4173);
const server = await preview({...viteConfig, configFile: false, preview: {host: '127.0.0.1', port, strictPort: true}});
server.printUrls();
