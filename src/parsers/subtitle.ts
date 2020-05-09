import { parse, toMS, subTitleType } from 'subtitle';
import { TimelineEvent } from '../timeline';

export default function parseSubtitle(contents: string) {
	const srtLines = parse(contents);
	const timeline: TimelineEvent[] = [];

	let prevLine: TimelineEvent;
	let prevSrtLine: subTitleType;

	for (const srtLine of srtLines) {
		let lineStart = 0;
		if (typeof(srtLine.start) === 'string') {
			lineStart = toMS(srtLine.start) / 1000;
		} else {
			lineStart = srtLine.start / 1000;
		}

		let prevLineEnd = 0;
		if (prevSrtLine) {
			if (typeof(prevSrtLine.end) === 'string') {
				prevLineEnd = toMS(prevSrtLine.end) / 1000;
			} else {
				prevLineEnd = prevSrtLine.end / 1000;
			}
		}

		if (prevLineEnd < lineStart) {
			const gapLine: TimelineEvent = {
				line: "---",
				time: prevLineEnd,
				prev: prevLine
			};
			if (prevLine) {
				prevLine.next = gapLine;
			}
			timeline.push(gapLine);
			prevLine = gapLine;
		}

		const curLine: TimelineEvent = {
			line: srtLine.text,
			time: lineStart,
			prev: prevLine
		};
		if (prevLine) {
			prevLine.next = curLine;
		}

		timeline.push(curLine);
		prevLine = curLine;
		prevSrtLine = srtLine;
	}

	return timeline;
}
