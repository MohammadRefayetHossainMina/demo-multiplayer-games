import {
  Box3,
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
} from "three";

function gunMat(color) {
  return new MeshBasicMaterial({ color, depthTest: false });
}

function part(geo, mat, x, y, z, rx = 0) {
  const mesh = new Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.x = rx;
  mesh.renderOrder = 2;
  mesh.frustumCulled = false;
  return mesh;
}

export function buildHeldRifle() {
  const g = new Group();
  g.name = "held-rifle";
  const polymer = gunMat(0xe8c98a);
  const metal = gunMat(0xc8c2b8);
  const dark = gunMat(0x4f4940);

  g.add(part(new BoxGeometry(0.07, 0.08, 0.28), polymer, 0, 0.02, 0.02));
  g.add(part(new BoxGeometry(0.055, 0.06, 0.12), dark, 0, 0.02, -0.16));
  g.add(part(new CylinderGeometry(0.016, 0.013, 0.2, 8), metal, 0, 0.025, -0.3, Math.PI / 2));
  g.add(part(new BoxGeometry(0.04, 0.12, 0.045), dark, 0, -0.06, 0.05));
  g.add(part(new BoxGeometry(0.045, 0.08, 0.1), polymer, 0, -0.04, 0.16, 0.28));
  g.add(part(new BoxGeometry(0.045, 0.025, 0.16), dark, 0, 0.06, -0.02));

  const muzzle = new Object3D();
  muzzle.name = "muzzle";
  muzzle.position.set(0, 0.025, -0.4);
  g.add(muzzle);

  const flash = new Mesh(new SphereGeometry(0.028, 6, 6), gunMat(0xffd27a));
  flash.name = "muzzle-flash";
  flash.position.copy(muzzle.position);
  flash.visible = false;
  flash.renderOrder = 3;
  flash.frustumCulled = false;
  g.add(flash);

  return g;
}

export function attachHeldRifle(root) {
  const rifle = buildHeldRifle();
  const s = Math.max(root.scale?.x || 1, 0.001);
  rifle.scale.setScalar(1.35 / s);
  root.updateMatrixWorld(true);
  const body = root.getObjectByName("body-mesh");
  const box = new Box3();
  if (body) box.setFromObject(body);
  else box.setFromObject(root);
  const chest = box.min.y + (box.max.y - box.min.y) * 0.62;
  const holdY = (chest - (root.position.y || 0)) / s;
  rifle.position.set(-0.28 / s, holdY, 0.2 / s);
  rifle.rotation.set(0.08, Math.PI, 0.05);
  root.add(rifle);
  return rifle.getObjectByName("muzzle");
}
