import { Box3, Group, Vector3 } from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
loader.setDRACOLoader(draco);

const SIZE = new Vector3();
const CENTER = new Vector3();

export const SKETCHFAB_CREDITS = {
  acr: {
    name: "Adaptive Combat Rifle",
    author: "doomsentinel",
    license: "CC BY 4.0",
    url: "https://sketchfab.com/3d-models/adaptive-combat-rifle-a18a8008a299430caa5f1fe05563c949",
  },
  cqc: {
    name: "CQC171",
    author: "flyinglist1",
    license: "CC BY 4.0",
    url: "https://sketchfab.com/3d-models/cqc171-15c40d3c13f94e98a0cd51836cf4d7ed",
  },
  pistol: {
    name: "Pistol",
    author: "SINNIK",
    license: "CC BY 4.0",
    url: "https://sketchfab.com/3d-models/pistol-54c52df11e164b42992a7d418d99cd3f",
  },
  bloodPriest: {
    name: "Blood Priest in Crimson Ritual Robes",
    author: "Pigcraft",
    license: "CC BY 4.0",
    url: "https://sketchfab.com/3d-models/blood-priest-in-crimson-ritual-robes-8055a4c59bf7451c8b95db8baab58909",
  },
  cultist: {
    name: "Ash-Grey Cultist - Ritual Mask & Chains",
    author: "Pigcraft",
    license: "CC BY 4.0",
    url: "https://sketchfab.com/3d-models/ash-grey-cultist-ritual-mask-chains-ead4dc1528374115a9d392ee7c1ef63d",
  },
};

const WEAPON_URLS = {
  acr: [
    "/assets/sketchfab/weapons/acr.glb",
    "/assets/sketchfab/weapons/acr/scene.gltf",
    "/assets/sketchfab/weapons/scene.gltf",
  ],
  cqc: [
    "/assets/sketchfab/weapons/cqc171.glb",
    "/assets/sketchfab/weapons/cqc171/scene.gltf",
  ],
  pistol: [
    "/assets/sketchfab/weapons/pistol.glb",
    "/assets/sketchfab/weapons/pistol/scene.gltf",
  ],
};

function loadGltf(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

export async function tryLoadGltf(urls) {
  for (const url of urls) {
    try {
      const probe = await fetch(url, { method: "GET" });
      if (!probe.ok) continue;
      const gltf = await loadGltf(url);
      if (gltf?.scene) return gltf.scene;
    } catch {
      /* try next drop-in path */
    }
  }
  return null;
}

export function fitViewmodel(model, targetLength = 0.7) {
  const holder = new Group();
  holder.add(model);
  holder.updateMatrixWorld(true);
  const box = new Box3().setFromObject(model);
  box.getSize(SIZE);
  box.getCenter(CENTER);
  model.position.sub(CENTER);
  const longest = Math.max(SIZE.x, SIZE.y, SIZE.z, 0.001);
  holder.scale.setScalar(targetLength / longest);
  if (SIZE.x >= SIZE.y && SIZE.x >= SIZE.z) {
    holder.rotation.y = Math.PI / 2;
  } else if (SIZE.y >= SIZE.x && SIZE.y >= SIZE.z) {
    holder.rotation.x = Math.PI / 2;
  } else if (SIZE.z >= SIZE.x && SIZE.z >= SIZE.y) {
    holder.rotation.y = Math.PI;
  }
  return holder;
}

export function markViewLayer(root, layer) {
  root.traverse((child) => {
    child.layers.set(layer);
    child.frustumCulled = false;
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });
}

export function loadWeaponModel(kind) {
  return tryLoadGltf(WEAPON_URLS[kind] || []);
}

export function loadAcrRifle() {
  return loadWeaponModel("acr");
}
