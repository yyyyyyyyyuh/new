import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

let renderer;
let scene;
let camera;
let clock;
let worldRoot;
let girlRoot;
let containerEl;
let animId = null;
let disposed = false;
let exploring = false;
const keyState = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

function ensureScene(containerId) {
  containerEl = document.getElementById(containerId);
  if (!containerEl) return false;
  containerEl.innerHTML = '';
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#bfdff6');

  camera = new THREE.PerspectiveCamera(58, Math.max(1, containerEl.clientWidth) / Math.max(1, containerEl.clientHeight), 0.1, 500);
  camera.position.set(0, 1.75, 3.2);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(containerEl.clientWidth || 800, containerEl.clientHeight || 600);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  containerEl.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  const hemi = new THREE.HemisphereLight(0xffffff, 0x9ab4c8, 0.95);
  hemi.position.set(0, 50, 0);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(4, 8, 3);
  scene.add(dir);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: '#b8d9ab' }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  return true;
}

function loadGLB(path, onProgress) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => resolve(gltf.scene),
      (event) => {
        if (onProgress && event?.total) onProgress((event.loaded / event.total) * 100);
      },
      reject,
    );
  });
}

function makeFallbackGirl() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.7, 4, 8),
    new THREE.MeshStandardMaterial({ color: '#8dbf84' }),
  );
  body.position.y = 0.8;
  group.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 20, 20),
    new THREE.MeshStandardMaterial({ color: '#f4d4c3' }),
  );
  head.position.y = 1.35;
  group.add(head);
  return group;
}

function makeFallbackWorld() {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(2.5, 0.25, 2.5);
  const mat = new THREE.MeshStandardMaterial({ color: '#d8c9a6' });
  const plaza = new THREE.Mesh(geo, mat);
  plaza.position.set(0, 0.12, 0);
  group.add(plaza);
  for (let i = 0; i < 6; i += 1) {
    const tree = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.9, 10),
      new THREE.MeshStandardMaterial({ color: '#6ca06b' }),
    );
    tree.position.set(Math.cos(i) * 3, 0.45, Math.sin(i) * 3);
    group.add(tree);
  }
  return group;
}

function frameCharacterFront() {
  if (!girlRoot || !camera) return;
  const target = girlRoot.position.clone().add(new THREE.Vector3(0, 1.1, 0));
  camera.position.set(target.x, target.y + 0.12, target.z + 2.3);
  camera.lookAt(target);
}

function moveAndFollow(dt) {
  if (!exploring || !girlRoot || !camera) return;
  const turnSpeed = 1.9;
  const moveSpeed = 2.15;
  if (keyState.ArrowLeft) girlRoot.rotation.y += turnSpeed * dt;
  if (keyState.ArrowRight) girlRoot.rotation.y -= turnSpeed * dt;

  const direction = new THREE.Vector3(0, 0, -1).applyEuler(girlRoot.rotation);
  if (keyState.ArrowUp) girlRoot.position.addScaledVector(direction, moveSpeed * dt);
  if (keyState.ArrowDown) girlRoot.position.addScaledVector(direction, -moveSpeed * dt * 0.7);

  girlRoot.position.x = THREE.MathUtils.clamp(girlRoot.position.x, -20, 20);
  girlRoot.position.z = THREE.MathUtils.clamp(girlRoot.position.z, -20, 20);

  const focus = girlRoot.position.clone().add(new THREE.Vector3(0, 1.2, 0));
  const behind = new THREE.Vector3(0, 1.4, 3.1).applyEuler(girlRoot.rotation);
  const desired = focus.clone().add(behind);
  camera.position.lerp(desired, 0.12);
  camera.lookAt(focus);
}

function tick() {
  if (disposed || !renderer || !scene || !camera) return;
  const dt = Math.min(clock.getDelta(), 1 / 30);
  moveAndFollow(dt);
  renderer.render(scene, camera);
  animId = window.requestAnimationFrame(tick);
}

function onResize() {
  if (!renderer || !camera || !containerEl) return;
  const w = containerEl.clientWidth || window.innerWidth;
  const h = containerEl.clientHeight || window.innerHeight;
  camera.aspect = Math.max(1, w) / Math.max(1, h);
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function handleKeyDown(event) {
  if (event.key in keyState) keyState[event.key] = true;
}

function handleKeyUp(event) {
  if (event.key in keyState) keyState[event.key] = false;
}

async function start({ containerId, worldModelPath, characterModelPath, onProgress }) {
  try {
    disposed = false;
    exploring = false;
    if (!ensureScene(containerId)) return false;

    onProgress?.(8);
    try {
      worldRoot = await loadGLB(worldModelPath, (p) => onProgress?.(8 + p * 0.42));
    } catch {
      worldRoot = makeFallbackWorld();
      onProgress?.(50);
    }

    try {
      girlRoot = await loadGLB(characterModelPath, (p) => onProgress?.(50 + p * 0.45));
    } catch {
      girlRoot = makeFallbackGirl();
      onProgress?.(96);
    }

    worldRoot.position.y = 0;
    scene.add(worldRoot);
    girlRoot.scale.setScalar(1);
    girlRoot.position.set(0, 0, 0);
    scene.add(girlRoot);
    frameCharacterFront();
    onProgress?.(100);

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (animId) window.cancelAnimationFrame(animId);
    tick();
    return true;
  } catch {
    return false;
  }
}

function enterExploreMode() {
  exploring = true;
}

function stop() {
  disposed = true;
  exploring = false;
  Object.keys(keyState).forEach((k) => { keyState[k] = false; });
  if (animId) {
    window.cancelAnimationFrame(animId);
    animId = null;
  }
  window.removeEventListener('resize', onResize);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss?.();
    renderer.domElement?.remove();
  }
  renderer = null;
  scene = null;
  camera = null;
  worldRoot = null;
  girlRoot = null;
  containerEl = null;
}

window.Island3D = {
  start,
  stop,
  enterExploreMode,
};
