import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import App from './app';

export default class Controls {
	private assets: MRE.AssetContainer;

	private get player() { return this.app.player; }

	public constructor(private app: App, actorDef?: MRE.ActorLike) {
		this.assets = new MRE.AssetContainer(this.app.context);
		this.buildControls(actorDef).catch(err => console.error(err));
	}

	private async buildControls(actorDef: MRE.ActorLike) {
		await this.assets.loadGltf(`${this.app.baseUrl}/controls.gltf`, 'box');
		const root = MRE.Actor.CreateFromPrefab(this.app.context, {
			prefab: this.assets.prefabs[0],
			actor: actorDef
		});
		await root.created();

		// grab button references
		const playPause = root.findChildrenByName('PlayPause', false)[0];
		const speed = root.findChildrenByName('Speed', false)[0];
		const speedUp = speed.findChildrenByName('SpeedUp', false)[0];
		const speedDown = speed.findChildrenByName('SpeedDown', false)[0];
		const skip = root.findChildrenByName('Skip', false)[0];
		const skipBack = skip.findChildrenByName('SkipBack', false)[0];
		const skipForward = skip.findChildrenByName('SkipForward', false)[0];

		// add labels
		speed.enableText({
			contents: this.formatPercent(this.player.speedMultiplier),
			height: 0.07,
			anchor: MRE.TextAnchorLocation.MiddleCenter
		});
	}

	private formatPercent(val: number) {
		return `${Math.round(val * 100)}%`;
	}

	private formatTime(val: number) {

	}
}
