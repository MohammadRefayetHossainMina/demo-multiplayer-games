import { CapsuleGeometry, Mesh, MeshStandardMaterial } from "three";
import { createEngine } from "./core/engine.js";
import { createInput } from "./core/Input.js";
import { createMinimap } from "./core/minimap.js";
import { createGameAudio } from "./core/audio.js";
import { probeContainment, probeReach } from "./core/containment.js";
import { createMatch } from "./core/match.js";
import { createNet } from "./core/net.js";
import { recordMatch, snapshotProgress } from "./core/progress.js";
import { createViewWeapon } from "./entities/Weapon.js";
import { applyDamage, healthFromHit } from "./entities/Targets.js";
import { mountCommerce } from "./ui/commerce.js";
import { createHud } from "./ui/hud.js";
import { freeholdLane } from "./maps/freeholdLane.js";

const map = freeholdLane;
const status = document.getElementById("status");
const canvas = document.getElementById("view");
const walkBtn = document.getElementById("walk-btn");
const matchBtn = document.getElementById("match-btn");
const homeLink = document.getElementById("home-link");
const overlay = document.getElementById("overlay");

window.addEventListener("error", (event) => {
  const message = event.message || "";
  if (/pointer lock|PointerLock/i.test(message)) return;
  if (status) status.textContent = "Map failed: " + message;
});
window.addEventListener("unhandledrejection", (event) => {
  const message = String(event.reason?.message || event.reason || "");
  if (/pointer lock|PointerLock/i.test(message)) return;
  if (status) status.textContent = "Map failed: " + message;
});

if (homeLink) {
  homeLink.href = location.port === "5173" ? "http://127.0.0.1:8765/" : "../";
}

const engine = createEngine(canvas);
const input = createInput(canvas);
const audio = createGameAudio();
const match = createMatch();
const net = createNet();
const ghosts = new Map();
let hitFlash = 0;
let hurtFlash = 0;
let lastShot = null;
let lastNet = 0;

const weapon = createViewWeapon(engine.camera, {
  world: engine.getWorld(),
  scene: engine.getScene(),
  extraHits: (origin, dir, far) => engine.raycastCombat(origin, dir, far),
  onKick: (pitch, yaw) => input.addKick(pitch, yaw),
  onShot(shot) {
    audio.shot(shot.muzzle);
    lastShot = {
      name: shot.object?.name || null,
      kind: healthFromHit(shot.object)?.kind || null,
      z: shot.point ? +shot.point.z.toFixed(2) : null,
    };
    if (!match.isLive() && !match.roam) return;
    const health = healthFromHit(shot.object);
    if (!health) {
      audio.impact(shot.point);
      return;
    }
    const result = applyDamage(health, shot.damage);
    if (!result.hit) {
      audio.impact(shot.point);
      return;
    }
    audio.hit(shot.point, result);
    hitFlash = 0.09;
    if (result.killed) {
      const next = match.addKill();
      if (next === "win") endMatch(true);
    }
  },
  onReload() {
    audio.reload(engine.camera.position);
  },
});

const hud = createHud({
  overlay,
  title: document.getElementById("overlay-title"),
  body: document.getElementById("overlay-body"),
  xp: document.getElementById("xp-line"),
  matchBtn,
  walkBtn,
  hpWrap: document.getElementById("hp-wrap"),
  hpFill: document.getElementById("hp-fill"),
  hpText: document.getElementById("hp-text"),
  kills: document.getElementById("kills"),
  ammo: document.getElementById("ammo"),
  hud: document.getElementById("hud"),
  crosshair: document.getElementById("crosshair"),
  hurt: document.getElementById("hurt"),
});
const minimap = createMinimap(document.getElementById("minimap"));
mountCommerce(document.getElementById("commerce"));

const ghostMat = new MeshStandardMaterial({ color: 0x4a6d8c, roughness: 0.7 });
net.onPeer((id, pose) => {
  let mesh = ghosts.get(id);
  if (!mesh) {
    mesh = new Mesh(new CapsuleGeometry(0.32, 1.05, 3, 8), ghostMat);
    mesh.castShadow = true;
    engine.getScene().add(mesh);
    ghosts.set(id, mesh);
  }
  mesh.position.set(pose.x, 0.9, pose.z);
  mesh.rotation.y = pose.yaw;
});
net.onLeave((id) => {
  const mesh = ghosts.get(id);
  if (!mesh) return;
  engine.getScene().remove(mesh);
  ghosts.delete(id);
});

