import THREE from "three"
import Ammo from 'ammojs-typed'
import { Entity } from "./entity";
import { Model } from "./model.js";
import { Game } from "./game";

class Box extends Entity {

	public body: Ammo.btRigidBody
	public mesh: THREE.Group
	private TRANSFORM_AUX: Ammo.btTransform
	private ammo: typeof Ammo
	private shape: Ammo.btBoxShape
	private motionState: Ammo.btDefaultMotionState

	public constructor(ammo: typeof Ammo, w: number, l: number, h: number, pos: THREE.Vector3) {
		super()

		this.ammo = ammo
		this.TRANSFORM_AUX = new ammo.btTransform();

		const mass = 75
		const friction = 10
		const halfExtents = new ammo.btVector3(w * 0.5, l * 0.5, h * 0.5)
		this.shape = new ammo.btBoxShape(halfExtents);

		this.mesh = Model.CRATE.clone()
		this.mesh.position.copy(pos);
		// mesh.quaternion.copy(quat);

		var transform = new ammo.btTransform();
		transform.setIdentity();
		const origin = new ammo.btVector3(pos.x, pos.y, pos.z)
		transform.setOrigin(origin);
		// transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		this.motionState = new ammo.btDefaultMotionState(transform);

		var localInertia = new ammo.btVector3(0, 0, 0);
		this.shape.calculateLocalInertia(mass, localInertia);

		var rbInfo = new ammo.btRigidBodyConstructionInfo(mass, this.motionState, this.shape, localInertia);
		this.body = new ammo.btRigidBody(rbInfo);

		this.body.setFriction(friction);
		//body.setRestitution(.9);
		//body.setDamping(0.2, 0.2);

		// Ces objets ne servent qu'à la construction : leurs valeurs ont été recopiées
		// dans la forme, l'état de mouvement et le corps. Le tas WASM n'étant pas
		// ramassé automatiquement, il faut les libérer explicitement.
		ammo.destroy(rbInfo)
		ammo.destroy(localInertia)
		ammo.destroy(transform)
		ammo.destroy(origin)
		ammo.destroy(halfExtents)
	}

	public add(game: Game) {
		game.world.addRigidBody(this.body)
		game.scene.add(this.mesh)
	}

	public remove(game: Game) {
		game.world.removeRigidBody(this.body)
		game.scene.remove(this.mesh)
	}

	/** Libère les objets Ammo de la caisse. À n'appeler qu'après remove(). */
	public dispose() {
		this.ammo.destroy(this.body)
		this.ammo.destroy(this.motionState)
		this.ammo.destroy(this.shape)
		this.ammo.destroy(this.TRANSFORM_AUX)
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