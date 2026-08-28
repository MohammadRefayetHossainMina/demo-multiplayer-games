export const PERSONALITIES = {
  aggressive: { aggression: 0.88, courage: 0.82, coverPref: 0.28, preferDist: 11 },
  defensive: { aggression: 0.28, courage: 0.34, coverPref: 0.94, preferDist: 20 },
  balanced: { aggression: 0.52, courage: 0.56, coverPref: 0.68, preferDist: 16 },
};

const BASE = {
  grunt: {
    level: 1,
    hp: 72,
    respawn: 4.5,
    detectRange: 26,
    viewHalf: (45 * Math.PI) / 180,
    weaponMin: 2,
    weaponMax: 22,
    fireGap: [1.45, 2.15],
    accuracy: 0.52,
    speed: 2.35,
    chaseSpeed: 3.15,
    searchTime: 4.8,
    react: 0.28,
    coverPref: 0.12,
    aggression: 0.55,
    courage: 0.5,
    preferDist: 14,
    damage: 11,
    scale: 1,
    tint: 0x6e6a62,
  },
  tactical: {
    level: 2,
    hp: 90,
    respawn: 5.2,
    detectRange: 30,
    viewHalf: (48 * Math.PI) / 180,
    weaponMin: 2.4,
    weaponMax: 26,
    fireGap: [1.15, 1.75],
    accuracy: 0.6,
    speed: 2.42,
    chaseSpeed: 3.45,
    searchTime: 6.2,
    react: 0.14,
    hideTime: 0.65,
    peekTime: 0.55,
    coverPref: 0.8,
    aggression: 0.45,
    courage: 0.48,
    preferDist: 16,
    damage: 12,
    scale: 1,
    tint: 0x4a5a68,
  },
  boss: {
    level: 3,
    hp: 168,
    respawn: 8.5,
    detectRange: 36,
    viewHalf: (52 * Math.PI) / 180,
    weaponMin: 2.2,
    weaponMax: 30,
    fireGap: [0.9, 1.3],
    accuracy: 0.68,
    speed: 2.55,
    chaseSpeed: 3.85,
    searchTime: 8,
    react: 0.08,
    hideTime: 0.5,
    peekTime: 0.42,
    coverPref: 0.72,
    aggression: 0.5,
    courage: 0.74,
    preferDist: 17,
    damage: 14,
    scale: 1.2,
    tint: 0x3a2218,
    reposition: 3.4,
  },
};

export function roleConfig(role = "grunt", personality = "balanced") {
  const base = { ...(BASE[role] || BASE.grunt) };
  if (role !== "grunt") Object.assign(base, PERSONALITIES[personality] || PERSONALITIES.balanced);
  if (role === "boss") {
    Object.assign(base, BASE.boss);
    base.aggression = 0.55;
    base.courage = 0.74;
    base.coverPref = 0.72;
    base.preferDist = 17;
  }
  return base;
}
