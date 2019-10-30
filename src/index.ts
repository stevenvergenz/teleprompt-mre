import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { resolve } from 'path';

import App from './app';

const webhost = new MRE.WebHost({
	baseDir: resolve(__dirname, '../public')
});

webhost.adapter.onConnection((context, params) => new App(context, params, webhost.baseUrl));

export default webhost;
