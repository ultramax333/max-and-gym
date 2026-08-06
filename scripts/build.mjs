import {build} from 'vite';
import viteConfig from '../vite.config.ts';

await build({...viteConfig, configFile: false});
