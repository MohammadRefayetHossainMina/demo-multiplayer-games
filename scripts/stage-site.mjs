import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
mkdirSync(dist, { recursive: true });

for (const file of ["index.html", "styles.css", "script.js"]) {
  cpSync(join(root, file), join(dist, file));
}
if (existsSync(join(root, "images"))) {
  cpSync(join(root, "images"), join(dist, "images"), { recursive: true });
}
console.log("Staged landing page into dist/");
