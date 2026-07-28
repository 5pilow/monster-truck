import { Entity } from "./entity"
import Ammo from 'ammojs-typed'
import { Model } from "./model"
import { Wheel } from "./wheel"
import { Game } from "./game"
import * as THREE from 'three'

class Vehicle extends Entity {

	public body: Ammo.btRigidBody
	public mesh: THREE.Group
	public TRANSFORM_AUX
	public wheels: Wheel[] = []
	private direction = 0
	// public cube: THREE.Mesh

	// Ammo est compilé en WebAssembly : ses objets sont alloués dans le tas WASM et
	// ne sont PAS ramassés par le GC de JavaScript. Tout btVector3 créé dans une
	// méthode appelée à chaque frame fuit donc définitivement. Ces vecteurs sont
	// alloués une seule fois puis réutilisés via setValue().
	private tmpTorque: Ammo.btVector3
	private angularLowerFront: Ammo.btVector3
	private angularUpperFront: Ammo.btVector3
	private angularLowerRear: Ammo.btVector3
	private angularUpperRear: Ammo.btVector3
	private jumpImpulse: Ammo.btVector3

	public constructor(ammo: typeof Ammo, pos: THREE.Vector3) {
		super()

		this.TRANSFORM_AUX = new ammo.btTransform();

		this.tmpTorque = new ammo.btVector3(0, 0, 0)
		this.angularLowerFront = new ammo.btVector3(0, 0, 0)
		this.angularUpperFront = new ammo.btVector3(0, 0, 0)
		this.angularLowerRear = new ammo.btVector3(0, 0, 0)
		this.angularUpperRear = new ammo.btVector3(0, 0, 0)
		this.jumpImpulse = new ammo.btVector3(0, 0, 0)

		var chassisWidth = 1.25;
		var chassisHeight = 1.0;
		var chassisLength = 2.95;
		var massVehicle = 1000;

		// Chassis
		var geometry = new ammo.btBoxShape(new ammo.btVector3(chassisWidth, chassisHeight, chassisLength));
		// this.cube = new THREE.Mesh( new THREE.BoxGeometry( chassisWidth * 2, chassisHeight * 2, chassisLength * 2 ), new THREE.MeshBasicMaterial( {
		// 	blendAlpha: 1.0, color: 0x0000ff,
		// 	transparent: true, opacity: 0.3
		// } ) );
		var transform = new ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new ammo.btVector3(pos.x, pos.y, pos.z));
		// transform.setRotation(new ammo.btQuaternion(1.0, Math.PI / 4, 1.0, Math.PI / 4));
		var motionState = new ammo.btDefaultMotionState(transform);
		var localInertia = new ammo.btVector3(0, 0, 0);
		geometry.calculateLocalInertia(massVehicle, localInertia);
		this.body = new ammo.btRigidBody(new ammo.btRigidBodyConstructionInfo(massVehicle, motionState, geometry, localInertia));
		// body.setActivationState(DISABLE_DEACTIVATION);

		// var [chassisMesh3, chassisMesh2] = createChassisMesh(chassisWidth, chassisHeight, chassisLength);
		this.mesh = Model.TRUCK

		for (const child of this.mesh.children) {
			child.castShadow = true
			child.receiveShadow = true
		}
		// chassisMesh.receiveShadow = false; //default

