const playDemoButton = document.getElementById("play-demo-btn");
const closeBriefingButton = document.getElementById("close-briefing-btn");
const demoBriefing = document.getElementById("demo-briefing");
const weaponStage = document.getElementById("weapon-stage");
const weaponName = document.getElementById("weapon-name");
const weaponNote = document.getElementById("weapon-note");
const damageBar = document.getElementById("stat-damage");
const rangeBar = document.getElementById("stat-range");
const rateBar = document.getElementById("stat-rate");
const viewForm = document.getElementById("view-form");
const viewList = document.getElementById("view-list");
const viewCount = document.getElementById("view-count");
const viewStatus = document.getElementById("view-status");
const VIEW_KEY = "dual-fire-views";

// Shows or hides the ops briefing overlay.
function toggleDemoBriefing(forceOpen) {
  const shouldOpen =
    typeof forceOpen === "boolean"
      ? forceOpen
      : demoBriefing.hasAttribute("hidden");

  demoBriefing.classList.toggle("is-open", shouldOpen);

  if (shouldOpen) {
    demoBriefing.removeAttribute("hidden");
    playDemoButton.textContent = "Close Briefing";
    playDemoButton.setAttribute("aria-expanded", "true");
  } else {
    demoBriefing.setAttribute("hidden", "");
    playDemoButton.textContent = "Play Demo";
    playDemoButton.setAttribute("aria-expanded", "false");
  }
}

function swapDefaultWeapon(thumb) {
  if (!thumb) return;

  document.querySelectorAll(".weapon-thumb").forEach((el) => {
    el.classList.toggle("is-active", el === thumb);
  });

  weaponStage.src = thumb.dataset.image;
  weaponStage.alt = thumb.dataset.alt;
  weaponName.textContent = thumb.dataset.name;
  weaponNote.textContent = thumb.dataset.note;
  damageBar.style.width = `${thumb.dataset.damage}%`;
  rangeBar.style.width = `${thumb.dataset.range}%`;
  rateBar.style.width = `${thumb.dataset.rate}%`;
}

function toggleIntel(button) {
  const card = button.closest(".intel-card");
  const open = !card.classList.contains("is-open");
  card.classList.toggle("is-open", open);
  button.textContent = open ? "Close Intel" : "Open Intel";
}

function loadViews() {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveViews(views) {
  localStorage.setItem(VIEW_KEY, JSON.stringify(views));
}

function renderViews() {
  const views = loadViews();
  viewCount.textContent = String(views.length);
  viewList.replaceChildren();

  if (!views.length) {
    const empty = document.createElement("p");
    empty.className = "view-empty";
    empty.textContent =
      "No field reports yet. Be the first operator to tell us what would make Dual Fire 99%.";
    viewList.append(empty);
    return;
  }

  views.forEach((view) => {
    const card = document.createElement("article");
    card.className = "view-card panel hud-panel";

    const head = document.createElement("header");
    const name = document.createElement("h3");
    name.textContent = view.name;
    const meta = document.createElement("p");
    meta.className = "view-meta";
    meta.textContent = `${view.focus} · ${view.when}`;
    head.append(name, meta);

    const body = document.createElement("p");
    body.textContent = view.body;
    card.append(head, body);
    viewList.append(card);
  });
}

function postView(event) {
  event.preventDefault();
  const name = document.getElementById("view-name").value.trim();
  const focus = document.getElementById("view-focus").value;
  const body = document.getElementById("view-body").value.trim();

  if (!name || !body) {
    viewStatus.textContent = "Callsign and view are required.";
    return;
  }

  const views = loadViews();
  views.unshift({
    name,
    focus,
    body,
    when: new Date().toLocaleString(),
  });
  saveViews(views);
  viewForm.reset();
  viewStatus.textContent = "View posted. Keep coming back and playing.";
  renderViews();
}

playDemoButton.addEventListener("click", () => toggleDemoBriefing());
closeBriefingButton.addEventListener("click", () => toggleDemoBriefing(false));
demoBriefing.addEventListener("click", (event) => {
  if (event.target === demoBriefing) toggleDemoBriefing(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") toggleDemoBriefing(false);
});

document.querySelectorAll(".weapon-thumb").forEach((thumb) => {
  thumb.addEventListener("click", () => swapDefaultWeapon(thumb));
});

document.querySelectorAll(".intel-toggle").forEach((button) => {
  button.addEventListener("click", () => toggleIntel(button));
});

viewForm.addEventListener("submit", postView);
renderViews();
