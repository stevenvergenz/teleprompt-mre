import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import App from './app';

export default class Controls {
	private assets: MRE.AssetContainer;

	public constructor(private app: App, root?: MRE.Actor) {
		this.assets = new MRE.AssetContainer(this.app.context);

		const playPause = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'playpause',
				parentId: root && root.id,
				text: {
					contents: '||>',
					height: 0.1,
					anchor: MRE.TextAnchorLocation.MiddleCenter
				},
				collider: {
					geometry: {
						shape: 'box',
						size: { x: 0.15, y: 0.1, z: 0.01 }
					}
				}
			}
		});
	}
}
