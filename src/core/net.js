export function createNet() {
  const peers = new Map();
  let socket = null;
  let selfId = null;
  let lastSend = 0;
  const listeners = { onPeer() {}, onLeave() {} };

  function url() {
    const env = import.meta.env?.VITE_WS_URL;
    if (env) return env;
    if (location.hostname === "127.0.0.1" || location.hostname === "localhost") {
      return "ws://127.0.0.1:8787";
    }
    return "";
  }

  function connect() {
    const target = url();
    if (!target || socket) return;
    try {
      socket = new WebSocket(target);
    } catch {
      socket = null;
      return;
    }
    socket.addEventListener("message", (event) => {
      let msg;
      try {
        msg = JSON.parse(String(event.data).slice(0, 512));
      } catch {
        return;
      }
      if (msg.t === "hello") {
        selfId = String(msg.id || "");
        return;
      }
      if (msg.t === "leave" && msg.id) {
        peers.delete(String(msg.id));
        listeners.onLeave(String(msg.id));
        return;
      }
      if (msg.t !== "p" || !msg.id || msg.id === selfId) return;
      const x = Number(msg.x);
      const z = Number(msg.z);
      const yaw = Number(msg.yaw);
      if (![x, z, yaw].every(Number.isFinite)) return;
      const id = String(msg.id);
      peers.set(id, { x, z, yaw });
      listeners.onPeer(id, { x, z, yaw });
    });
    socket.addEventListener("close", () => {
      socket = null;
    });
    socket.addEventListener("error", () => {
      try {
        socket?.close();
      } catch {
        /* ignore */
      }
      socket = null;
    });
  }

  function sendPose(x, z, yaw) {
    if (!socket || socket.readyState !== 1) return;
    const now = performance.now();
    if (now - lastSend < 50) return;
    lastSend = now;
    socket.send(JSON.stringify({ t: "p", x: +x.toFixed(2), z: +z.toFixed(2), yaw: +yaw.toFixed(3) }));
  }

  function disconnect() {
    try {
      socket?.close();
    } catch {
      /* ignore */
    }
    socket = null;
    peers.clear();
  }

  return {
    connect,
    sendPose,
    disconnect,
    peers,
    onPeer(fn) {
      listeners.onPeer = fn;
    },
    onLeave(fn) {
      listeners.onLeave = fn;
    },
    connected: () => !!socket && socket.readyState === 1,
  };
}