function resetWorldCombat() {
  engine.getPatrol()?.reset?.();
  engine.getTargets()?.reset?.();
  weapon.resetLoadout();
}

let matchOver = false;

function endMatch(win) {
  if (matchOver) return;
  matchOver = true;
  input.exitLock();
  recordMatch({ win, kills: match.kills });
  hud.showOverlay(win ? "win" : "lose", hud.xpLine());
  document.body.dataset.match = win ? "win" : "lose";
  audio.stopAmbience();
}

async function beginPlay(kind) {
  const free = kind === "roam";
  if (match.state === "paused") {
    match.resume();
    hud.hideOverlay();
  } else if (match.state === "playing" && engine.isPlaying()) {
    hud.hideOverlay();
  } else {
    matchOver = false;
    resetWorldCombat();
    match.start({ free });
    input.faceToward(engine.getSpawn(), engine.getLookTarget());
    engine.enterPlay();
    input.applyLook(engine.camera);
    hud.hideOverlay();
  }
  document.body.dataset.match = match.roam ? "roam" : "playing";
  await audio.unlock();
  audio.startAmbience();
  net.connect();
  input.requestLock();
}

function setPlayingUi(playing) {
  document.body.classList.toggle("is-playing", playing);
  if (!playing && match.state !== "win" && match.state !== "lose") {
    match.toMenu();
    hud.showOverlay("menu");
    document.body.dataset.match = "menu";
    audio.stopAmbience();
  }
  if (status && !playing) {
    status.textContent = `${map.name} loaded. Start a match or free roam.`;
  }
}

function runBoundsProbe() {
  const blocked = engine.getBlocked();
  const walkBounds = engine.getWalkBounds();
  const spawn = engine.getSpawn();
  const leaks = probeContainment(blocked, walkBounds, spawn);
  const reach = probeReach(blocked, walkBounds, spawn);
  const failed = leaks.length;
  const text = failed
    ? "BOUNDS-LEAK " + JSON.stringify(leaks[0])
    : reach.short.length
      ? "REACH-SHORT " + JSON.stringify(reach.short[0])
      : "BOUNDS-OK";
  const probe = document.getElementById("probe");
  if (probe) probe.textContent = text;
  document.body.dataset.bounds = failed ? "leak" : "ok";
  document.body.dataset.reach = JSON.stringify({
    short: reach.short,
    east: reach.east?.x,
    west: reach.west?.x,
    north: reach.north?.z,
    south: reach.south?.z,
  });
  return { leaks, reach };
}

function afterMapReady() {
  const { leaks } = runBoundsProbe();
  if (leaks.length) {
    status.textContent = "Bounds leak: " + JSON.stringify(leaks[0]);
    return;
  }
  hud.showOverlay("menu", hud.xpLine());
  if (status) status.textContent = `${map.name} loaded. Start a match or free roam.`;
  document.body.dataset.match = "menu";
  const params = new URLSearchParams(location.search);
  if (params.has("roam")) {
    beginPlay("roam");
  } else if (params.has("walk") || params.has("match") || params.has("edge")) {
    beginPlay("match").then(() => {
      const edge = params.get("edge");
      const y = engine.getSpawn().y;
      if (edge === "n") {
        engine.camera.position.set(0, y, 58.8);
        input.faceToward(engine.camera.position, { x: 0, y, z: 90 });
      } else if (edge === "s") {
        engine.camera.position.set(0, y, -58.8);
        input.faceToward(engine.camera.position, { x: 0, y, z: -90 });
      } else if (edge === "e") {
        engine.camera.position.set(62.4, y, 0);
        input.faceToward(engine.camera.position, { x: 90, y, z: 0 });
      } else if (edge === "w") {
        engine.camera.position.set(-62.4, y, 0);
        input.faceToward(engine.camera.position, { x: -90, y, z: 0 });
      }
      input.applyLook(engine.camera);
    });
  }
}

if (status) status.textContent = `Loading ${map.name}…`;
engine
  .loadMap(map.build)
  .then(() => {
    afterMapReady();
  })
  .catch((err) => {
    if (status) status.textContent = "Map failed: " + (err?.message || err);
  });

