import { pickCover } from "./cover.js";
import { sampleSense } from "./senses.js";

function setState(agent, name) {
  if (agent.state === name) return;
  agent.state = name;
  agent.stateT = 0;
}

function facePlayer(agent, player) {
  agent.mesh.rotation.y = Math.atan2(player.x - agent.x, player.z - agent.z);
}

function rememberPlayer(agent, player) {
  if (!player) return;
  agent.lastSeen = { x: player.x, z: player.z, age: 0 };
}

export function raiseAlarm(agent, player) {
  if (!agent?.health?.alive) return;
  rememberPlayer(agent, player);
  agent.underFire = Math.max(agent.underFire || 0, 0.85);
  agent.alerted = Math.max(agent.alerted || 0, 4.8);
  agent.coverSlot = null;
  agent.atCover = false;
  if (agent.state === "dead") return;
  if (agent.state === "cover" || agent.state === "peek") return;
  setState(agent, "cover");
}

export function alertAllies(agents, source, player) {
  if (!source || !player) return;
  raiseAlarm(source, player);
  for (const agent of agents) {
    if (agent === source || !agent.health.alive) continue;
    const dist = Math.hypot(agent.x - source.x, agent.z - source.z);
    const hear = agent.cfg.hearRange || 14;
    if (dist > hear) continue;
    raiseAlarm(agent, player);
  }
}

function strafeGoal(agent, player) {
  const dx = player.x - agent.x;
  const dz = player.z - agent.z;
  const len = Math.hypot(dx, dz) || 1;
  const side = agent.strafeSign || 1;
  return {
    x: agent.x + (-dz / len) * 2.4 * side,
    z: agent.z + (dx / len) * 2.4 * side,
  };
}

function backGoal(agent, player) {
  const dx = player.x - agent.x;
  const dz = player.z - agent.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: agent.x - (dx / len) * 2.1, z: agent.z - (dz / len) * 2.1 };
}

function decide(agent, sense, player, coverSlots, blocked, losBoxes) {
  const cfg = agent.cfg;
  const cover = pickCover(coverSlots, agent, player, blocked, losBoxes, {
    maxDist: cfg.level === 3 ? 26 : 20,
    avoid: cfg.level === 3 ? agent.coverSlot : null,
  });
  const low = sense.hpRatio < 0.38;
  const far = sense.dist > cfg.preferDist + 3;
  const pressured = agent.underFire > 0 || agent.alerted > 0 || low;

  if (pressured && cover) return "cover";

  if (cfg.level === 1) {
    if (sense.canShoot) return "attack";
    return "chase";
  }

  if (cfg.level === 3) {
    if (sense.dist < 8 && sense.hpRatio > 0.4) return sense.canShoot ? "attack" : "chase";
    if (sense.canShoot && !far) return "attack";
    return cover ? "cover" : "chase";
  }

  if ((pressured && cfg.coverPref > 0.45 && cover) || (far && cfg.coverPref > 0.6 && cover)) {
    return "cover";
  }
  if (cfg.aggression > 0.7 && far) return "chase";
  if (sense.canShoot) return "attack";
  return cover && cfg.coverPref > 0.5 ? "cover" : "chase";
}