		var dx = 2.2
		var dz = 1.8
		var oz = 0
		const wheel1 = new Wheel(ammo, this.body, Model.WHEEL, pos.x, -dx, pos.y, pos.z, oz + dz)
		const wheel2 = new Wheel(ammo, this.body, Model.WHEEL, pos.x, dx, pos.y, pos.z, oz + dz)
		const wheel3 = new Wheel(ammo, this.body, Model.WHEEL, pos.x, -dx, pos.y, pos.z, oz - dz)
		const wheel4 = new Wheel(ammo, this.body, Model.WHEEL, pos.x, dx, pos.y, pos.z, oz - dz)
		// const wheel5 = new Wheel(ammo, this.body, Model.WHEEL, pos.x, -dx, pos.y, pos.z, oz)
		// const wheel6 = new Wheel(ammo, this.body, Model.WHEEL, pos.x, dx, pos.y, pos.z, oz)
		this.wheels = [wheel1, wheel2, wheel3, wheel4,
			// wheel5, wheel6
		]
	}

	public add(game: Game) {
		game.world.addRigidBody(this.body)
		game.scene.add(this.mesh)
		// game.scene.add(this.cube)
		for (const wheel of this.wheels) {
			game.addEntity(wheel)
		}
	}

	move(force: number) {

		// for (const wheel of [wheel3, wheel4]) {
		for (const wheel of this.wheels) {

			var basis = wheel.body.getCenterOfMassTransform().getBasis()

			// Le couple (0, -force, 0) exprimé dans le repère de la roue, c'est-à-dire
			// projeté sur les lignes de sa base : seule la composante y compte.
			const y0 = basis.getRow(0).y()
			const y1 = basis.getRow(1).y()
			const y2 = basis.getRow(2).y()
			this.tmpTorque.setValue(-force * y0, -force * y1, -force * y2)

			wheel.body.applyTorque(this.tmpTorque)
		}
	}

	steer(dir: number) {
		const max = 0.3
		this.direction += dir
		if (this.direction < -max) this.direction = -max
		if (this.direction > max) this.direction = max
		this.applySteer()
	}

	releaseSteer() {
		// Une fois le braquage revenu à zéro il n'y a plus rien à faire : sans cette
		// sortie anticipée on repousserait les mêmes limites à chaque frame pour rien.
		if (this.direction === 0) return
		this.direction *= 0.9
		if (Math.abs(this.direction) < 1e-4) this.direction = 0
		this.applySteer()
	}

	private applySteer() {
		this.angularLowerFront.setValue(-Math.PI, this.direction, 0)
		this.angularUpperFront.setValue(Math.PI, this.direction, 0)
		this.angularLowerRear.setValue(-Math.PI, -this.direction, 0)
		this.angularUpperRear.setValue(Math.PI, -this.direction, 0)
		this.wheels[0].constraint.setAngularLowerLimit(this.angularLowerFront);
		this.wheels[0].constraint.setAngularUpperLimit(this.angularUpperFront);
		this.wheels[1].constraint.setAngularLowerLimit(this.angularLowerFront);
		this.wheels[1].constraint.setAngularUpperLimit(this.angularUpperFront);
		this.wheels[2].constraint.setAngularLowerLimit(this.angularLowerRear);
		this.wheels[2].constraint.setAngularUpperLimit(this.angularUpperRear);
		this.wheels[3].constraint.setAngularLowerLimit(this.angularLowerRear);
		this.wheels[3].constraint.setAngularUpperLimit(this.angularUpperRear);
	}

	public jump() {
		const force = 20000
		this.jumpImpulse.setValue(0, force, 0)
		this.body.applyCentralImpulse(this.jumpImpulse)
	}

	public update() {
		var ms = this.body.getMotionState();
		if (ms) {
			ms.getWorldTransform(this.TRANSFORM_AUX);
			var p = this.TRANSFORM_AUX.getOrigin();
			var q = this.TRANSFORM_AUX.getRotation();
			this.mesh.position.set(p.x(), p.y(), p.z());
			this.mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());

			// this.cube.position.set(p.x(), p.y(), p.z());
			// this.cube.quaternion.set(q.x(), q.y(), q.z(), q.w());
			// chassisMesh2.position.set(p.x(), p.y(), p.z());
			// chassisMesh2.quaternion.set(q.x(), q.y(), q.z(), q.w());
		}
	}

	public setSuspension(suspension: number) {
		for (const wheel of this.wheels) {
			wheel.constraint.setStiffness(1, 5000 + suspension * 10000)
			// wheel.constraint.setDamping(1, suspension / 5)
		}
	}
	public setHeight(ammo: typeof Ammo, height: number) {
		const h = Math.max(0.1, (5 - height) / 5)
		for (const wheel of this.wheels) {
			// wheel.constraint.setLinearLowerLimit(new ammo.btVector3( 0, -h,  0));
			wheel.constraint.setLinearUpperLimit(new ammo.btVector3( 0, h,  0));
		}
	}
}

export { Vehicle }