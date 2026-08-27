import { AdditiveBlending, Color, EdgesGeometry, Group, IcosahedronGeometry, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial, OctahedronGeometry, PointLight, SphereGeometry } from "three";

export const ORB_KINDS = {
  flaming: {
    hp: 54,
    respawn: 3.6,
    color: 0xff6a1a,
    emissive: 0xff3b00,
    light: 0xff6a22,
    spin: 1.8,
    bob: 0.32,
  },
  cyber: {
    hp: 72,
    respawn: 4.2,
    color: 0x1ad6ff,
    emissive: 0x00b8ff,
    light: 0x3cf0ff,
    spin: 0.9,
    bob: 0.22,
  },
  water: {
    hp: 36,
    respawn: 3.2,
    color: 0x4aa8ff,
    emissive: 0x1a6cff,
    light: 0x7ec8ff,
    spin: 0.55,
    bob: 0.4,
  },
};

const HIT_FLASH = new Color(0xffffff);

export function raySphere(origin, dir, center, radius) {
  const ox = origin.x - center.x;
  const oy = origin.y - center.y;
  const oz = origin.z - center.z;
  const b = ox * dir.x + oy * dir.y + oz * dir.z;
  const c = ox * ox + oy * oy + oz * oz - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  const t0 = -b - s;
  const t1 = -b + s;
  if (t0 > 0.35) return t0;
  if (t1 > 0.35) return t1;
  return null;
}

export function makeHealth(kind, hp, respawnSec) {
  return {
    kind,
    hp,
    maxHp: hp,
    alive: true,
    respawnLeft: 0,
    respawnSec,
    hideLeft: 0,
  };
}

export function healthFromHit(object) {
  let node = object;
  while (node) {
    if (node.userData?.health) return node.userData.health;
    node = node.parent;
  }
  return null;
}

export function applyDamage(health, amount) {
  if (!health?.alive) return { hit: false, killed: false, kind: health?.kind || null };
  health.hp = Math.max(0, health.hp - amount);
  const killed = health.hp <= 0;
  if (killed) {
    health.alive = false;
    health.respawnLeft = health.respawnSec;
    health.hideLeft = health.kind === "soldier" ? 1.15 : 0;
    health.onKill?.();
  } else {
    health.onHurt?.();
  }
  return { hit: true, killed, kind: health.kind, hp: health.hp, maxHp: health.maxHp };
}

export function tickHealth(health, dt) {
  if (!health || health.alive) return false;
  if (health.hideLeft > 0) {
    health.hideLeft -= dt;
    if (health.hideLeft <= 0) health.onHide?.();
  }
  health.respawnLeft -= dt;
  if (health.respawnLeft > 0) return false;
  health.alive = true;
  health.hp = health.maxHp;
  health.hideLeft = 0;
  health.onRespawn?.();
  return true;
}

function orbMaterial(kind) {
  const spec = ORB_KINDS[kind];
  const transparent = kind === "water";
  return new MeshStandardMaterial({
    color: spec.color,
    emissive: spec.emissive,
    emissiveIntensity: kind === "flaming" ? 1.35 : kind === "cyber" ? 1.1 : 0.85,
    roughness: kind === "water" ? 0.12 : 0.28,
    metalness: kind === "cyber" ? 0.72 : 0.08,
    transparent,
    opacity: transparent ? 0.78 : 1,
  });
}

function orbMesh(kind) {
  if (kind === "flaming") return new Mesh(new IcosahedronGeometry(0.52, 1), orbMaterial(kind));
  if (kind === "cyber") return new Mesh(new OctahedronGeometry(0.56), orbMaterial(kind));
  return new Mesh(new SphereGeometry(0.5, 24, 16), orbMaterial(kind));
}

function hitSphere() {
  const hit = new Mesh(
    new SphereGeometry(0.78, 12, 10),
    new MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      color: 0xffffff,
    })
  );
  hit.name = "orb-hit";
  hit.frustumCulled = false;
  return hit;
}

