import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import Player from './player';
import { Timeline } from './timeline';

export default class App {
	public timeline: Timeline;
	public player: Player;

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
		this.player = new Player(this);

		await this.timeline.load('../public/test.md');
		this.player.play(0);
	}

	private userJoined(user: MRE.User) {

	}
}
