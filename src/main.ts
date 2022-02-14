import './style.css'
import Ammo from './ammo.js'
import * as THREE from 'three'
import { OrbitControls } from './OrbitControls'
import { Wheel } from './wheel'

const app = document.querySelector<HTMLDivElement>('#app')!

app.innerHTML = `
  <h1>Hello Vite!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`

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

function quat_mul_vec3(q, w) {
	return new Ammo.btQuaternion(
			q.w() * w.x() + q.y() * w.z() - q.z() * w.y(),
			q.w() * w.y() + q.z() * w.x() - q.x() * w.z(),
			q.w() * w.z() + q.x() * w.y() - q.y() * w.x(),
			-q.x() * w.x() - q.y() * w.y() - q.z() * w.z());
}

// function getEulerZYX(q) {
// 	const sqx = q.x() * q.x();
// 	const = m_floats[1] * m_floats[1];
// 	sqz = m_floats[2] * m_floats[2];
// 	squ = m_floats[3] * m_floats[3];
// 	sarg = btScalar(-2.) * (m_floats[0] * m_floats[2] - m_floats[3] * m_floats[1]);

// 		// If the pitch angle is PI/2 or -PI/2, we can only compute
// 		// the sum roll + yaw.  However, any combination that gives
// 		// the right sum will produce the correct orientation, so we
// 		// set rollX = 0 and compute yawZ.
// 		if (sarg <= -btScalar(0.99999))
// 		{
// 				pitchY = btScalar(-0.5)*SIMD_PI;
// 				rollX  = 0;
// 				yawZ   = btScalar(2) * btAtan2(m_floats[0],-m_floats[1]);
// 		} else if (sarg >= btScalar(0.99999))
// 		{
// 				pitchY = btScalar(0.5)*SIMD_PI;
// 				rollX  = 0;
// 				yawZ   = btScalar(2) * btAtan2(-m_floats[0], m_floats[1]);
// 		} else
// 		{
// 				pitchY = btAsin(sarg);
// 				rollX = btAtan2(2 * (m_floats[1] * m_floats[2] + m_floats[3] * m_floats[0]), squ - sqx - sqy + sqz);
// 				yawZ = btAtan2(2 * (m_floats[0] * m_floats[1] + m_floats[3] * m_floats[2]), squ + sqx - sqy - sqz);
// 		}
// }

function dot3(v, v0, v1, v2) {
	// console.log("v0", v0.x(), v0.y(), v0.z())
	// console.log("v1", v1.x(), v1.y(), v1.z())
	return new Ammo.btVector3( v.dot(v0), v.dot(v1), v.dot(v2));
}

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const loader = new GLTFLoader();
let truck = null
let wheelModel1 = null, wheelModel2 = null, wheelModel3 = null, wheelModel4 = null, crateModel = null

loader.load('src/truck.glb', function ( gltf ) {
	truck = gltf.scene
}, undefined, function ( error ) {
	console.error( error );
} );
loader.load('src/wheel.glb', function ( gltf ) {
	wheelModel1 = gltf.scene
}, undefined, function ( error ) { console.error( error ); } );
loader.load('src/wheel.glb', function ( gltf ) {
	wheelModel2 = gltf.scene
}, undefined, function ( error ) { console.error( error ); } );
loader.load('src/wheel.glb', function ( gltf ) {
	wheelModel3 = gltf.scene
}, undefined, function ( error ) { console.error( error ); } );
loader.load('src/wheel.glb', function ( gltf ) {
	wheelModel4 = gltf.scene
}, undefined, function ( error ) { console.error( error ); } );
loader.load('src/crate.glb', function ( gltf ) {
	crateModel = gltf.scene
	for (const child of crateModel.children) {
		child.castShadow = true
		child.receiveShadow = true
	}
	crateModel.scale.set(0.25, 0.25, 0.25)
}, undefined, function ( error ) { console.error( error ); } );


