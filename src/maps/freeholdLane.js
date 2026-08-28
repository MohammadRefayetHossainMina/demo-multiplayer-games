import houseA from "../assets/kenney/suburban/building-type-a.glb?url";
import houseB from "../assets/kenney/suburban/building-type-b.glb?url";
import houseC from "../assets/kenney/suburban/building-type-c.glb?url";
import houseD from "../assets/kenney/suburban/building-type-d.glb?url";
import houseE from "../assets/kenney/suburban/building-type-e.glb?url";
import houseG from "../assets/kenney/suburban/building-type-g.glb?url";
import houseI from "../assets/kenney/suburban/building-type-i.glb?url";
import houseK from "../assets/kenney/suburban/building-type-k.glb?url";
import houseM from "../assets/kenney/suburban/building-type-m.glb?url";
import houseO from "../assets/kenney/suburban/building-type-o.glb?url";
import houseQ from "../assets/kenney/suburban/building-type-q.glb?url";
import houseS from "../assets/kenney/suburban/building-type-s.glb?url";
import treeSmall from "../assets/kenney/suburban/tree-small.glb?url";
import treeLarge from "../assets/kenney/suburban/tree-large.glb?url";
import fence from "../assets/kenney/suburban/fence-1x4.glb?url";
import planter from "../assets/kenney/suburban/planter.glb?url";
import stones from "../assets/kenney/suburban/path-stones-messy.glb?url";
import lamp from "../assets/kenney/roads/light-square.glb?url";
import cone from "../assets/kenney/roads/construction-cone.glb?url";
import { placeKenney } from "./kenneyLoader.js";
import { createPatrols } from "../core/patrol.js";
import { createOrbs } from "../entities/Targets.js";
import { addMudCross, muddyRoadMaterial } from "./muddyRoad.js";

const SCALE = 8;

