export function inWalkBounds(x, z, bounds) {
  if (!bounds) return true;
  if (bounds.shape === "plus") {
    const onNs = Math.abs(x) <= bounds.arm && Math.abs(z) <= bounds.extentZ;
    const onEw = Math.abs(z) <= bounds.arm && Math.abs(x) <= bounds.extentX;
    return onNs || onEw;
  }
  return (
    x >= bounds.minx &&
    x <= bounds.maxx &&
    z >= bounds.minz &&
    z <= bounds.maxz
  );
}

export function clampToWalkBounds(x, z, bounds) {
  if (!bounds) return { x, z };
  if (bounds.shape !== "plus") {
    return {
      x: Math.min(bounds.maxx, Math.max(bounds.minx, x)),
      z: Math.min(bounds.maxz, Math.max(bounds.minz, z)),
    };
  }

  const arm = bounds.arm;
  const ex = bounds.extentX;
  const ez = bounds.extentZ;
  const ns = {
    x: Math.min(arm, Math.max(-arm, x)),
    z: Math.min(ez, Math.max(-ez, z)),
  };
  const ew = {
    x: Math.min(ex, Math.max(-ex, x)),
    z: Math.min(arm, Math.max(-arm, z)),
  };
  const nsDist = (ns.x - x) * (ns.x - x) + (ns.z - z) * (ns.z - z);
  const ewDist = (ew.x - x) * (ew.x - x) + (ew.z - z) * (ew.z - z);
  return nsDist <= ewDist ? ns : ew;
}

export function isOutsideWalkBounds(x, z, bounds) {
  return !inWalkBounds(x, z, bounds);
}

export function insetWalkBounds(bounds, pad) {
  if (!bounds || !(pad > 0)) return bounds;
  if (bounds.shape === "plus") {
    return {
      ...bounds,
      arm: Math.max(0.25, bounds.arm - pad),
      extentX: Math.max(0.25, bounds.extentX - pad),
      extentZ: Math.max(0.25, bounds.extentZ - pad),
    };
  }
  return {
    ...bounds,
    minx: bounds.minx + pad,
    maxx: bounds.maxx - pad,
    minz: bounds.minz + pad,
    maxz: bounds.maxz - pad,
  };
}

export function probeContainment(blocked, walkBounds, spawn) {
  const leaks = [];
  const far = [
    [80, 0],
    [-80, 0],
    [0, 80],
    [0, -80],
    [80, 80],
    [18, 18],
    [-18, 18],
    [18, -18],
    [-18, -18],
  ];
  if (walkBounds) {
    const pad = 40;
    const maxx = walkBounds.maxx ?? walkBounds.extentX ?? 20;
    const minx = walkBounds.minx ?? -(walkBounds.extentX ?? 20);
    const maxz = walkBounds.maxz ?? walkBounds.extentZ ?? 20;
    const minz = walkBounds.minz ?? -(walkBounds.extentZ ?? 20);
    far.push(
      [maxx + pad, 0],
      [minx - pad, 0],
      [0, maxz + pad],
      [0, minz - pad]
    );
  }
  for (const [x, z] of far) {
    if (!blocked(x, z) && isOutsideWalkBounds(x, z, walkBounds)) {
      leaks.push({ kind: "far-open", x, z });
    }
  }

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [0.7, 0.7],
    [-0.7, 0.7],
    [0.7, -0.7],
    [-0.7, -0.7],
  ];
  for (const [dx, dz] of dirs) {
    let x = spawn.x;
    let z = spawn.z;
    for (let i = 0; i < 200; i += 1) {
      const tryX = x + dx * 0.4;
      if (!blocked(tryX, z)) x = tryX;
      const tryZ = z + dz * 0.4;
      if (!blocked(x, tryZ)) z = tryZ;
      const held = clampToWalkBounds(x, z, walkBounds);
      x = held.x;
      z = held.z;
    }
    if (isOutsideWalkBounds(x, z, walkBounds)) {
      leaks.push({ kind: "walk-out", x, z, dx, dz });
    }
  }

  return leaks;
}

export function probeReach(blocked, walkBounds, spawn) {
  if (!walkBounds || !walkBounds.reachEnds) {
    return { short: [], east: spawn, west: spawn, north: spawn, south: spawn };
  }

  const step = 0.5;
  const minx = walkBounds.minx ?? -(walkBounds.extentX || 0);
  const maxx = walkBounds.maxx ?? walkBounds.extentX;
  const minz = walkBounds.minz ?? -(walkBounds.extentZ || 0);
  const maxz = walkBounds.maxz ?? walkBounds.extentZ;
  const qx = Math.round((maxx - minx) / step) + 4;
  const qz = Math.round((maxz - minz) / step) + 4;
  const seen = new Uint8Array((qx + 2) * (qz + 2));
  const idx = (ix, iz) => (iz + 1) * (qx + 2) + (ix + 1);
  const toIx = (x) => Math.round((x - minx) / step);
  const toIz = (z) => Math.round((z - minz) / step);

  const open = [];
  open.push(spawn.x, spawn.z);
  let maxX = spawn.x;
  let minX = spawn.x;
  let maxZ = spawn.z;
  let minZ = spawn.z;
  let cursor = 0;

  while (cursor < open.length) {
    const x = open[cursor];
    const z = open[cursor + 1];
    cursor += 2;
    const ix = toIx(x);
    const iz = toIz(z);
    if (ix < 0 || iz < 0 || ix > qx || iz > qz) continue;
    const slot = idx(ix, iz);
    if (seen[slot]) continue;
    if (blocked(x, z) || isOutsideWalkBounds(x, z, walkBounds)) continue;
    seen[slot] = 1;
    if (x > maxX) maxX = x;
    if (x < minX) minX = x;
    if (z > maxZ) maxZ = z;
    if (z < minZ) minZ = z;
    open.push(x + step, z, x - step, z, x, z + step, x, z - step);
  }

  const pad = 1.1;
  const short = [];
  if (maxX < maxx - pad) short.push({ dir: "+X", got: maxX, need: maxx - pad });
  if (minX > minx + pad) short.push({ dir: "-X", got: minX, need: minx + pad });
  if (maxZ < maxz - pad) short.push({ dir: "+Z", got: maxZ, need: maxz - pad });
  if (minZ > minz + pad) short.push({ dir: "-Z", got: minZ, need: minz + pad });

  return {
    short,
    east: { x: maxX, z: spawn.z },
    west: { x: minX, z: spawn.z },
    north: { x: spawn.x, z: maxZ },
    south: { x: spawn.x, z: minZ },
  };
}
