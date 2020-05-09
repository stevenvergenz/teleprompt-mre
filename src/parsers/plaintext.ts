import { TimelineEvent } from '../timeline';

const timePerWord = 0.4;
const timePerPunctuation = 0.1;
const lineLength = 40;

export default function loadPlaintext(contents: string) {
	const words = contents.split(/\s+/);

	let runtime = 0;
	let timeline: TimelineEvent[] = [];
	let line = '';
	let lineDuration = 0;
	let lastEvent: TimelineEvent;
	for (const word of words) {
		if (line.length + word.length + 1 >= lineLength) {
			const newEvent = { time: runtime, line } as TimelineEvent;
			timeline.push(newEvent);
			runtime += lineDuration;
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

	const newEvent = { time: runtime, line } as TimelineEvent;
	timeline.push(newEvent);
	runtime += lineDuration;
	if (lastEvent) {
		newEvent.prev = lastEvent;
		lastEvent.next = newEvent;
	}

	return timeline;
}
