import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import Player from './player';
import { Timeline } from './timeline';
import Controls from './controls';

export default class App {
	public timeline: Timeline;
	public player: Player;
	public controls: Controls;

	constructor(
		public context: MRE.Context,
		public params: MRE.ParameterSet,
		public baseUrl: string
	) {
		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.userJoined(user));
	}

	private started() {
		this.timeline = new Timeline();
		this.player = new Player(this);
		this.controls = new Controls(this);

		this.timeline.load(this.params.script as string || `file://${__dirname}/../public/declaration.txt`);
	}

	private userJoined(user: MRE.User) {

	}
}
