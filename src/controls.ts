import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import App from './app';

export default class Controls {
	private assets: MRE.AssetContainer;

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
		MRE.Actor.Create(this.app.context, {
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
		});
		MRE.Actor.Create(this.app.context, {
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
