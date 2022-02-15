import Ammo from 'ammojs-typed'
import * as THREE from 'three'
import { Game } from './game'

class Wheel {

	public body
	public mesh
	public constraint
	private TRANSFORM_AUX ;
	// private wire

	constructor(carBody: Ammo.btRigidBody, model: THREE.Group, x: number, dx: number, y: number, z: number, dz: number) {

		this.TRANSFORM_AUX = new Ammo.btTransform()

		var DISABLE_DEACTIVATION = 4;
		var wheelRadius = 0.85
		var wheelWidth = 1.2;
		// var wheelRadius = 0.6;
		// var wheelWidth = 0.6;
		var massWheel = 400
		var erp = 1

		var geometry = new Ammo.btCylinderShape(new Ammo.btVector3(wheelRadius, wheelWidth / 2, wheelRadius));
		// var geometry = new Ammo.btSphereShape(wheelRadius);
		// var geometry = new Ammo.btCapsuleShapeX(wheelRadius, wheelWidth);
		var transformW = new Ammo.btTransform();
		transformW.setIdentity();
		transformW.setOrigin(new Ammo.btVector3(x + dx, y, z + dz));
		var wheelRot = new Ammo.btQuaternion(0, 0, Math.PI / 2, Math.PI / 2)
		transformW.setRotation(wheelRot);
		var motionStateW = new Ammo.btDefaultMotionState(transformW);
		var localInertiaW = new Ammo.btVector3(0, 0, 0);
		geometry.calculateLocalInertia(massWheel, localInertiaW);
		this.body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massWheel, motionStateW, geometry, localInertiaW));
		this.body.setActivationState(DISABLE_DEACTIVATION);
		this.body.setFriction(500);
		this.body.setDamping(0.5, 0.8)
		// var material = new THREE.MeshPhongMaterial({ color: 0x222222 });
		// this.wire = this.createWheelMesh(scene, wheelRadius, wheelWidth, material)
		this.mesh = model.clone()
		// scene.add(model);

		for (const child of this.mesh.children) {
			child.castShadow = true
			child.receiveShadow = true
		}

		// Constraint Chassis <--> Wheel
		var frameA = new Ammo.btTransform();
		frameA.setIdentity();
		frameA.setOrigin(new Ammo.btVector3(dx * 0.5, -1.3, dz));
		// frameA.setRotation(new Ammo.btQuaternion(0, 0, -Math.PI / 2, -Math.PI / 2))
		var frameB = new Ammo.btTransform();
		frameB.setIdentity();
		frameB.setOrigin(new Ammo.btVector3(0, Math.sign(dx) * 0.5, 0));
		frameB.setRotation(new Ammo.btQuaternion(0, 0, -Math.PI / 2 , Math.PI / 2))

		this.constraint = new Ammo.btGeneric6DofSpringConstraint(carBody, this.body, frameA, frameB, false)
		// console.log("constraint", this.constraint)
		// var constraint = new Ammo.btGeneric6DofConstraint(this.spindleBody, this.body, frameA, frameB, true)
		// var constraint = new Ammo.btSliderConstraint(this.spindleBody, this.body, frameA, frameB, false)
		// constraint.setLowerLinLimit(0)
		// constraint.setUpperLinLimit(0)
		this.constraint.setLinearLowerLimit(new Ammo.btVector3( 0 , 0, 0));
		this.constraint.setLinearUpperLimit(new Ammo.btVector3( 0, 0.6,  0));
		this.constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, 0, 0));
		this.constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, 0, 0));
		this.constraint.enableSpring(1, true)
		this.constraint.setStiffness(1, 30000)
		this.constraint.setDamping(1, 0.75)
		// constraint.setLowerAngLimit(new Ammo.btVector3(-Math.PI, 0, 0));
		// constraint.setUpperAngLimit(new Ammo.btVector3(Math.PI, 0, 0));
		for (let i = 0; i < 6; ++i) this.constraint.setParam(1, erp, i)
		for (let i = 0; i < 6; ++i) this.constraint.setParam(2, erp, i)
		for (let i = 0; i < 6; ++i) this.constraint.setParam(3, 0, i)
		for (let i = 0; i < 6; ++i) this.constraint.setParam(4, 0, i)
		// var constraintMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), materialDynamic);
		// scene.add(constraintMesh);
	}

	public update() {
		var ms = this.body.getMotionState();
		if (ms) {
			ms.getWorldTransform(this.TRANSFORM_AUX);
			var p = this.TRANSFORM_AUX.getOrigin();
			var q = this.TRANSFORM_AUX.getRotation();
			this.mesh.position.set(p.x(), p.y(), p.z());
			this.mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
			// this.wire.position.set(p.x(), p.y(), p.z());
			// this.wire.quaternion.set(q.x(), q.y(), q.z(), q.w());
		}
	}
/*
	private createWheelMesh(scene, radius, width, material) {
		var t = new THREE.CylinderGeometry(radius, radius, width, 24, 1);
		// var t = new THREE.SphereGeometry(radius);
		// var t = new THREE.CapsuleGeometry(radius, width);

		// t.rotateZ(Math.PI / 2);
		var mesh = new THREE.Mesh(t, material);
		mesh.add(new THREE.Mesh(new THREE.BoxGeometry(width * 1.7, radius * 1.2, radius*.25, 1, 1, 1), material));
		// scene.add(mesh);
		const edges = new THREE.EdgesGeometry(t);
		const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 }));
		// scene.add(line);
		return line
	}
*/
	public add(game: Game) {
		game.scene.add(this.mesh)
		game.world.addRigidBody(this.body)
		game.world.addConstraint(this.constraint, true)
	}
}

export { Wheel }