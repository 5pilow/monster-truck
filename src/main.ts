import './style.css'
import * as THREE from 'three'
import Ammo from 'ammojs-typed'

let game: Game
let ammo: typeof Ammo

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

import { Model } from './model'
import { Game } from './game'
import { Vehicle } from './vehicle'

async function main() {

	await Model.load()

	ammo = await Ammo.bind(window)()

	if (!Detector.webgl) {
		Detector.addGetWebGLMessage(null);
		document.getElementById('container')!.innerHTML = "";
	}

	game = new Game(ammo)
	createObjects(ammo)
	game.update()
}

main()

function createObjects(ammo: typeof Ammo) {

	// var ground = createBox(new THREE.Vector3(0, -0.5, 0), ZERO_QUATERNION, 75, 1, 75, 0, 2);
	// ground.receiveShadow = true

	// var quaternion = new THREE.Quaternion(0, 0, 0, 1);
	// quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 10);
	// var jump = createBox(new THREE.Vector3(0, -1.5, 0), quaternion, 8, 4, 10, 0);
	// jump.castShadow = true
	// jump.receiveShadow = true

	const vehicle = new Vehicle(ammo, new THREE.Vector3(50, 29, -35))
	game.addEntity(vehicle)
	game.vehicle = vehicle

	const materialStatic = new THREE.MeshPhongMaterial({
		color: 0x539c00,
		// color: 0xEBC55E,
	});
	const groundMass = 0;
	const groundLocalInertia = new ammo.btVector3( 0, 0, 0 );

	Model.GROUND.traverse((o: any) => {
		if (o.isMesh) {
			o.receiveShadow = true
			o.castShadow = true
			o.material = materialStatic
			o.geometry.computeVertexNormals(true);
		}
	})

	const groundGeometry = (Model.GROUND.children[0] as any).geometry
	Model.GROUND.children[0].scale.set(400, 60, 400)
	const scaling = Model.GROUND.children[0].scale
	var groundMesh = new ammo.btTriangleMesh(true, true);
	var points = groundGeometry.attributes.position.array;
	var idx = groundGeometry.index.array;
	for (var i = 0; i < idx.length / 3; i++) {
		groundMesh.addTriangle(
			new ammo.btVector3(points[idx[i * 3 + 0] * 3 + 0] * scaling.x, points[idx[i * 3 + 0] * 3 + 1] * scaling.y, points[idx[i * 3 + 0] * 3 + 2] * scaling.z),
			new ammo.btVector3(points[idx[i * 3 + 1] * 3 + 0] * scaling.x, points[idx[i * 3 + 1] * 3 + 1] * scaling.y, points[idx[i * 3 + 1] * 3 + 2] * scaling.z),
			new ammo.btVector3(points[idx[i * 3 + 2] * 3 + 0] * scaling.x, points[idx[i * 3 + 2] * 3 + 1] * scaling.y, points[idx[i * 3 + 2] * 3 + 2] * scaling.z),
			false
		);
	}
	const customGroundShape = new ammo.btBvhTriangleMeshShape(groundMesh, true, true);
	const customGroundTransform = new ammo.btTransform();
	customGroundTransform.setIdentity();
	// Shifts the terrain, since bullet re-centers it on its bounding box.
	customGroundTransform.setOrigin( new ammo.btVector3( 0, -0.05, 0 ) );
	const customGroundMotionState = new ammo.btDefaultMotionState( customGroundTransform );
	const customGroundBody = new ammo.btRigidBody( new ammo.btRigidBodyConstructionInfo( groundMass, customGroundMotionState, customGroundShape, groundLocalInertia ) );
	// customGroundBody.setDamping(100, 100)
	customGroundBody.setFriction(10)
	// customGroundBody.setRestitution(2.0)
	game.world.addRigidBody(customGroundBody)

	Model.GROUND.receiveShadow = true
	Model.GROUND.castShadow = true
	game.scene.add(Model.GROUND)

	// Trees
	const setShadow = (model: any) => model.traverse((o: any) => {
		if (o.name === 'BlueSpruce_Med_1') o.material = new THREE.MeshPhongMaterial({ color: 0x1f7600 })
		if (o.name === 'BlueSpruce_Med_2') o.material = new THREE.MeshPhongMaterial({ color: 0x279300 })
		if (o.name === 'BlueSpruce_Med_3') o.material = new THREE.MeshPhongMaterial({ color: 0x2eaf00 })
		if (o.name === 'BlueSpruce_Med_4') o.material = new THREE.MeshPhongMaterial({ color: 0x114000 })
		if (o.name === 'BlueSpruce_Med_5') o.material = new THREE.MeshPhongMaterial({ color: 0x210b00 })
		if (o.isMesh) {
			o.castShadow = true
			o.receiveShadow = true
		}
	})
	const models = [Model.TREE10, Model.TREE11, Model.TREE12]
	setShadow(Model.TREE10)
	setShadow(Model.TREE11)
	setShadow(Model.TREE12)

	for (let i = 0; i < 100; ++i) {
		const x = -400 + Math.random() * 800
		const z = -400 + Math.random() * 800
		const from = new ammo.btVector3(x, 100, z)
		const to = new ammo.btVector3(x, -100, z)
		const closestResults = new ammo.ClosestRayResultCallback(from, to)
		game.world.rayTest(from, to, closestResults)
		const y = closestResults.get_m_hitPointWorld().y() - 0.5

		const model = models[Math.random() * models.length | 0].clone()
		model.position.set(x, y, z)

		// const scale = 50 + Math.random() * 100
		const scale = 3 + Math.random() * 6
		model.scale.set(scale, scale, scale)
		model.rotateY(Math.random() * Math.PI * 2)
		game.scene.add(model)
	}
}

// @ts-ignore
window.setColor = function(color: number) {

	game.currentColor = color
	game.setPaint()
}

// @ts-ignore
window.changeSuspension = function(event) {
	// console.log("change suspension", event.target.valueAsNumber)

	event.stopPropagation()

	game.vehicle.setSuspension(event.target.valueAsNumber)
}

// @ts-ignore
window.changeHeight = function(event) {
	// console.log("change height", event.target.valueAsNumber)

	event.stopPropagation()

	game.vehicle.setHeight(ammo, event.target.valueAsNumber)
}

// @ts-ignore
window.changeMetallic = function(event) {
	// console.log("change height", event.target.valueAsNumber)

	event.stopPropagation()

	game.currentMetallic = event.target.valueAsNumber
	game.setPaint()
}
