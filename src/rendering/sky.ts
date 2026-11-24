import * as THREE from 'three';
import { PALETTE } from '../core/config.ts';
import { RNG } from '../core/rng.ts';

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_Position.z = gl_Position.w;
  }
`;

const skyFrag = /* glsl */ `
  varying vec3 vDir;
  uniform vec3 sunDir;
  uniform float night;
  uniform float sunset;
  uniform vec3 zenithDay;
  uniform vec3 horizonDay;
  uniform vec3 zenithNight;
  uniform vec3 horizonSunset;
  void main() {
    vec3 d = normalize(vDir);
    float h = max(d.y, 0.0);
    vec3 zen = mix(zenithDay, zenithNight, night);
    vec3 hor = mix(horizonDay, zenithNight * 0.6, night);
    vec3 col = mix(hor, zen, pow(h, 0.55));
    float sunAmt = max(dot(d, sunDir), 0.0);
    col += vec3(1.0, 0.75, 0.45) * pow(sunAmt, 600.0) * (1.0 - night * 0.9) * 1.2;
    col += horizonSunset * pow(sunAmt, 6.0) * sunset * (1.0 - night) * (1.0 - h * 1.4 + 0.4);
    col += vec3(0.5, 0.65, 1.0) * pow(sunAmt, 24.0) * sunset * 0.25;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export class Sky {
  dome: THREE.Mesh;
  uniforms: { sunDir: { value: THREE.Vector3 }; night: { value: number }; sunset: { value: number }; zenithDay: { value: THREE.Color }; horizonDay: { value: THREE.Color }; zenithNight: { value: THREE.Color }; horizonSunset: { value: THREE.Color } };
  stars: THREE.Points;
  clouds: THREE.Group;
  cloudMat: THREE.MeshBasicMaterial;
  rng: RNG;
  sunSprite: THREE.Sprite;
  moonSprite: THREE.Sprite;
  sunGlow: THREE.Sprite;

  constructor(scene: THREE.Scene) {
    this.uniforms = {
      sunDir: { value: new THREE.Vector3(0, 1, 0) },
      night: { value: 0 },
      sunset: { value: 0 },
      zenithDay: { value: new THREE.Color(0x4a90d9) },
      horizonDay: { value: new THREE.Color(0xbfd9e8) },
      zenithNight: { value: new THREE.Color(PALETTE.midnightNavy).multiplyScalar(0.7) },
      horizonSunset: { value: new THREE.Color(PALETTE.coralOrange) },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      uniforms: this.uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(2900, 32, 18), mat);
    this.dome.frustumCulled = false;
    this.dome.name = 'sky';
    scene.add(this.dome);

    this.rng = new RNG(9090);
    const starGeo = new THREE.BufferGeometry();
    const starPos: number[] = [];
    for (let i = 0; i < 900; i++) {
      const v = new THREE.Vector3().randomDirection();
      if (v.y < 0.02) v.y = Math.abs(v.y) * 0.5 + 0.02;
      v.normalize().multiplyScalar(2850);
      starPos.push(v.x, v.y, v.z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xcfd8ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
    this.stars = new THREE.Points(starGeo, starMat);
    this.stars.frustumCulled = false;
    scene.add(this.stars);

    const cnv = document.createElement('canvas');
    cnv.width = 128;
    cnv.height = 128;
    const ctx = cnv.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const cloudTex = new THREE.CanvasTexture(cnv);
    this.cloudMat = new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.5, depthWrite: false, fog: false });
    this.clouds = new THREE.Group();
    for (let i = 0; i < 26; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(220, 110), this.cloudMat);
      m.position.set(this.rng.range(-2400, 2400), this.rng.range(320, 520), this.rng.range(-2000, 2000));
      m.rotation.x = -Math.PI / 2;
      this.clouds.add(m);
    }
    scene.add(this.clouds);

    const mkGlow = (inner: string, outer: string, size: number) => {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 63);
      g.addColorStop(0, inner);
      g.addColorStop(0.35, outer);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false }));
      spr.scale.set(size, size, 1);
      spr.renderOrder = 998;
      scene.add(spr);
      return spr;
    };
    this.sunSprite = mkGlow('rgba(255,250,230,1)', 'rgba(255,190,110,0.55)', 260);
    this.sunGlow = mkGlow('rgba(255,220,160,0.5)', 'rgba(255,170,90,0.18)', 900);
    this.moonSprite = mkGlow('rgba(220,230,255,0.95)', 'rgba(160,180,255,0.35)', 130);
  }

  update(sunDir: THREE.Vector3, night: number, sunset: number, cloudiness: number, wind: number, dt: number, camPos: THREE.Vector3): void {
    this.uniforms.sunDir.value.copy(sunDir);
    this.uniforms.night.value = night;
    this.uniforms.sunset.value = sunset;
    this.dome.position.copy(camPos);
    this.stars.position.copy(camPos);
    (this.stars.material as THREE.PointsMaterial).opacity = night * 0.9;
    this.cloudMat.opacity = 0.12 + cloudiness * 0.55;
    this.cloudMat.color.setScalar(1 - night * 0.55 - cloudiness * 0.25);
    this.clouds.position.copy(camPos);
    for (const c of this.clouds.children) {
      c.position.x += wind * dt * 6;
      if (c.position.x > 2600) c.position.x = -2600;
    }
    const sunPos = camPos.clone().addScaledVector(sunDir, 2750);
    this.sunSprite.position.copy(sunPos);
    this.sunGlow.position.copy(sunPos);
    this.sunSprite.visible = sunDir.y > -0.08;
    this.sunGlow.visible = this.sunSprite.visible;
    const moonDir = sunDir.clone().multiplyScalar(-1);
    this.moonSprite.position.copy(camPos.clone().addScaledVector(moonDir, 2750));
    this.moonSprite.visible = night > 0.3;
    (this.sunSprite.material as THREE.SpriteMaterial).opacity = clamp01(1 - night * 1.2) * clamp01(sunDir.y * 8 + 0.6);
    (this.moonSprite.material as THREE.SpriteMaterial).opacity = night * 0.9;
  }
}
