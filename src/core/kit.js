export function makeKit(THREE, group) {
  const plaster = (hex, extra = {}) =>
    new THREE.MeshStandardMaterial({
      color: hex,
      roughness: 0.86,
      metalness: 0.04,
      ...extra,
    });

  function mesh(geo, mat, x, y, z, shadow = true) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    m.receiveShadow = true;
    group.add(m);
    return m;
  }

  function wall(w, h, d, x, y, z, color) {
    return mesh(new THREE.BoxGeometry(w, h, d), plaster(color), x, y, z);
  }

  function box(w, h, d, x, y, z, color, shadow = true) {
    return mesh(new THREE.BoxGeometry(w, h, d), plaster(color), x, y, z, shadow);
  }

  function tileTexture(draw, repeatX, repeatY) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    draw(c.getContext("2d"));
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  return { plaster, mesh, wall, box, tileTexture };
}
