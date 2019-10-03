import { promisify } from 'util';
import { readFile } from 'fs';
const readFileP = promisify(readFile);
import { resolve } from 'path';

const timePerWord = 0.5;
const timePerPunctuation = 0.2;
const lineLength = 30;

type TimelineEvent = {
	time: number;
	line: string;
	next?: TimelineEvent;
	prev?: TimelineEvent;
};

export default class Timeline {
	private timeline: TimelineEvent[] = [];
	public runtime = 0;

	public async load(path: string) {
		const rawScript = await readFileP(
			resolve(__dirname, '../public/test.md'), { encoding: 'utf8' });
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
			}

			line += line.length === 0 ? word : (' ' + word);
			lineDuration += timePerWord;

			if (/[.,;!?]/.test(word)) {
				lineDuration += timePerPunctuation;
			}
		}

		this.timeline.push({ time: this.runtime, line });
		this.runtime += lineDuration;
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
