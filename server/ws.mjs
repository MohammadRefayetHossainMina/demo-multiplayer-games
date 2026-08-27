import { WebSocketServer } from "ws";

const port = Number(process.env.PORT_WS || 8787);
const wss = new WebSocketServer({ port, host: "127.0.0.1" });
let nextId = 1;

function send(socket, payload) {
  if (socket.readyState === 1) socket.send(payload);
}

wss.on("connection", (socket) => {
  const id = String(nextId++);
  socket.__id = id;
  send(socket, JSON.stringify({ t: "hello", id }));

  socket.on("message", (raw) => {
    const text = String(raw).slice(0, 512);
    let msg;
    try {
      msg = JSON.parse(text);
    } catch {
      return;
    }
    if (msg?.t !== "p") return;
    const x = Number(msg.x);
    const z = Number(msg.z);
    const yaw = Number(msg.yaw);
    if (![x, z, yaw].every(Number.isFinite)) return;
    if (Math.abs(x) > 400 || Math.abs(z) > 400) return;
    const payload = JSON.stringify({ t: "p", id, x, z, yaw });
    for (const client of wss.clients) {
      if (client !== socket && client.readyState === 1) send(client, payload);
    }
  });

  socket.on("close", () => {
    const payload = JSON.stringify({ t: "leave", id });
    for (const client of wss.clients) send(client, payload);
  });
});

console.log("Dual Fire anonymous WS on ws://127.0.0.1:" + port);
