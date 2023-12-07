import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class Model {

	static loader = new GLTFLoader();
	static CRATE: THREE.Group
	static TRUCK: THREE.Group
	static WHEEL: THREE.Group
	static GROUND: THREE.Group
	static TREE: THREE.Group
	static TREE2: THREE.Group
	static TREE3: THREE.Group
	static TREE4: THREE.Group
	static TREE5: THREE.Group
	static TREE6: THREE.Group
	static TREE7: THREE.Group
	static TREE8: THREE.Group
	static TREE9: THREE.Group
	static TREE10: THREE.Group
	static TREE11: THREE.Group
	static TREE12: THREE.Group

	public static async load() {
		// console.time()
		const crate = await Model.loader.loadAsync('model/crate.glb')
		Model.CRATE = crate.scene
		for (const child of Model.CRATE.children) {
			child.castShadow = true
			child.receiveShadow = true
		}
		Model.CRATE.scale.set(0.25, 0.25, 0.25)
		// console.log(crate)
		// console.timeEnd()

		// console.time()
		const truck = await Model.loader.loadAsync('model/truck.glb')
		Model.TRUCK = truck.scene
		// console.timeEnd()

		// console.time()
		const wheel = await Model.loader.loadAsync('model/wheel.glb')
		Model.WHEEL = wheel.scene
		// console.timeEnd()

		// console.time()
		const ground = await Model.loader.loadAsync('model/ground.glb')
		Model.GROUND = ground.scene
		// console.timeEnd()

		// console.time()
		const tree = await Model.loader.loadAsync('model/tree.glb')
		Model.TREE = tree.scene
		// console.timeEnd()

		// console.time()
		const tree10 = await Model.loader.loadAsync('model/tree10.glb')
		Model.TREE10 = tree10.scene
		// console.timeEnd()

		// console.time()
		const tree11 = await Model.loader.loadAsync('model/tree11.glb')
		Model.TREE11 = tree11.scene
		// console.timeEnd()

		// console.time()
		const tree12 = await Model.loader.loadAsync('model/tree12.glb')
		Model.TREE12 = tree12.scene
		// console.timeEnd()
	}
}

export { Model }