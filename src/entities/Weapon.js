import {
  AdditiveBlending,
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PointLight,
  Raycaster,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { createCombatFx } from "./fx.js";
import { fitViewmodel, loadWeaponModel, markViewLayer } from "../maps/sketchfabLoader.js";

const VIEW_LAYER = 1;
const WALK_SPEED = 6.4;
const SLOT_IDS = { 1: "acr", 2: "cqc", 3: "pistol" };
const SLOT_NAMES = { 1: "ACR", 2: "CQC171", 3: "Pistol" };

const REST = {
  1: { x: 0.28, y: -0.22, z: -0.5, rx: 0.04, ry: 0.08, rz: 0.03 },
  2: { x: 0.26, y: -0.2, z: -0.42, rx: 0.06, ry: 0.1, rz: 0.04 },
  3: { x: 0.2, y: -0.14, z: -0.34, rx: 0.08, ry: 0.12, rz: 0.05 },
};

const LOADOUT = {
  1: { magSize: 30, reserve: 90, rpm: 620, reload: 1.7, auto: true, spread: 0.004, kickP: 0.016, kickY: 0.01, recoil: 0.045, damage: 18 },
  2: { magSize: 25, reserve: 75, rpm: 780, reload: 1.45, auto: true, spread: 0.008, kickP: 0.02, kickY: 0.014, recoil: 0.055, damage: 14 },
  3: { magSize: 12, reserve: 36, rpm: 260, reload: 1.2, auto: false, spread: 0.006, kickP: 0.028, kickY: 0.012, recoil: 0.07, damage: 26 },
};

const MUZZLE = {
  1: { x: 0, y: 0.022, z: -0.76 },
  2: { x: 0, y: 0.018, z: -0.44 },
  3: { x: 0, y: 0.026, z: -0.16 },
};

function hasHealth(object) {
  let node = object;
  while (node) {
    if (node.userData?.health) return true;
    node = node.parent;
  }
  return false;
}

const AIM = new Vector3();
const MUZ = new Vector3();
const HIT = new Vector3();
const FLASH_POS = new Vector3();
const raycaster = new Raycaster();
raycaster.far = 220;

function mat() {
  return new MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.82,
    metalness: 0.06,
    emissive: 0x000000,
    emissiveIntensity: 0,
  });
}

function dress(mesh) {
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  mesh.layers.set(VIEW_LAYER);
  return mesh;
}

function addBox(parent, w, h, d, material, x, y, z, rotX = 0) {
  const mesh = dress(new Mesh(new BoxGeometry(w, h, d), material));
  mesh.position.set(x, y, z);
  mesh.rotation.x = rotX;
  parent.add(mesh);
  return mesh;
}

