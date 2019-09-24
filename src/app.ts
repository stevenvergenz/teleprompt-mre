import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import Timeline from './timeline';

export default class App {
	constructor(public context: MRE.Context, public params: MRE.ParameterSet, public baseUrl: string) {
		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.userJoined(user));
	}

	private async started() {
		// load script


		// process script
	}

	private userJoined(user: MRE.User) {

	}
}
