import { parse, toMS, subTitleType } from 'subtitle';
import { TimelineEvent } from '../timeline';

export default function parseSubtitle(contents: string) {
	const srtLines = parse(contents);
	const timeline: TimelineEvent[] = [];

	let prevLine: TimelineEvent;
	let prevSrtLine: subTitleType;

	for (const srtLine of srtLines) {
		const prevLineEnd = prevSrtLine ? toSeconds(prevSrtLine.end) : 0;
		const lineStart = toSeconds(srtLine.start);

		if (prevLineEnd < (lineStart - 1)) {
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

		const totalDuration = toSeconds(srtLine.end) - lineStart;
		let timingOffset = 0;
		for (const wrappedLine of wrapText(srtLine.text)) {
			const curLine: TimelineEvent = {
				line: wrappedLine,
				time: lineStart + timingOffset,
				prev: prevLine
			};
			if (prevLine) {
				prevLine.next = curLine;
			}
			timeline.push(curLine);
			prevLine = curLine;
			timingOffset += totalDuration * (wrappedLine.length + 1) / srtLine.text.length;
		}
		prevSrtLine = srtLine;
	}

	return timeline;
}

function wrapText(text: string): string[] {
	const wrapLength = 40;
	if (text.length <= wrapLength) {
		return [text.replace(/\s+/, ' ')];
	}

	const lines: string[] = [];
	let fitLine = "";
	for (const word of text.split(/\s+/)) {
		if (fitLine.length + word.length <= wrapLength) {
			fitLine += ` ${word}`;
		} else {
			lines.push(fitLine);
			fitLine = word;
		}
	}

	lines.push(fitLine);
	return lines;
}

function toSeconds(timestamp: string | number): number {
	if (typeof(timestamp) === 'string') {
		return toMS(timestamp) / 1000;
	} else {
		return timestamp / 1000;
	}
}
