import { Entity } from "./entity"
import Ammo from 'ammojs-typed'
import { Model } from "./model"
import { Wheel } from "./wheel"
import { Game } from "./game"
import { dot3 } from "./math"

class Vehicle extends Entity {

	public body: Ammo.btRigidBody
	public mesh: THREE.Group
	public TRANSFORM_AUX = new Ammo.btTransform();
	public wheels: Wheel[] = []
	private direction = 0

	public constructor(pos: THREE.Vector3) {
		super()

		var chassisWidth = 2.5;
		var chassisHeight = 1.5;
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
		this.body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle, motionState, geometry, localInertia));
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
		const wheel1 = new Wheel(this.body, Model.WHEEL, pos.x, -dx, pos.y, pos.z, oz + dz)
		const wheel2 = new Wheel(this.body, Model.WHEEL, pos.x, dx, pos.y, pos.z, oz + dz)
		const wheel3 = new Wheel(this.body, Model.WHEEL, pos.x, -dx, pos.y, pos.z, oz - dz)
		const wheel4 = new Wheel(this.body, Model.WHEEL, pos.x, dx, pos.y, pos.z, oz - dz)
		// const wheel5 = new Wheel(physicsWorld, scene, body, pos.x - dx, pos.y, pos.z - 0)
		// const wheel6 = new Wheel(physicsWorld, scene, body, pos.x + dx, pos.y, pos.z - 0)
		this.wheels = [wheel1, wheel2, wheel3, wheel4,
			// wheel5, wheel6
		]
	}

	public add(game: Game) {
		game.world.addRigidBody(this.body)
		game.scene.add(this.mesh)
		for (const wheel of this.wheels) {
			game.addEntity(wheel)
		}
	}

	move(force: number) {
		const torqueOrigin = new Ammo.btVector3( 0, -force, 0)

		// for (const wheel of [wheel3, wheel4]) {
		for (const wheel of this.wheels) {

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

	steer(dir: number) {
		const max = 0.3
		this.direction += dir
		if (this.direction < -max) this.direction = -max
		if (this.direction > max) this.direction = max
		this.wheels[0].constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, this.direction, 0));
		this.wheels[0].constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, this.direction, 0));
		this.wheels[1].constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, this.direction, 0,));
		this.wheels[1].constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, this.direction, 0));
		this.wheels[2].constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, -this.direction, 0));
		this.wheels[2].constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, -this.direction, 0));
		this.wheels[3].constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, -this.direction, 0,));
		this.wheels[3].constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, -this.direction, 0));
	}

	releaseSteer() {
		this.direction *= 0.9
		this.wheels[0].constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, this.direction, 0));
		this.wheels[0].constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, this.direction, 0));
		this.wheels[1].constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, this.direction, 0,));
		this.wheels[1].constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, this.direction, 0));
		this.wheels[2].constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, -this.direction, 0));
		this.wheels[2].constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, -this.direction, 0));
		this.wheels[3].constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, -this.direction, 0,));
		this.wheels[3].constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, -this.direction, 0));
	}

	public update() {
		var ms = this.body.getMotionState();
		if (ms) {
			ms.getWorldTransform(this.TRANSFORM_AUX);
			var p = this.TRANSFORM_AUX.getOrigin();
			var q = this.TRANSFORM_AUX.getRotation();
			this.mesh.position.set(p.x(), p.y(), p.z());
			this.mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
			// chassisMesh2.position.set(p.x(), p.y(), p.z());
			// chassisMesh2.quaternion.set(q.x(), q.y(), q.z(), q.w());
		}
	}
}

export { Vehicle }