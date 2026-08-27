const MUD_SHADER_KEY = "mud-world-proc-v3";

const MUD_GLSL = `
float mudHash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 mudGrad(vec2 i) {
  float a = mudHash12(i) * 6.2831853;
  return vec2(cos(a), sin(a));
}
float mudPerlin(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(mudGrad(i), f), dot(mudGrad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(mudGrad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(mudGrad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}
float mudFbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
  for (int o = 0; o < 5; o++) {
    sum += amp * mudPerlin(p);
    p = rot * p * 2.03;
    amp *= 0.5;
  }
  return sum * 0.5 + 0.5;
}
vec3 mudColor(vec3 worldPos) {
  vec2 p = worldPos.xz;
  float n = mudFbm(p * 0.21);
  float n2 = mudFbm(p * 0.68 + vec2(17.4, 9.1));
  float n3 = mudPerlin(p * 2.4 + vec2(3.2, 8.8));
  float n4 = mudPerlin(p * 5.1 + vec2(11.0, 4.7));
  float wet = clamp(n * 0.5 + n2 * 0.5, 0.0, 1.0);
  vec3 dry = mix(vec3(0.39, 0.27, 0.14), vec3(0.63, 0.45, 0.22), n3 * 0.55 + n4 * 0.45);
  vec3 damp = mix(vec3(0.16, 0.10, 0.05), vec3(0.08, 0.05, 0.03), wet);
  return mix(dry, damp, wet * wet);
}
`;

export function muddyRoadMaterial(THREE) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.93,
    metalness: 0.03,
  });
  mat.customProgramCacheKey = () => MUD_SHADER_KEY;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
       varying vec3 vMudWorld;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `#include <project_vertex>
       vMudWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
       varying vec3 vMudWorld;
       ${MUD_GLSL}`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
       diffuseColor.rgb = mudColor(vMudWorld);`
    );
  };
  mat.needsUpdate = true;
  return mat;
}

export function addMudCross(THREE, world, mat) {
  function strip(w, d, y) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    mesh.receiveShadow = false;
    world.add(mesh);
    return mesh;
  }
  strip(8.6, 136, 0.06);
  strip(136, 8.6, 0.07);
}
