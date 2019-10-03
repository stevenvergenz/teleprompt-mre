import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import Timeline from './timeline';

export default class App {
	public timeline: Timeline;

	constructor(
		public context: MRE.Context,
		public params: MRE.ParameterSet,
		public baseUrl: string
	) {
		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.userJoined(user));
	}

	private async started() {
		this.timeline = new Timeline();
		await this.timeline.load('../public/test.md');
	}

	private userJoined(user: MRE.User) {

	}
}
