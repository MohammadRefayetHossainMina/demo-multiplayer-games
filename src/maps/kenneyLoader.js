import { Box3, LoadingManager, RepeatWrapping, SRGBColorSpace, TextureLoader } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import suburbanAtlasUrl from "../assets/kenney/suburban/colormap.png?url";
import roadsAtlasUrl from "../assets/kenney/roads/Textures/colormap.png?url";

const textures = new TextureLoader();

function loadAtlas(url) {
  const map = textures.load(url);
  map.colorSpace = SRGBColorSpace;
  map.flipY = false;
  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  map.userData.shared = true;
  return map;
}

const suburbanAtlas = loadAtlas(suburbanAtlasUrl);
const roadsAtlas = loadAtlas(roadsAtlasUrl);

const manager = new LoadingManager();
manager.setURLModifier((url) => {
  if (url.includes("colormap.png")) {
    return url.includes("roads") ? roadsAtlasUrl : suburbanAtlasUrl;
  }
  return url;
});
const loader = new GLTFLoader(manager);
const glbCache = new Map();

function atlasFor(kind) {
  return kind === "roads" ? roadsAtlas : suburbanAtlas;
}

export function loadKenneyGlb(url, kind = "suburban") {
  const key = kind + ":" + url;
  if (!glbCache.has(key)) {
    glbCache.set(
      key,
      new Promise((resolve, reject) => {
        loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
      })
    );
  }
  return glbCache.get(key);
}

export async function placeKenney(THREE, world, url, x, z, rotY = 0, scale = 8, kind = "suburban") {
  const model = await loadKenneyGlb(url, kind);
  const root = model.clone(true);
  const map = atlasFor(kind);
  root.traverse((child) => {
    if (!child.isMesh) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    const next = mats.map((mat) => {
      const painted = mat.clone();
      painted.map = map;
      painted.needsUpdate = true;
      return painted;
    });
    child.material = next.length === 1 ? next[0] : next;
    child.castShadow = true;
    child.receiveShadow = true;
  });
  root.scale.setScalar(scale);
  root.position.set(x, 0, z);
  root.rotation.y = rotY;
  world.add(root);
  root.updateMatrixWorld(true);
  const box = new Box3().setFromObject(root);
  return { root, box, solid: solidBox(root) };
}

function solidBox(root) {
  const box = new Box3();
  let found = false;
  root.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
    const piece = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
    if (piece.max.y - piece.min.y < 1.15) return;
    if (!found) {
      box.copy(piece);
      found = true;
    } else {
      box.union(piece);
    }
  });
  if (!found) return null;
  const cx = (box.min.x + box.max.x) * 0.5;
  const cz = (box.min.z + box.max.z) * 0.5;
  const hx = (box.max.x - box.min.x) * 0.5 * 0.62;
  const hz = (box.max.z - box.min.z) * 0.5 * 0.62;
  box.min.x = cx - hx;
  box.max.x = cx + hx;
  box.min.z = cz - hz;
  box.max.z = cz + hz;
  return box;
}
