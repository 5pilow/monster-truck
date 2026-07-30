import { Entity } from "./entity";
import * as THREE from 'three'
import { Stats } from './stats.js'
import Ammo from 'ammojs-typed'
import { Vehicle } from "./vehicle";
import { Model } from "./model";
import { Lensflare, LensflareElement } from "./lensflare";
import { Box } from "./box";
import { show as showAd } from "./ads";
import { setupConsent } from "./consent";

/** Nombre d'images entre deux rafraîchissements de la sonde de reflet. */
const CUBE_CAMERA_INTERVAL = 3

/**
 * Signe de l'axe local Z du châssis qui pointe vers l'avant du camion. Mesuré en
 * accélérant et en observant le signe de la projection de la vitesse : le nez est
 * du côté des Z positifs.
 */
const FORWARD_AXIS_SIGN = 1

/** Distance caméra minimale et maximale, en unités du monde. */
const ZOOM_MIN = 2
const ZOOM_MAX = 40

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
	private homeScreen = document.getElementById('home')!
	private pauseScreen = document.getElementById('pause')!
	private cameraX = 0
	private cameraY = 2
	private cameraZ = 0
	private cameraZoom = 9
	private dirLight
	private camS = 40
	public cubeRenderTarget
	private cubeCamera1
	private paused = false
	/**
	 * Faux tant que le joueur n'a pas cliqué sur Jouer, et de nouveau faux au retour à
	 * l'accueil. La scène continue d'être rendue (on voit le décor derrière le
	 * panneau, la caméra reste orbitable) mais la simulation n'avance pas : sur
	 * l'écran d'accueil le camion doit rester en place.
	 */
	private started = false
	private boxes: Box[] = []
	public currentColor: number = 0xff0000
	public currentMetallic: number = 2
	private paintMaterial: THREE.MeshPhongMaterial | null = null
	private frame = 0
	// Vecteurs de travail réutilisés, pour ne pas en créer à chaque image.
	private lookTarget = new THREE.Vector3()
	private shadowTarget = new THREE.Vector3()

	private down = false
	/** Identifiant du pointeur qui pilote la rotation, null si aucun. */
	private activePointer: number | null = null
	/** Pointeurs actuellement posés sur le canvas, pour le pincement à deux doigts. */
	private pointers = new Map<number, { x: number, y: number }>()
	private pinchStartDistance = 0
	private pinchStartZoom = 0
	private downX: number = 0
	private downY: number = 0
	private cameraAngle = - Math.PI / 2 - 0.4
	private downAngle: number = 0
	private downCameraY: number = 0

	// Keybord actions
	private actions = {} as {[key: string]: boolean};
	// e.code désigne la touche par sa POSITION physique : KeyW/KeyA correspondent donc
	// bien à Z/Q sur un clavier AZERTY. Les flèches sont acceptées en plus, pour ceux
	// dont la disposition ne place pas ZQSD/WASD au même endroit.
	private keysActions = {
		"KeyW": 'acceleration',
		"KeyS": 'braking',
		"KeyA": 'left',
		"KeyD": 'right',
		"ArrowUp": 'acceleration',
		"ArrowDown": 'braking',
		"ArrowLeft": 'left',
		"ArrowRight": 'right',
	} as {[key: string]: string};

	public constructor(ammo: typeof Ammo) {

		this.ammo = ammo
		this.container.innerHTML = "";

		// Physics configuration
		const collisionConfiguration = new ammo.btDefaultCollisionConfiguration();
		const dispatcher = new ammo.btCollisionDispatcher(collisionConfiguration);
		const broadphase = new ammo.btDbvtBroadphase();
		const solver = new ammo.btSequentialImpulseConstraintSolver();
		this.world = new ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
		this.world.setGravity(new ammo.btVector3(0, -9.82, 0));

		this.updateMethod = this.update.bind(this)

		// Le compteur de FPS n'a rien à faire sur un jeu public : il encombre l'écran et
		// donne un air inachevé. Il reste disponible en ajoutant ?stats à l'URL.
		if (new URLSearchParams(location.search).has('stats')) {
			this.stats = new (Stats as any)();
			this.stats.domElement.style.position = 'absolute';
			this.stats.domElement.style.top = '0px';
			this.container.appendChild(this.stats.domElement);
		}

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
		// Plafonné à 2 : au-delà, on quadruple le nombre de pixels à calculer pour un
		// gain visuel imperceptible, ce qui fait s'écrouler le framerate sur mobile.
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
		// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
		const loader = new THREE.TextureLoader();
		const texture = loader.load(
		  '/sky.jpg',
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
		const textureFlare0 = textureLoader.load("/sun.png")
		const textureFlare1 = textureLoader.load("/lens.png")
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
		window.addEventListener('orientationchange', () => this.onWindowResize(), false);
		window.addEventListener('keydown', (e) => this.keydown(e));
		window.addEventListener('keyup', (e) => this.keyup(e));

		// Les événements « pointer » couvrent souris, doigt et stylet d'un seul tenant.
		// Ils sont posés sur le canvas et non sur window, sinon faire glisser un curseur
		// de réglage fait aussi pivoter la caméra.
		const canvas = this.renderer.domElement
		canvas.addEventListener('pointerdown', (e) => this.pointerdown(e))
		canvas.addEventListener('pointermove', (e) => this.pointermove(e))
		canvas.addEventListener('pointerup', (e) => this.pointerup(e))
		canvas.addEventListener('pointercancel', (e) => this.pointerup(e))
		// 'mousewheel' n'a jamais existé sur Firefox : le zoom molette y était mort.
		canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: true })
		this.bindTouchControls()

		this.updateCamera()

		this.addBoxes()

		document.getElementById('play')?.addEventListener('click', () => this.start())
		document.getElementById('resume')?.addEventListener('click', () => this.togglePause())
		document.getElementById('home-button')?.addEventListener('click', () => this.backHome())
		document.getElementById('back-home')?.addEventListener('click', () => this.backHome())
		document.getElementById('settings-toggle')?.addEventListener('click', () => {
			document.getElementById('settings')?.classList.toggle('open')
		})

		// La scène tourne derrière l'écran d'accueil : le joueur voit le camion avant
		// même d'avoir cliqué, ce qui donne tout de suite envie de jouer.
		this.homeScreen.style.display = 'flex'
		showAd('home', document.getElementById('ad-home'))
		// Lien « Cookies » dans les pieds de page + masquage du widget flottant de
		// Google, l'un conditionnant l'autre (cf. consent.ts).
		setupConsent()
	}

	public addBoxes() {
		// this.boxes doit être vidé : sinon les caisses déjà retirées y restent, on
		// tente de les retirer une seconde fois au rechargement suivant et
		// removeEntity() supprime alors des entités au hasard (cf. son commentaire).
		for (const box of this.boxes) {
			this.removeEntity(box)
			box.dispose()
		}
		this.boxes.length = 0
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
		// Le retrait du monde physique a lieu dans tous les cas : l'appelant peut
		// enchaîner sur un dispose(), et libérer un corps encore présent dans le monde
		// laisserait un pointeur mort côté Bullet.
		entity.remove(this)
		const index = this.entities.indexOf(entity)
		// Sans ce test, une entité absente donne indexOf() === -1 et splice(-1, 1)
		// retire la DERNIÈRE entité de la liste, au hasard : les roues ou le véhicule
		// cessent alors d'être mis à jour.
		if (index !== -1) this.entities.splice(index, 1)
	}

	private pointerdown(e: PointerEvent) {
		this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
		// La capture garde le geste lié au canvas même si le doigt en sort, et évite
		// que le pointeur soit perdu en cours de route.
		try {
			this.renderer.domElement.setPointerCapture(e.pointerId)
		} catch (error) {
			// Capture refusée (pointeur déjà relâché) : le glissement fonctionne quand même.
		}

		if (this.pointers.size >= 2) {
			// Deux doigts : on passe en pincement et on interrompt la rotation, sinon la
			// caméra tournerait en même temps qu'on zoome.
			this.down = false
			this.activePointer = null
			this.startPinch()
			return
		}

		// Un seul doigt : rotation.
		this.activePointer = e.pointerId
		this.down = true
		this.downX = e.clientX
		this.downY = e.clientY
		this.downAngle = this.cameraAngle
		this.downCameraY = this.cameraY
	}

	private pointermove(e: PointerEvent) {
		const tracked = this.pointers.get(e.pointerId)
		if (tracked) {
			tracked.x = e.clientX
			tracked.y = e.clientY
		}

		if (this.pointers.size >= 2) {
			const distance = this.pinchDistance()
			if (distance > 0 && this.pinchStartDistance > 0) {
				// Doigts qui s'écartent : on se rapproche du camion.
				this.cameraZoom = this.pinchStartZoom * this.pinchStartDistance / distance
				if (this.cameraZoom < ZOOM_MIN) this.cameraZoom = ZOOM_MIN
				if (this.cameraZoom > ZOOM_MAX) this.cameraZoom = ZOOM_MAX
				this.updateCamera()
			}
			return
		}

		if (this.down && e.pointerId === this.activePointer) {
			var dx = e.clientX - this.downX
			var dy = e.clientY - this.downY
			this.cameraAngle = this.downAngle + dx * 0.005
			this.cameraY = this.downCameraY + dy * 0.05
			if (this.cameraY > 15) this.cameraY = 15
			if (this.cameraY < -15) this.cameraY = -15
			this.updateCamera()
		}
	}

	private pointerup(e?: PointerEvent) {
		if (e) {
			this.pointers.delete(e.pointerId)
			try {
				this.renderer.domElement.releasePointerCapture(e.pointerId)
			} catch (error) {
				// Déjà relâchée, rien à faire.
			}
		} else {
			this.pointers.clear()
		}

		if (this.pointers.size >= 2) {
			// Il reste au moins deux doigts : on repart d'un pincement propre.
			this.startPinch()
			return
		}

		this.pinchStartDistance = 0

		const remaining = this.pointers.keys().next()
		if (!remaining.done) {
			// Un doigt reste posé après un pincement : la rotation reprend à partir de sa
			// position actuelle, sinon la caméra sauterait d'un coup.
			const id = remaining.value
			const point = this.pointers.get(id)!
			this.activePointer = id
			this.down = true
			this.downX = point.x
			this.downY = point.y
			this.downAngle = this.cameraAngle
			this.downCameraY = this.cameraY
			return
		}

		this.activePointer = null
		this.down = false
	}

	/** Mémorise l'écartement et la distance caméra au début d'un pincement. */
	private startPinch() {
		this.pinchStartDistance = this.pinchDistance()
		this.pinchStartZoom = this.cameraZoom
	}

	/** Écartement entre les deux premiers doigts posés, 0 s'il y en a moins de deux. */
	private pinchDistance() {
		const iterator = this.pointers.values()
		const a = iterator.next()
		const b = iterator.next()
		if (a.done || b.done) return 0
		return Math.hypot(a.value.x - b.value.x, a.value.y - b.value.y)
	}

	private onWheel(e: WheelEvent) {
		this.cameraZoom += e.deltaY * 0.02
		if (this.cameraZoom < ZOOM_MIN) this.cameraZoom = ZOOM_MIN
		if (this.cameraZoom > ZOOM_MAX) this.cameraZoom = ZOOM_MAX
		this.updateCamera()
	}
	private updateCamera() {
		this.cameraX = Math.cos(this.cameraAngle) * this.cameraZoom
		this.cameraZ = Math.sin(this.cameraAngle) * this.cameraZoom
	}

	/**
	 * Boutons tactiles : sans eux le jeu est simplement injouable sur téléphone,
	 * puisqu'il n'y a aucun clavier. Chaque bouton pilote la même table d'actions
	 * que les touches.
	 */
	private bindTouchControls() {
		const bind = (id: string, action: string) => {
			const el = document.getElementById(id)
			if (!el) return
			const set = (value: boolean) => (e: PointerEvent) => {
				e.preventDefault()
				e.stopPropagation()
				this.actions[action] = value
			}
			el.addEventListener('pointerdown', set(true))
			el.addEventListener('pointerup', set(false))
			el.addEventListener('pointerleave', set(false))
			el.addEventListener('pointercancel', set(false))
		}
		bind('touch-accelerate', 'acceleration')
		bind('touch-brake', 'braking')
		bind('touch-left', 'left')
		bind('touch-right', 'right')

		const jump = document.getElementById('touch-jump')
		if (jump) {
			jump.addEventListener('pointerdown', (e) => {
				e.preventDefault()
				e.stopPropagation()
				this.vehicle.jump()
			})
		}
	}

	private onWindowResize() {

		// Une hauteur nulle (fenêtre réduite au minimum, rotation de l'écran) donnerait
		// un ratio infini, une matrice de projection invalide et un rendu vide définitif.
		const width = Math.max(1, window.innerWidth)
		const height = Math.max(1, window.innerHeight)

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setSize(width, height);
	}

	private keyup(e: KeyboardEvent) {
		// console.log("keyup", e)
		// Sur l'écran d'accueil, les touches de jeu ne doivent rien déclencher : ni
		// pause par-dessus l'accueil, ni saut, ni rechargement des caisses.
		if (!this.started) return true
		if (e.code === 'Escape') {
			this.togglePause()
			return false
		}
		if (e.code === "Space") {
			this.vehicle.jump()
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

	/** Quitte l'écran d'accueil et lance la simulation. */
	public start() {
		this.homeScreen.style.display = 'none'
		this.pauseScreen.style.display = 'none'
		this.hud.style.display = 'block'
		this.started = true
		// Reprendre depuis l'accueil ne doit pas laisser la simulation figée.
		if (this.paused) {
			this.paused = false
			this.clock.getDelta()
			this.update()
		}
	}

	/** Revient à l'écran d'accueil et y remet la simulation à l'arrêt. */
	public backHome() {
		this.started = false
		this.pauseScreen.style.display = 'none'
		this.hud.style.display = 'none'
		document.getElementById('settings')?.classList.remove('open')
		// Les touches maintenues au moment du clic resteraient actives au retour.
		for (const action of Object.keys(this.actions)) this.actions[action] = false
		if (this.paused) {
			this.paused = false
			this.clock.getDelta()
			this.update()
		}
		this.homeScreen.style.display = 'flex'
	}

	/** Affiche ou masque l'écran de pause, en suspendant la simulation. */
	public togglePause() {
		this.paused = !this.paused
		this.pauseScreen.style.display = this.paused ? 'flex' : 'none'
		if (this.paused) {
			showAd('pause', document.getElementById('ad-pause'))
		} else {
			// La boucle a été interrompue pendant la pause : sans cette remise à zéro,
			// getDelta() renverrait toute la durée de la pause d'un coup.
			this.clock.getDelta()
			this.update()
		}
	}

	public update() {
		if (this.paused) return ;
		requestAnimationFrame(this.updateMethod);
		// Borné : un onglet passé en arrière-plan suspend requestAnimationFrame, et au
		// retour un dt de plusieurs secondes fait exploser la simulation.
		var dt = Math.min(this.clock.getDelta(), 0.1);
		// this.time += dt;
		for (const entity of this.entities) {
			entity.update(dt)
		}
		if (this.started) {
			this.world.stepSimulation(dt , 10);
		}

		var ms = this.vehicle.body.getMotionState();
		ms.getWorldTransform(this.vehicle.TRANSFORM_AUX);
		var p = this.vehicle.TRANSFORM_AUX.getOrigin();
		var q = this.vehicle.TRANSFORM_AUX.getRotation();

		// Bullet travaille en mètres par seconde : il faut multiplier par 3,6 pour
		// afficher des km/h. Sans ça le compteur annonçait 6 quand le camion roulait
		// en réalité à 22 km/h.
		const velocity = this.vehicle.body.getLinearVelocity()
		const speed = velocity.length() * 3.6
		// Sens de marche : la vitesse projetée sur l'axe longitudinal du châssis.
		// getLinearVelocity().length() est toujours positif, donc le test « < 0 »
		// d'origine ne pouvait jamais afficher la marche arrière.
		const chassis = this.vehicle.TRANSFORM_AUX.getBasis()
		const forward = velocity.x() * chassis.getRow(0).z()
			+ velocity.y() * chassis.getRow(1).z()
			+ velocity.z() * chassis.getRow(2).z()
		// Zone morte : à l'arrêt le signe de la projection sautille.
		const reverse = speed > 1 && forward * FORWARD_AXIS_SIGN < 0

		// const position = "[" + Math.round(p.x()) + ", " + Math.round(p.y()) + ", " + Math.round(p.z()) + "]"
		this.speedometer.innerHTML = (reverse ? '(R) ' : '') + speed.toFixed(0) + ' km/h ' // + position;

		this.camera.position.x = p.x() + this.cameraX;
		this.camera.position.y = p.y() + this.cameraY;
		if (this.camera.position.y < 0.1) this.camera.position.y = 0.1
		this.camera.position.z = p.z() + this.cameraZ;
		this.lookTarget.set(p.x(), p.y() + 0.2, p.z())
		this.camera.lookAt(this.lookTarget);

		this.dirLight.position.set(p.x() + 100, p.y() + 50, p.z() + 100);
		this.dirLight.target = this.vehicle.mesh
		this.shadowTarget.set(p.x(), 0, p.z())
		this.dirLight.shadow.camera.lookAt(this.shadowTarget);
		// helper.update()

		this.cubeCamera1.position.set(p.x(), p.y(), p.z());
		this.cubeCamera1.quaternion.set(q.x(), q.y(), q.z(), q.w());

		// spotLight.target = truck

		if (this.started) {
			if (this.actions.acceleration || this.actions.braking) {
				const forceAbs = 15000
				const force = this.actions.acceleration ? forceAbs : -forceAbs
				this.vehicle.move(force)
			}
			if (this.actions.left || this.actions.right) {
				this.vehicle.steer(this.actions.left ? -0.01 : 0.01)
			} else {
				this.vehicle.releaseSteer()
			}
		}

		this.draw()
	}

	public draw() {

		// La sonde d'environnement rend la scène 6 fois (une par face du cube) : avec le
		// rendu principal, cela fait 7 rendus complets par image. Un rafraîchissement
		// une image sur trois est indiscernable sur un reflet de carrosserie et divise
		// le coût du rendu par plus de deux.
		if (this.frame % CUBE_CAMERA_INTERVAL === 0) {
			Model.TRUCK.visible = false
			for (const wheel of this.vehicle.wheels) {
				wheel.mesh.visible = false
			}
			this.cubeCamera1.update(this.renderer, this.scene);
			Model.TRUCK.visible = true
			for (const wheel of this.vehicle.wheels) {
				wheel.mesh.visible = true
			}
		}
		this.frame++
		this.renderer.render(this.scene, this.camera);

		if (this.stats) this.stats.update();
	}

	public setPaint() {
		// Le matériau est créé une seule fois puis modifié : en recréer un à chaque
		// mouvement de curseur laissait derrière lui autant de matériaux et de
		// programmes GPU jamais libérés.
		if (!this.paintMaterial) {
			this.paintMaterial = new THREE.MeshPhongMaterial()
			Model.TRUCK.traverse((o: any) => {
				if (o.isMesh) {
					if( o.name === "BodyC10003" || o.name === "BodyC10007" || o.name === "BodyC10010") {
						o.material = this.paintMaterial
					}
				}
			});
		}
		const material = this.paintMaterial
		material.shininess = this.currentMetallic * 3
		material.emissive.setHex(this.currentColor)
		material.emissiveIntensity = this.currentMetallic
		material.color.setHex(this.currentColor)
		material.specular.setHex(this.currentMetallic > 0 ? 0xffffff : 0x000000)
		const envMap = this.currentMetallic > 0 ? this.cubeRenderTarget.texture : null
		if (material.envMap !== envMap) {
			material.envMap = envMap
			// Changer la présence d'une envMap change le shader : il faut le recompiler.
			material.needsUpdate = true
		}
	}
}

export { Game }