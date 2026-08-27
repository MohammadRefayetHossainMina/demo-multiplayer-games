import * as THREE from "three";
import { clampToWalkBounds } from "./containment.js";

export function createEngine(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(68, 1, 0.05, 900);
  camera.rotation.order = "YXZ";
  camera.up.set(0, 1, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x070b16, 1);

  const hemi = new THREE.HemisphereLight(0xdde8ff, 0x4a4036, 0.9);
  const sun = new THREE.DirectionalLight(0xfff3d2, 2.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.001;
  sun.shadow.normalBias = 0.06;
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.camera.far = 180;
  scene.add(hemi, sun);

  const world = new THREE.Group();
  scene.add(world);
  scene.add(camera);

  let playing = false;
  let blocked = () => true;
  let walkBounds = { minx: -12, maxx: 12, minz: -12, maxz: 12 };
  let patrol = { step() {}, blips: () => [], list: () => [] };
  let targets = { step() {}, blips: () => [], list: () => [] };
  let minimap = { roads: [], buildings: [] };
  let fogFar = 80;
  let preview = {
    position: new THREE.Vector3(0, 4, 10),
    lookAt: new THREE.Vector3(0, 1, 0),
  };
  let spawn = preview.position.clone();
  let lastTime = performance.now();
  const listeners = { onMode: null, onFrame: null };
  const bounds = new THREE.Box3();
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  const overview = {
    ready: false,
    interior: false,
    x: 0,
    y: 8,
    z: 12,
    tx: 0,
    ty: 1,
    tz: 0,
    sway: 0.3,
  };

  function fit() {
    const w = Math.max(window.innerWidth, 1);
    const h = Math.max(window.innerHeight, 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
  }

  function captureOverview() {
    world.updateMatrixWorld(true);
    bounds.makeEmpty();
    world.traverse((obj) => {
      if (!obj.isMesh || obj.userData.ignoreOverview) return;
      bounds.expandByObject(obj);
    });
    overview.ready = true;
    if (bounds.isEmpty()) {
      overview.interior = false;
      overview.x = preview.position.x;
      overview.y = preview.position.y;
      overview.z = preview.position.z;
      overview.tx = preview.lookAt.x;
      overview.ty = preview.lookAt.y;
      overview.tz = preview.lookAt.z;
      overview.sway = 0.2;
      return;
    }
    bounds.getCenter(center);
    bounds.getSize(size);
    overview.interior = fogFar < 70;
    if (overview.interior) {
      const spanX = Math.min(size.x, 24);
      const spanZ = Math.min(size.z, 36);
      overview.x = center.x - spanX * 0.32;
      overview.y = 6.35;
      overview.z = center.z + spanZ * 0.34;
      overview.tx = center.x;
      overview.ty = 0.7;
      overview.tz = center.z - spanZ * 0.08;
      overview.sway = 0.06;
      return;
    }
    const span = Math.max(size.x, size.z, 16);
    overview.x = center.x - span * 0.56;
    overview.y = Math.max(12, span * 0.4);
    overview.z = center.z + span * 0.56;
    overview.tx = center.x + span * 0.1;
    overview.ty = 1.15;
    overview.tz = center.z;
    overview.sway = 0.35;
  }

  function frameFullMap(time) {
    if (!overview.ready) captureOverview();
    camera.up.set(0, 1, 0);
    const sway = Math.sin(time * 0.14) * overview.sway;
    camera.position.set(overview.x + sway, overview.y, overview.z);
    camera.lookAt(overview.tx, overview.ty, overview.tz);
  }

  function enterPlay() {
    if (!playing) {
      camera.position.copy(spawn);
      camera.position.y = spawn.y;
    }
    playing = true;
    listeners.onMode?.(true);
  }

  function exitPlay() {
    if (!playing) return;
    playing = false;
    frameFullMap(0);
    listeners.onMode?.(false);
  }

  window.addEventListener("resize", fit);

  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const t = now / 1000;

    listeners.onFrame?.(dt, {
      playing,
      camera,
      blocked,
      walkBounds,
      eyeHeight: spawn.y,
    });

    patrol.step?.(dt);
    targets.step?.(dt, t);

    if (playing) {
      const held = clampToWalkBounds(
        camera.position.x,
        camera.position.z,
        walkBounds
      );
      camera.position.x = held.x;
      camera.position.z = held.z;
    } else {
      frameFullMap(t);
    }

    renderer.render(scene, camera);
  }

  function clearWorld() {
    while (world.children.length) {
      const obj = world.children[0];
      world.remove(obj);
      obj.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            if (m.map && !m.map.userData.shared) m.map.dispose();
            m.dispose();
          });
        }
      });
    }
  }

  async function loadMap(buildMap) {
    exitPlay();
    clearWorld();
    const result = await Promise.resolve(buildMap(THREE, world));
    blocked = result.blocked || (() => true);
    walkBounds = result.walkBounds || walkBounds;
    patrol = result.patrol || { step() {}, blips: () => [], list: () => [] };
    targets = result.targets || { step() {}, blips: () => [], list: () => [] };
    minimap = result.minimap || { roads: [], buildings: [] };
    preview = result.preview;
    fogFar = result.fogFar;
    spawn = result.preview.spawn
      ? result.preview.spawn.clone()
      : result.preview.position.clone();
    scene.background = new THREE.Color(result.background);
    renderer.setClearColor(result.background, 1);
    scene.fog = new THREE.Fog(result.fog, result.fogNear, result.fogFar);
    hemi.color.set(result.hemiSky);
    hemi.groundColor.set(result.hemiGround);
    hemi.intensity = result.hemiIntensity;
    sun.color.set(result.sunColor);
    sun.intensity = result.sunIntensity;
    sun.position.copy(result.sunPosition);
    renderer.toneMappingExposure = result.exposure;
    overview.ready = false;
    captureOverview();
    frameFullMap(0);
    fit();
  }

  fit();
  requestAnimationFrame(tick);

  return {
    camera,
    loadMap,
    enterPlay,
    exitPlay,
    getSpawn: () => spawn,
    getLookTarget: () => preview.lookAt,
    getBlocked: () => blocked,
    getWalkBounds: () => walkBounds,
    getMinimap: () => minimap,
    getAiBlips: () => patrol.blips?.() || [],
    getOrbBlips: () => targets.blips?.() || [],
    getPatrolList: () => patrol.list?.() || [],
    getTargetList: () => targets.list?.() || [],
    raycastCombat(origin, dir, far = 220) {
      const a = patrol.raycast?.(origin, dir, far) || [];
      const b = targets.raycast?.(origin, dir, far) || [];
      return a.concat(b);
    },
    getPatrol: () => patrol,
    getTargets: () => targets,
    getWorld: () => world,
    getScene: () => scene,
    onMode(fn) {
      listeners.onMode = fn;
    },
    onFrame(fn) {
      listeners.onFrame = fn;
    },
    isPlaying: () => playing,
  };
}
