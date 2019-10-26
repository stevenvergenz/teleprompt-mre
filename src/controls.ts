import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import App from './app';

export default class Controls {
	private assets: MRE.AssetContainer;

	public constructor(private app: App, root?: MRE.Actor) {
		this.assets = new MRE.AssetContainer(this.app.context);

		this.assets.loadGltf(`${this.app.baseUrl}/controls.gltf`, 'box')
		.then(() => {
			MRE.Actor.CreateFromPrefab(this.app.context, {
				prefab: this.assets.prefabs[0],
				actor: {
					parentId: root.id
				}
			})
		});
	}
}
