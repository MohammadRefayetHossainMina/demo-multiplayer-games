function pointInBoxes(x, z, boxes) {
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    if (x >= b.minx && x <= b.maxx && z >= b.minz && z <= b.maxz) return true;
  }
  return false;
}

export function clearShot(ax, az, px, pz, blocked, boxes) {
  const dx = px - ax;
  const dz = pz - az;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.01) return true;
  const step = boxes ? 1.6 : 1.1;
  const steps = Math.max(4, Math.ceil(dist / step));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = ax + dx * t;
    const z = az + dz * t;
    if (boxes) {
      if (pointInBoxes(x, z, boxes)) return false;
    } else if (typeof blocked === "function" && blocked(x, z)) {
      return false;
    }
  }
  return true;
}

export function sampleSense(agent, player, blocked, losBoxes) {
  const cfg = agent.cfg;
  const dx = player.x - agent.x;
  const dz = player.z - agent.z;
  const dist = Math.hypot(dx, dz);
  const combat =
    (agent.state && agent.state !== "idle" && agent.state !== "patrol" && agent.state !== "dead") ||
    (agent.alerted || 0) > 0 ||
    (agent.underFire || 0) > 0;
  if (dist > cfg.detectRange && !combat) {
    return {
      dx,
      dz,
      dist,
      facing: 0,
      inCone: false,
      hasLos: false,
      canSee: false,
      canShoot: false,
      hpRatio: agent.health.hp / agent.health.maxHp,
    };
  }
  const yaw = agent.mesh.rotation.y;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  const facing = dist > 0.01 ? (fx * dx + fz * dz) / dist : 1;
  const inCone = dist <= cfg.detectRange && facing >= Math.cos(cfg.viewHalf);
  const needsLos = inCone || combat;
  const hasLos = needsLos && dist > 0.01 && clearShot(agent.x, agent.z, player.x, player.z, blocked, losBoxes);
  const inWeapon = dist >= cfg.weaponMin && dist <= cfg.weaponMax;
  return {
    dx,
    dz,
    dist,
    facing,
    inCone,
    hasLos,
    canSee: inCone && hasLos,
    canShoot: hasLos && inWeapon,
    hpRatio: agent.health.hp / agent.health.maxHp,
  };
}
