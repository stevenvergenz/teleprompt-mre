import { promisify } from 'util';
import { readFile as fsReadFile, writeFile as fsWriteFile, unlink as fsUnlink } from 'fs';
import path from 'path';
import GLTF from './gltf';
const [readFile, writeFile, unlinkFile] = [promisify(fsReadFile), promisify(fsWriteFile), promisify(fsUnlink)];

async function convertToDataUrl(filename: string): Promise<string> {
	const data = await readFile(filename);
	return 'data:application/octet-stream;base64,' + data.toString('base64');
}

async function postprocessControls(filename: string) {
	// read JSON
	const gltfFile = path.resolve(process.cwd(), filename);
	const strData = await readFile(gltfFile, { encoding: 'utf8' });
	const gltf = JSON.parse(strData) as GLTF.GlTf;

	// rewrite texture references
	gltf.textures = gltf.textures.slice(0, 1);
	for (const mat of gltf.materials) {
		mat.pbrMetallicRoughness.baseColorTexture.index = 0;
	}

	// pack binary data
	const binFile = path.resolve(path.dirname(gltfFile), gltf.buffers[0].uri)
	gltf.buffers[0].uri = await convertToDataUrl(binFile);
	await unlinkFile(binFile);

	// output result
	await writeFile(gltfFile, JSON.stringify(gltf));
}

async function main(args: string[]) {
	switch (args[2]) {
		case 'postprocess-controls':
		case 'ppc':
			await postprocessControls(args[3]);
			break;
		default:
			console.log('Unexpected argument:', args[2]);
			break;
	}
}

main(process.argv).catch(ex => {
	console.error(ex);
	process.exit(1);
});
