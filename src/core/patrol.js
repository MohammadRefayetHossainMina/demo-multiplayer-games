import { AnimationMixer, Box3, CapsuleGeometry, Color, LoadingManager, LoopOnce, Mesh, MeshBasicMaterial, SRGBColorSpace, TextureLoader, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import soldierUrl from "../assets/kenney/soldiers/character-soldier.glb?url";
import soldierAtlasUrl from "../assets/kenney/soldiers/colormap.png?url";
import { makeHealth, raySphere, tickHealth } from "../entities/Targets.js";
import { resetBrain, updateBrain } from "./ai/brain.js";
import { roleConfig } from "./ai/config.js";
import { buildCoverSlots } from "./ai/cover.js";

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

function paint(root, map, tint) {
  const mul = new Color(tint || 0x6e6a62);
  root.traverse((child) => {
    if (!child.isMesh) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    const next = mats.map((mat) => {
      const painted = mat.clone();
      painted.map = map;
      painted.color.multiply(mul);
      painted.needsUpdate = true;
      return painted;
    });
    child.material = next.length === 1 ? next[0] : next;
    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = true;
  });
}

function fitSoldier(root, scale = 1) {
  root.updateMatrixWorld(true);
  const box = new Box3().setFromObject(root);
  box.getSize(SIZE);
  const height = Math.max(SIZE.y, 0.001);
  root.scale.multiplyScalar((TARGET_HEIGHT * scale) / height);
  root.updateMatrixWorld(true);
  const grounded = new Box3().setFromObject(root);
  root.position.y -= grounded.min.y;
  return root.position.y;
}

function moveToward(agent, tx, tz, speed, dt, blocked) {
  const dx = tx - agent.x;
  const dz = tz - agent.z;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.4) return true;
  const nx = agent.x + (dx / dist) * speed * dt;
  const nz = agent.z + (dz / dist) * speed * dt;
  if (!blocked(nx, nz)) {
    agent.x = nx;
    agent.z = nz;
  } else if (!blocked(nx, agent.z)) {
    agent.x = nx;
  } else if (!blocked(agent.x, nz)) {
    agent.z = nz;
  }
  agent.mesh.position.x = agent.x;
  agent.mesh.position.z = agent.z;
  if (agent.state === "patrol" || agent.state === "chase" || agent.state === "search" || agent.state === "cover") {
    agent.mesh.rotation.y = Math.atan2(dx, dz);
  }
  return false;
}

