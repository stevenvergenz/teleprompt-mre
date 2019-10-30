import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import App from './app';

export default class Controls {
	private assets: MRE.AssetContainer;
	private speedLabel: MRE.Text;
	private timeLabel: MRE.Text;
	private get player() { return this.app.player; }


	public constructor(private app: App) {
		this.assets = new MRE.AssetContainer(this.app.context);
		this.buildControls().catch(err => console.error(err));
	}

	private async buildControls() {
		await this.assets.loadGltf(`${this.app.baseUrl}/controls.gltf`, 'box');
		const root = MRE.Actor.CreateFromPrefab(this.app.context, {
			prefab: this.assets.prefabs[0],
			actor: {
				transform: {
					local: {
						position: { x: 2.4 },
						rotation: MRE.Quaternion.FromEulerAngles(0, Math.PI, 0),
						scale: { x: 1.5, y: 1.5, z: 1.5 }
					}
				}
			}
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
		this.speedLabel = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'label',
				parentId: speed.id,
				transform: { local: { rotation: MRE.Quaternion.FromEulerAngles(0, Math.PI, 0) } },
				text: {
					contents: this.formatPercent(this.player.speedMultiplier),
					height: 0.07,
					anchor: MRE.TextAnchorLocation.MiddleCenter
				}
			}
		}).text;
		this.timeLabel = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'label',
				parentId: skip.id,
				transform: { local: { rotation: MRE.Quaternion.FromEulerAngles(0, Math.PI, 0) } },
				text: {
					contents: this.formatTime(this.player.playhead),
					height: 0.07,
					anchor: MRE.TextAnchorLocation.MiddleCenter
				}
			}
		}).text;
		setInterval(() => {
			console.log('updating time label');
			this.timeLabel.contents = this.formatTime(this.player.playhead);
		}, 250);

		// add play/pause handler
		this.addBehavior(playPause, this.assets.materials.find(m => m.name === 'PlayPause'), () => {
			if (this.player.isPlaying) {
				this.player.pause();
			} else {
				this.player.play();
			}
		});

		// add speed button handlers
		this.addBehavior(speedUp, this.assets.materials.find(m => m.name === 'SpeedUp'), () => {
			this.player.speedMultiplier += 0.05;
			this.speedLabel.contents = this.formatPercent(this.player.speedMultiplier);
		});
		this.addBehavior(speedDown, this.assets.materials.find(m => m.name === 'SpeedDown'), () => {
			this.player.speedMultiplier -= 0.05;
			this.speedLabel.contents = this.formatPercent(this.player.speedMultiplier);
		});

		// add seek handlers
		this.addBehavior(skipForward, this.assets.materials.find(m => m.name === 'SkipForward'), () => {
			this.player.playhead += 5;
			this.timeLabel.contents = this.formatTime(this.player.playhead);
		});
		this.addBehavior(skipBack, this.assets.materials.find(m => m.name === 'SkipBack'), () => {
			this.player.playhead -= 5;
			this.timeLabel.contents = this.formatTime(this.player.playhead);
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
		let originalColor = material.color.clone();
		const highlightColor = MRE.Color3.Teal().toColor4(1);
		actor.setBehavior(MRE.ButtonBehavior)
			.onHover('enter', () => {
				material.color = highlightColor;
			})
			.onHover('exit', () => {
				material.color = originalColor;
			})
			.onClick(callback);
	}
}