// Heightfield parameters
const terrainWidthExtents = 100;
const terrainDepthExtents = 100;
const terrainWidth = 128;
const terrainDepth = 128;
const terrainHalfWidth = terrainWidth / 2;
const terrainHalfDepth = terrainDepth / 2;
const terrainMaxHeight = 8;
const terrainMinHeight = - 2;

let heightData = null;
let ammoHeightData = null;

setTimeout(() => {
Ammo(Ammo).then(() => {

	// Detects webgl
	if (!Detector.webgl) {
		Detector.addGetWebGLMessage(null);
		document.getElementById('container')!.innerHTML = "";
	}

	// - Global variables -
	var DISABLE_DEACTIVATION = 4;
	var TRANSFORM_AUX = new Ammo.btTransform();
	var ZERO_QUATERNION = new THREE.Quaternion(0, 0, 0, 1);

	var angle = 0

	// Graphics variables
	var container, stats, speedometer;
	var camera, controls, scene: THREE.Scene, renderer;
	var terrainMesh, texture;
	var clock = new THREE.Clock();
	var materialDynamic, materialStatic, materialInteractive;

	// Physics variables
	var collisionConfiguration;
	var dispatcher;
	var broadphase;
	var solver;
	var physicsWorld: Ammo.btDiscreteDynamicsWorld;

	var cubeCamera1
	var syncList = [];
	var time = 0;
	var objectTimePeriod = 3;
	var timeNextSpawn = time + objectTimePeriod;
	var maxNumObjects = 30;
	const camS = 25
	let dirLight
	let helper

	// Keybord actions
	var actions = {};
	var keysActions = {
		"KeyW": 'acceleration',
		"KeyS": 'braking',
		"KeyA": 'left',
		"KeyD": 'right',
		"Space": 'jump'
	};

	// - Functions -

	function initGraphics() {

		container = document.getElementById('container');
		speedometer = document.getElementById('speedometer');

		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 2000);
		camera.position.x = -6.84;
		camera.position.y = 6.39;
		camera.position.z = -18.11;
		camera.lookAt(new THREE.Vector3(-20.33, -0.40, -10.85));
		// controls = new OrbitControls(camera, container);

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setClearColor(0xbfd1e5);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap
		// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

		var ambientLight = new THREE.AmbientLight(0x404040);
		scene.add(ambientLight);

		const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
		dirLight1.position.set(-10, 10, -10);
		scene.add(dirLight1);

		dirLight = new THREE.DirectionalLight(0xffccaa, 1);
		dirLight.position.set(10, 5, 10);
		dirLight.castShadow = true;
		dirLight.intensity = 1.7
		//Set up shadow properties for the light
		dirLight.shadow.mapSize.width = 1024 * 4; // default
		dirLight.shadow.mapSize.height = 1024 * 4; // default
		dirLight.shadow.camera.near = 0.1; // default
		dirLight.shadow.camera.far = 1000; // default
		dirLight.shadow.bias = -0.0001;
		scene.add(dirLight);
		// helper = new THREE.CameraHelper( dirLight.shadow.camera );
   		// scene.add( helper );

		materialDynamic = new THREE.MeshPhongMaterial({ color: 0xfca400 });
		materialStatic = new THREE.MeshPhongMaterial({ color: 0xE7B261 });

		materialInteractive = new THREE.MeshPhongMaterial({ color: 0x990000 });

		container.innerHTML = "";
		container.appendChild(renderer.domElement);

		// stats = new Stats();
		// stats.domElement.style.position = 'absolute';
		// stats.domElement.style.top = '0px';
		// container.appendChild(stats.domElement);

		window.addEventListener('resize', onWindowResize, false);
		window.addEventListener('keydown', keydown);
		window.addEventListener('keyup', keyup);
		window.addEventListener('mousedown', mousedown)
		window.addEventListener('mousemove', mousemove)
		window.addEventListener('mouseup', mouseup)
		window.addEventListener('mousewheel', mousewheel)
	}

	var down = false
	var downX, downY
	var cameraAngle = -3 * Math.PI / 4, downAngle, downCameraY
	var cameraX = 0, cameraY = 7, cameraZ = -20, cameraZoom = 10
	updateCamera()

	function mousedown(e) {
		down = true
		downX = e.clientX
		downY = e.clientY
		downAngle = cameraAngle
		downCameraY = cameraY
	}
	function mousemove(e) {
		if (down) {
			var dx = e.clientX - downX
			var dy = e.clientY - downY
			cameraAngle = downAngle + dx * 0.005
			cameraY = downCameraY + dy * 0.05
			updateCamera()
		}
	}
	function mouseup() {
		down = false
	}
	function mousewheel(e) {
		cameraZoom += e.deltaY * 0.02
		updateCamera()
	}
	function updateCamera() {
		cameraX = Math.cos(cameraAngle) * cameraZoom
		cameraZ = Math.sin(cameraAngle) * cameraZoom
	}

	function onWindowResize() {

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);

	}

	function initPhysics() {

		// Physics configuration
		collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
		broadphase = new Ammo.btDbvtBroadphase();
		solver = new Ammo.btSequentialImpulseConstraintSolver();
		// solver = new Ammo.btSequentialImpulseConstraintSolverMt()
		physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
		physicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));
	}

	function tick() {
		requestAnimationFrame(tick);
		var dt = clock.getDelta();
		for (var i = 0; i < syncList.length; i++)
			syncList[i](dt);
		physicsWorld.stepSimulation(dt , 10);
		// controls.update(dt);
		cubeCamera1.update(renderer, scene);
		renderer.render(scene, camera);
		time += dt;
		// stats.update();
	}

	function keyup(e) {
		if (keysActions[e.code]) {
			actions[keysActions[e.code]] = false;
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	}
	function keydown(e) {
		if (keysActions[e.code]) {
			actions[keysActions[e.code]] = true;
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	}

	function createBox(pos, quat, w, l, h, mass, friction) {
		var material = mass > 0 ? materialDynamic : materialStatic;
		var shape = new THREE.BoxGeometry(w, l, h, 1, 1, 1);
		var geometry = new Ammo.btBoxShape(new Ammo.btVector3(w * 0.5, l * 0.5, h * 0.5));

		if (!mass) mass = 0;
		if (!friction) friction = 1;

		var mesh = mass > 0 ? crateModel.clone() : new THREE.Mesh(shape, material);

		mesh.position.copy(pos);
		mesh.quaternion.copy(quat);
		scene.add(mesh);

		var transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		var motionState = new Ammo.btDefaultMotionState(transform);

		var localInertia = new Ammo.btVector3(0, 0, 0);
		geometry.calculateLocalInertia(mass, localInertia);

		var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia);
		var body = new Ammo.btRigidBody(rbInfo);

		body.setFriction(friction);
		//body.setRestitution(.9);
		//body.setDamping(0.2, 0.2);

		physicsWorld.addRigidBody(body);

		if (mass > 0) {
			body.setActivationState(DISABLE_DEACTIVATION);
			// Sync physics and graphics
			function sync(dt) {

				var ms = body.getMotionState();
				if (ms) {
					ms.getWorldTransform(TRANSFORM_AUX);
					var p = TRANSFORM_AUX.getOrigin();
					var q = TRANSFORM_AUX.getRotation();
					mesh.position.set(p.x(), p.y(), p.z());
					mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
				}
			}

			syncList.push(sync);
		}
		return mesh
	}

	function createChassisMesh(w, l, h) {
		var shape = new THREE.BoxGeometry(w, l, h, 1, 1, 1);
		var mesh = new THREE.Mesh(shape, materialInteractive);
		const edges = new THREE.EdgesGeometry(shape);
		const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0, linewidth: 3 }));
		// scene.add(line);
		// scene.add(mesh);
		return [mesh, line]
	}

	function createVehicle(pos, quat) {

		var chassisWidth = 2.5;
		var chassisHeight = 2.8;
		var chassisLength = 5.9;
		var massVehicle = 1000;

		// Chassis
		var geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight * .5, chassisLength * .5));
		var transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		// transform.setRotation(new Ammo.btQuaternion(quat.x, Math.PI / 4, quat.z, Math.PI / 4));
		var motionState = new Ammo.btDefaultMotionState(transform);
		var localInertia = new Ammo.btVector3(0, 0, 0);
		geometry.calculateLocalInertia(massVehicle, localInertia);
		var body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, geometry, localInertia));
		// body.setActivationState(DISABLE_DEACTIVATION);
		physicsWorld.addRigidBody(body);
		var [chassisMesh3, chassisMesh2] = createChassisMesh(chassisWidth, chassisHeight, chassisLength);
		var chassisMesh = truck
		scene.add(chassisMesh)

		console.log(chassisMesh)
		for (const child of chassisMesh.children) {
			child.castShadow = true
			child.receiveShadow = true
		}
		// chassisMesh.receiveShadow = false; //default

		var dy = -1
		var dx = 2.2
		var dz = 1.8
		var oz = 0
		const wheel1 = new Wheel(physicsWorld, scene, body, wheelModel1, pos.x - dx, pos.y, oz + dz)
		const wheel2 = new Wheel(physicsWorld, scene, body, wheelModel2, pos.x + dx, pos.y, oz + dz)
		const wheel3 = new Wheel(physicsWorld, scene, body, wheelModel3, pos.x - dx, pos.y, oz - dz)
		const wheel4 = new Wheel(physicsWorld, scene, body, wheelModel4, pos.x + dx, pos.y, oz - dz)
		// const wheel5 = new Wheel(physicsWorld, scene, body, pos.x - dx, pos.y, pos.z - 0)
		// const wheel6 = new Wheel(physicsWorld, scene, body, pos.x + dx, pos.y, pos.z - 0)
		const wheels = [wheel1, wheel2, wheel3, wheel4,
			// wheel5, wheel6
		]
		// console.log(body)
		// for (const wheel of wheels) wheel.body.setIgnoreCollisionCheck(body)

		// Sync physics and graphics
		function sync(dt) {
			var ms = body.getMotionState();
			if (ms) {
				ms.getWorldTransform(TRANSFORM_AUX);
				var p = TRANSFORM_AUX.getOrigin();
				var q = TRANSFORM_AUX.getRotation();
				chassisMesh.position.set(p.x(), p.y(), p.z());
				chassisMesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
				chassisMesh2.position.set(p.x(), p.y(), p.z());
				chassisMesh2.quaternion.set(q.x(), q.y(), q.z(), q.w());
				// chassisLines.position.set(p.x(), p.y(), p.z());zz

				// var p = constraint.getAncorInA()
				// constraintMesh.position.set(p.x(), p.y(), p.z());
				// console.log(p.x(), p.y(), p.z());

				camera.position.x = p.x() + cameraX;
				camera.position.y = p.y() + cameraY;
				if (camera.position.y < 0.1) camera.position.y    = 0.1
				camera.position.z = p.z() + cameraZ;
				camera.lookAt(new THREE.Vector3(p.x(), p.y(), p.z()));


				dirLight.shadow.camera.top = p.z() - camS // default
				dirLight.shadow.camera.right = p.x() + camS // default
				dirLight.shadow.camera.left = p.x() - camS // default
				dirLight.shadow.camera.bottom = p.z() + camS // defaults
				dirLight.position.set(p.x() + 10, p.y() + 5, p.z() + 10);
				dirLight.target = truck
				dirLight.shadow.camera.lookAt(new THREE.Vector3(p.x(), 0, p.z()));
				// helper.update()

				cubeCamera1.position.set(p.x(), p.y(), p.z());
				cubeCamera1.quaternion.set(q.x(), q.y(), q.z(), q.w());
			}

			if (actions.acceleration || actions.braking) {
				const forceAbs = 8000
				const force = actions.acceleration ? 8000 : -8000
				const torqueOrigin = new Ammo.btVector3( 0, -force, 0)

				// for (const wheel of [wheel3, wheel4]) {
					for (const wheel of wheels) {

					var basis = wheel.body.getCenterOfMassTransform().getBasis()

					let row0 = basis.getRow(0)
					row0 = new Ammo.btVector3(row0.x(), row0.y(), row0.z())
					let row1 = basis.getRow(1)
					row1 = new Ammo.btVector3(row1.x(), row1.y(), row1.z())
					let row2 = basis.getRow(2)
					row2 = new Ammo.btVector3(row2.x(), row2.y(), row2.z())
					const torque = dot3(torqueOrigin, row0, row1, row2)

					// console.log("torque", torque.x(), torque.y(), torque.z())

					wheel.body.applyTorque(torque)
				}
			}
			if (actions.left || actions.right) {
				const max = 0.3
				angle += actions.left ? -0.01 : 0.01
				if (angle < -max) angle = -max
				if (angle > max) angle = max
				wheel1.constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, angle, 0));
				wheel1.constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, angle, 0));
				wheel2.constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, angle, 0,));
				wheel2.constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, angle, 0));
				wheel3.constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, -angle, 0));
				wheel3.constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, -angle, 0));
				wheel4.constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, -angle, 0,));
				wheel4.constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, -angle, 0));
			} else {
				angle *= 0.9
				wheel1.constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, angle, 0));
				wheel1.constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, angle, 0));
				wheel2.constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, angle, 0));
				wheel2.constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, angle, 0));
				wheel3.constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, -angle, 0));
				wheel3.constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, -angle, 0));
				wheel4.constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, -angle, 0,));
				wheel4.constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, -angle, 0));
			}

			if (actions.jump) {
				console.log("jump")
				body.applyCentralImpulse(new Ammo.btVector3( 0, 1000, 0) )
				// body.applyTorqueImpulse(new Ammo.btVector3( 0, 200, 0) )
			}
		}

		syncList.push(sync)
		for (const wheel of wheels) {
			syncList.push(wheel.update.bind(wheel))
		}
	}

	function createObjects() {

		// var ground = createBox(new THREE.Vects

		// var quaternion = new THREE.Quaternion(0, 0, 0, 1);
		// quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 10);
		// var jump = createBox(new THREE.Vector3(0, -1.5, 0), quaternion, 8, 4, 10, 0);
		// jump.castShadow = true
		// jump.receiveShadow = true

		var size = 1.2;
		var weight = 50
		var nw = 8;
		var nh = 6;
		for (var j = 0; j < nw; j++) {
			for (var i = 0; i < nh; i++) {
				var box = createBox(new THREE.Vector3(size * j - (size * (nw - 1)) / 2, size * i, 10), ZERO_QUATERNION, size, size, size, weight, 10);

			}
		}

		createVehicle(new THREE.Vector3(0, 4, -2), ZERO_QUATERNION);

		var cubeRenderTarget1 = new THREE.WebGLCubeRenderTarget( 512, { format: THREE.RGBAFormat, generateMipmaps: true, minFilter:THREE.LinearMipmapLinearFilter } );
		cubeCamera1 = new THREE.CubeCamera(.1, 1000, cubeRenderTarget1);
		// cubeCamera1.position.set(-10, 3, 5)
		var material = new THREE.MeshPhongMaterial({
			shininess: 10,
			color: 0x00D8FF,
			// color: 0xff0000,
			// color: 0xffffff,
			specular: 0xffffff,
			envMap: cubeRenderTarget1.texture
		  });
		 var geometry = new THREE.SphereGeometry(2, 24, 24);
		  var Ball1 = new THREE.Mesh(geometry, material);
		  Ball1.position.set(-10, 3, 5);
		  Ball1.castShadow = true;
		  Ball1.receiveShadow = true;
		  Ball1.add(cubeCamera1);
		  scene.add(cubeCamera1)
		//   scene.add(Ball1)

		  truck.traverse((o) => {
			if (o.isMesh) {
				// console.log(o.name)
				if( o.name === "BodyC10003" || o.name === "BodyC10007" || o.name === "BodyC10010") {
			//   o.material.emissive = new THREE.Color( 0x00ffff );
			  o.material = material
			}
			}
		  });

		  heightData = generateHeight( terrainWidth, terrainDepth, terrainMinHeight, terrainMaxHeight );

		  const geometryG = new THREE.PlaneGeometry( terrainWidthExtents, terrainDepthExtents, terrainWidth - 1, terrainDepth - 1 );
		  console.log(geometryG, heightData)
		  geometryG.rotateX( - Math.PI / 2 );

			const vertices = geometryG.attributes.position.array;

			for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
				// j + 1 because it is the y component that we modify
				vertices[ j + 1 ] = heightData[ i ];
			}

			geometryG.computeVertexNormals();

			terrainMesh = new THREE.Mesh( geometryG, materialStatic );
			terrainMesh.receiveShadow = true;
			terrainMesh.castShadow = true;

			scene.add( terrainMesh );

			const groundShape = createTerrainShape();
			const groundTransform = new Ammo.btTransform();
			groundTransform.setIdentity();
			// Shifts the terrain, since bullet re-centers it on its bounding box.
			groundTransform.setOrigin( new Ammo.btVector3( 0, ( terrainMaxHeight + terrainMinHeight ) / 2, 0 ) );
			const groundMass = 0;
			const groundLocalInertia = new Ammo.btVector3( 0, 0, 0 );
			const groundMotionState = new Ammo.btDefaultMotionState( groundTransform );
			const groundBody = new Ammo.btRigidBody( new Ammo.btRigidBodyConstructionInfo( groundMass, groundMotionState, groundShape, groundLocalInertia ) );
			physicsWorld.addRigidBody( groundBody );

	}

	// - Init -
	initGraphics();
	initPhysics();
	createObjects();
	tick();

});
}, 400)