engine.onFrame((dt, ctx) => {
  const live = match.isLive() && ctx.playing;
  input.step(dt, { ...ctx, playing: live || (match.roam && ctx.playing) });
  const motion = {
    playing: live || (match.roam && ctx.playing),
    ...input.getMotion(),
  };
  if (!motion.playing) {
    motion.fireHeld = false;
    motion.firePressed = false;
  }
  weapon.step(dt, motion);
  if (ctx.playing && (live || match.roam)) {
    input.applyLook(ctx.camera);
    audio.setListener(ctx.camera);
  }

  if (live && !match.roam) {
    engine.getPatrol()?.tryAttack?.(dt, ctx.camera.position, {
      active: true,
      onShot(shot) {
        audio.shot({ x: shot.x, y: shot.y, z: shot.z });
        if (!shot.hit) return;
        hurtFlash = 0.18;
        const next = match.hurt(shot.damage);
        if (next === "lose") endMatch(false);
      },
    });
  }

  hitFlash = Math.max(0, hitFlash - dt);
  hurtFlash = Math.max(0, hurtFlash - dt);
  const clip = weapon.getAmmo();
  hud.paint({
    playing: ctx.playing,
    overlay: !overlay?.hidden,
    hp: match.hp,
    kills: match.kills,
    mag: clip.mag,
    reserve: clip.reserve,
    reloading: clip.reloading,
    weapon: weapon.getName(),
    hitFlash: hitFlash > 0,
    hurtFlash: hurtFlash > 0,
  });
  if (ctx.playing) {
    document.body.dataset.ammo = clip.mag + "/" + clip.reserve;
    document.body.dataset.kills = String(match.kills);
    document.body.dataset.hp = String(Math.ceil(match.hp));
    document.body.dataset.pose =
      ctx.camera.position.x.toFixed(2) + "," + ctx.camera.position.z.toFixed(2);
    document.body.dataset.match = match.state;
  }

  const pos = ctx.playing ? ctx.camera.position : engine.getSpawn();
  minimap.draw({
    bounds: engine.getWalkBounds(),
    ...engine.getMinimap(),
    player: {
      x: pos.x,
      z: pos.z,
      yaw: ctx.playing ? input.getYaw() : 0,
    },
    ai: engine.getAiBlips(),
    orbs: engine.getOrbBlips(),
  });

  lastNet += dt;
  if (lastNet > 0.05 && ctx.playing && (live || match.roam)) {
    lastNet = 0;
    net.sendPose(ctx.camera.position.x, ctx.camera.position.z, input.getYaw());
  }
});
engine.onMode(setPlayingUi);

input.onLock((locked) => {
  if (!locked) {
    if (match.isLive() && !match.roam) {
      match.pause();
      hud.showOverlay("paused");
      document.body.dataset.match = "paused";
      return;
    }
    engine.exitPlay();
    return;
  }
  if (match.state === "paused") {
    match.resume();
    hud.hideOverlay();
  } else if (!engine.isPlaying()) beginPlay("match");
});

canvas.addEventListener("click", (event) => {
  event.preventDefault();
  if (match.state === "menu" || match.state === "win" || match.state === "lose") return;
  if (match.state === "paused") {
    beginPlay(match.roam ? "roam" : "match");
    return;
  }
  input.requestLock();
});
matchBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  beginPlay("match");
});
walkBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  beginPlay("roam");
});
window.addEventListener("keydown", (event) => {
  if (event.code !== "Escape") return;
  if (match.isLive()) return;
  if (engine.isPlaying() && !input.isLocked()) engine.exitPlay();
});
window.__debugCombat = {
  fire: () => weapon.debugFire(),
  reload: () => weapon.debugReload(),
  ammo: () => weapon.getAmmo(),
};
window.__debugAi = () => engine.getAiBlips();
window.__debugTargets = () => ({
  kills: match.kills,
  hp: match.hp,
  state: match.state,
  audio: audio.state(),
  lastShot,
  orbs: engine.getTargetList(),
  soldiers: engine.getPatrolList(),
  progress: snapshotProgress(),
  net: net.connected(),
});
window.__debugMatch = {
  start: () => beginPlay("match"),
  win: () => endMatch(true),
  lose: () => endMatch(false),
};
