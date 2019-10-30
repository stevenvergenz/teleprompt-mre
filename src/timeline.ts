import { promisify } from 'util';
import { readFile } from 'fs';
const readFileP = promisify(readFile);
import { resolve } from 'path';

const timePerWord = 0.4;
const timePerPunctuation = 0.1;
const lineLength = 40;

export type TimelineEvent = {
	time: number;
	line: string;
	next?: TimelineEvent;
	prev?: TimelineEvent;
};

export class Timeline {
	private timeline: TimelineEvent[] = [];
	public runtime = 0;

	private _loaded: Promise<void>;
	private loadResolvedCallback: (value?: void | PromiseLike<void>) => void;
	private loadRejectedCallback: (reason?: any) => void;
	public get loaded() { return this._loaded; }

	public constructor() {
		this._loaded = new Promise<void>((resolve, reject) => {
			this.loadResolvedCallback = resolve;
			this.loadRejectedCallback = reject;
		});
	}

	public load(path: string) {
		this._load(path)
			.then(this.loadResolvedCallback)
			.catch(this.loadRejectedCallback);
		return this.loaded;
	}

	private async _load(path: string) {
		const rawScript = await readFileP(
			resolve(__dirname, path), { encoding: 'utf8' });
		const words = rawScript.split(/\s+/);

		let line = '';
		let lineDuration = 0;
		let lastEvent: TimelineEvent;
		for (const word of words) {
			if (line.length + word.length + 1 >= lineLength) {
				const newEvent = { time: this.runtime, line } as TimelineEvent;
				this.timeline.push(newEvent);
				this.runtime += lineDuration;
				if (lastEvent) {
					newEvent.prev = lastEvent;
					lastEvent.next = newEvent;
				}

				line = '';
				lineDuration = 0;
				lastEvent = newEvent;
			}

			line += line.length === 0 ? word : (' ' + word);
			lineDuration += timePerWord;

			if (/[.,;!?]/.test(word)) {
				lineDuration += timePerPunctuation;
			}
		}

		const newEvent = { time: this.runtime, line } as TimelineEvent;
		this.timeline.push(newEvent);
		this.runtime += lineDuration;
		if (lastEvent) {
			newEvent.prev = lastEvent;
			lastEvent.next = newEvent;
		}
	}

	public at(time: number) {
		function bsearch(arr: TimelineEvent[]): TimelineEvent {
			const mid = Math.floor(arr.length / 2);
			const midEvent = arr[mid];
			if (time >= midEvent.time && (arr.length <= (mid + 1) || arr[mid+1].time > time)) {
				return midEvent;
			} else if (time > midEvent.time) {
				return bsearch(arr.slice(mid+1));
			} else {
				return bsearch(arr.slice(0, mid));
			}
		}

		return bsearch(this.timeline);
	}
}
