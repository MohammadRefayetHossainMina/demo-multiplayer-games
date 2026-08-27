import { PLAYER_MAX_HP, WIN_KILLS } from "../core/match.js";
import { snapshotProgress } from "../core/progress.js";

export function createHud(els) {
  function xpLine() {
    const p = snapshotProgress();
    return "Lv " + p.level + " · " + p.xp + " XP · " + p.wins + "/" + p.matches + " wins";
  }

  function showOverlay(mode, extra = "") {
    if (!els.overlay) return;
    const menu = mode === "menu";
    const paused = mode === "paused";
    const win = mode === "win";
    const lose = mode === "lose";
    els.overlay.hidden = false;
    if (els.title) {
      els.title.textContent = win
        ? "Sector held"
        : lose
          ? "Down"
          : paused
            ? "Paused"
            : "Kill to Survive";
    }
    if (els.body) {
      els.body.textContent = win
        ? "Five drops. You still stand."
        : lose
          ? "The lane took you. Drop again."
          : paused
            ? "Pointer unlocked. Resume to keep the fight."
            : "Frag " + WIN_KILLS + " targets before they drop you. Equal kit. No unlocks.";
    }
    if (els.xp) els.xp.textContent = extra || xpLine();
    if (els.matchBtn) {
      els.matchBtn.textContent = paused ? "Resume" : win || lose ? "Restart match" : "Start match";
    }
    if (els.walkBtn) els.walkBtn.hidden = !menu;
  }

  function hideOverlay() {
    if (els.overlay) els.overlay.hidden = true;
  }

  function paint(state) {
    const live = state.playing && !state.overlay;
    if (els.hpWrap) els.hpWrap.hidden = !live;
    if (els.hpFill) els.hpFill.style.width = (100 * state.hp) / PLAYER_MAX_HP + "%";
    if (els.hpText) els.hpText.textContent = Math.ceil(state.hp) + " HP";
    if (els.kills) {
      els.kills.hidden = !live;
      els.kills.textContent = state.kills + " / " + WIN_KILLS;
    }
    if (els.ammo) {
      els.ammo.hidden = !live;
      els.ammo.textContent = state.reloading ? "RELOAD" : state.mag + " / " + state.reserve;
      els.ammo.classList.toggle("empty", !state.reloading && state.mag === 0);
    }
    if (els.hud) {
      els.hud.hidden = !live;
      els.hud.textContent =
        "LMB shoot · R reload · 1 ACR · 2 CQC · 3 Pistol · " +
        (state.weapon || "ACR") +
        " · Esc";
    }
    if (els.crosshair) {
      els.crosshair.classList.toggle("on", live);
      els.crosshair.classList.toggle("hit", live && state.hitFlash);
      els.crosshair.classList.toggle("hurt", live && state.hurtFlash);
    }
    if (els.hurt) els.hurt.classList.toggle("on", live && state.hurtFlash);
  }

  return { showOverlay, hideOverlay, paint, xpLine };
}
