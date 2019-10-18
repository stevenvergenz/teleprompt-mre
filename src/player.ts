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
		this.animRoot = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'animRoot',
				parentId: root && root.id
			}
		});

		const textTemplate: Partial<MRE.TextLike> = {
			anchor: MRE.TextAnchorLocation.MiddleCenter,
			justify: MRE.TextJustify.Center,
			height: 0.3
		};
		this.lines = {
			next: MRE.Actor.Create(this.app.context, {
				actor: {
					name: 'nextLine',
					parentId: this.animRoot.id,
					transform: { local: { position: { y: 0.4 } } },
					text: textTemplate
				}
			}),
			current: MRE.Actor.Create(this.app.context, {
				actor: {
					name: 'currentLine',
					parentId: this.animRoot.id,
					text: textTemplate
				}
			}),
			prev: MRE.Actor.Create(this.app.context, {
				actor: {
					name: 'prevLine',
					parentId: this.animRoot.id,
					transform: { local: { position: { y: -0.4 } } },
					text: textTemplate
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

		this.lines.current.text.contents = evt.line;

		if (evt.prev) {
			this.lines.prev.text.contents = evt.prev.line;
		} else {
			this.lines.prev.text.contents = '';
		}

		if (evt.next) {
			this.lines.next.text.contents = evt.next.line;
			this.updateTimeout = setTimeout(
				() => this.play(evt.next),
				evt.next.time - this.playhead
			);
		} else {
			this.lines.next.text.contents = '';
		}
	}

	public pause(): void {
		clearTimeout(this.updateTimeout);
	}
}
