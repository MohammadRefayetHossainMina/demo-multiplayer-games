function project(x, z, bounds, w, h) {
  const minx = bounds.minx ?? -(bounds.extentX || 12);
  const maxx = bounds.maxx ?? bounds.extentX ?? 12;
  const minz = bounds.minz ?? -(bounds.extentZ || 12);
  const maxz = bounds.maxz ?? bounds.extentZ ?? 12;
  const u = (x - minx) / Math.max(0.001, maxx - minx);
  const v = (z - minz) / Math.max(0.001, maxz - minz);
  return {
    x: u * w,
    y: (1 - v) * h,
  };
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function createMinimap(canvas) {
  const ctx = canvas.getContext("2d");

  function draw(state) {
    const w = canvas.width;
    const h = canvas.height;
    const bounds = state.bounds;
    if (!ctx || !bounds) return;

    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 1, 1, w - 2, h - 2, 18);
    ctx.save();
    ctx.clip();

    ctx.fillStyle = "#121820";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1a2430";
    ctx.fillRect(0, 0, w, h);

    if (state.lot) {
      const a = project(state.lot.minx, state.lot.maxz, bounds, w, h);
      const b = project(state.lot.maxx, state.lot.minz, bounds, w, h);
      ctx.fillStyle = "#2a251c";
      ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    }

    for (const road of state.roads || []) {
      const a = project(road.minx, road.maxz, bounds, w, h);
      const b = project(road.maxx, road.minz, bounds, w, h);
      ctx.fillStyle = "#3a2a1c";
      ctx.fillRect(a.x - 1, a.y - 1, b.x - a.x + 2, b.y - a.y + 2);
      ctx.fillStyle = "#5a4030";
      ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    }

    for (const building of state.buildings || []) {
      const a = project(building.minx, building.maxz, bounds, w, h);
      const b = project(building.maxx, building.minz, bounds, w, h);
      ctx.fillStyle = "#3d382f";
      ctx.strokeStyle = "#2a261f";
      ctx.lineWidth = 1.5;
      ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    }

    for (const blip of state.ai || []) {
      const p = project(blip.x, blip.z, bounds, w, h);
      const radius = blip.role === "boss" ? 7.2 : blip.role === "tactical" ? 5.2 : 4.2;
      ctx.beginPath();
      if (blip.firing) {
        ctx.fillStyle = "rgba(255, 90, 50, 0.35)";
        ctx.arc(p.x, p.y, radius + 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "#ff5a32";
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle =
          blip.role === "boss" ? "#c4a35a" : blip.role === "tactical" ? "#8a6a4a" : "#5f6368";
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const blip of state.orbs || []) {
      const p = project(blip.x, blip.z, bounds, w, h);
      ctx.beginPath();
      ctx.fillStyle =
        blip.kind === "flaming" ? "#ff6a1a" : blip.kind === "cyber" ? "#3cf0ff" : "#4aa8ff";
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const blip of state.ammo || []) {
      const p = project(blip.x, blip.z, bounds, w, h);
      ctx.beginPath();
      ctx.fillStyle = "#c4a35a";
      ctx.rect(p.x - 4, p.y - 4, 8, 8);
      ctx.fill();
    }

    if (state.player) {
      const p = project(state.player.x, state.player.z, bounds, w, h);
      const yaw = state.player.yaw || 0;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(-Math.sin(yaw), -Math.cos(yaw)));
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(5.5, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-5.5, 6);
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
      ctx.fillStyle = "#ea4335";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 4;
    roundRect(ctx, 2, 2, w - 4, h - 4, 16);
    ctx.stroke();
    ctx.strokeStyle = "rgba(60,64,67,0.35)";
    ctx.lineWidth = 1;
    roundRect(ctx, 2, 2, w - 4, h - 4, 16);
    ctx.stroke();
  }

  return { draw };
}