function addTube(parent, rTop, rBot, len, material, x, y, z, segs = 14) {
  const mesh = dress(new Mesh(new CylinderGeometry(rTop, rBot, len, segs), material));
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function addCapZ(parent, radius, length, material, x, y, z, segs = 12) {
  const mesh = dress(new Mesh(new CapsuleGeometry(radius, length, 3, segs), material));
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function addCapY(parent, radius, length, material, x, y, z, rotX = 0) {
  const mesh = dress(new Mesh(new CapsuleGeometry(radius, length, 3, 10), material));
  mesh.position.set(x, y, z);
  mesh.rotation.x = rotX;
  parent.add(mesh);
  return mesh;
}

function buildAcr() {
  const g = new Group();
  const polymer = mat();
  const metal = mat();
  const dark = mat();
  const optic = mat();

  addCapZ(g, 0.038, 0.3, polymer, 0, 0.02, 0.02);
  addCapZ(g, 0.034, 0.2, dark, 0, 0.018, -0.22);
  addCapZ(g, 0.012, 0.36, dark, 0, 0.022, -0.5);
  addTube(g, 0.018, 0.015, 0.06, metal, 0, 0.022, -0.72);
  addCapZ(g, 0.016, 0.08, optic, 0, 0.07, 0.06, 10);
  addBox(g, 0.028, 0.018, 0.22, dark, 0, 0.052, -0.04);
  addCapY(g, 0.02, 0.09, polymer, 0, -0.07, 0.08, 0.38);
  addBox(g, 0.032, 0.13, 0.04, dark, 0, -0.08, -0.02);
  addCapZ(g, 0.03, 0.16, polymer, 0, 0.008, 0.28);
  addCapY(g, 0.022, 0.05, polymer, 0, -0.03, 0.4, 0.15);
  const guard = dress(new Mesh(new TorusGeometry(0.03, 0.007, 8, 16, Math.PI), metal));
  guard.rotation.set(Math.PI / 2, 0, Math.PI);
  guard.position.set(0, -0.02, 0.1);
  g.add(guard);
  return g;
}

function buildCqc() {
  const g = new Group();
  const body = mat();
  const tan = mat();
  const metal = mat();
  const dark = mat();

  addCapZ(g, 0.042, 0.22, body, 0, 0.016, 0.02);
  addCapZ(g, 0.04, 0.14, tan, 0, 0.014, -0.16);
  addCapZ(g, 0.015, 0.16, dark, 0, 0.018, -0.32);
  addTube(g, 0.02, 0.017, 0.04, metal, 0, 0.018, -0.42);
  addCapY(g, 0.016, 0.12, dark, 0, -0.09, 0.0, 0.08);
  addCapY(g, 0.02, 0.08, tan, 0, -0.07, 0.12, 0.32);
  addCapZ(g, 0.018, 0.07, tan, 0, 0.062, 0.02, 10);
  addCapZ(g, 0.028, 0.1, body, 0, 0.006, 0.2);
  addBox(g, 0.02, 0.04, 0.07, dark, 0, 0.02, 0.28);
  return g;
}

function buildPistol() {
  const g = new Group();
  const slide = mat();
  const frame = mat();
  const accent = mat();
  const grip = mat();

  addCapZ(g, 0.018, 0.16, slide, 0, 0.03, -0.02);
  addCapZ(g, 0.016, 0.12, frame, 0, 0.01, 0.02);
  addTube(g, 0.01, 0.01, 0.06, slide, 0, 0.026, -0.12, 10);
  addCapY(g, 0.018, 0.08, grip, 0, -0.05, 0.07, 0.4);
  addCapZ(g, 0.008, 0.02, accent, 0, 0.05, 0.05, 8);
  const guard = dress(new Mesh(new TorusGeometry(0.024, 0.006, 8, 14, Math.PI * 1.15), frame));
  guard.rotation.set(Math.PI / 2, 0, Math.PI);
  guard.position.set(0, -0.008, 0.02);
  g.add(guard);
  return g;
}

function emptySlot() {
  const slot = new Group();
  slot.layers.set(VIEW_LAYER);
  return slot;
}

function placeMuzzle(slot, pose) {
  let muzzle = slot.getObjectByName("muzzle");
  if (!muzzle) {
    muzzle = new Object3D();
    muzzle.name = "muzzle";
    slot.add(muzzle);
  }
  muzzle.position.set(pose.x, pose.y, pose.z);
  muzzle.layers.set(VIEW_LAYER);
  return muzzle;
}

function adoptModel(slot, built, kind, length, pose) {
  slot.add(built);
  placeMuzzle(slot, pose);
  loadWeaponModel(kind).then((scene) => {
    if (!scene) return;
    const next = fitViewmodel(scene, length);
    markViewLayer(next, VIEW_LAYER);
    const keep = slot.getObjectByName("muzzle");
    while (slot.children.length) slot.remove(slot.children[0]);
    slot.add(next);
    if (keep) slot.add(keep);
    placeMuzzle(slot, pose);
  });
}

function makeAmmo() {
  return {
    1: { mag: LOADOUT[1].magSize, reserve: LOADOUT[1].reserve, reloadLeft: 0 },
    2: { mag: LOADOUT[2].magSize, reserve: LOADOUT[2].reserve, reloadLeft: 0 },
    3: { mag: LOADOUT[3].magSize, reserve: LOADOUT[3].reserve, reloadLeft: 0 },
  };
}

export function createViewWeapon(camera, { world, scene, onKick, onShot, onReload, extraHits } = {}) {
  const root = new Group();
  root.name = "viewWeapons";
  root.visible = false;
  root.layers.set(VIEW_LAYER);

  const slots = {
    acr: emptySlot(),
    cqc: emptySlot(),
    pistol: emptySlot(),
  };
  adoptModel(slots.acr, buildAcr(), "acr", 0.74, MUZZLE[1]);
  adoptModel(slots.cqc, buildCqc(), "cqc", 0.52, MUZZLE[2]);
  adoptModel(slots.pistol, buildPistol(), "pistol", 0.28, MUZZLE[3]);
  root.add(slots.acr, slots.cqc, slots.pistol);

  const flash = new Mesh(
    new SphereGeometry(0.018, 8, 8),
    new MeshBasicMaterial({
      color: 0xfff1c2,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
    })
  );
  flash.name = "muzzleFlash";
  flash.frustumCulled = false;
  flash.layers.set(VIEW_LAYER);
  root.add(flash);

  const lamp = new PointLight(0xc8ccd0, 0.85, 1.4, 1.6);
  lamp.position.set(0.08, 0.12, 0.05);
  lamp.layers.set(VIEW_LAYER);
  root.add(lamp);

  const shotLight = new PointLight(0xffe6b0, 0, 6.5, 2);
  shotLight.layers.set(0);
  if (scene) scene.add(shotLight);

  const fx = scene ? createCombatFx(scene) : null;

  camera.layers.enable(VIEW_LAYER);
  camera.add(root);

  const ammo = makeAmmo();
  const muzzles = {
    1: slots.acr.getObjectByName("muzzle"),
    2: slots.cqc.getObjectByName("muzzle"),
    3: slots.pistol.getObjectByName("muzzle"),
  };

  let slot = 1;
  let switchKick = 0;
  let time = 0;
  let bob = 0;
  let lagX = 0;
  let lagY = 0;
  let lastYaw = 0;
  let lastPitch = 0;
  let sprintDip = 0;
  let primed = false;
  let fireWait = 0;
  let recoil = 0;
  let flashLeft = 0;
  let shotLightLeft = 0;

  function showSlot(next) {
    const id = SLOT_IDS[next] || "acr";
    slots.acr.visible = id === "acr";
    slots.cqc.visible = id === "cqc";
    slots.pistol.visible = id === "pistol";
  }
  showSlot(slot);

  function currentGun() {
    return ammo[slot];
  }

  function spec() {
    return LOADOUT[slot] || LOADOUT[1];
  }

  function beginReload() {
    const gun = currentGun();
    const load = spec();
    if (gun.reloadLeft > 0) return;
    if (gun.mag >= load.magSize) return;
    if (gun.reserve <= 0) return;
    gun.reloadLeft = load.reload;
    onReload?.();
  }

  function finishReload() {
    const gun = currentGun();
    const load = spec();
    const need = load.magSize - gun.mag;
    const take = Math.min(need, gun.reserve);
    gun.mag += take;
    gun.reserve -= take;
    gun.reloadLeft = 0;
  }

  function fireShot() {
    const gun = currentGun();
    const load = spec();
    if (gun.mag <= 0) {
      beginReload();
      return false;
    }
    gun.mag -= 1;
    fireWait = 60 / load.rpm;
    recoil = Math.min(1, recoil + load.recoil * 8);
    flashLeft = 0.045;
    shotLightLeft = 0.05;

    const muzzle = muzzles[slot];
    if (muzzle) muzzle.getWorldPosition(MUZ);
    else camera.getWorldPosition(MUZ);

    camera.getWorldDirection(AIM);
    AIM.x += (Math.random() - 0.5) * load.spread;
    AIM.y += (Math.random() - 0.5) * load.spread;
    AIM.z += (Math.random() - 0.5) * load.spread;
    AIM.normalize();
    raycaster.set(camera.position, AIM);
    const meshHits = world
      ? raycaster
          .intersectObject(world, true)
          .filter((hit) => hit.distance > 0.35 && !hasHealth(hit.object))
      : [];
    const volumeHits = extraHits?.(camera.position, AIM, raycaster.far) || [];
    const hits = meshHits.concat(volumeHits).sort((a, b) => a.distance - b.distance);
    if (hits.length) {
      const hit = hits[0];
      if (hit.point.copy) HIT.copy(hit.point);
      else HIT.set(hit.point.x, hit.point.y, hit.point.z);
      fx?.spawnImpact(HIT);
      onKick?.(
        load.kickP + Math.random() * load.kickP * 0.35,
        (Math.random() - 0.5) * load.kickY * 2
      );
      fx?.spawnTracer(MUZ, HIT);
      onShot?.({
        damage: load.damage,
        object: hit.object || null,
        point: HIT.clone(),
        muzzle: MUZ.clone(),
      });
    } else {
      HIT.copy(camera.position).addScaledVector(AIM, raycaster.far);
      fx?.spawnTracer(MUZ, HIT);
      onKick?.(
        load.kickP + Math.random() * load.kickP * 0.35,
        (Math.random() - 0.5) * load.kickY * 2
      );
      onShot?.({
        damage: load.damage,
        object: null,
        point: HIT.clone(),
        muzzle: MUZ.clone(),
      });
    }
    if (gun.mag <= 0) beginReload();
    return true;
  }

  function step(dt, motion) {
    const playing = !!motion.playing;
    root.visible = playing;
    fx?.step(dt);
    if (!playing) {
      primed = false;
      flash.material.opacity = 0;
      shotLight.intensity = 0;
      return;
    }

    const nextSlot = motion.weaponSlot || 1;
    if (nextSlot !== slot) {
      slot = nextSlot;
      switchKick = 1;
      fireWait = 0.08;
      showSlot(slot);
    }

    if (!primed) {
      lastYaw = motion.yaw;
      lastPitch = motion.pitch;
      primed = true;
    }

    const gun = currentGun();
    const load = spec();
    if (motion.reloadPressed) beginReload();
    if (gun.reloadLeft > 0) {
      gun.reloadLeft -= dt;
      if (gun.reloadLeft <= 0) finishReload();
    }

    fireWait = Math.max(0, fireWait - dt);
    const canShoot = motion.locked && gun.reloadLeft <= 0 && fireWait <= 0;
    const wantShot = load.auto ? motion.fireHeld : motion.firePressed;
    if (canShoot && wantShot) fireShot();

    time += dt;
    switchKick = Math.max(0, switchKick - dt * 7);
    recoil = Math.max(0, recoil - dt * 9);
    flashLeft = Math.max(0, flashLeft - dt);
    shotLightLeft = Math.max(0, shotLightLeft - dt);

    const muzzle = muzzles[slot];
    if (muzzle) {
      muzzle.getWorldPosition(MUZ);
      FLASH_POS.copy(MUZ);
      root.worldToLocal(FLASH_POS);
      flash.position.copy(FLASH_POS);
      shotLight.position.copy(MUZ);
    }
    flash.material.opacity = flashLeft > 0 ? 0.95 : 0;
    flash.scale.setScalar(flashLeft > 0 ? 1 + Math.random() * 0.8 : 1);
    shotLight.intensity = shotLightLeft > 0 ? 3.4 : 0;

    const speed = motion.speed || 0;
    const move = Math.min(1, speed / WALK_SPEED);
    const sprintMul = motion.sprinting ? 1.5 : 1;
    bob += dt * (8.4 * sprintMul) * move;

    const amp = 0.014 * move * sprintMul;
    const bobX = Math.sin(bob) * amp;
    const bobY = (1 - Math.abs(Math.cos(bob))) * amp * 0.72;
    const idleX = Math.sin(time * 1.12) * 0.0032;
    const idleY = Math.cos(time * 0.78) * 0.004;

    let dyaw = motion.yaw - lastYaw;
    let dpitch = motion.pitch - lastPitch;
    while (dyaw > Math.PI) dyaw -= Math.PI * 2;
    while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    dyaw = Math.max(-0.18, Math.min(0.18, dyaw));
    dpitch = Math.max(-0.18, Math.min(0.18, dpitch));
    lastYaw = motion.yaw;
    lastPitch = motion.pitch;

    const follow = 1 - Math.exp(-9 * dt);
    lagX += (-dyaw * 0.55 - lagX) * follow;
    lagY += (dpitch * 0.5 - lagY) * follow;

    const sprintTarget = motion.sprinting && move > 0.2 ? 0.028 : 0;
    sprintDip += (sprintTarget - sprintDip) * (1 - Math.exp(-8 * dt));

    const rest = REST[slot] || REST[1];
    const rec = recoil;
    root.position.set(
      rest.x + bobX + idleX + lagX,
      rest.y + bobY + idleY + lagY - sprintDip - switchKick * 0.14 + rec * 0.02,
      rest.z + rec * 0.08
    );
    root.rotation.set(
      rest.rx + lagY * 0.6 + bobY * 0.8 + switchKick * 0.2 - rec * 0.35,
      rest.ry + lagX * 0.35,
      rest.rz + bobX * 2.2 + lagX * 0.8
    );
  }

  return {
    step,
    getName: () => SLOT_NAMES[slot] || "ACR",
    getAmmo: () => {
      const gun = currentGun();
      return { mag: gun.mag, reserve: gun.reserve, reloading: gun.reloadLeft > 0 };
    },
    debugFire() {
      return fireShot();
    },
    debugReload() {
      beginReload();
    },
    collectAmmo({ acr = 0, cqc = 0, pistol = 0 } = {}) {
      const cap = (slotId) => LOADOUT[slotId].reserve * 2;
      ammo[1].reserve = Math.min(cap(1), ammo[1].reserve + acr);
      ammo[2].reserve = Math.min(cap(2), ammo[2].reserve + cqc);
      ammo[3].reserve = Math.min(cap(3), ammo[3].reserve + pistol);
      return {
        acr: ammo[1].reserve,
        cqc: ammo[2].reserve,
        pistol: ammo[3].reserve,
      };
    },
    resetLoadout() {
      Object.assign(ammo, makeAmmo());
      slot = 1;
      fireWait = 0;
      recoil = 0;
      showSlot(slot);
    },
  };
}

