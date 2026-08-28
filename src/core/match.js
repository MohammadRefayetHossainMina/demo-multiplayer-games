export const PLAYER_MAX_HP = 100;

export function createMatch() {
  let state = "menu";
  let hp = PLAYER_MAX_HP;
  let kills = 0;
  let roam = false;

  function live() {
    return state === "playing";
  }

  return {
    get state() {
      return state;
    },
    get hp() {
      return hp;
    },
    get kills() {
      return kills;
    },
    get roam() {
      return roam;
    },
    isLive: live,
    isPaused: () => state === "paused",
    start({ free = false } = {}) {
      roam = !!free;
      hp = PLAYER_MAX_HP;
      kills = 0;
      state = "playing";
    },
    pause() {
      if (state === "playing") state = "paused";
    },
    resume() {
      if (state === "paused") state = "playing";
    },
    addKill(target) {
      if (!live() || roam) return state;
      kills += 1;
      if (target === "boss") state = "win";
      return state;
    },
    hurt(amount) {
      if (!live() || roam) return state;
      hp = Math.max(0, hp - amount);
      if (hp <= 0) state = "lose";
      return state;
    },
    toMenu() {
      state = "menu";
      roam = false;
    },
  };
}
