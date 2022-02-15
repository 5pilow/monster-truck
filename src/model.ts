import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class Model {

	static loader = new GLTFLoader();
	static CRATE: THREE.Group
	static TRUCK: THREE.Group
	static WHEEL: THREE.Group
	static GROUND: THREE.Group

	public static load() {
		Model.loader.load('public/model/crate.glb', function ( gltf ) {
			Model.CRATE = gltf.scene
			for (const child of Model.CRATE.children) {
				child.castShadow = true
				child.receiveShadow = true
			}
			Model.CRATE.scale.set(0.25, 0.25, 0.25)
		}, undefined, function ( error ) { console.error( error ); } );

		Model.loader.load('public/model/truck.glb', function ( gltf ) {
			Model.TRUCK = gltf.scene
		}, undefined, function ( error ) {
			console.error( error );
		} );

		Model.loader.load('public/model/wheel.glb', function ( gltf ) {
			Model.WHEEL = gltf.scene
		}, undefined, function ( error ) {
			console.error( error );
		} );

		Model.loader.load('public/model/ground.glb', function ( gltf ) {
			Model.GROUND = gltf.scene
		}, undefined, function ( error ) {
			console.error( error );
		} );
	}
}

export { Model }