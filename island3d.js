(function () {
  const THREE = window.THREE;
  if (!THREE) return;

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
  let inTransition = false;
  let transitionStart = 0;
  const keyState = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

  function ensureScene(containerId) {
    containerEl = document.getElementById(containerId);
    if (!containerEl) return false;
    containerEl.innerHTML = '';

    scene = new THREE.Scene();
    scene.background = new THREE.Color('#bfdff6');

    camera = new THREE.PerspectiveCamera(58, Math.max(1, containerEl.clientWidth) / Math.max(1, containerEl.clientHeight), 0.1, 500);
    camera.position.set(0, 1.8, 3.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(containerEl.clientWidth || 800, containerEl.clientHeight || 600);
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerEl.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    const hemi = new THREE.HemisphereLight(0xffffff, 0x9ab4c8, 1.05);
    hemi.position.set(0, 50, 0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.15);
    dir.position.set(4, 9, 4);
    scene.add(dir);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: '#afd5ab' }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    return true;
  }

  function makeFallbackGirl() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.22, 0.7, 4, 8),
      new THREE.MeshStandardMaterial({ color: '#89b57b' }),
    );
    body.position.y = 0.8;
    group.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshStandardMaterial({ color: '#f4d7c9' }),
    );
    head.position.y = 1.35;
    group.add(head);
    return group;
  }

  function makeFallbackWorld() {
    const group = new THREE.Group();
    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.9, 0.25, 30),
      new THREE.MeshStandardMaterial({ color: '#d7c39c' }),
    );
    plaza.position.y = 0.12;
    group.add(plaza);
    for (let i = 0; i < 8; i += 1) {
      const tree = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 1, 10),
        new THREE.MeshStandardMaterial({ color: '#6ca06b' }),
      );
      tree.position.set(Math.cos(i * 0.8) * 4.5, 0.5, Math.sin(i * 0.8) * 4.5);
      group.add(tree);
    }
    return group;
  }

  function loadGLB(path, onProgress) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();
      loader.load(
        path,
        (gltf) => resolve(gltf.scene),
        (event) => {
          if (onProgress && event && event.total) onProgress((event.loaded / event.total) * 100);
        },
        reject,
      );
    });
  }

  async function loadWithCandidates(candidates, onProgress) {
    for (let i = 0; i < candidates.length; i += 1) {
      const candidate = candidates[i];
      // eslint-disable-next-line no-await-in-loop
      const loaded = await loadGLB(candidate, onProgress).then((scene3d) => ({ scene3d })).catch(() => null);
      if (loaded) return loaded.scene3d;
    }
    return null;
  }

  function lookFront() {
    if (!girlRoot || !camera) return;
    const target = girlRoot.position.clone().add(new THREE.Vector3(0, 1.1, 0));
    camera.position.copy(target).add(new THREE.Vector3(0, 0.1, 2.3));
    camera.lookAt(target);
  }

  function getFollowCameraTarget() {
    const focus = girlRoot.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const behind = new THREE.Vector3(0, 1.45, 3.1).applyEuler(girlRoot.rotation);
    return { focus, desiredPos: focus.clone().add(behind) };
  }

  function updateTransition() {
    if (!inTransition || !girlRoot) return;
    const elapsed = performance.now() - transitionStart;
    const t = Math.min(1, elapsed / 1200);
    const eased = 1 - ((1 - t) * (1 - t));

    const target = girlRoot.position.clone().add(new THREE.Vector3(0, 1.1, 0));
    const frontPos = target.clone().add(new THREE.Vector3(0, 0.1, 2.3));
    const follow = getFollowCameraTarget();
    camera.position.lerpVectors(frontPos, follow.desiredPos, eased);
    camera.lookAt(follow.focus);

    if (t >= 1) {
      inTransition = false;
      exploring = true;
    }
  }

  function moveAndFollow(dt) {
    if (!exploring || !girlRoot || !camera) return;
    const turnSpeed = 1.9;
    const moveSpeed = 2.2;

    if (keyState.ArrowLeft) girlRoot.rotation.y += turnSpeed * dt;
    if (keyState.ArrowRight) girlRoot.rotation.y -= turnSpeed * dt;

    const direction = new THREE.Vector3(0, 0, -1).applyEuler(girlRoot.rotation);
    if (keyState.ArrowUp) girlRoot.position.addScaledVector(direction, moveSpeed * dt);
    if (keyState.ArrowDown) girlRoot.position.addScaledVector(direction, -moveSpeed * dt * 0.7);

    girlRoot.position.x = THREE.MathUtils.clamp(girlRoot.position.x, -24, 24);
    girlRoot.position.z = THREE.MathUtils.clamp(girlRoot.position.z, -24, 24);

    const follow = getFollowCameraTarget();
    camera.position.lerp(follow.desiredPos, 0.12);
    camera.lookAt(follow.focus);
  }

  function tick() {
    if (disposed || !renderer || !scene || !camera) return;
    const dt = Math.min(clock.getDelta(), 1 / 30);
    updateTransition();
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
    disposed = false;
    exploring = false;
    inTransition = false;

    if (!ensureScene(containerId)) return false;
    onProgress && onProgress(8);

    const worldCandidates = [
      worldModelPath,
      './3dground.glb',
      './models/3dground.glb',
      '/3dground.glb',
      'https://raw.githubusercontent.com/yyyyyyyyyuh/new/main/3dground.glb',
      'file:///D:/myweb/3dground.glb',
    ].filter(Boolean);
    worldRoot = await loadWithCandidates(worldCandidates, (p) => onProgress && onProgress(8 + p * 0.42));
    if (!worldRoot) {
      worldRoot = makeFallbackWorld();
      onProgress && onProgress(50);
    }

    const roleCandidates = [
      characterModelPath,
      './new_girl.glb',
      './models/new_girl.glb',
      '/new_girl.glb',
      'https://raw.githubusercontent.com/yyyyyyyyyuh/new/main/new_girl.glb',
      'file:///D:/myweb/new_girl.glb',
    ].filter(Boolean);
    girlRoot = await loadWithCandidates(roleCandidates, (p) => onProgress && onProgress(50 + p * 0.45));
    if (!girlRoot) {
      girlRoot = makeFallbackGirl();
      onProgress && onProgress(96);
    }

    scene.add(worldRoot);
    girlRoot.position.set(0, 0, 0);
    scene.add(girlRoot);
    lookFront();
    onProgress && onProgress(100);

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    if (animId) window.cancelAnimationFrame(animId);
    tick();
    return true;
  }

  function enterExploreMode() {
    if (!girlRoot || !camera) return;
    transitionStart = performance.now();
    inTransition = true;
    exploring = false;
  }

  function stop() {
    disposed = true;
    exploring = false;
    inTransition = false;
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
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
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
})();
