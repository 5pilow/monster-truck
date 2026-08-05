import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class Model {

	static loader = new GLTFLoader();
	static CRATE: THREE.Group
	static TRUCK: THREE.Group
	static WHEEL: THREE.Group
	static GROUND: THREE.Group
	static TREE10: THREE.Group
	static TREE11: THREE.Group
	static TREE12: THREE.Group

	public static async load() {

		// Les modèles étaient chargés les uns après les autres : chaque requête attendait
		// la fin de la précédente, si bien que le temps de chargement était la somme des
		// huit allers-retours. En parallèle, c'est le plus lent qui donne le tempo.
		// (tree.glb était chargé ici sans être utilisé nulle part : 7,6 Mo pour rien.)
		const [crate, truck, wheel, ground, tree10, tree11, tree12] = await Promise.all([
			Model.loader.loadAsync('/model/crate.glb'),
			Model.loader.loadAsync('/model/truck.glb'),
			Model.loader.loadAsync('/model/wheel.glb'),
			Model.loader.loadAsync('/model/ground.glb'),
			Model.loader.loadAsync('/model/tree10.glb'),
			Model.loader.loadAsync('/model/tree11.glb'),
			Model.loader.loadAsync('/model/tree12.glb'),
		])

		Model.CRATE = crate.scene
		for (const child of Model.CRATE.children) {
			child.castShadow = true
			child.receiveShadow = true
		}
		// La caisse (Kenney/Quaternius, CC0) est déjà exportée à la bonne taille
		// (cube de 1,2, centré sur l'origine), qui correspond au « size » du pavé
		// physique dans addBoxes() — aucune mise à l'échelle nécessaire.
		Model.CRATE.scale.set(1, 1, 1)

		Model.TRUCK = truck.scene
		Model.WHEEL = wheel.scene
		Model.GROUND = ground.scene
		Model.TREE10 = tree10.scene
		Model.TREE11 = tree11.scene
		Model.TREE12 = tree12.scene
	}
}

export { Model }