export function updateBrain(agent, dt, player, ctx) {
  const { blocked, coverSlots, losBoxes, active } = ctx;
  agent.stateT += dt;
  agent.wantFire = false;
  agent.moveSpeed = agent.cfg.speed;
  agent.underFire = Math.max(0, (agent.underFire || 0) - dt);
  agent.alerted = Math.max(0, (agent.alerted || 0) - dt);

  if (!agent.health.alive) {
    setState(agent, "dead");
    agent.goal = null;
    return;
  }

  if (!active || !player) {
    if (agent.state !== "idle" && agent.state !== "patrol") setState(agent, "patrol");
    tickRoute(agent, dt);
    return;
  }

  if (agent.alerted > 0 || agent.underFire > 0) {
    rememberPlayer(agent, player);
  }

  const sense = sampleSense(agent, player, blocked, losBoxes);
  if (sense.canSee) agent.lastSeen = { x: player.x, z: player.z, age: 0 };
  else if (agent.lastSeen) agent.lastSeen.age += dt;

  if ((agent.state === "idle" || agent.state === "patrol") && (sense.canSee || agent.alerted > 0)) {
    setState(agent, agent.alerted > 0 ? "cover" : "alert");
  }

  switch (agent.state) {
    case "idle":
    case "patrol":
      tickRoute(agent, dt);
      break;
    case "alert":
      agent.goal = null;
      facePlayer(agent, player);
      if (agent.stateT >= agent.cfg.react) {
        setState(agent, decide(agent, sense, player, coverSlots, blocked, losBoxes));
      }
      break;
    case "chase":
      agent.moveSpeed = agent.cfg.chaseSpeed;
      agent.goal = sense.canSee ? { x: player.x, z: player.z } : agent.lastSeen;
      facePlayer(agent, player);
      if (decide(agent, sense, player, coverSlots, blocked, losBoxes) === "cover") {
        setState(agent, "cover");
      } else if (sense.canSee && sense.canShoot) setState(agent, "attack");
      else if (!sense.canSee) setState(agent, "search");
      break;
    case "attack":
      facePlayer(agent, player);
      if (agent.underFire > 0 || agent.alerted > 0) {
        if (decide(agent, sense, player, coverSlots, blocked, losBoxes) === "cover") {
          setState(agent, "cover");
          break;
        }
        agent.goal = agent.cfg.courage < 0.45 ? backGoal(agent, player) : strafeGoal(agent, player);
      } else {
        agent.goal = null;
      }
      agent.wantFire = sense.canShoot;
      if (!sense.hasLos) setState(agent, "search");
      else if (!sense.canShoot && sense.canSee) setState(agent, "chase");
      break;
    case "cover": {
      if (!agent.atCover) agent.moveSpeed = agent.cfg.chaseSpeed;
      if (!agent.coverSlot) {
        agent.coverSlot = pickCover(coverSlots, agent, player, blocked, losBoxes, { maxDist: 24 });
      }
      const slot = agent.coverSlot;
      if (!slot) {
        setState(agent, sense.canShoot ? "attack" : "chase");
        break;
      }
      agent.goal = slot;
      const here = Math.hypot(slot.x - agent.x, slot.z - agent.z) < 0.7;
      if (here) {
        agent.goal = null;
        facePlayer(agent, player);
        if (!agent.atCover) {
          agent.atCover = true;
          agent.stateT = 0;
        }
        agent.wantFire = sense.hasLos && sense.dist <= agent.cfg.weaponMax;
        if (agent.stateT > (agent.cfg.hideTime || 0.6)) setState(agent, "peek");
      } else {
        agent.atCover = false;
      }
      if (!sense.canSee && !agent.alerted && (!agent.lastSeen || agent.lastSeen.age > 1.8)) {
        setState(agent, "search");
      }
      break;
    }
    case "peek": {
      const slot = agent.coverSlot;
      if (!slot?.peek) {
        setState(agent, "cover");
        break;
      }
      agent.goal = slot.peek;
      facePlayer(agent, player);
      const atPeek = Math.hypot(slot.peek.x - agent.x, slot.peek.z - agent.z) < 0.55;
      agent.wantFire = atPeek && sense.hasLos;
      if (agent.stateT > (agent.cfg.peekTime || 0.5)) {
        agent.peekCount = (agent.peekCount || 0) + 1;
        if (agent.cfg.level === 3 && agent.peekCount >= 2) {
          agent.coverSlot = null;
          agent.peekCount = 0;
        }
        agent.atCover = false;
        setState(agent, "cover");
      }
      if (!sense.hasLos && agent.lastSeen && agent.lastSeen.age > 2 && !agent.alerted) {
        setState(agent, "search");
      }
      break;
    }
    case "search":
      agent.goal = agent.lastSeen;
      agent.moveSpeed = agent.cfg.speed * 0.9;
      if (sense.canSee || agent.alerted > 0) setState(agent, "alert");
      else if (!agent.lastSeen || agent.lastSeen.age > agent.cfg.searchTime) {
        agent.lastSeen = null;
        setState(agent, "patrol");
      }
      break;
    default:
      setState(agent, "patrol");
  }
}

function tickRoute(agent, dt) {
  if (!agent.route?.length) {
    agent.goal = null;
    return;
  }
  if (agent.state === "idle") {
    agent.goal = null;
    agent.idleLeft = (agent.idleLeft || 0) - dt;
    if (agent.idleLeft <= 0) setState(agent, "patrol");
    return;
  }
  const goal = agent.route[agent.index % agent.route.length];
  agent.goal = goal;
  const dist = Math.hypot(goal.x - agent.x, goal.z - agent.z);
  if (dist < 1.15) {
    agent.index = (agent.index + 1) % agent.route.length;
    agent.idleLeft = 0.35 + Math.random() * 0.7;
    setState(agent, "idle");
  }
}

export function resetBrain(agent) {
  agent.state = "patrol";
  agent.stateT = 0;
  agent.lastSeen = null;
  agent.underFire = 0;
  agent.alerted = 0;
  agent.coverSlot = null;
  agent.atCover = false;
  agent.peekCount = 0;
  agent.goal = null;
  agent.wantFire = false;
  agent.idleLeft = 0;
  agent.strafeSign = Math.random() < 0.5 ? 1 : -1;
}
