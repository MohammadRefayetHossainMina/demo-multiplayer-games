import { clearShot } from "./senses.js";

export function buildCoverSlots(buildings, blocked) {
  const slots = [];
  const pad = 2.1;
  const list = buildings || [];
  for (const box of list) {
    const cx = (box.minx + box.maxx) * 0.5;
    const cz = (box.minz + box.maxz) * 0.5;
    const candidates = [
      { x: cx, z: box.minz - pad },
      { x: cx, z: box.maxz + pad },
      { x: box.minx - pad, z: cz },
      { x: box.maxx + pad, z: cz },
    ];
    for (const point of candidates) {
      if (blocked(point.x, point.z)) continue;
      slots.push({ x: point.x, z: point.z });
    }
  }
  return slots;
}

function peekFrom(slot, player, blocked, losBoxes) {
  const dx = player.x - slot.x;
  const dz = player.z - slot.z;
  const dist = Math.hypot(dx, dz) || 1;
  for (const step of [1.35, 1.0]) {
    const x = slot.x + (dx / dist) * step;
    const z = slot.z + (dz / dist) * step;
    if (blocked(x, z)) continue;
    if (!clearShot(x, z, player.x, player.z, blocked, losBoxes)) continue;
    return { x, z };
  }
  return null;
}

export function pickCover(slots, agent, player, blocked, losBoxes, { maxDist = 22, avoid = null } = {}) {
  const nearby = [];
  for (const slot of slots) {
    const travel = Math.hypot(slot.x - agent.x, slot.z - agent.z);
    if (travel > maxDist) continue;
    if (avoid && Math.hypot(slot.x - avoid.x, slot.z - avoid.z) < 2.2) continue;
    nearby.push({ slot, travel });
  }
  nearby.sort((a, b) => a.travel - b.travel);
  const take = nearby.slice(0, 6);
  let best = null;
  let bestScore = -1e9;
  for (const item of take) {
    const slot = item.slot;
    if (clearShot(slot.x, slot.z, player.x, player.z, blocked, losBoxes)) continue;
    const peek = peekFrom(slot, player, blocked, losBoxes);
    if (!peek) continue;
    const score = 12 - item.travel * 0.45;
    if (score > bestScore) {
      bestScore = score;
      best = { x: slot.x, z: slot.z, peek };
    }
  }
  return best;
}
