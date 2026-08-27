import {
  AdditiveBlending,
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from "three";

const FROM = new Vector3();
const TO = new Vector3();

export function createCombatFx(scene) {
  const tracerMat = new LineBasicMaterial({
    color: 0xffe6a0,
    transparent: true,
    opacity: 1,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const sparkMat = new MeshBasicMaterial({
    color: 0xfff3c8,
    transparent: true,
    opacity: 1,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const sparkGeo = new SphereGeometry(0.06, 6, 6);

  const tracers = [];
  const sparks = [];

  function spawnTracer(from, to) {
    FROM.copy(from);
    TO.copy(to);
    const positions = new Float32Array([FROM.x, FROM.y, FROM.z, TO.x, TO.y, TO.z]);
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
    const line = new Line(geo, tracerMat.clone());
    line.frustumCulled = false;
    line.userData.life = 0.07;
    scene.add(line);
    tracers.push(line);
  }

  function spawnImpact(point) {
    const spark = new Mesh(sparkGeo, sparkMat.clone());
    spark.position.copy(point);
    spark.frustumCulled = false;
    spark.userData.life = 0.12;
    scene.add(spark);
    sparks.push(spark);
  }

  function step(dt) {
    for (let i = tracers.length - 1; i >= 0; i -= 1) {
      const line = tracers[i];
      line.userData.life -= dt;
      line.material.opacity = Math.max(0, line.userData.life / 0.07);
      if (line.userData.life <= 0) {
        scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
        tracers.splice(i, 1);
      }
    }
    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const spark = sparks[i];
      spark.userData.life -= dt;
      const t = Math.max(0, spark.userData.life / 0.12);
      spark.material.opacity = t;
      spark.scale.setScalar(0.4 + (1 - t) * 2.2);
      if (spark.userData.life <= 0) {
        scene.remove(spark);
        spark.material.dispose();
        sparks.splice(i, 1);
      }
    }
  }

  return { spawnTracer, spawnImpact, step };
}
