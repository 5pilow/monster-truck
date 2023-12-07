import { Entity } from "./entity";
import * as THREE from 'three'
import { Stats } from './stats.js'
import Ammo from 'ammojs-typed'
import { Vehicle } from "./vehicle";
import { Model } from "./model";
import { Lensflare, LensflareElement } from "./lensflare";
import { Box } from "./box";

class Game {

	public ammo: typeof Ammo
	public world: Ammo.btDiscreteDynamicsWorld;
	scene = new THREE.Scene();
	private entities: Entity[] = [];
	private updateMethod: any
	private clock = new THREE.Clock();
	private stats: any
	public camera: THREE.PerspectiveCamera
	private renderer: THREE.WebGLRenderer
	public vehicle!: Vehicle
	private container = document.getElementById('container')!
	private speedometer = document.getElementById('speedometer')!
	private hud = document.getElementById('hud')!
	private cameraX = 0
	private cameraY = 2
	private cameraZ = 0
	private cameraZoom = 9
	private dirLight
	private camS = 40
	public cubeRenderTarget
	private cubeCamera1
	private paused = false
	private boxes: Box[] = []
	public currentColor: number = 0xff0000
	public currentMetallic: number = 2

	private down = false
	private downX: number = 0
	private downY: number = 0
	private cameraAngle = - Math.PI / 2 - 0.4
	private downAngle: number = 0
	private downCameraY: number = 0

	// Keybord actions
	private actions = {} as {[key: string]: boolean};
	private keysActions = {
		"KeyW": 'acceleration',
		"KeyS": 'braking',
		"KeyA": 'left',
		"KeyD": 'right',
		"Esc": 'pause'
	} as {[key: string]: string};

	public constructor(ammo: typeof Ammo) {

		this.ammo = ammo
		this.container.innerHTML = "";
		this.hud.style.display = 'block'

		// Physics configuration
		const collisionConfiguration = new ammo.btDefaultCollisionConfiguration();
		const dispatcher = new ammo.btCollisionDispatcher(collisionConfiguration);
		const broadphase = new ammo.btDbvtBroadphase();
		const solver = new ammo.btSequentialImpulseConstraintSolver();
		this.world = new ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
		this.world.setGravity(new ammo.btVector3(0, -9.82, 0));

		this.updateMethod = this.update.bind(this)

		this.stats = new (Stats as any)();
		this.stats.domElement.style.position = 'absolute';
		this.stats.domElement.style.top = '0px';
		this.container.appendChild(this.stats.domElement);

		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.2, 2000);
		this.camera.position.x = 0;
		this.camera.position.y = 6.39;
		this.camera.position.z = 0;
		this.camera.lookAt(new THREE.Vector3(0, -0.40, 0));
		this.camera.name = 'main'
		// controls = new OrbitControls(camera, container);

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setClearColor(0xbfd1e5);
		// renderer.setClearColor(0x001030);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
		// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
		const loader = new THREE.TextureLoader();
		const texture = loader.load(
		  'sky.jpg',
		  () => {
			const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
			rt.fromEquirectangularTexture(this.renderer, texture);
			this.scene.background = rt.texture;
		  });

		var ambientLight = new THREE.AmbientLight(0x404040);
		this.scene.add(ambientLight);

		const dirLight1 = new THREE.DirectionalLight(0xffffff, 1);
		dirLight1.intensity = 0.8
		dirLight1.position.set(-10, 10, -10);
		this.scene.add(dirLight1);

		this.dirLight = new THREE.DirectionalLight(0xffddcc, 1);
		this.dirLight.position.set(10, 5, 10);
		this.dirLight.castShadow = true;
		this.dirLight.intensity = 3.7
		//Set up shadow properties for the light
		this.dirLight.shadow.mapSize.width = 1024 * 4; // default
		this.dirLight.shadow.mapSize.height = 1024 * 4; // default
		this.dirLight.shadow.camera.near = 0.01; // default
		this.dirLight.shadow.camera.far = 1000; // default
		this.dirLight.shadow.bias = -0.0001;
		this.dirLight.shadow.camera.top = -this.camS // default
		this.dirLight.shadow.camera.right = + this.camS // default
		this.dirLight.shadow.camera.left = -this.camS // default
		this.dirLight.shadow.camera.bottom = + this.camS // defaults
		this.scene.add(this.dirLight);
		// helper = new THREE.CameraHelper( dirLight.shadow.camera );
   		// scene.add( helper );

