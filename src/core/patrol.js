import { AnimationMixer, Box3, CapsuleGeometry, LoadingManager, LoopOnce, Mesh, MeshBasicMaterial, SRGBColorSpace, TextureLoader, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import soldierUrl from "../assets/kenney/soldiers/character-soldier.glb?url";
import soldierAtlasUrl from "../assets/kenney/soldiers/colormap.png?url";
import { makeHealth, raySphere, tickHealth } from "../entities/Targets.js";

const TARGET_HEIGHT = 1.72;
const SIZE = new Vector3();
const manager = new LoadingManager();
manager.setURLModifier((url) => (url.includes("colormap.png") ? soldierAtlasUrl : url));
const loader = new GLTFLoader(manager);

let soldierGltf = null;
let soldierAtlas = null;

function atlas() {
  if (!soldierAtlas) {
    soldierAtlas = new TextureLoader().load(soldierAtlasUrl);
    soldierAtlas.colorSpace = SRGBColorSpace;
    soldierAtlas.flipY = false;
    soldierAtlas.userData.shared = true;
  }
  return soldierAtlas;
}

function loadSoldierGltf() {
  if (!soldierGltf) {
    soldierGltf = new Promise((resolve, reject) => {
      loader.load(soldierUrl, resolve, undefined, reject);
    });
  }
  return soldierGltf;
}

function paint(root, map) {
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
    child.frustumCulled = true;
  });
}

function fitSoldier(root) {
  root.updateMatrixWorld(true);
  const box = new Box3().setFromObject(root);
  box.getSize(SIZE);
  const height = Math.max(SIZE.y, 0.001);
  root.scale.multiplyScalar(TARGET_HEIGHT / height);
  root.updateMatrixWorld(true);
  const grounded = new Box3().setFromObject(root);
  root.position.y -= grounded.min.y;
  return root.position.y;
}

export async function createPatrols(THREE, world, routes, blocked) {
  const gltf = await loadSoldierGltf();
  const map = atlas();
  const clips = gltf.animations || [];
  const walkClip =
    clips.find((clip) => clip.name === "walk") ||
    clips.find((clip) => /walk|sprint|run/i.test(clip.name)) ||
    clips[0] ||
    null;
  const dieClip = clips.find((clip) => clip.name === "die") || null;

  const agents = routes.map((route) => {
    const mesh = cloneSkeleton(gltf.scene);
    paint(mesh, map);
    mesh.userData.patrol = true;
    const footY = fitSoldier(mesh);
    const start = route[0];
    mesh.position.set(start.x, footY, start.z);
    mesh.rotation.y = 0;
    const hitbox = new Mesh(
      new CapsuleGeometry(0.38, 1.05, 3, 8),
      new MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        color: 0xffffff,
      })
    );
    hitbox.name = "soldier-hit";
    hitbox.position.y = 0.9;
    hitbox.userData.ignoreOverview = true;
    mesh.add(hitbox);
    world.add(mesh);

    const health = makeHealth("soldier", 72, 4.5);
    mesh.userData.health = health;

    let mixer = null;
    let walkAction = null;
    let dieAction = null;
    if (walkClip || dieClip) {
      mixer = new AnimationMixer(mesh);
      if (walkClip) {
        walkAction = mixer.clipAction(walkClip);
        walkAction.play();
      }
      if (dieClip) {
        dieAction = mixer.clipAction(dieClip);
        dieAction.setLoop(LoopOnce, 1);
        dieAction.clampWhenFinished = true;
      }
    }

    health.onKill = () => {
      walkAction?.stop();
      if (dieAction) {
        dieAction.reset();
        dieAction.play();
      }
    };
    health.onHide = () => {
      mesh.visible = false;
    };
    health.onRespawn = () => {
      mesh.visible = true;
      const home = route[0];
      agent.x = home.x;
      agent.z = home.z;
      agent.index = 1 % route.length;
      mesh.position.set(home.x, footY, home.z);
      dieAction?.stop();
      walkAction?.reset();
      walkAction?.play();
    };

    const agent = {
      mesh,
      mixer,
      route,
      index: 1 % route.length,
      x: start.x,
      z: start.z,
      y: footY,
      health,
      fireWait: 0.4 + Math.random() * 1.2,
    };
    return agent;
  });

  function step(dt) {
    const speed = 2.35;
    for (const agent of agents) {
      agent.mixer?.update(dt);
      tickHealth(agent.health, dt);
      if (!agent.health.alive) continue;
      if (!agent.route.length) continue;
      const goal = agent.route[agent.index];
      const dx = goal.x - agent.x;
      const dz = goal.z - agent.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 1.1) {
        agent.index = (agent.index + 1) % agent.route.length;
        continue;
      }
      const nx = agent.x + (dx / dist) * speed * dt;
      const nz = agent.z + (dz / dist) * speed * dt;
      if (typeof blocked === "function" && blocked(nx, nz)) {
        agent.index = (agent.index + 1) % agent.route.length;
        continue;
      }
      agent.x = nx;
      agent.z = nz;
      agent.mesh.position.x = nx;
      agent.mesh.position.z = nz;
      agent.mesh.rotation.y = Math.atan2(dx, dz);
    }
  }

  return {
    step,
    blips() {
      return agents
        .filter((agent) => agent.health.alive)
        .map((agent) => ({ x: agent.x, z: agent.z }));
    },
    list() {
      return agents.map((agent) => ({
        kind: "soldier",
        hp: agent.health.hp,
        maxHp: agent.health.maxHp,
        alive: agent.health.alive,
        x: +agent.x.toFixed(2),
        z: +agent.z.toFixed(2),
      }));
    },
    raycast(origin, dir, far = 220) {
      const hits = [];
      for (const agent of agents) {
        if (!agent.health.alive) continue;
        const dist = raySphere(origin, dir, { x: agent.x, y: 1.05, z: agent.z }, 0.72);
        if (dist == null || dist > far) continue;
        hits.push({
          distance: dist,
          point: {
            x: origin.x + dir.x * dist,
            y: origin.y + dir.y * dist,
            z: origin.z + dir.z * dist,
          },
          object: agent.mesh,
        });
      }
      return hits;
    },
    tryAttack(dt, player, { active, onShot } = {}) {
      if (!active || !player) return;
      for (const agent of agents) {
        agent.fireWait = Math.max(0, (agent.fireWait || 0) - dt);
        if (!agent.health.alive || agent.fireWait > 0) continue;
        const dx = player.x - agent.x;
        const dz = player.z - agent.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 5 || dist > 34) continue;
        agent.fireWait = 1.55 + Math.random() * 0.7;
        agent.mesh.rotation.y = Math.atan2(dx, dz);
        const hit = Math.random() > 0.22 + Math.min(0.35, dist / 80);
        onShot?.({
          x: agent.x,
          y: 1.35,
          z: agent.z,
          damage: hit ? 11 : 0,
          hit,
        });
      }
    },
    reset() {
      for (const agent of agents) {
        agent.health.alive = true;
        agent.health.hp = agent.health.maxHp;
        agent.health.respawnLeft = 0;
        agent.health.hideLeft = 0;
        agent.health.onRespawn?.();
        agent.fireWait = 0.4 + Math.random() * 1.2;
      }
    },
  };
}
