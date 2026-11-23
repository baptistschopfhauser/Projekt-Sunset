import * as THREE from 'three';

export interface CharacterParts {
  group: THREE.Group;
  torso: THREE.Group;
  head: THREE.Mesh;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  handR: THREE.Group;
}

export interface CharacterStyle {
  skin: number;
  hair: number;
  shirt: number;
  jacket: number;
  pants: number;
  shoes: number;
}

export const ALEX_STYLE: CharacterStyle = {
  skin: 0xc9a184,
  hair: 0x2a2018,
  shirt: 0xf1f3f5,
  jacket: 0x2e3440,
  pants: 0x2b3a55,
  shoes: 0xd8d3c8,
};

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
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.28), mat(style.hair));
  hair.position.y = 1.76;
  group.add(head, hair);

  const mkArm = (side: 1 | -1): THREE.Group => {
    const g = new THREE.Group();
    g.position.set(0.26 * side, 1.45, 0);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.42, 0.13), mat(style.jacket));
    upper.position.y = -0.19;
    upper.castShadow = true;
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.4, 0.11), mat(style.skin));
    fore.position.y = -0.58;
    g.add(upper, fore);
    return g;
  };
  const armL = mkArm(-1);
  const armR = mkArm(1);
  group.add(armL, armR);
  const handR = new THREE.Group();
  handR.position.y = -0.78;
  armR.add(handR);

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
    g.add(thigh, shin, shoe);
    return g;
  };
  const legL = mkLeg(-1);
  const legR = mkLeg(1);
  group.add(legL, legR);

  return { group, torso, head, armL, armR, legL, legR, handR };
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
