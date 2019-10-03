import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import App from './app';

export default class Player {
	private _playhead = 0;
	public get playhead() { return this._playhead; }

	private get timeline() { return this.app.timeline; }

	public constructor(private app: App, private root: MRE.Actor) {

	}
}
