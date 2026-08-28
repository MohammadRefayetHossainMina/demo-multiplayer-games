import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
} from "three";

const RESTOCK = 26;
const REACH = 1.7;
const PACK = { acr: 30, cqc: 25, pistol: 12 };

function crateMesh() {
  const root = new Group();
  const wood = new MeshStandardMaterial({
    color: 0x6a5136,
    roughness: 0.9,
    metalness: 0.04,
  });
  const brass = new MeshStandardMaterial({
    color: 0xc4a35a,
    roughness: 0.45,
    metalness: 0.35,
    emissive: 0x3a2a10,
    emissiveIntensity: 0.55,
  });
  const box = new Mesh(new BoxGeometry(0.72, 0.42, 0.52), wood);
  box.position.y = 0.21;
  box.castShadow = true;
  box.receiveShadow = true;
  const lid = new Mesh(new BoxGeometry(0.76, 0.08, 0.56), wood);
  lid.position.y = 0.44;
  const can = new Mesh(new CylinderGeometry(0.12, 0.12, 0.22, 10), brass);
  can.position.set(0.08, 0.55, 0.02);
  can.castShadow = true;
  const lamp = new PointLight(0xffc56a, 0.55, 4.5, 2);
  lamp.position.set(0, 0.7, 0);
  root.add(box, lid, can, lamp);
  return root;
}

export function createAmmoPacks(world, spots = []) {
  const packs = spots.map((spot) => {
    const mesh = crateMesh();
    mesh.position.set(spot.x, 0, spot.z);
    mesh.userData.ammo = true;
    world.add(mesh);
    return {
      mesh,
      x: spot.x,
      z: spot.z,
      taken: false,
      restock: 0,
    };
  });

  function restore(pack) {
    pack.taken = false;
    pack.restock = 0;
    pack.mesh.visible = true;
  }

  return {
    step(dt, player, onCollect) {
      if (!player) return;
      for (const pack of packs) {
        if (pack.taken) {
          pack.restock -= dt;
          if (pack.restock <= 0) restore(pack);
          continue;
        }
        const dist = Math.hypot(player.x - pack.x, player.z - pack.z);
        if (dist > REACH) continue;
        pack.taken = true;
        pack.restock = RESTOCK;
        pack.mesh.visible = false;
        onCollect?.({ ...PACK, x: pack.x, z: pack.z });
      }
    },
    blips() {
      return packs
        .filter((pack) => !pack.taken)
        .map((pack) => ({ x: pack.x, z: pack.z, kind: "ammo" }));
    },
    reset() {
      for (const pack of packs) restore(pack);
    },
  };
}
