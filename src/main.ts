import './style.css'
import * as THREE from 'three'
import Ammo from 'ammojs-typed'

let game: Game

var Detector = {
	canvas: !!window.CanvasRenderingContext2D,
	webgl: (function () {
		try {
			var canvas = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
		} catch (e) {
			return false;
		}
	})(),
	workers: !!window.Worker,
	fileapi: window.File && window.FileReader && window.FileList && window.Blob,

	getWebGLErrorMessage: function () {
		var element = document.createElement('div');
		element.id = 'webgl-error-message';
		element.style.fontFamily = 'monospace';
		element.style.fontSize = '13px';
		element.style.fontWeight = 'normal';
		element.style.textAlign = 'center';
		element.style.background = '#fff';
		element.style.color = '#000';
		element.style.padding = '1.5em';
		element.style.width = '400px';
		element.style.margin = '5em auto 0';

		if (!this.webgl) {
			element.innerHTML = window.WebGLRenderingContext ? [
				'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
			].join('\n') : [
				'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
				'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
			].join('\n');

		}
		return element;
	},

	addGetWebGLMessage: function (parameters: any) {
		var parent, id, element;
		parameters = parameters || {};
		parent = parameters.parent !== undefined ? parameters.parent : document.body;
		id = parameters.id !== undefined ? parameters.id : 'oldie';
		element = Detector.getWebGLErrorMessage();
		element.id = id;
		parent.appendChild(element);
	}
}

import { Box } from './box'
import { Model } from './model'
import { Game } from './game'
import { Vehicle } from './vehicle'

Model.load()

setTimeout(() => {
Ammo(Ammo).then(() => {

	if (!Detector.webgl) {
		Detector.addGetWebGLMessage(null);
		document.getElementById('container')!.innerHTML = "";
	}

	function createObjects() {

		// var ground = createBox(new THREE.Vector3(0, -0.5, 0), ZERO_QUATERNION, 75, 1, 75, 0, 2);
		// ground.receiveShadow = true

		// var quaternion = new THREE.Quaternion(0, 0, 0, 1);
		// quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 10);
		// var jump = createBox(new THREE.Vector3(0, -1.5, 0), quaternion, 8, 4, 10, 0);
		// jump.castShadow = true
		// jump.receiveShadow = true

		var size = 1.2;
		var boxY = 50
		var nw = 8;
		var nh = 6;
		for (var j = 0; j < nw; j++) {
			for (var i = 0; i < nh; i++) {
				const box = new Box(size, size, size, new THREE.Vector3(size * j - (size * (nw - 1)) / 2, boxY + size * i, 10))
				game.addEntity(box)
			}
		}

		const vehicle = new Vehicle(new THREE.Vector3(25, 50, -2))
		game.addEntity(vehicle)
		game.vehicle = vehicle

		const materialStatic = new THREE.MeshPhongMaterial({ color: 0x777777 });
		const groundMass = 0;
		const groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );

		Model.GROUND.traverse((o: any) => {
			if (o.isMesh) {
				o.receiveShadow = true
				// o.castShadow = true
				o.material = materialStatic
				o.geometry.computeVertexNormals(true);
			}
		})

		const groundGeometry = (Model.GROUND.children[0] as any).geometry
		Model.GROUND.children[0].scale.set(400, 70, 400)
		const scaling = Model.GROUND.children[0].scale
		var groundMesh = new Ammo.btTriangleMesh(true, true);
		var points = groundGeometry.attributes.position.array;
		var idx = groundGeometry.index.array;
		for (var i = 0; i < idx.length / 3; i++) {
			groundMesh.addTriangle(
				new Ammo.btVector3(points[idx[i * 3 + 0] * 3 + 0] * scaling.x, points[idx[i * 3 + 0] * 3 + 1] * scaling.y, points[idx[i * 3 + 0] * 3 + 2] * scaling.z),
				new Ammo.btVector3(points[idx[i * 3 + 1] * 3 + 0] * scaling.x, points[idx[i * 3 + 1] * 3 + 1] * scaling.y, points[idx[i * 3 + 1] * 3 + 2] * scaling.z),
				new Ammo.btVector3(points[idx[i * 3 + 2] * 3 + 0] * scaling.x, points[idx[i * 3 + 2] * 3 + 1] * scaling.y, points[idx[i * 3 + 2] * 3 + 2] * scaling.z),
				false
			);
		}
		const customGroundShape = new Ammo.btBvhTriangleMeshShape(groundMesh, true, true);
		const customGroundTransform = new Ammo.btTransform();
		customGroundTransform.setIdentity();
		// Shifts the terrain, since bullet re-centers it on its bounding box.
		customGroundTransform.setOrigin( new Ammo.btVector3( 0, -0.1, 0 ) );
		const customGroundMotionState = new Ammo.btDefaultMotionState( customGroundTransform );
		const customGroundBody = new Ammo.btRigidBody( new Ammo.btRigidBodyConstructionInfo( groundMass, customGroundMotionState, customGroundShape, groundLocalInertia ) );
		// groundBody.setDamping(100, 100)
		customGroundBody.setFriction(1000)
		game.world.addRigidBody(customGroundBody)

		Model.GROUND.receiveShadow = true
		game.scene.add(Model.GROUND)
	}

	game = new Game()
	createObjects();
	game.update()

});
}, 1000)