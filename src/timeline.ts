import { URL } from 'url';
import { promisify } from 'util';
import { readFile } from 'fs';
const readFileP = promisify(readFile);
import { extname } from 'path';
import fetch from 'node-fetch';

import plaintextParser from './parsers/plaintext';
import srtParser from './parsers/subtitle';

export type TimelineEvent = {
	time: number;
	line: string;
	next?: TimelineEvent;
	prev?: TimelineEvent;
};

export type TimelineParser = (content: string) => TimelineEvent[];

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

	public load(uri: string) {
		this._load(uri)
			.then(() => this.loadResolvedCallback())
			.catch(this.loadRejectedCallback);
		return this.loaded;
	}

	private async _load(uri: string) {
		const url = new URL(uri);
		let contents: string;
		switch (url.protocol) {
			case 'file:':
				contents = await readFileP(uri.slice(7), { encoding: 'utf8' });
				break;
			case 'http:':
			case 'https:':
				contents = await (await fetch(url)).text();
				break;
			default:
				throw new Error(`Don't know how to load ${uri}`);
		}

		let parser: TimelineParser;
		switch (extname(url.pathname)) {
			case '.srt':
			case '.vtt':
				parser = srtParser;
				break;
			default:
				parser = plaintextParser;
				break;
		}
		
		this.timeline = parser(contents);
		this.runtime = this.timeline[this.timeline.length - 1].time;
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