function generateHeight( width, depth, minHeight, maxHeight ) {

	// Generates the height data (a sinus wave)

	const size = width * depth;
	const data = new Float32Array( size );

	const hRange = maxHeight - minHeight;
	const w2 = width / 2;
	const d2 = depth / 2;
	const phaseMult = 12;

	let p = 0;

	for ( let j = 0; j < depth; j ++ ) {
		for ( let i = 0; i < width; i ++ ) {
			const radius = Math.sqrt(
				Math.pow( ( i - w2 ) / w2, 2.0 ) +
					Math.pow( ( j - d2 ) / d2, 2.0 ) );

			const height = ( Math.sin( radius * phaseMult ) + 1 ) * 0.2 * hRange + minHeight;
			data[ p ] = height;
			p ++;
		}
	}
	return data;
}

function createTerrainShape() {

	// This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
	const heightScale = 1;

	// Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
	const upAxis = 1;

	// hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
	const hdt = 'PHY_FLOAT';

	// Set this to your needs (inverts the triangles)
	const flipQuadEdges = false;

	// Creates height data buffer in Ammo heap
	ammoHeightData = Ammo._malloc( 4 * terrainWidth * terrainDepth );

	// Copy the javascript height data array to the Ammo one.
	let p = 0;
	let p2 = 0;

	for ( let j = 0; j < terrainDepth; j ++ ) {
		for ( let i = 0; i < terrainWidth; i ++ ) {
			// write 32-bit float data to memory
			Ammo.HEAPF32[ ammoHeightData + p2 >> 2 ] = heightData[ p ];
			p ++;
			// 4 bytes/float
			p2 += 4;
		}
	}

	// Creates the heightfield physics shape
	const heightFieldShape = new Ammo.btHeightfieldTerrainShape(
		terrainWidth,
		terrainDepth,
		ammoHeightData,
		heightScale,
		terrainMinHeight,
		terrainMaxHeight,
		upAxis,
		hdt,
		flipQuadEdges
	);

	// Set horizontal scale
	const scaleX = terrainWidthExtents / ( terrainWidth - 1 );
	const scaleZ = terrainDepthExtents / ( terrainDepth - 1 );
	heightFieldShape.setLocalScaling( new Ammo.btVector3( scaleX, 1, scaleZ ) );

	heightFieldShape.setMargin( 0.05 );

	return heightFieldShape;

}