import { Vector3 } from "three";

const POS = new Vector3();
const FWD = new Vector3();

function fillNoise(data, fn) {
  for (let i = 0; i < data.length; i += 1) data[i] = fn(i / data.length, i);
}

function makeBuffer(ctx, seconds, fn) {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  fillNoise(buffer.getChannelData(0), (t, i) => fn(t, i, ctx.sampleRate));
  return buffer;
}

function makeShot(ctx) {
  return makeBuffer(ctx, 0.22, (t) => {
    const env = Math.exp(-t * 26);
    const bang = (Math.random() * 2 - 1) * env;
    const body = Math.sin(t * Math.PI * 2 * (90 + t * 40)) * env * 0.45;
    return (bang * 0.72 + body) * 0.9;
  });
}

function makeImpact(ctx) {
  return makeBuffer(ctx, 0.12, (t) => {
    const env = Math.exp(-t * 38);
    return (Math.random() * 2 - 1) * env * 0.55 + Math.sin(t * 720 * Math.PI * 2) * env * 0.2;
  });
}

function makeHit(ctx) {
  return makeBuffer(ctx, 0.1, (t) => {
    const env = Math.exp(-t * 42);
    return Math.sin(t * 1400 * Math.PI * 2) * env * 0.35 + (Math.random() * 2 - 1) * env * 0.25;
  });
}

function makeKill(ctx, kind) {
  if (kind === "flaming") {
    return makeBuffer(ctx, 0.28, (t) => {
      const env = Math.exp(-t * 10);
      return (Math.random() * 2 - 1) * env * 0.5 + Math.sin(t * 180 * Math.PI * 2) * env * 0.3;
    });
  }
  if (kind === "cyber") {
    return makeBuffer(ctx, 0.22, (t) => {
      const env = Math.exp(-t * 14);
      const buzz = Math.sin(t * 920 * Math.PI * 2) * Math.sin(t * 40 * Math.PI * 2);
      return buzz * env * 0.55 + (Math.random() * 2 - 1) * env * 0.12;
    });
  }
  if (kind === "water") {
    return makeBuffer(ctx, 0.26, (t) => {
      const env = Math.exp(-t * 9);
      return Math.sin(t * 220 * Math.PI * 2) * env * 0.4 + (Math.random() * 2 - 1) * env * 0.28;
    });
  }
  return makeBuffer(ctx, 0.3, (t) => {
    const env = Math.exp(-t * 8);
    return (Math.random() * 2 - 1) * env * 0.4 + Math.sin(t * 110 * Math.PI * 2) * env * 0.35;
  });
}

function makeReload(ctx) {
  return makeBuffer(ctx, 0.18, (t) => {
    const click = t < 0.03 ? (Math.random() * 2 - 1) * (1 - t / 0.03) : 0;
    const slide = t > 0.06 ? Math.sin(t * 380 * Math.PI * 2) * Math.exp(-(t - 0.06) * 28) * 0.25 : 0;
    return click * 0.4 + slide;
  });
}

function makeAmbience(ctx) {
  return makeBuffer(ctx, 2.4, () => (Math.random() * 2 - 1) * 0.22);
}

export function createGameAudio() {
  let ctx = null;
  let master = null;
  let ambGain = null;
  let ambSrc = null;
  let ambFilter = null;
  const buffers = {};

  function ensure() {
    if (ctx) return ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    buffers.shot = makeShot(ctx);
    buffers.impact = makeImpact(ctx);
    buffers.hit = makeHit(ctx);
    buffers.reload = makeReload(ctx);
    buffers.amb = makeAmbience(ctx);
    buffers.killFlaming = makeKill(ctx, "flaming");
    buffers.killCyber = makeKill(ctx, "cyber");
    buffers.killWater = makeKill(ctx, "water");
    buffers.killSoldier = makeKill(ctx, "soldier");
    return ctx;
  }

  async function unlock() {
    if (!ensure()) return false;
    if (ctx.state === "suspended") await ctx.resume();
    return ctx.state === "running";
  }

  function playAt(buffer, x, y, z, volume = 0.4, refDistance = 4) {
    if (!ctx || ctx.state !== "running" || !buffer) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const panner = ctx.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = refDistance;
    panner.maxDistance = 90;
    panner.rolloffFactor = 1.15;
    if (panner.positionX) {
      panner.positionX.value = x;
      panner.positionY.value = y;
      panner.positionZ.value = z;
    } else {
      panner.setPosition(x, y, z);
    }
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.connect(panner);
    panner.connect(gain);
    gain.connect(master);
    src.start();
    src.onended = () => {
      src.disconnect();
      panner.disconnect();
      gain.disconnect();
    };
  }

  function setListener(camera) {
    if (!ctx || !camera) return;
    camera.getWorldPosition(POS);
    camera.getWorldDirection(FWD);
    const l = ctx.listener;
    const p = POS;
    const fx = FWD.x;
    const fy = FWD.y;
    const fz = FWD.z;
    if (l.positionX) {
      l.positionX.value = p.x;
      l.positionY.value = p.y;
      l.positionZ.value = p.z;
      l.forwardX.value = fx;
      l.forwardY.value = fy;
      l.forwardZ.value = fz;
      l.upX.value = 0;
      l.upY.value = 1;
      l.upZ.value = 0;
    } else {
      l.setPosition(p.x, p.y, p.z);
      l.setOrientation(fx, fy, fz, 0, 1, 0);
    }
  }

  function startAmbience() {
    if (!ensure() || ctx.state !== "running") return;
    stopAmbience();
    ambFilter = ctx.createBiquadFilter();
    ambFilter.type = "lowpass";
    ambFilter.frequency.value = 380;
    ambGain = ctx.createGain();
    ambGain.gain.value = 0.045;
    ambSrc = ctx.createBufferSource();
    ambSrc.buffer = buffers.amb;
    ambSrc.loop = true;
    ambSrc.connect(ambFilter);
    ambFilter.connect(ambGain);
    ambGain.connect(master);
    ambSrc.start();
  }

  function stopAmbience() {
    try {
      ambSrc?.stop();
    } catch {
      /* already stopped */
    }
    ambSrc?.disconnect();
    ambFilter?.disconnect();
    ambGain?.disconnect();
    ambSrc = null;
    ambFilter = null;
    ambGain = null;
  }

  return {
    unlock,
    setListener,
    startAmbience,
    stopAmbience,
    shot(pos) {
      playAt(buffers.shot, pos.x, pos.y, pos.z, 0.48, 2.2);
    },
    impact(pos) {
      playAt(buffers.impact, pos.x, pos.y, pos.z, 0.32, 5);
    },
    hit(pos, result) {
      if (result?.killed) {
        const key =
          result.kind === "flaming"
            ? "killFlaming"
            : result.kind === "cyber"
              ? "killCyber"
              : result.kind === "water"
                ? "killWater"
                : "killSoldier";
        playAt(buffers[key], pos.x, pos.y, pos.z, 0.42, 5);
        return;
      }
      playAt(buffers.hit, pos.x, pos.y, pos.z, 0.28, 5);
    },
    reload(pos) {
      playAt(buffers.reload, pos.x, pos.y, pos.z, 0.22, 1.6);
    },
    state() {
      return ctx?.state || "none";
    },
  };
}
