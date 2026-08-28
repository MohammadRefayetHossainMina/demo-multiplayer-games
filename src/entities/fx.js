import {
  AdditiveBlending,
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PointLight,
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
  const muzzleGeo = new SphereGeometry(0.14, 8, 8);
  const muzzleLight = new PointLight(0xffc078, 0, 22, 2);
  scene.add(muzzleLight);

  const tracers = [];
  const sparks = [];
  const muzzles = [];

  function spawnTracer(from, to, life = 0.07) {
    FROM.copy(from);
    TO.copy(to);
    const positions = new Float32Array([FROM.x, FROM.y, FROM.z, TO.x, TO.y, TO.z]);
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
    const line = new Line(geo, tracerMat.clone());
    line.frustumCulled = false;
    line.userData.life = life;
    line.userData.maxLife = life;
    scene.add(line);
    tracers.push(line);
  }

  function spawnMuzzle(from) {
    FROM.set(from.x, from.y, from.z);
    const flash = new Mesh(muzzleGeo, sparkMat.clone());
    flash.position.copy(FROM);
    flash.scale.setScalar(2.8);
    flash.frustumCulled = false;
    flash.userData.life = 0.11;
    scene.add(flash);
    muzzles.push(flash);
    muzzleLight.position.copy(FROM);
    muzzleLight.intensity = 5.5;
    muzzleLight.userData.life = 0.12;
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
      line.material.opacity = Math.max(0, line.userData.life / (line.userData.maxLife || 0.07));
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
    for (let i = muzzles.length - 1; i >= 0; i -= 1) {
      const flash = muzzles[i];
      flash.userData.life -= dt;
      const t = Math.max(0, flash.userData.life / 0.11);
      flash.material.opacity = t;
      flash.scale.setScalar(2.2 + (1 - t) * 2.4);
      if (flash.userData.life <= 0) {
        scene.remove(flash);
        flash.material.dispose();
        muzzles.splice(i, 1);
      }
    }
    if (muzzleLight.userData.life > 0) {
      muzzleLight.userData.life -= dt;
      muzzleLight.intensity = 5.5 * Math.max(0, muzzleLight.userData.life / 0.12);
    } else {
      muzzleLight.intensity = 0;
    }
  }

  return { spawnTracer, spawnMuzzle, spawnImpact, step };
}
