import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import App from './app';
import { TimelineEvent } from './timeline';

export default class Player {
	private _playhead = 0;
	/** The server timestamp when the current frame started */
	private _basisTime = 0;
	
	private animRoot: MRE.Actor;
	private lines: {
		current: MRE.Actor,
		next: MRE.Actor,
		prev: MRE.Actor
	};
	private updateTimeout: NodeJS.Timeout = null;
	private progressAnim: MRE.Animation;

	public get playhead() {
		let offset = 0;
		if (this._basisTime > 0) {
			offset = (Date.now() - this._basisTime) * this.speedMultiplier / 1000;
		}
		return this._playhead + offset;
	}
	public set playhead(val) {
		const wasPlaying = this.isPlaying;
		this.pause();
		this._playhead = Math.max(0, Math.min(this.timeline.runtime, val));
		if (wasPlaying) {
			this.play();
		} else {
			this.updateText(this.timeline.at(this._playhead));
		}
	}

	private _speedMultiplier = 1;
	public get speedMultiplier() { return this._speedMultiplier; }
	public set speedMultiplier(val) {
		const wasPlaying = this.isPlaying;
		this.pause();
		this._speedMultiplier = Math.max(0.25, Math.min(4, val));
		if (wasPlaying) {
			this.play();
		}
	}

	public get isPlaying() {
		return this.updateTimeout !== null && this._basisTime !== 0;
	}

	private get timeline() { return this.app.timeline; }

	public constructor(private app: App, root?: MRE.Actor) {
		const bgAssets = new MRE.AssetContainer(this.app.context);
		const bgBox = bgAssets.createBoxMesh('fullWidthBox', 4, 0.6, 0.01);
		MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'textBg',
				parentId: root && root.id,
				appearance: {
					meshId: bgBox.id,
					materialId: bgAssets.createMaterial('bgMat', {
						color: MRE.Color3.DarkGray().toColor4(0.5),
						alphaMode: MRE.AlphaMode.Blend
					}).id
				},
				transform: { local: { position: { z: 0.1 } } }
			}
		});
		this.animRoot = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'animRoot',
				parentId: root && root.id
			}
		});

		const textTemplate: Partial<MRE.TextLike> = {
			anchor: MRE.TextAnchorLocation.MiddleCenter,
			justify: MRE.TextJustify.Center,
			height: 0.2
		};
		const offLineColor = new MRE.Color3(0.7, 0.9, 1);
		this.lines = {
			prev: MRE.Actor.Create(this.app.context, {
				actor: {
					name: 'prevLine',
					parentId: this.animRoot.id,
					transform: { local: { position: { y: textTemplate.height } } },
					text: { ...textTemplate, height: textTemplate.height * 0.75, color: offLineColor }
				}
			}),
			current: MRE.Actor.Create(this.app.context, {
				actor: {
					name: 'currentLine',
					parentId: this.animRoot.id,
					text: textTemplate
				}
			}),
			next: MRE.Actor.Create(this.app.context, {
				actor: {
					name: 'nextLine',
					parentId: this.animRoot.id,
					transform: { local: { position: { y: -textTemplate.height } } },
					text: { ...textTemplate, height: textTemplate.height * 0.75, color: offLineColor }
				}
			})
		};

		const pBarStartSize = 0.02, pBarEndSize = 3.5;
		const pBarStartScale = pBarStartSize / pBarEndSize;
		const pBarStartPos = (pBarStartSize - pBarEndSize) / 2;
		const progressBar = MRE.Actor.Create(this.app.context, { actor: {
			name: "progressBar",
			parentId: this.animRoot.id,
			appearance: { meshId: bgAssets.createBoxMesh("progressBox", pBarEndSize, 0.015, 0.01).id },
			transform: {
				local: {
					position: { x: pBarStartPos, y: -textTemplate.height / 2 },
					scale: { x: pBarStartScale }
				}
			}
		}});

		const progressData = bgAssets.createAnimationData("progressData", { tracks: [{
			target: MRE.ActorPath("bar").transform.local.position.x,
			easing: MRE.AnimationEaseCurves.Linear,
			keyframes: [
				{ time: 0, value: pBarStartPos },
				{ time: 1, value: 0 }
			]
		}, {
			target: MRE.ActorPath("bar").transform.local.scale.x,
			easing: MRE.AnimationEaseCurves.Linear,
			keyframes: [
				{ time: 0, value: pBarStartScale },
				{ time: 1, value: 1 }
			]
		}]});
		progressData.bind({ bar: progressBar }, { wrapMode: MRE.AnimationWrapMode.Loop, speed: 0, isPlaying: true })
			.then(anim => this.progressAnim = anim)
			.catch(err => MRE.log.error("app", err));

		this.timeline.loaded
			.then(() => this.updateText(this.timeline.at(0)))
			.catch(err => MRE.log.error("app", err));
	}

	public play(): void;
	public play(time: number): void;
	public play(evt: TimelineEvent): void;
	public play(arg?: TimelineEvent | number) {
		let evt: TimelineEvent;
		if (arg === undefined) {
			evt = this.timeline.at(this.playhead);
		} else if (typeof arg === 'number') {
			evt = this.timeline.at(arg);
			this._playhead = arg;
		} else {
			evt = arg;
			this._playhead = evt.time;
		}
		this._basisTime = Date.now() - (this._playhead - evt.time) / this.speedMultiplier * 1000;

		this.updateText(evt);

		if (this.updateTimeout) {
			clearTimeout(this.updateTimeout);
			this.updateTimeout = null;
		}
		if (evt.next) {
			this.updateTimeout = setTimeout(
				() => this.play(evt.next),
				(evt.next.time - this._playhead) / this.speedMultiplier * 1000
			);

			if (this.progressAnim) {
				this.progressAnim.speed = this.speedMultiplier / (evt.next.time - evt.time);
				this.progressAnim.time = (this._playhead - evt.time) / (evt.next.time - evt.time);
			}
		} else {
			this._basisTime = 0;
			if (this.progressAnim) {
				this.progressAnim.speed = 0;
			}
		}
	}

	public pause(): void {
		clearTimeout(this.updateTimeout);
		this.updateTimeout = null;
		this._playhead = this.playhead;
		this._basisTime = 0;

		if (this.progressAnim) {
			this.progressAnim.speed = 0;
		}
	}

	private updateText(evt: TimelineEvent) {
		this.lines.current.text.contents = evt.line;

		if (evt.prev) {
			this.lines.prev.text.contents = evt.prev.line;
		} else {
			this.lines.prev.text.contents = '';
		}

		if (evt.next) {
			this.lines.next.text.contents = evt.next.line;
		} else {
			this.lines.next.text.contents = '';
		}
	}
}