export async function createPatrols(THREE, world, squad, blocked, occluders = []) {
  const gltf = await loadSoldierGltf();
  const map = atlas();
  const clips = gltf.animations || [];
  const walkClip =
    clips.find((clip) => clip.name === "walk") ||
    clips.find((clip) => /walk|sprint|run/i.test(clip.name)) ||
    clips[0] ||
    null;
  const dieClip = clips.find((clip) => clip.name === "die") || null;
  const coverSlots = buildCoverSlots(occluders, blocked);
  const combat = { player: null, active: false, onShot: null };

  const specs = (squad || []).map((item) =>
    Array.isArray(item) ? { role: "grunt", route: item } : item
  );

  const agents = specs.map((spec) => {
    const cfg = roleConfig(spec.role, spec.personality);
    const mesh = cloneSkeleton(gltf.scene);
    paint(mesh, map, cfg.tint);
    mesh.userData.patrol = true;
    mesh.userData.role = spec.role || "grunt";
    const footY = fitSoldier(mesh, cfg.scale);
    const route = spec.route || [];
    const start = route[0] || { x: 0, z: 0 };
    mesh.position.set(start.x, footY, start.z);
    mesh.rotation.y = 0;
    const hitbox = new Mesh(
      new CapsuleGeometry(0.38 * cfg.scale, 1.05 * cfg.scale, 3, 8),
      new MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
        color: 0xffffff,
      })
    );
    hitbox.name = spec.role === "boss" ? "boss-hit" : "soldier-hit";
    hitbox.position.y = 0.9 * cfg.scale;
    hitbox.userData.ignoreOverview = true;
    mesh.add(hitbox);
    world.add(mesh);

    const health = makeHealth("soldier", cfg.hp, cfg.respawn);
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

    const agent = {
      mesh,
      mixer,
      route,
      index: 1 % Math.max(route.length, 1),
      x: start.x,
      z: start.z,
      y: footY,
      health,
      cfg,
      role: spec.role || "grunt",
      personality: spec.personality || "balanced",
      fireWait: 0.3 + Math.random() * 0.8,
      muzzleLeft: 0,
      walkAction,
      dieAction,
    };
    resetBrain(agent);

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
    health.onHurt = () => {
      agent.underFire = 0.85;
      agent.strafeSign *= -1;
    };
    health.onRespawn = () => {
      mesh.visible = true;
      const home = route[0] || start;
      agent.x = home.x;
      agent.z = home.z;
      agent.index = 1 % Math.max(route.length, 1);
      mesh.position.set(home.x, footY, home.z);
      dieAction?.stop();
      walkAction?.reset();
      walkAction?.play();
      resetBrain(agent);
    };
    return agent;
  });

  function fire(agent, player) {
    if (agent.fireWait > 0 || !player) return;
    const gap = agent.cfg.fireGap;
    agent.fireWait = gap[0] + Math.random() * (gap[1] - gap[0]);
    agent.muzzleLeft = 0.4;
    const chance = Math.max(0.2, agent.cfg.accuracy - (agent.lastDist || 14) / 110);
    const hit = Math.random() < chance;
    combat.onShot?.({
      x: agent.x,
      y: 1.35 * agent.cfg.scale,
      z: agent.z,
      damage: hit ? agent.cfg.damage : 0,
      hit,
      role: agent.role,
    });
  }

  function step(dt) {
    const player = combat.player;
    for (const agent of agents) {
      agent.mixer?.update(dt);
      tickHealth(agent.health, dt);
      agent.muzzleLeft = Math.max(0, (agent.muzzleLeft || 0) - dt);
      agent.fireWait = Math.max(0, (agent.fireWait || 0) - dt);
      if (!agent.health.alive) continue;
      updateBrain(agent, dt, player, {
        blocked,
        coverSlots,
        losBoxes: occluders,
        active: combat.active,
      });
      if (player) agent.lastDist = Math.hypot(player.x - agent.x, player.z - agent.z);
      if (agent.goal) {
        moveToward(agent, agent.goal.x, agent.goal.z, agent.moveSpeed || agent.cfg.speed, dt, blocked);
      }
      if (agent.wantFire && combat.active) fire(agent, player);
    }
  }

  return {
    step,
    setCombat(next) {
      combat.player = next.player || null;
      combat.active = !!next.active;
      combat.onShot = next.onShot || null;
    },
    markFire(health) {
      const agent = agents.find((item) => item.health === health);
      if (agent) agent.underFire = 0.9;
    },
    blips() {
      return agents
        .filter((agent) => agent.health.alive)
        .map((agent) => ({
          x: agent.x,
          z: agent.z,
          firing: (agent.muzzleLeft || 0) > 0,
          role: agent.role,
        }));
    },
    list() {
      return agents.map((agent) => ({
        kind: agent.role === "boss" ? "boss" : "soldier",
        role: agent.role,
        state: agent.state,
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
        const dist = raySphere(origin, dir, { x: agent.x, y: 1.05 * agent.cfg.scale, z: agent.z }, 0.72 * agent.cfg.scale);
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
    reset() {
      for (const agent of agents) {
        agent.health.alive = true;
        agent.health.hp = agent.health.maxHp;
        agent.health.respawnLeft = 0;
        agent.health.hideLeft = 0;
        agent.health.onRespawn?.();
        agent.fireWait = 0.3 + Math.random() * 0.9;
        agent.muzzleLeft = 0;
      }
    },
  };
}
