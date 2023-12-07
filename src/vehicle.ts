import { Entity } from "./entity"
import Ammo from 'ammojs-typed'
import { Model } from "./model"
import { Wheel } from "./wheel"
import { Game } from "./game"
import { dot3 } from "./math"
import * as THREE from 'three'

class Vehicle extends Entity {

	public body: Ammo.btRigidBody
	public mesh: THREE.Group
	public TRANSFORM_AUX
	public wheels: Wheel[] = []
	private direction = 0
	// public cube: THREE.Mesh

	public constructor(ammo: typeof Ammo, pos: THREE.Vector3) {
		super()

		this.TRANSFORM_AUX = new ammo.btTransform();

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

	move(ammo: typeof Ammo, force: number) {
		const torqueOrigin = new ammo.btVector3( 0, -force, 0)

		// for (const wheel of [wheel3, wheel4]) {
		for (const wheel of this.wheels) {

			var basis = wheel.body.getCenterOfMassTransform().getBasis()

			let row0 = basis.getRow(0)
			row0 = new ammo.btVector3(row0.x(), row0.y(), row0.z())
			let row1 = basis.getRow(1)
			row1 = new ammo.btVector3(row1.x(), row1.y(), row1.z())
			let row2 = basis.getRow(2)
			row2 = new ammo.btVector3(row2.x(), row2.y(), row2.z())
			const torque = dot3(ammo, torqueOrigin, row0, row1, row2)

			// console.log("torque", torque.x(), torque.y(), torque.z())

			wheel.body.applyTorque(torque)
		}
	}

	steer(ammo: typeof Ammo, dir: number) {
		const max = 0.3
		this.direction += dir
		if (this.direction < -max) this.direction = -max
		if (this.direction > max) this.direction = max
		this.wheels[0].constraint.setAngularLowerLimit(new ammo.btVector3( -Math.PI, this.direction, 0));
		this.wheels[0].constraint.setAngularUpperLimit(new ammo.btVector3( Math.PI, this.direction, 0));
		this.wheels[1].constraint.setAngularLowerLimit(new ammo.btVector3( -Math.PI, this.direction, 0,));
		this.wheels[1].constraint.setAngularUpperLimit(new ammo.btVector3( Math.PI, this.direction, 0));
		this.wheels[2].constraint.setAngularLowerLimit(new ammo.btVector3( -Math.PI, -this.direction, 0));
		this.wheels[2].constraint.setAngularUpperLimit(new ammo.btVector3( Math.PI, -this.direction, 0));
		this.wheels[3].constraint.setAngularLowerLimit(new ammo.btVector3( -Math.PI, -this.direction, 0,));
		this.wheels[3].constraint.setAngularUpperLimit(new ammo.btVector3( Math.PI, -this.direction, 0));
	}

	releaseSteer(ammo: typeof Ammo) {
		this.direction *= 0.9
		this.wheels[0].constraint.setAngularLowerLimit(new ammo.btVector3( -Math.PI, this.direction, 0));
		this.wheels[0].constraint.setAngularUpperLimit(new ammo.btVector3( Math.PI, this.direction, 0));
		this.wheels[1].constraint.setAngularLowerLimit(new ammo.btVector3( -Math.PI, this.direction, 0,));
		this.wheels[1].constraint.setAngularUpperLimit(new ammo.btVector3( Math.PI, this.direction, 0));
		this.wheels[2].constraint.setAngularLowerLimit(new ammo.btVector3( -Math.PI, -this.direction, 0));
		this.wheels[2].constraint.setAngularUpperLimit(new ammo.btVector3( Math.PI, -this.direction, 0));
		this.wheels[3].constraint.setAngularLowerLimit(new ammo.btVector3( -Math.PI, -this.direction, 0,));
		this.wheels[3].constraint.setAngularUpperLimit(new ammo.btVector3( Math.PI, -this.direction, 0));
	}

	public jump(ammo: typeof Ammo) {
		const force = 20000
		this.body.applyCentralImpulse(new ammo.btVector3( 0, force, 0) )
		// for (const wheel of this.wheels) {
			// wheel.body.applyCentralImpulse(new ammo.btVector3( 0, force / 3, 0) )
		// }
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