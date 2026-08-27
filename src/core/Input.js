import { MathUtils } from "three";
import { clampToWalkBounds, inWalkBounds, insetWalkBounds } from "./containment.js";

const PITCH_MIN = MathUtils.degToRad(-85);
const PITCH_MAX = MathUtils.degToRad(85);
const LOOK_SENS = 0.00215;
const WALK_SPEED = 6.4;
const SPRINT_SPEED = 11.2;
const ACCEL = 42;
const DECEL = 30;
const JUMP_SPEED = 6.4;
const GRAVITY = 22;
const WALL_CLEAR = 2.6;

function approach(current, target, maxDelta) {
  if (current < target) return Math.min(target, current + maxDelta);
  return Math.max(target, current - maxDelta);
}

export function createInput(canvas) {
  const keys = new Set();
  const look = { yaw: 0, pitch: 0 };
  const velocity = { x: 0, z: 0, y: 0 };
  let locked = false;
  let grounded = true;
  let sprinting = false;
  let weaponSlot = 1;
  let fireHeld = false;
  let firePressed = false;
  let reloadPressed = false;
  const listeners = { onLock: null };

  function isOurLock() {
    return document.pointerLockElement === canvas;
  }

  function onMouseMove(event) {
    if (!isOurLock()) return;
    look.yaw -= event.movementX * LOOK_SENS;
    look.pitch -= event.movementY * LOOK_SENS;
    if (look.pitch < PITCH_MIN) look.pitch = PITCH_MIN;
    if (look.pitch > PITCH_MAX) look.pitch = PITCH_MAX;
  }

  function onPointerLockChange() {
    const next = isOurLock();
    if (next === locked) return;
    locked = next;
    listeners.onLock?.(locked);
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    if (locked && (event.code === "Space" || event.code === "Tab")) {
      event.preventDefault();
    }
    if (event.code === "Digit1" || event.code === "Numpad1") weaponSlot = 1;
    if (event.code === "Digit2" || event.code === "Numpad2") weaponSlot = 2;
    if (event.code === "Digit3" || event.code === "Numpad3") weaponSlot = 3;
    if (event.code === "KeyR") reloadPressed = true;
    keys.add(event.code);
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onBlur() {
    keys.clear();
    fireHeld = false;
  }

  function onMouseDown(event) {
    if (event.button !== 0) return;
    if (!isOurLock()) return;
    fireHeld = true;
    firePressed = true;
  }

  function onMouseUp(event) {
    if (event.button !== 0) return;
    fireHeld = false;
  }

  function onContextMenu(event) {
    if (event.target === canvas) event.preventDefault();
  }

  function onWheel(event) {
    if (!isOurLock()) return;
    event.preventDefault();
    const dir = event.deltaY > 0 ? 1 : -1;
    weaponSlot = ((weaponSlot - 1 + dir + 3) % 3) + 1;
  }

  document.addEventListener("pointerlockchange", onPointerLockChange);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("contextmenu", onContextMenu);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  function applyLook(camera) {
    camera.rotation.order = "YXZ";
    camera.rotation.set(look.pitch, look.yaw, 0);
    camera.quaternion.setFromEuler(camera.rotation);
    camera.up.set(0, 1, 0);
  }

  function requestLock() {
    if (isOurLock()) return;
    const lock = () => {
      try {
        const result = canvas.requestPointerLock({ unadjustedMovement: true });
        if (result && typeof result.catch === "function") {
          result.catch(() => {
            try {
              canvas.requestPointerLock();
            } catch {
              /* headless / no user gesture */
            }
          });
        }
      } catch {
        try {
          canvas.requestPointerLock();
        } catch {
          /* pointer lock unavailable */
        }
      }
    };
    lock();
  }

  function exitLock() {
    if (isOurLock()) document.exitPointerLock();
  }

  function faceToward(from, target) {
    look.pitch = 0;
    look.yaw = Math.atan2(-(target.x - from.x), -(target.z - from.z));
    velocity.x = 0;
    velocity.z = 0;
    velocity.y = 0;
    grounded = true;
  }

  function step(dt, { playing, camera, blocked, eyeHeight, walkBounds }) {
    if (!playing) {
      sprinting = false;
      fireHeld = false;
      return;
    }

    applyLook(camera);

    const sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const speed = sprint ? SPRINT_SPEED : WALK_SPEED;
    const fx = -Math.sin(look.yaw);
    const fz = -Math.cos(look.yaw);
    const rx = Math.cos(look.yaw);
    const rz = -Math.sin(look.yaw);

    let wishX = 0;
    let wishZ = 0;
    if (keys.has("KeyW")) {
      wishX += fx;
      wishZ += fz;
    }
    if (keys.has("KeyS")) {
      wishX -= fx;
      wishZ -= fz;
    }
    if (keys.has("KeyD")) {
      wishX += rx;
      wishZ += rz;
    }
    if (keys.has("KeyA")) {
      wishX -= rx;
      wishZ -= rz;
    }
    const wishLen = Math.hypot(wishX, wishZ);
    sprinting = sprint && wishLen > 0.0001;
    if (wishLen > 0.0001) {
      wishX = (wishX / wishLen) * speed;
      wishZ = (wishZ / wishLen) * speed;
      velocity.x = approach(velocity.x, wishX, ACCEL * dt);
      velocity.z = approach(velocity.z, wishZ, ACCEL * dt);
    } else {
      velocity.x = approach(velocity.x, 0, DECEL * dt);
      velocity.z = approach(velocity.z, 0, DECEL * dt);
    }

    if (keys.has("Space") && grounded) {
      velocity.y = JUMP_SPEED;
      grounded = false;
    }
    velocity.y -= GRAVITY * dt;

    const playBounds = insetWalkBounds(walkBounds, WALL_CLEAR);
    const heldStart = clampToWalkBounds(camera.position.x, camera.position.z, playBounds);
    camera.position.x = heldStart.x;
    camera.position.z = heldStart.z;

    const bodyHit = (x, z) => {
      if (playBounds && !inWalkBounds(x, z, playBounds)) return true;
      return typeof blocked === "function" ? blocked(x, z) : false;
    };

    const ox = camera.position.x;
    const oz = camera.position.z;
    const dx = velocity.x * dt;
    const dz = velocity.z * dt;
    const nx = ox + dx;
    const nz = oz + dz;

    if (!bodyHit(nx, nz)) {
      camera.position.x = nx;
      camera.position.z = nz;
    } else if (!bodyHit(nx, oz)) {
      camera.position.x = nx;
      camera.position.z = oz;
      velocity.z = 0;
    } else if (!bodyHit(ox, nz)) {
      camera.position.x = ox;
      camera.position.z = nz;
      velocity.x = 0;
    } else {
      camera.position.x = ox;
      camera.position.z = oz;
      velocity.x = 0;
      velocity.z = 0;
    }

    const held = clampToWalkBounds(camera.position.x, camera.position.z, playBounds);
    camera.position.x = held.x;
    camera.position.z = held.z;

    camera.position.y += velocity.y * dt;
    if (camera.position.y <= eyeHeight) {
      camera.position.y = eyeHeight;
      velocity.y = 0;
      grounded = true;
    }
  }

  function dispose() {
    document.removeEventListener("pointerlockchange", onPointerLockChange);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mouseup", onMouseUp);
    canvas.removeEventListener("contextmenu", onContextMenu);
    canvas.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
    keys.clear();
  }

  return {
    step,
    requestLock,
    exitLock,
    faceToward,
    applyLook,
    dispose,
    getYaw: () => look.yaw,
    addKick(pitch, yaw) {
      look.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, look.pitch + pitch));
      look.yaw += yaw;
    },
    getMotion: () => {
      const motion = {
        speed: Math.hypot(velocity.x, velocity.z),
        sprinting,
        grounded,
        yaw: look.yaw,
        pitch: look.pitch,
        weaponSlot,
        locked,
        fireHeld,
        firePressed,
        reloadPressed,
      };
      firePressed = false;
      reloadPressed = false;
      return motion;
    },
    isLocked: () => locked,
    onLock(fn) {
      listeners.onLock = fn;
    },
  };
}
