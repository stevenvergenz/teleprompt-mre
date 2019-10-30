import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import App from './app';

export default class Controls {
	private assets: MRE.AssetContainer;

	private get player() { return this.app.player; }

	public constructor(private app: App, actorDef?: Partial<MRE.ActorLike>) {
		this.assets = new MRE.AssetContainer(this.app.context);
		this.buildControls(actorDef).catch(err => console.error(err));
	}

	private async buildControls(actorDef?: Partial<MRE.ActorLike>) {
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
		skip.enableText({
			contents: this.formatTime(this.player.playhead),
			height: 0.07,
			anchor: MRE.TextAnchorLocation.MiddleCenter
		});

		// add handlers
		this.addBehavior(playPause, this.assets.materials.find(m => m.name === 'PlayPause'), () => {
			if (this.player.isPlaying) {
				this.player.pause();
			} else {
				this.player.play();
			}
		});
	}

	private formatPercent(val: number) {
		return `${Math.round(val * 100)}%`;
	}

	private formatTime(time: number) {
		time = Math.floor(Math.max(0, time));
		const minutes = Math.floor(time / 60);
		const seconds = time % 60;
		return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
	}

	private addBehavior(actor: MRE.Actor, material: MRE.Material, callback: MRE.ActionHandler) {
		let originalColor: MRE.Color4;
		actor.setBehavior(MRE.ButtonBehavior)
			.onHover('enter', () => {
				originalColor = material.color;
				material.color = MRE.Color3.Teal().toColor4(1);
			})
			.onHover('exit', () => {
				material.color = originalColor;
			})
			.onClick(callback);
	}
}