		const textureLoader = new THREE.TextureLoader();
		const textureFlare0 = textureLoader.load("sun.png")
		const textureFlare1 = textureLoader.load("lens.png")
		const lensflare = new Lensflare();
		// @ts-ignore
		lensflare.addElement( new LensflareElement( textureFlare0, 400, 0, new THREE.Color(0xffff00) ) );
		// @ts-ignore
		lensflare.addElement( new LensflareElement( textureFlare1, 50, 0.15 , new THREE.Color(0xffff77) ) );
		// @ts-ignore
		lensflare.addElement( new LensflareElement( textureFlare1, 150, 0.2, new THREE.Color(0xffff77) ) );
		// @ts-ignore
		lensflare.addElement( new LensflareElement( textureFlare1, 170, 0.25, new THREE.Color(0xff7777) ) );
		// @ts-ignore
		lensflare.addElement( new LensflareElement( textureFlare1, 200, 0.35, new THREE.Color(0x7777ff) ) );
		// @ts-ignore
		lensflare.addElement( new LensflareElement( textureFlare1, 180, 0.37, new THREE.Color(0xffff77) ) );
		// @ts-ignore
		lensflare.addElement( new LensflareElement( textureFlare1, 70, 0.42, new THREE.Color(0xffff77) ) );
		// @ts-ignore
		lensflare.addElement( new LensflareElement( textureFlare1, 240, 0.5, new THREE.Color(0x77ff00) ) );
		// @ts-ignore
		lensflare.addElement( new LensflareElement( textureFlare1, 290, 0.58, new THREE.Color(0xffbb77) ) );
		// @ts-ignore
		lensflare.addElement( new LensflareElement( textureFlare1, 140, 0.65, new THREE.Color(0x77ffff) ) );
		// @ts-ignore
		lensflare.addElement( new LensflareElement( textureFlare1, 130, 0.75, new THREE.Color(0xff77ff) ) );
		// @ts-ignore
		lensflare.addElement( new LensflareElement( textureFlare1, 90, 0.8, new THREE.Color(0xffbb77) ) );
		this.dirLight.add( lensflare );

		const spotLight = new THREE.SpotLight( 0xffff55 );
		spotLight.position.set( 10, 10, 10 );
		spotLight.intensity = 1
		spotLight.castShadow = true;
		spotLight.shadow.mapSize.width = 1024 * 2;
		spotLight.shadow.mapSize.height = 1024 * 2;
		spotLight.shadow.camera.near = 0.1;
		spotLight.shadow.camera.far = 4000;
		spotLight.shadow.camera.fov = 20;
		spotLight.shadow.bias = -0.0001;
		spotLight.angle = Math.PI / 6
		spotLight.decay = 20
		// scene.add( spotLight );