export const freeholdLane = {
  id: "lane",
  name: "Freehold Lane",
  use: "Solo vs AI compound with houses and malls. Demo Kenney art — replace before commercial launch.",
  async build(THREE, world) {
    const blockers = [];

    const footprints = [];
    const parkingLots = [];

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(660, 660),
      new THREE.MeshStandardMaterial({ color: 0x6f7a5c, roughness: 0.97 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.ignoreOverview = true;
    world.add(ground);

    const lot = new THREE.Mesh(
      new THREE.PlaneGeometry(168, 156),
      new THREE.MeshStandardMaterial({ color: 0x8a7d63, roughness: 0.96 })
    );
    lot.rotation.x = -Math.PI / 2;
    lot.position.y = 0.01;
    lot.receiveShadow = true;
    world.add(lot);

    const WALL_THICK = 0.48;
    const DOOR_WIDTH = 1.35;

    function wallBox(minx, maxx, minz, maxz) {
      if (maxx - minx < 0.05 || maxz - minz < 0.05) return;
      blockers.push({ minx, maxx, minz, maxz });
    }

    function doorFace(rotY) {
      const fx = -Math.sin(rotY);
      const fz = -Math.cos(rotY);
      if (Math.abs(fx) >= Math.abs(fz)) return fx >= 0 ? "e" : "w";
      return fz >= 0 ? "n" : "s";
    }

    function gapsAlong(start, end, centers, half) {
      const cuts = centers
        .map((c) => [c - half, c + half])
        .sort((a, b) => a[0] - b[0]);
      const segs = [];
      let cursor = start;
      for (const [a, b] of cuts) {
        if (a > cursor + 0.05) segs.push([cursor, Math.min(a, end)]);
        cursor = Math.max(cursor, b);
      }
      if (cursor < end - 0.05) segs.push([cursor, end]);
      return segs;
    }

    function addWallShell(minx, maxx, minz, maxz, face, doorCenters, doorW = DOOR_WIDTH) {
      const t = WALL_THICK;
      const half = doorW * 0.5;
      const alongX = face === "n" || face === "s";
      const centers = doorCenters || [(alongX ? (minx + maxx) : (minz + maxz)) * 0.5];

      if (face === "n") {
        for (const [a, b] of gapsAlong(minx, maxx, centers, half)) wallBox(a, b, maxz - t, maxz);
      } else {
        wallBox(minx, maxx, maxz - t, maxz);
      }
      if (face === "s") {
        for (const [a, b] of gapsAlong(minx, maxx, centers, half)) wallBox(a, b, minz, minz + t);
      } else {
        wallBox(minx, maxx, minz, minz + t);
      }
      if (face === "e") {
        for (const [a, b] of gapsAlong(minz, maxz, centers, half)) wallBox(maxx - t, maxx, a, b);
      } else {
        wallBox(maxx - t, maxx, minz, maxz);
      }
      if (face === "w") {
        for (const [a, b] of gapsAlong(minz, maxz, centers, half)) wallBox(minx, minx + t, a, b);
      } else {
        wallBox(minx, minx + t, minz, maxz);
      }
    }

    function houseDoorCenter(minx, maxx, minz, maxz, rotY) {
      const face = doorFace(rotY);
      const localLeftX = -Math.cos(rotY);
      const localLeftZ = -Math.sin(rotY);
      const off = 1.15;
      if (face === "n" || face === "s") return (minx + maxx) * 0.5 + localLeftX * off;
      return (minz + maxz) * 0.5 + localLeftZ * off;
    }

    const wallCanvas = document.createElement("canvas");
    wallCanvas.width = 256;
    wallCanvas.height = 256;
    const wg = wallCanvas.getContext("2d");
    wg.fillStyle = "#6a513c";
    wg.fillRect(0, 0, 256, 256);
    wg.fillStyle = "#4f3c2c";
    for (let i = 0; i < 8; i += 1) wg.fillRect(i * 32, 0, 9, 256);
    wg.fillStyle = "#3d2e22";
    wg.fillRect(0, 188, 256, 68);
    wg.fillStyle = "#c4a574";
    wg.fillRect(0, 184, 256, 6);
    const wallMap = new THREE.CanvasTexture(wallCanvas);
    wallMap.wrapS = THREE.RepeatWrapping;
    wallMap.wrapT = THREE.RepeatWrapping;
    wallMap.repeat.set(10, 2);
    wallMap.colorSpace = THREE.SRGBColorSpace;
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallMap,
      roughness: 0.92,
    });
    function rim(w, h, d, x, z) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      mesh.position.set(x, h * 0.5, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      world.add(mesh);
    }
    const wallH = 10;
    rim(138, wallH, 1.4, 0, 63.9);
    rim(138, wallH, 1.4, 0, -63.9);
    rim(1.4, wallH, 130.8, 67.8, 0);
    rim(1.4, wallH, 130.8, -67.8, 0);

    const mudMat = muddyRoadMaterial(THREE);
    const mallWall = new THREE.MeshStandardMaterial({ color: 0xd9d2c6, roughness: 0.88 });
    const mallTrim = new THREE.MeshStandardMaterial({ color: 0x4a5560, roughness: 0.55, metalness: 0.2 });
    const mallRoof = new THREE.MeshStandardMaterial({ color: 0x6d7380, roughness: 0.9 });
    const mallGlass = new THREE.MeshStandardMaterial({
      color: 0x7ec8e8,
      emissive: 0xffc56a,
      emissiveIntensity: 0.7,
      roughness: 0.18,
      metalness: 0.35,
      transparent: true,
      opacity: 0.62,
    });
    const mallFloor = new THREE.MeshStandardMaterial({ color: 0xc4b8a4, roughness: 0.92 });
    const awningColors = [0xc44536, 0x2f6fed, 0x2f9e44, 0xe8b923, 0x8e44ad];

    function boxMesh(geo, mat, x, y, z) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      world.add(mesh);
      return mesh;
    }

    function addMall(minx, maxx, minz, maxz, face) {
      const w = maxx - minx;
      const d = maxz - minz;
      const cx = (minx + maxx) * 0.5;
      const cz = (minz + maxz) * 0.5;
      const h = 6.4;
      const t = 0.55;
      const doorW = 2.2;
      const alongX = face === "n" || face === "s";
      const span = alongX ? w : d;
      const doorCenters = [-span * 0.32, 0, span * 0.32].map(
        (off) => (alongX ? cx : cz) + off
      );

      const parkPad = 12;
      let pminx = minx;
      let pmaxx = maxx;
      let pminz = minz;
      let pmaxz = maxz;
      if (face === "w") {
        pminx = minx - parkPad;
        pmaxx = minx;
      } else if (face === "e") {
        pminx = maxx;
        pmaxx = maxx + parkPad;
      } else if (face === "s") {
        pminz = minz - parkPad;
        pmaxz = minz;
      } else {
        pminz = maxz;
        pmaxz = maxz + parkPad;
      }
      const parkGeo = new THREE.PlaneGeometry(pmaxx - pminx, pmaxz - pminz);
      const park = new THREE.Mesh(parkGeo, mudMat);
      park.rotation.x = -Math.PI / 2;
      park.position.set((pminx + pmaxx) * 0.5, 0.02, (pminz + pmaxz) * 0.5);
      park.receiveShadow = false;
      world.add(park);
      parkingLots.push({ minx: pminx, maxx: pmaxx, minz: pminz, maxz: pmaxz });

      const inner = new THREE.Mesh(new THREE.PlaneGeometry(w - 1.2, d - 1.2), mallFloor);
      inner.rotation.x = -Math.PI / 2;
      inner.position.set(cx, 0.04, cz);
      inner.receiveShadow = true;
      world.add(inner);

      addWallShell(minx, maxx, minz, maxz, face, doorCenters, doorW);

      if (face !== "n") boxMesh(new THREE.BoxGeometry(w, h, t), mallWall, cx, h * 0.5, maxz - t * 0.5);
      if (face !== "s") boxMesh(new THREE.BoxGeometry(w, h, t), mallWall, cx, h * 0.5, minz + t * 0.5);
      if (face !== "e") boxMesh(new THREE.BoxGeometry(t, h, d), mallWall, maxx - t * 0.5, h * 0.5, cz);
      if (face !== "w") boxMesh(new THREE.BoxGeometry(t, h, d), mallWall, minx + t * 0.5, h * 0.5, cz);

      const half = doorW * 0.5;
      if (face === "n" || face === "s") {
        const z = face === "n" ? maxz - t * 0.5 : minz + t * 0.5;
        for (const [a, b] of gapsAlong(minx, maxx, doorCenters, half)) {
          boxMesh(new THREE.BoxGeometry(Math.max(0.2, b - a), h, t), mallWall, (a + b) * 0.5, h * 0.5, z);
        }
        boxMesh(new THREE.BoxGeometry(w, h - 3.15, t), mallWall, cx, 3.15 + (h - 3.15) * 0.5, z);
      } else {
        const x = face === "e" ? maxx - t * 0.5 : minx + t * 0.5;
        for (const [a, b] of gapsAlong(minz, maxz, doorCenters, half)) {
          boxMesh(new THREE.BoxGeometry(t, h, Math.max(0.2, b - a)), mallWall, x, h * 0.5, (a + b) * 0.5);
        }
        boxMesh(new THREE.BoxGeometry(t, h - 3.15, d), mallWall, x, 3.15 + (h - 3.15) * 0.5, cz);
      }
      boxMesh(new THREE.BoxGeometry(w + 0.6, 0.35, d + 0.6), mallRoof, cx, h + 0.1, cz);
      boxMesh(new THREE.BoxGeometry(w + 0.2, 0.18, d + 0.2), mallTrim, cx, h * 0.92, cz);

      const bays = 5;
      for (let i = 0; i < bays; i += 1) {
        const u = (i + 0.5) / bays - 0.5;
        const awning = new THREE.MeshStandardMaterial({
          color: awningColors[i % awningColors.length],
          roughness: 0.7,
        });
        let gx;
        let gz;
        let geo;
        if (alongX) {
          gx = cx + u * (w - 2);
          gz = face === "n" ? maxz + 0.35 : minz - 0.35;
          geo = new THREE.BoxGeometry(Math.min(5.2, w / bays - 0.4), 0.18, 1.6);
        } else {
          gx = face === "e" ? maxx + 0.35 : minx - 0.35;
          gz = cz + u * (d - 2);
          geo = new THREE.BoxGeometry(1.6, 0.18, Math.min(5.2, d / bays - 0.4));
        }
        boxMesh(geo, awning, gx, 3.35, gz);
        const glassGeo =
          alongX
            ? new THREE.BoxGeometry(Math.min(4.4, w / bays - 0.8), 2.4, 0.12)
            : new THREE.BoxGeometry(0.12, 2.4, Math.min(4.4, d / bays - 0.8));
        const glass = new THREE.Mesh(glassGeo, mallGlass);
        glass.position.set(
          alongX ? gx : face === "e" ? maxx - 0.08 : minx + 0.08,
          1.7,
          alongX ? (face === "n" ? maxz - 0.08 : minz + 0.08) : gz
        );
        world.add(glass);
      }

      boxMesh(new THREE.BoxGeometry(2.2, 0.7, 1.4), mallTrim, cx - 4, h + 0.55, cz - 2);
      boxMesh(new THREE.BoxGeometry(1.6, 0.55, 1.6), mallTrim, cx + 5, h + 0.5, cz + 2);

      footprints.push({ minx, maxx, minz, maxz });
    }

    const house = (url, x, z, rotY) =>
      placeKenney(THREE, world, url, x, z, rotY, SCALE).then((placed) => {
        const pad = 0.1;
        const minx = placed.box.min.x + pad;
        const maxx = placed.box.max.x - pad;
        const minz = placed.box.min.z + pad;
        const maxz = placed.box.max.z - pad;
        const face = doorFace(rotY);
        addWallShell(minx, maxx, minz, maxz, face, [
          houseDoorCenter(minx, maxx, minz, maxz, rotY),
        ]);
        footprints.push({
          minx: placed.box.min.x,
          maxx: placed.box.max.x,
          minz: placed.box.min.z,
          maxz: placed.box.max.z,
        });
      });
    const prop = (url, x, z, rotY = 0, kind = "suburban") =>
      placeKenney(THREE, world, url, x, z, rotY, SCALE, kind);

    async function streetLamp(x, z) {
      const placed = await placeKenney(THREE, world, lamp, x, z, 0, SCALE, "roads");
      placed.root.traverse((child) => {
        if (!child.isMesh) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          mat.emissive = new THREE.Color(0xffe1a8);
          mat.emissiveIntensity = 2.4;
        }
      });
      const glow = new THREE.PointLight(0xffc56a, 8.2, 28, 1.7);
      glow.position.set(x, 5.5, z);
      world.add(glow);
      return placed;
    }

    const catalog = [
      houseA,
      houseB,
      houseC,
      houseD,
      houseE,
      houseG,
      houseI,
      houseK,
      houseM,
      houseO,
      houseQ,
      houseS,
    ];
    let houseIndex = 0;
    const houseJobs = [];
    const putHouse = (x, z, rotY) => {
      houseJobs.push(house(catalog[houseIndex % catalog.length], x, z, rotY));
      houseIndex += 1;
    };

    addMall(29, 44, 24, 52, "w");
    addMall(-44, -29, -52, -24, "e");

    for (const z of [16, 32, 48]) putHouse(12.2, z, 0);
    for (const z of [-16, -32, -48]) putHouse(12.2, z, Math.PI);
    for (const z of [16, 32, 48]) putHouse(-12.2, z, 0);
    for (const z of [-16, -32, -48]) putHouse(-12.2, z, Math.PI);
    for (const x of [16, 32, 52]) putHouse(x, 12.2, 0);
    for (const x of [-16, -32, -52]) putHouse(x, 12.2, 0);
    for (const x of [16, 32, 52]) putHouse(x, -12.2, Math.PI);
    for (const x of [-16, -32, -52]) putHouse(x, -12.2, Math.PI);
    putHouse(-28, 32, 0);
    putHouse(-28, 48, 0);
    putHouse(-44, 32, 0);
    putHouse(-44, 48, 0);
    putHouse(28, -32, Math.PI);
    putHouse(28, -48, Math.PI);
    putHouse(44, -32, Math.PI);
    putHouse(44, -48, Math.PI);
    putHouse(54, 28, Math.PI / 2);
    putHouse(54, 44, Math.PI / 2);
    putHouse(-54, -28, -Math.PI / 2);
    putHouse(-54, -44, -Math.PI / 2);

    addMudCross(THREE, world, mudMat);

    await Promise.all([
      ...houseJobs,
      prop(treeLarge, 18.6, 7.4),
      prop(treeSmall, -18.6, 7.4),
      prop(treeLarge, 18.6, -7.4),
      prop(treeSmall, -18.6, -7.4),
      prop(treeLarge, 55, 8),
      prop(treeSmall, -55, 8),
      prop(treeLarge, 55, -8),
      prop(treeSmall, -55, -8),
      prop(treeLarge, -22, 22),
      prop(treeSmall, 22, -22),
      prop(treeLarge, -50, 18),
      prop(treeSmall, 50, -18),
      prop(planter, 6.2, 6.2),
      prop(planter, -6.2, -6.2, 0.6),
      prop(planter, 6.2, -6.2, 0.4),
      prop(planter, -6.2, 6.2, 1.1),
      prop(stones, 3, 12, 0.2),
      prop(stones, -4, -12, 1.1),
      streetLamp(4.5, 4.5),
      streetLamp(-4.5, -4.5),
      streetLamp(4.5, -4.5),
      streetLamp(-4.5, 4.5),
      streetLamp(4.5, 24),
      streetLamp(-4.5, -24),
      streetLamp(4.5, -36),
      streetLamp(-4.5, 36),
      streetLamp(24, 4.5),
      streetLamp(-24, -4.5),
      streetLamp(36, -4.5),
      streetLamp(-36, 4.5),
      streetLamp(22, 38),
      streetLamp(-22, -38),
      prop(cone, 2.2, 9, 0.3, "roads"),
      prop(cone, -1.8, -8.5, -0.4, "roads"),
    ]);

    const fencePosts = [];
    for (let i = -9; i <= 9; i++) {
      fencePosts.push(prop(fence, 72, i * 6, Math.PI / 2));
      fencePosts.push(prop(fence, -72, i * 6, Math.PI / 2));
      fencePosts.push(prop(fence, i * 7, 66, 0));
      fencePosts.push(prop(fence, i * 7, -66, 0));
    }
    await Promise.all(fencePosts);

    const starCount = 420;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * 0.72;
      const r = 220 + Math.random() * 40;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = 28 + r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.BufferAttribute(starPos, 3)
      ),
      new THREE.PointsMaterial({
        color: 0xdce6ff,
        size: 1.35,
        sizeAttenuation: true,
      })
    );
    stars.userData.ignoreOverview = true;
    world.add(stars);

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(3.4, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xe8eef8 })
    );
    moon.position.set(-168, 210, 148);
    moon.userData.ignoreOverview = true;
    world.add(moon);

    const limits = { minx: -65.7, maxx: 65.7, minz: -61.8, maxz: 61.8 };
    const blocked = (x, z) => {
      if (x < limits.minx || x > limits.maxx || z < limits.minz || z > limits.maxz) {
        return true;
      }
      const r = 0.22;
      const spots = [
        [x, z],
        [x + r, z],
        [x - r, z],
        [x, z + r],
        [x, z - r],
      ];
      return spots.some(([px, pz]) =>
        blockers.some(
          (box) => px >= box.minx && px <= box.maxx && pz >= box.minz && pz <= box.maxz
        )
      );
    };

    const patrol = await createPatrols(
      THREE,
      world,
      [
        { role: "grunt", route: [{ x: 0, z: 32 }, { x: 0, z: 12 }] },
        { role: "grunt", route: [{ x: 0, z: -48 }, { x: 0, z: -14 }] },
        { role: "grunt", route: [{ x: 48, z: 0 }, { x: 14, z: 0 }] },
        { role: "grunt", route: [{ x: -48, z: 0 }, { x: -14, z: 0 }] },
        {
          role: "tactical",
          personality: "aggressive",
          route: [{ x: 22, z: 20 }, { x: 22, z: 4 }, { x: 8, z: 20 }],
        },
        {
          role: "tactical",
          personality: "defensive",
          route: [{ x: -22, z: -22 }, { x: -22, z: -4 }, { x: -8, z: -22 }],
        },
        {
          role: "tactical",
          personality: "balanced",
          route: [{ x: 20, z: -20 }, { x: 6, z: -20 }, { x: 20, z: -6 }],
        },
        {
          role: "boss",
          route: [
            { x: 0, z: -36 },
            { x: 36, z: 0 },
            { x: 0, z: 28 },
            { x: -36, z: 0 },
          ],
        },
      ],
      blocked,
      footprints
    );

    const targets = createOrbs(world, [
      { kind: "cyber", x: 0, y: 1.72, z: 12 },
      { kind: "flaming", x: 0, y: 1.7, z: 26 },
      { kind: "water", x: 18, y: 1.68, z: 0 },
    ]);

    return {
      blocked,
      patrol,
      targets,
      minimap: {
        lot: { minx: -84, maxx: 84, minz: -78, maxz: 78 },
        roads: [
          { minx: -4.2, maxx: 4.2, minz: -64, maxz: 64 },
          { minx: -64, maxx: 64, minz: -4.2, maxz: 4.2 },
          ...parkingLots,
        ],
        buildings: footprints,
      },
      walkBounds: {
        shape: "box",
        reachEnds: true,
        minx: limits.minx,
        maxx: limits.maxx,
        minz: limits.minz,
        maxz: limits.maxz,
      },
      preview: {
        position: new THREE.Vector3(8, 22, 72),
        lookAt: new THREE.Vector3(0, 1.4, 4),
        spawn: new THREE.Vector3(0, 1.65, 42),
      },
      background: 0x070b16,
      fog: 0x0c1424,
      fogNear: 38,
      fogFar: 165,
      hemiSky: 0x4a5d82,
      hemiGround: 0x161410,
      hemiIntensity: 0.4,
      sunColor: 0xc5d4ee,
      sunIntensity: 0.52,
      sunPosition: new THREE.Vector3(-42, 78, 38),
      exposure: 0.86,
    };
  },
};
