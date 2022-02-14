import * as THREE from 'three';
import Ammo from './ammo.js'

class Wheel {

	private body
	private mesh
	private spindleBody
	private spindleMesh
	private constraint
	private spindleConstraint
	private TRANSFORM_AUX ;
	private wire

	constructor(world, scene, carBody, model, x: number, y: number, z: number) {

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
		transformW.setOrigin(new Ammo.btVector3(x, y, z));
		var wheelRot = new Ammo.btQuaternion(0, 0, Math.PI / 2, Math.PI / 2)
		transformW.setRotation(wheelRot);
		var motionStateW = new Ammo.btDefaultMotionState(transformW);
		var localInertiaW = new Ammo.btVector3(0, 0, 0);
		geometry.calculateLocalInertia(massWheel, localInertiaW);
		this.body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massWheel, motionStateW, geometry, localInertiaW));
		this.body.setActivationState(DISABLE_DEACTIVATION);
		this.body.setFriction(500);
		world.addRigidBody(this.body);
		var material = new THREE.MeshPhongMaterial({ color: 0x222222 });
		this.wire = this.createWheelMesh(scene, wheelRadius, wheelWidth, material)
		this.mesh = model
		scene.add(model);

		for (const child of model.children) {
			child.castShadow = true
			child.receiveShadow = true
		}

		// Spindle
		/*
		var spindleMass = 20
		var geometry = new Ammo.btBoxShape(new Ammo.btVector3(0.25, 0.25, 0.25));
		var transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(x * 0.4, y - 1, z));
		transform.setRotation(new Ammo.btQuaternion(0, 0, Math.PI / 2, Math.PI / 2))
		var motionState = new Ammo.btDefaultMotionState(transform);
		var localInertia = new Ammo.btVector3(0, 0, 0);
		geometry.calculateLocalInertia(spindleMass, localInertia);
		this.spindleBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(spindleMass, motionState, geometry, localInertia));
		world.addRigidBody(this.spindleBody);
		var shape = new THREE.BoxGeometry(0.5, 0.5, 0.5);
		var spindleMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
		this.spindleMesh = new THREE.Mesh(shape, spindleMaterial);
		scene.add(this.spindleMesh);

		// Constraint Spindle <--> Body
		var sframeA = new Ammo.btTransform();
		sframeA.setIdentity();
		sframeA.setOrigin(new Ammo.btVector3(x * 0.4, -0.5, z));
		sframeA.setRotation(new Ammo.btQuaternion(0, 0, Math.PI / 2, Math.PI / 2))
		var sframeB = new Ammo.btTransform();
		sframeB.setIdentity();
		sframeB.setOrigin(new Ammo.btVector3(0, 0, 0));
		// var constraintS = new Ammo.btSliderConstraint(carBody, this.spindleBody, sframeA, sframeB, true)
		this.spindleConstraint = new Ammo.btGeneric6DofSpringConstraint(carBody, this.spindleBody, sframeA, sframeB, true)
		console.log(this.spindleConstraint)
		// console.log("constraintS", this.spindleConstraint)
		// constraintS.setLowerAngLimit(new Ammo.btVector3(-Math.PI, 0, 0));
		// constraintS.setUpperAngLimit(new Ammo.btVector3(Math.PI, 0, 0));
		this.spindleConstraint.setLinearLowerLimit(new Ammo.btVector3( 0 , 0, 0));
		this.spindleConstraint.setLinearUpperLimit(new Ammo.btVector3( 0.5, 0,  0));
		// this.spindleConstraint.setLinearUpperLimit(new Ammo.btVector3( 0.8, 0,  0));
		this.spindleConstraint.setAngularLowerLimit(new Ammo.btVector3( 0, 0, 0));
		this.spindleConstraint.setAngularUpperLimit(new Ammo.btVector3( 0, 0, 0));
		this.spindleConstraint.enableSpring(0, true)
		this.spindleConstraint.setStiffness(0, 20000, false)
		// this.spindleConstraint.setDamping(0, 10000)
		// constraintS.setLowerLinLimit(0)
		// constraintS.setUpperLinLimit(0.5)
		// constraintS.setSoftnessDirLin(10)
		for (let i = 0; i < 6; ++i) this.spindleConstraint.setParam(1, erp, i)
		for (let i = 0; i < 6; ++i) this.spindleConstraint.setParam(2, erp, i)
		for (let i = 0; i < 6; ++i) this.spindleConstraint.setParam(3, 0, i)
		for (let i = 0; i < 6; ++i) this.spindleConstraint.setParam(4, 0, i)
		world.addConstraint(this.spindleConstraint, false)
		*/

		// Constraint Spindle <--> Wheel
		var frameA = new Ammo.btTransform();
		frameA.setIdentity();
		frameA.setOrigin(new Ammo.btVector3(x * 0.5, -1.15, z));
		// frameA.setRotation(new Ammo.btQuaternion(0, 0, -Math.PI / 2, -Math.PI / 2))
		var frameB = new Ammo.btTransform();
		frameB.setIdentity();
		frameB.setOrigin(new Ammo.btVector3(0, Math.sign(x) * 0.5, 0));
		frameB.setRotation(new Ammo.btQuaternion(0, 0, -Math.PI / 2 , Math.PI / 2))

		this.constraint = new Ammo.btGeneric6DofSpringConstraint(carBody, this.body, frameA, frameB, false)
		console.log("constraint", this.constraint)
		// var constraint = new Ammo.btGeneric6DofConstraint(this.spindleBody, this.body, frameA, frameB, true)
		// var constraint = new Ammo.btSliderConstraint(this.spindleBody, this.body, frameA, frameB, false)
		// constraint.setLowerLinLimit(0)
		// constraint.setUpperLinLimit(0)
		this.constraint.setLinearLowerLimit(new Ammo.btVector3( 0 , 0, 0));
		this.constraint.setLinearUpperLimit(new Ammo.btVector3( 0, 0.8,  0));
		this.constraint.setAngularLowerLimit(new Ammo.btVector3( -Math.PI, 0, 0));
		this.constraint.setAngularUpperLimit(new Ammo.btVector3( Math.PI, 0, 0));
		this.constraint.enableSpring(1, true)
		this.constraint.setStiffness(1, 40000)
		// this.constraint.setDamping(1, 0.001)
		// constraint.setLowerAngLimit(new Ammo.btVector3(-Math.PI, 0, 0));
		// constraint.setUpperAngLimit(new Ammo.btVector3(Math.PI, 0, 0));
		for (let i = 0; i < 6; ++i) this.constraint.setParam(1, erp, i)
		for (let i = 0; i < 6; ++i) this.constraint.setParam(2, erp, i)
		for (let i = 0; i < 6; ++i) this.constraint.setParam(3, 0, i)
		for (let i = 0; i < 6; ++i) this.constraint.setParam(4, 0, i)
		world.addConstraint(this.constraint, true)
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
			this.wire.position.set(p.x(), p.y(), p.z());
			this.wire.quaternion.set(q.x(), q.y(), q.z(), q.w());
		}
		// var msS = this.spindleBody.getMotionState();
		// if (msS) {
		// 	msS.getWorldTransform(this.TRANSFORM_AUX);
		// 	var p = this.TRANSFORM_AUX.getOrigin();
		// 	var q = this.TRANSFORM_AUX.getRotation();
		// 	this.spindleMesh.position.set(p.x(), p.y(), p.z());
		// 	this.spindleMesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
		// }
	}


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
}

export { Wheel }