		this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 512, { format: THREE.RGBAFormat, generateMipmaps: true, minFilter:THREE.LinearMipmapLinearFilter } );
		this.cubeCamera1 = new THREE.CubeCamera(.1, 1000, this.cubeRenderTarget);
		// cubeCamera1.position.set(-10, 3, 5)

		//  var geometry = new THREE.SphereGeometry(2, 24, 24);
		//   var Ball1 = new THREE.Mesh(geometry, material);
		//   Ball1.position.set(-10, 3, 5);
		//   Ball1.castShadow = true;
		//   Ball1.receiveShadow = true;
		//   Ball1.add(this.cubeCamera1);
		  this.scene.add(this.cubeCamera1)
		//   scene.add(Ball1)

		this.setPaint()

		var materialWheel = new THREE.MeshPhongMaterial({
		  shininess: 0,
		  color: 0x000000,
		  specular: 0x777777,
		});
		Model.WHEEL.traverse((o: any) => {
			if (o.isMesh) {
				// console.log(o.name)
				if( o.name === "BodyC10018") {
					o.material = materialWheel
				}
			}
		});

		this.container.appendChild(this.renderer.domElement);

		window.addEventListener('resize', () => this.onWindowResize(), false);
		window.addEventListener('keydown', (e) => this.keydown(e));
		window.addEventListener('keyup', (e) => this.keyup(e));
		window.addEventListener('mousedown', (e) => this.mousedown(e))
		window.addEventListener('mousemove', (e) => this.mousemove(e))
		window.addEventListener('mouseup', () => this.mouseup())
		window.addEventListener('mousewheel', (e: any) => this.mousewheel(e))

		this.updateCamera()

		this.addBoxes()
	}

	public addBoxes() {
		for (const box of this.boxes) {
			this.removeEntity(box)
		}
		const boxX = 40
		const boxZ = -25
		const boxY = 28
		var size = 1.2;
		var nw = 4;
		var nh = 6;
		var nz = 4;
		for (var j = 0; j < nw; j++) {
			for (var i = 0; i < nh; i++) {
				for (var k = 0; k < nz; k++) {
					const box = new Box(this.ammo, size, size, size, new THREE.Vector3(boxX + size * j - (size * (nw - 1)) / 2, boxY + size * i, boxZ + size * k + 10))
					this.addEntity(box)
					this.boxes.push(box)
				}
			}
		}
	}

	public addEntity(entity: any) {
		entity.add(this)
		this.entities.push(entity)
	}

	public removeEntity(entity: Entity) {
		entity.remove(this)
		this.entities.splice(this.entities.indexOf(entity), 1)
	}

	private mousedown(e: MouseEvent) {
		this.down = true
		this.downX = e.clientX
		this.downY = e.clientY
		this.downAngle = this.cameraAngle
		this.downCameraY = this.cameraY
	}

	private mousemove(e: MouseEvent) {
		if (this.down) {
			var dx = e.clientX - this.downX
			var dy = e.clientY - this.downY
			this.cameraAngle = this.downAngle + dx * 0.005
			this.cameraY = this.downCameraY + dy * 0.05
			if (this.cameraY > 15) this.cameraY = 15
			if (this.cameraY < -15) this.cameraY = -15
			this.updateCamera()
		}
	}
	private mouseup() {
		this.down = false
	}
	private mousewheel(e: WheelEvent) {
		this.cameraZoom += e.deltaY * 0.02
		if (this.cameraZoom < 2) this.cameraZoom = 2
		this.updateCamera()
	}
	private updateCamera() {
		this.cameraX = Math.cos(this.cameraAngle) * this.cameraZoom
		this.cameraZ = Math.sin(this.cameraAngle) * this.cameraZoom
	}

	private onWindowResize() {

		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	private keyup(e: KeyboardEvent) {
		// console.log("keyup", e)
		if (e.code === 'Escape') {
			this.paused = !this.paused
			if (!this.paused) {
				this.update()
			}
		}
		if (e.code === "Space") {
			this.vehicle.jump(this.ammo)
			// this.vehicle.body.applyTorqueImpulse(new this.ammo.btVector3( 0, 20000, 0) )
		}
		if (e.code === 'KeyR') {
			this.addBoxes()
		}
		if (this.keysActions[e.code]) {
			this.actions[this.keysActions[e.code]] = false;
			e.preventDefault();
			e.stopPropagation();
			return false
		}
		return true
	}
	private keydown(e: KeyboardEvent) {
		if (this.keysActions[e.code]) {
			this.actions[this.keysActions[e.code]] = true;
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
		return true
	}

	public update() {
		if (this.paused) return ;
		requestAnimationFrame(this.updateMethod);
		var dt = this.clock.getDelta();
		// this.time += dt;
		for (const entity of this.entities) {
			entity.update(dt)
		}
		this.world.stepSimulation(dt , 10);

		var speed = this.vehicle.body.getLinearVelocity().length();

		var ms = this.vehicle.body.getMotionState();
		ms.getWorldTransform(this.vehicle.TRANSFORM_AUX);
		var p = this.vehicle.TRANSFORM_AUX.getOrigin();
		var q = this.vehicle.TRANSFORM_AUX.getRotation();

		// const position = "[" + Math.round(p.x()) + ", " + Math.round(p.y()) + ", " + Math.round(p.z()) + "]"
		this.speedometer.innerHTML = (speed < 0 ? '(R) ' : '') + Math.abs(speed).toFixed(1) + ' km/h ' // + position;

		this.camera.position.x = p.x() + this.cameraX;
		this.camera.position.y = p.y() + this.cameraY;
		if (this.camera.position.y < 0.1) this.camera.position.y = 0.1
		this.camera.position.z = p.z() + this.cameraZ;
		this.camera.lookAt(new THREE.Vector3(p.x(), p.y() + 0.2, p.z()));

		this.dirLight.position.set(p.x() + 100, p.y() + 50, p.z() + 100);
		this.dirLight.target = this.vehicle.mesh
		this.dirLight.shadow.camera.lookAt(new THREE.Vector3(p.x(), 0, p.z()));
		this.dirLight.shadow.camera.up
		// helper.update()

		this.cubeCamera1.position.set(p.x(), p.y(), p.z());
		this.cubeCamera1.quaternion.set(q.x(), q.y(), q.z(), q.w());

		// spotLight.target = truck

		if (this.actions.acceleration || this.actions.braking) {
			const forceAbs = 15000
			const force = this.actions.acceleration ? forceAbs : -forceAbs
			this.vehicle.move(this.ammo, force)
		}
		if (this.actions.left || this.actions.right) {
			this.vehicle.steer(this.ammo, this.actions.left ? -0.01 : 0.01)
		} else {
			this.vehicle.releaseSteer(this.ammo)
		}

		if (this.actions.jump) {
			// console.log("jump")
			this.vehicle.body.applyCentralImpulse(new this.ammo.btVector3( 0, 2000, 0) )
			// body.applyTorqueImpulse(new Ammo.btVector3( 0, 200, 0) )
		}

		this.draw()
	}

	public draw() {

		Model.TRUCK.visible = false
		for (const wheel of this.vehicle.wheels) {
			wheel.mesh.visible = false
		}
		this.cubeCamera1.update(this.renderer, this.scene);
		Model.TRUCK.visible = true
		for (const wheel of this.vehicle.wheels) {
			wheel.mesh.visible = true
		}
		this.renderer.render(this.scene, this.camera);

		this.stats.update();
	}

	public setPaint() {
		var material = new THREE.MeshPhongMaterial({
			shininess: this.currentMetallic * 3,
			emissive: this.currentColor,
			emissiveIntensity: this.currentMetallic,
			color: this.currentColor,
			specular: this.currentMetallic > 0 ? 0xffffff : 0x000000,
			envMap: this.currentMetallic > 0 ? this.cubeRenderTarget.texture : null
		  });
		  Model.TRUCK.traverse((o: any) => {
			if (o.isMesh) {
				if( o.name === "BodyC10003" || o.name === "BodyC10007" || o.name === "BodyC10010") {
					o.material = material
				}
			}
		});
	}
}

export { Game }