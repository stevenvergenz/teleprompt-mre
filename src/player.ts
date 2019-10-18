import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import App from './app';
import { TimelineEvent } from './timeline';

export default class Player {
	private _playhead = 0;
	public get playhead() { return this._playhead; }
	private get timeline() { return this.app.timeline; }

	private animRoot: MRE.Actor;
	private lines: {
		current: MRE.Actor,
		next: MRE.Actor,
		prev: MRE.Actor
	};
	private updateTimeout: NodeJS.Timeout;

	public constructor(private app: App, root?: MRE.Actor) {
		const bgAssets = new MRE.AssetContainer(this.app.context);
		MRE.Actor.CreatePrimitive(bgAssets, {
			definition: {
				shape: MRE.PrimitiveShape.Box,
				dimensions: { x: 4, y: 0.6, z: 0.01 }
			},
			actor: {
				name: 'textBg',
				parentId: root && root.id,
				appearance: {
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
		} else {
			evt = arg;
			this._playhead = evt.time;
		}

		console.log(`text: "${evt.line}", next: "${evt.next && evt.next.line}", prev: "${evt.prev && evt.prev.line}"`);
		this.lines.current.text.contents = evt.line;

		if (evt.prev) {
			this.lines.prev.text.contents = evt.prev.line;
		} else {
			this.lines.prev.text.contents = '';
		}

		if (evt.next) {
			this.lines.next.text.contents = evt.next.line;
			console.log('setting timeout for', evt.next.time - this.playhead);
			this.updateTimeout = setTimeout(
				() => this.play(evt.next),
				(evt.next.time - this.playhead) * 1000
			);
		} else {
			this.lines.next.text.contents = '';
		}
	}

	public pause(): void {
		clearTimeout(this.updateTimeout);
	}
}
