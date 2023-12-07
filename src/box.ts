import THREE from "three"
import Ammo from 'ammojs-typed'
import { Entity } from "./entity";
import { Model } from "./model.js";
import { Game } from "./game";

class Box extends Entity {

	public body: Ammo.btRigidBody
	public mesh: THREE.Group
	private TRANSFORM_AUX: Ammo.btTransform

	public constructor(ammo: typeof Ammo, w: number, l: number, h: number, pos: THREE.Vector3) {
		super()

		this.TRANSFORM_AUX = new ammo.btTransform();

		const mass = 75
		const friction = 10
		var geometry = new ammo.btBoxShape(new ammo.btVector3(w * 0.5, l * 0.5, h * 0.5));

		this.mesh = Model.CRATE.clone()
		this.mesh.position.copy(pos);
		// mesh.quaternion.copy(quat);

		var transform = new ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new ammo.btVector3(pos.x, pos.y, pos.z));
		// transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		var motionState = new ammo.btDefaultMotionState(transform);

		var localInertia = new ammo.btVector3(0, 0, 0);
		geometry.calculateLocalInertia(mass, localInertia);

		var rbInfo = new ammo.btRigidBodyConstructionInfo(mass, motionState, geometry, localInertia);
		this.body = new ammo.btRigidBody(rbInfo);

		this.body.setFriction(friction);
		//body.setRestitution(.9);
		//body.setDamping(0.2, 0.2);
	}

	public add(game: Game) {
		game.world.addRigidBody(this.body)
		game.scene.add(this.mesh)
	}

	public remove(game: Game) {
		game.world.removeRigidBody(this.body)
		game.scene.remove(this.mesh)
	}

	public update() {
		var ms = this.body.getMotionState();
		if (ms) {
			ms.getWorldTransform(this.TRANSFORM_AUX);
			var p = this.TRANSFORM_AUX.getOrigin();
			var q = this.TRANSFORM_AUX.getRotation();
			this.mesh.position.set(p.x(), p.y(), p.z());
			this.mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
		}
	}
}

export { Box }