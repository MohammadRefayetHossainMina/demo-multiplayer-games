const KEY = "dual-fire-progress";
const XP_PER_LEVEL = 120;

function clampInt(value, min, max) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function empty() {
  return { xp: 0, matches: 0, wins: 0 };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : empty();
    if (!data || typeof data !== "object") return empty();
    return {
      xp: clampInt(data.xp, 0, 10_000_000),
      matches: clampInt(data.matches, 0, 1_000_000),
      wins: clampInt(data.wins, 0, 1_000_000),
    };
  } catch {
    return empty();
  }
}

export function levelFor(xp) {
  return Math.floor(clampInt(xp, 0, 10_000_000) / XP_PER_LEVEL) + 1;
}

export function snapshotProgress() {
  const data = loadProgress();
  return { ...data, level: levelFor(data.xp) };
}

export function recordMatch({ win, kills }) {
  const data = loadProgress();
  data.matches += 1;
  if (win) data.wins += 1;
  const frag = clampInt(kills, 0, 99);
  data.xp += 25 + frag * 15 + (win ? 40 : 0);
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
  return { ...data, level: levelFor(data.xp) };
}