export function createOrbs(world, spots) {
  const orbs = spots.map((spot, index) => {
    const kind = spot.kind;
    const spec = ORB_KINDS[kind];
    const group = new Group();
    group.name = "orb-" + kind;
    group.position.set(spot.x, spot.y, spot.z);

    const mesh = orbMesh(kind);
    mesh.castShadow = true;
    group.add(mesh);
    group.add(hitSphere());

    if (kind === "cyber") {
      const edges = new LineSegments(
        new EdgesGeometry(mesh.geometry),
        new LineBasicMaterial({
          color: 0xb8ffff,
          transparent: true,
          opacity: 0.85,
          blending: AdditiveBlending,
          depthWrite: false,
        })
      );
      group.add(edges);
    }

    if (kind === "flaming") {
      const core = new Mesh(
        new SphereGeometry(0.18, 10, 10),
        new MeshStandardMaterial({
          color: 0xfff1a8,
          emissive: 0xffee88,
          emissiveIntensity: 2.2,
        })
      );
      group.add(core);
    }

    const light = new PointLight(spec.light, 1.35, 11, 2);
    light.position.set(0, 0.1, 0);
    group.add(light);
    group.traverse((child) => {
      child.userData.ignoreOverview = true;
    });
    world.add(group);

    const health = makeHealth(kind, spec.hp, spec.respawn);
    group.userData.health = health;
    const baseEmissive = mesh.material.emissiveIntensity;
    let flash = 0;

    health.onHurt = () => {
      flash = 1;
      mesh.material.emissive.copy(HIT_FLASH);
    };
    health.onKill = () => {
      flash = 0;
      group.visible = false;
      light.intensity = 0;
    };
    health.onHide = () => {
      group.visible = false;
    };
    health.onRespawn = () => {
      group.visible = true;
      group.scale.setScalar(1);
      light.intensity = 1.35;
      mesh.material.emissive.setHex(spec.emissive);
      mesh.material.emissiveIntensity = baseEmissive;
    };

    return {
      kind,
      group,
      mesh,
      light,
      health,
      spec,
      baseY: spot.y,
      phase: index * 1.7,
      flash: () => flash,
      setFlash(next) {
        flash = next;
      },
      baseEmissive,
    };
  });

  function step(dt, time) {
    const t = time ?? 0;
    for (const orb of orbs) {
      tickHealth(orb.health, dt);
      if (!orb.health.alive) continue;
      const spec = orb.spec;
      orb.group.position.y = orb.baseY + Math.sin(t * (1.4 + spec.bob) + orb.phase) * spec.bob;
      orb.group.rotation.y += dt * spec.spin;
      if (orb.kind === "water") {
        const squash = 1 + Math.sin(t * 2.1 + orb.phase) * 0.06;
        orb.group.scale.set(1 / squash, squash, 1 / squash);
      }
      if (orb.kind === "flaming") {
        orb.light.intensity = 1.15 + Math.sin(t * 11 + orb.phase) * 0.35;
      }
      const flash = orb.flash();
      if (flash > 0) {
        const next = Math.max(0, flash - dt * 6);
        orb.setFlash(next);
        orb.mesh.material.emissiveIntensity = orb.baseEmissive + next * 1.8;
        if (next <= 0) orb.mesh.material.emissive.setHex(spec.emissive);
      }
    }
  }

  return {
    step,
    blips() {
      return orbs
        .filter((orb) => orb.health.alive)
        .map((orb) => ({
          x: orb.group.position.x,
          z: orb.group.position.z,
          kind: orb.kind,
        }));
    },
    list() {
      return orbs.map((orb) => ({
        kind: orb.kind,
        hp: orb.health.hp,
        maxHp: orb.health.maxHp,
        alive: orb.health.alive,
        respawn: +orb.health.respawnLeft.toFixed(2),
        x: +orb.group.position.x.toFixed(2),
        y: +orb.group.position.y.toFixed(2),
        z: +orb.group.position.z.toFixed(2),
      }));
    },
    raycast(origin, dir, far = 220) {
      const hits = [];
      for (const orb of orbs) {
        if (!orb.health.alive) continue;
        const dist = raySphere(origin, dir, orb.group.position, 0.82);
        if (dist == null || dist > far) continue;
        hits.push({
          distance: dist,
          point: {
            x: origin.x + dir.x * dist,
            y: origin.y + dir.y * dist,
            z: origin.z + dir.z * dist,
          },
          object: orb.group,
        });
      }
      return hits;
    },
    reset() {
      for (const orb of orbs) {
        orb.health.alive = true;
        orb.health.hp = orb.health.maxHp;
        orb.health.respawnLeft = 0;
        orb.health.hideLeft = 0;
        orb.health.onRespawn?.();
      }
    },
  };
}
