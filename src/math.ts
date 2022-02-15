import Ammo from "ammojs-typed";

function dot3(v: Ammo.btVector3, v0: Ammo.btVector3, v1: Ammo.btVector3, v2: Ammo.btVector3) {
	// console.log("v0", v0.x(), v0.y(), v0.z())
	// console.log("v1", v1.x(), v1.y(), v1.z())
	return new Ammo.btVector3( v.dot(v0), v.dot(v1), v.dot(v2));
}

function quat_mul_vec3(q: Ammo.btQuaternion, w: Ammo.btVector3) {
	return new Ammo.btQuaternion(
		q.w() * w.x() + q.y() * w.z() - q.z() * w.y(),
		q.w() * w.y() + q.z() * w.x() - q.x() * w.z(),
		q.w() * w.z() + q.x() * w.y() - q.y() * w.x(),
		-q.x() * w.x() - q.y() * w.y() - q.z() * w.z());
}

export { dot3, quat_mul_vec3 }