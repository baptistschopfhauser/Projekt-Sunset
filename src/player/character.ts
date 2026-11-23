import * as THREE from 'three';

export interface CharacterParts {
  group: THREE.Group;
  torso: THREE.Group;
  head: THREE.Mesh;
  chest: THREE.Mesh;
  jacket: THREE.Mesh;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  handR: THREE.Group;
  hatCap: THREE.Mesh;
  hatBeanie: THREE.Mesh;
  legMeshes: THREE.Mesh[];
  shoeMeshes: THREE.Mesh[];
  armMeshes: THREE.Mesh[];
  skinMeshes: THREE.Mesh[];
  hairMesh: THREE.Mesh;
}

export interface CharacterStyle {
  skin: number;
  hair: number;
  shirt: number;
  jacket: number;
  pants: number;
  shoes: number;
  hat: number;
}

export const ALEX_STYLE: CharacterStyle = {
  skin: 0xc9a184,
  hair: 0x2a2018,
  shirt: 0xf1f3f5,
  jacket: 0x2e3440,
  pants: 0x2b3a55,
  shoes: 0xd8d3c8,
  hat: 0,
};

export const WARDROBE = {
  shirts: [0xf1f3f5, 0x2e3440, 0x7a1f2b],
  jackets: [0x2e3440, 0x4a5d43],
  pants: [0x2b3a55, 0x37474f, 0x6b4f2a],
  shoes: [0xd8d3c8, 0x222222, 0x6b4f2a],
  hats: [0x14213d, 0xb0483c],
};

export function applyStyle(parts: CharacterParts, style: CharacterStyle): void {
  const set = (m: THREE.Mesh, color: number) => ((m.material as THREE.MeshStandardMaterial).color.setHex(color));
  set(parts.chest, style.shirt);
  set(parts.jacket, style.jacket);
  for (const m of parts.legMeshes) set(m, style.pants);
  for (const m of parts.shoeMeshes) set(m, style.shoes);
  for (const m of parts.armMeshes) set(m, style.jacket);
  for (const m of parts.skinMeshes) set(m, style.skin);
  set(parts.hairMesh, style.hair);
  parts.hatCap.visible = style.hat === 1;
  parts.hatBeanie.visible = style.hat === 2;
  if (style.hat === 1) set(parts.hatCap, WARDROBE.hats[0]);
  if (style.hat === 2) set(parts.hatBeanie, WARDROBE.hats[1]);
}

export type CharacterStyle2 = CharacterStyle;

export function buildCharacter(style: CharacterStyle): CharacterParts {
  const group = new THREE.Group();
  const mat = (color: number, rough = 0.8) => new THREE.MeshStandardMaterial({ color, roughness: rough });

  const torso = new THREE.Group();
  torso.position.y = 0.95;
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.24), mat(style.shirt));
  chest.position.y = 0.28;
  chest.castShadow = true;
  const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.28), mat(style.jacket));
  jacket.position.y = 0.3;
  jacket.castShadow = true;
  torso.add(chest, jacket);
  group.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.26), mat(style.skin));
  head.position.y = 1.62;
  head.castShadow = true;
  const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.28), mat(style.hair));
  hairMesh.position.y = 1.76;
  const hatCap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.3), mat(WARDROBE.hats[0]));
  hatCap.position.y = 1.82;
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.14), hatCap.material as THREE.Material);
  brim.position.set(0, 1.79, 0.2);
  hatCap.visible = style.hat === 1;
  const hatBeanie = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.14, 0.29), mat(WARDROBE.hats[1]));
  hatBeanie.position.y = 1.8;
  hatBeanie.visible = style.hat === 2;
  group.add(head, hairMesh, hatCap, brim, hatBeanie);

  const armMeshes: THREE.Mesh[] = [];
  const skinMeshes: THREE.Mesh[] = [];
  const mkArm = (side: 1 | -1): THREE.Group => {
    const g = new THREE.Group();
    g.position.set(0.26 * side, 1.45, 0);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.42, 0.13), mat(style.jacket));
    upper.position.y = -0.19;
    upper.castShadow = true;
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.4, 0.11), mat(style.skin));
    fore.position.y = -0.58;
    armMeshes.push(upper);
    skinMeshes.push(fore);
    g.add(upper, fore);
    return g;
  };
  const armL = mkArm(-1);
  const armR = mkArm(1);
  group.add(armL, armR);
  const handR = new THREE.Group();
  handR.position.y = -0.78;
  armR.add(handR);

  const legMeshes: THREE.Mesh[] = [];
  const shoeMeshes: THREE.Mesh[] = [];
  const mkLeg = (side: 1 | -1): THREE.Group => {
    const g = new THREE.Group();
    g.position.set(0.11 * side, 0.95, 0);
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.17), mat(style.pants));
    thigh.position.y = -0.24;
    thigh.castShadow = true;
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.15), mat(style.pants));
    shin.position.y = -0.68;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.26), mat(style.shoes));
    shoe.position.set(0, -0.9, 0.05);
    legMeshes.push(thigh, shin);
    shoeMeshes.push(shoe);
    g.add(thigh, shin, shoe);
    return g;
  };
  const legL = mkLeg(-1);
  const legR = mkLeg(1);
  group.add(legL, legR);
  skinMeshes.push(head);

  return { group, torso, head, chest, jacket, armL, armR, legL, legR, handR, hatCap, hatBeanie, legMeshes, shoeMeshes, armMeshes, skinMeshes, hairMesh };
}

export type AnimState = 'idle' | 'walk' | 'sprint' | 'aim' | 'crouch' | 'jump' | 'fall' | 'dead' | 'sit' | 'reload' | 'interact';

export function animateCharacter(parts: CharacterParts, state: AnimState, moveSpeed: number, t: number, aimPitch: number, dt: number): void {
  const sw = Math.sin(t * (state === 'sprint' ? 13 : state === 'walk' ? 9 : 3));
  const amp = state === 'sprint' ? 0.9 : state === 'walk' ? 0.55 : 0.08;
  const crouch = state === 'crouch' ? 0.35 : 0;
  parts.group.position.y = -crouch * 0.4;
  parts.legL.rotation.x = sw * amp;
  parts.legR.rotation.x = -sw * amp;
  parts.armL.rotation.x = -sw * amp * 0.7;
  parts.armR.rotation.x = sw * amp * 0.7;
  parts.torso.rotation.y = sw * amp * 0.06;
  if (state === 'aim') {
    parts.armR.rotation.x = -Math.PI / 2 + aimPitch;
    parts.armL.rotation.x = -Math.PI / 2 + aimPitch * 0.8;
    parts.armR.rotation.y = 0;
  } else if (state === 'reload') {
    parts.armL.rotation.x = -1.2;
    parts.armR.rotation.x = -0.6 + Math.sin(t * 10) * 0.2;
  } else if (state === 'dead') {
    parts.group.rotation.x = -Math.PI / 2 * 0.9;
    parts.group.position.y = -0.7;
  } else if (state === 'sit') {
    parts.legL.rotation.x = -Math.PI / 2;
    parts.legR.rotation.x = -Math.PI / 2;
  } else if (state === 'jump' || state === 'fall') {
    parts.legL.rotation.x = 0.5;
    parts.legR.rotation.x = -0.4;
    parts.armL.rotation.x = -2.4;
    parts.armR.rotation.x = -2.4;
  }
  void dt;
  void moveSpeed;
}
