const tabs = document.querySelectorAll('.menu-item');
const sections = document.querySelectorAll('.tab-content');

const todayDate = document.getElementById('todayDate');
const planGrid = document.getElementById('planGrid');
const careText = document.getElementById('careText');
const aiPlan = document.getElementById('aiPlan');
const restModal = document.getElementById('restModal');

const calendarWeek = document.getElementById('calendarWeek');
const calendarGrid = document.getElementById('calendarGrid');
const checkinBtn = document.getElementById('checkinBtn');
const checkinMinutes = document.getElementById('checkinMinutes');
const checkinType = document.getElementById('checkinType');
const fatigueLevel = document.getElementById('fatigueLevel');
const checkinMsg = document.getElementById('checkinMsg');
const healthScoreValue = document.getElementById('healthScoreValue');

const state = {
  user: JSON.parse(localStorage.getItem('rehabUser') || 'null'),
  users: JSON.parse(localStorage.getItem('rehabUsers') || '[]'),
  posts: JSON.parse(localStorage.getItem('rehabPosts') || '[]'),
  favorites: JSON.parse(localStorage.getItem('rehabFavorites') || '[]'),
  history: JSON.parse(localStorage.getItem('rehabHistory') || '[]'),
  checkins: JSON.parse(localStorage.getItem('rehabCheckins') || '[]'),
  followGraph: JSON.parse(localStorage.getItem('rehabFollowGraph') || '{}'),
  dmThreads: JSON.parse(localStorage.getItem('rehabDmThreads') || '{}'),
  profiles: JSON.parse(localStorage.getItem('rehabProfiles') || '{}'),
  userStore: JSON.parse(localStorage.getItem('rehabUserStore') || '{}'),
};

const knowledgeData = [
  '饮食管理：康复期优先高蛋白、低炎性饮食。',
  '睡眠恢复：固定睡眠时段有助于神经修复。',
  '疼痛干预：持续疼痛时优先寻求专业理疗评估。',
];
const sportsData = [
  '2026 全国残疾人社区运动会新增轮椅篮球体验组。',
  '多地体育馆完成无障碍升级并开放康复时段。',
  '公益机构联合高校举办“运动康复开放周”。',
];

const videoItems = [
  {
    id: 'v1',
    title: '健身60秒：靠墙静蹲的正确姿势，“蹲”错了膝盖损伤不可逆！',
    src: 'https://yyyyyyyyyuh.github.io/new/video.mp4',
    cover: 'https://images.pexels.com/photos/6455777/pexels-photo-6455777.jpeg?auto=compress&cs=tinysrgb&w=1200',
    duration: '01:00',
  },
  {
    id: 'v2',
    title: '一首音乐挑战开合跳，看看你能做多少？',
    src: 'https://yyyyyyyyyuh.github.io/new/video1.mp4',
    cover: 'https://images.pexels.com/photos/4498606/pexels-photo-4498606.jpeg?auto=compress&cs=tinysrgb&w=1200',
    duration: '03:14',
  },
  {
    id: 'v3',
    title: '肩颈舒缓训练：办公室人群放松指南',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    cover: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=900&auto=format&fit=crop',
    duration: '02:32',
  },
  {
    id: 'v4',
    title: '下肢恢复训练：安全提升膝踝稳定性',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    cover: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&auto=format&fit=crop',
    duration: '04:06',
  },
  {
    id: 'v5',
    title: '呼吸节律训练：60秒恢复体能状态',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    cover: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&auto=format&fit=crop',
    duration: '01:20',
  },
  {
    id: 'v6',
    title: '睡前放松拉伸：改善睡眠质量的轻训练',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    cover: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&auto=format&fit=crop',
    duration: '02:48',
  },
];
const video2Override = {
  title: '一首音乐挑战开合跳，看看你能做多少？',
  src: 'https://yyyyyyyyyuh.github.io/new/video1.mp4',
  duration: '00:53',
};
const videoSourceCandidates = {
  v1: [
    'https://yyyyyyyyyuh.github.io/new/video.mp4',
    'https://raw.githubusercontent.com/yyyyyyyyyuh/new/codex/replace-ai-button-with-girl-image-00on8o/video.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
  ],
  v2: [
    'https://yyyyyyyyyuh.github.io/new/video1.mp4',
    'https://raw.githubusercontent.com/yyyyyyyyyuh/new/codex/replace-ai-button-with-girl-image-931aui/video1.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  ],
};
let activeVideoId = videoItems[0].id;
let followPromptShown = false;
let cameraStream = null;
let squatStartAt = null;
let accumulatedHoldMs = 0;
let detectRafId = null;
let poseLandmarker = null;
let visionFileset = null;
let detectionRunning = false;
let detectionBackend = '';
let legacyPose = null;
let legacyLandmarks = null;
let jumpJackCount = 0;
let jumpJackState = 'ready';
let jumpJackSmooth = null;
let jumpOpenStableFrames = 0;
let jumpCloseStableFrames = 0;
let jumpStateFrameAge = 0;
const defaultPlans = [
  ['晨间拉伸', '15分钟', '呼吸与上肢放松'],
  ['核心稳定', '20分钟', '坐姿平衡训练'],
  ['步态辅助', '25分钟', '步态矫正与耐力'],
  ['睡前舒缓', '12分钟', '肩颈与情绪放松'],
];

const therapyMap = {
  浙江: {
    杭州: [
      { name: '周晨', title: '神经康复理疗师', price: '¥198/次', mode: '支持上门' },
      { name: '林悦', title: '运动康复治疗师', price: '¥228/次', mode: '支持上门' },
    ],
    宁波: [{ name: '顾宁', title: '关节康复理疗师', price: '¥188/次', mode: '支持上门' }],
  },
  上海: {
    上海市: [
      { name: '陈峰', title: '脊柱康复理疗师', price: '¥260/次', mode: '支持上门' },
      { name: '徐晴', title: '儿童康复治疗师', price: '¥230/次', mode: '机构/上门' },
    ],
  },
  广东: {
    广州: [{ name: '黄杰', title: '术后康复理疗师', price: '¥210/次', mode: '支持上门' }],
    深圳: [{ name: '苏雅', title: '姿态矫正理疗师', price: '¥240/次', mode: '支持上门' }],
  },
};

const shopItems = [
  { category: '助行设备', name: '轻量助行器', price: '¥299', img: 'https://images.unsplash.com/photo-1542816417-0983678b9c7b?w=600' },
  { category: '康复训练', name: '弹力训练带套装', price: '¥69', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600' },
  { category: '理疗器械', name: '便携筋膜放松仪', price: '¥199', img: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=600' },
  { category: '康复训练', name: '平衡训练垫', price: '¥159', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600' },
  { category: '理疗器械', name: '热敷理疗护膝', price: '¥129', img: 'https://images.unsplash.com/photo-1584467735871-10c1a977fd2c?w=600' },
  { category: '助行设备', name: '折叠防滑拐杖', price: '¥89', img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600' },
];

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function activeUserKey() {
  return currentUser()?.id || '__guest__';
}

function userBucket() {
  const k = activeUserKey();
  if (!state.userStore[k]) {
    state.userStore[k] = { posts: [], favorites: [], history: [], checkins: [], likedPostIds: [], daily: {} };
    save('rehabUserStore', state.userStore);
  }
  if (!state.userStore[k].daily) {
    state.userStore[k].daily = {};
    save('rehabUserStore', state.userStore);
  }
  return state.userStore[k];
}

function saveUserBucket() {
  save('rehabUserStore', state.userStore);
}

function ensureUserModel() {
  let changed = false;
  state.users = state.users.map((u, idx) => {
    if (!u.id) {
      changed = true;
      return { ...u, id: `U${1000 + idx}` };
    }
    return u;
  });
  const seed = [
    { id: 'U2001', username: '阳光小宇', password: '123456' },
    { id: 'U2002', username: '康复小林', password: '123456' },
  ];
  seed.forEach((u) => {
    if (!state.users.find((x) => x.id === u.id || x.username === u.username)) {
      state.users.push(u);
      changed = true;
    }
  });
  state.users.forEach((u) => {
    if (!state.profiles[u.id]) {
      state.profiles[u.id] = {
        bio: '热爱康复训练与互助交流。',
        avatar: `https://i.pravatar.cc/120?u=${u.id}`,
      };
      changed = true;
    }
  });
  if (!state.userStore.__guest__) {
    state.userStore.__guest__ = {
      posts: state.posts || [],
      favorites: state.favorites || [],
      history: state.history || [],
      checkins: state.checkins || [],
      likedPostIds: [],
      daily: {},
    };
    changed = true;
  }

  Object.keys(state.userStore).forEach((k) => {
    if (!state.userStore[k].daily) {
      state.userStore[k].daily = {};
      changed = true;
    }
  });

  if (state.user && !state.user.id) {
    const found = state.users.find((u) => u.username === state.user.username);
    if (found) {
      state.user = { id: found.id, username: found.username };
      changed = true;
    }
  }
  if (changed) {
    save('rehabUsers', state.users);
    save('rehabProfiles', state.profiles);
    save('rehabUser', state.user);
    save('rehabUserStore', state.userStore);
  }
}

function currentUser() {
  if (!state.user) return null;
  return state.users.find((u) => u.id === state.user.id) || null;
}

function switchTab(tabId) {
  if (tabId !== 'followTraining') {
    const followVideo = document.getElementById('followTrainingVideo');
    if (followVideo && !followVideo.paused) followVideo.pause();
    stopCameraStream();
  }
  tabs.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
  sections.forEach((s) => s.classList.toggle('active', s.id === tabId));
}

function syncUserUI() {
  const user = currentUser();
  const name = user?.username || '朋友';
  document.getElementById('welcomeName').textContent = name;
  document.getElementById('sideName').textContent = user?.username || '访客用户';
  document.getElementById('sideState').textContent = user ? `ID:${user.id}` : '未登录';
}

function syncProfileAuthVisibility() {
  const block = document.getElementById('profileAuthBlock');
  const logout2 = document.getElementById('logoutBtn2');
  const loggedIn = Boolean(currentUser());
  if (block) block.classList.toggle('hidden', loggedIn);
  if (logout2) logout2.classList.toggle('hidden', !loggedIn);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayMetrics() {
  const box = userBucket();
  box.daily[todayKey()] = box.daily[todayKey()] || { articleReads: [], videoReads: [], exercise: 0 };
  return box.daily[todayKey()];
}

function renderHealthScore() {
  const m = todayMetrics();
  const articleScore = Math.min(2, new Set(m.articleReads).size) * 5;
  const videoScore = Math.min(2, new Set(m.videoReads).size) * 5;
  const learningScore = articleScore + videoScore;
  const exerciseScore = Math.min(40, Number(m.exercise || 0));
  const total = Math.min(100, 40 + learningScore + exerciseScore);
  if (healthScoreValue) healthScoreValue.textContent = String(Math.round(total));
}


function renderPlans(plans = defaultPlans) {
  planGrid.innerHTML = plans.map((p) => `<div class="plan-item"><h4>${p[0]}</h4><p>${p[1]}</p><small>${p[2]}</small></div>`).join('');
}

function renderCalendar() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.getDate();
  const firstDay = new Date(y, m, 1);
  const lastDate = new Date(y, m + 1, 0).getDate();
  const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
  calendarWeek.innerHTML = weekLabels.map((w) => `<div>${w}</div>`).join('');

  const monthPrefix = `${y}-${String(m + 1).padStart(2, '0')}-`;
  const checkins = userBucket().checkins;
  const doneDays = new Set(checkins.filter((c) => c.date.startsWith(monthPrefix)).map((c) => Number(c.date.slice(-2))));

  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push('<div></div>');
  for (let d = 1; d <= lastDate; d += 1) {
    const isToday = d === today;
    const isDone = doneDays.has(d);
    cells.push(`<div class="day-cell ${isToday ? 'today' : ''} ${isDone ? 'done' : ''}"><div class="day-num">${d}</div><div class="day-mark"></div></div>`);
  }
  calendarGrid.innerHTML = cells.join('');
}

function renderList(elId, list, category) {
  const daily = todayMetrics();
  const scored = new Set(daily.articleReads);
  document.getElementById(elId).innerHTML = list
    .map((item, idx) => {
      const readId = `${category}-${idx}`;
      const readDone = scored.has(readId);
      return `<div>${item} <button class="hub-btn collect-btn" data-category="${category}" data-item="${item}">收藏</button> <button class="hub-btn read-btn" data-read-id="${readId}">${readDone ? '已计分' : '阅读1分钟计分'}</button></div>`;
    })
    .join('');
}

function addFavorite(item, category) {
  const box = userBucket();
  box.favorites.unshift({ item, category, time: new Date().toLocaleString('zh-CN') });
  box.favorites = box.favorites.slice(0, 50);
  saveUserBucket();
  renderProfileData();
}

function addHistory(item) {
  const box = userBucket();
  box.history.unshift(`${new Date().toLocaleTimeString('zh-CN')} ${item}`);
  box.history = box.history.slice(0, 80);
  saveUserBucket();
  renderProfileData();
}

function videoCommentsStore() {
  return JSON.parse(localStorage.getItem('rehabVideoComments') || '{}');
}

function saveVideoComments(store) {
  localStorage.setItem('rehabVideoComments', JSON.stringify(store));
}

function renderVideoCards() {
  const grid = document.getElementById('videoCardGrid');
  if (!grid) return;
  grid.innerHTML = videoItems
    .map((item) => {
      const view = item.id === 'v2' ? { ...item, ...video2Override } : item;
      return `<article class="video-tile" data-video-id="${view.id}"><img src="${view.cover}" alt="${view.title}"/><div class="video-tile-body"><h4>${view.title}</h4><p>${view.duration}</p></div></article>`;
    })
    .join('');
}

function renderVideoComments() {
  const list = document.getElementById('videoCommentList');
  if (!list) return;
  const store = videoCommentsStore();
  const comments = store[activeVideoId] || [];
  list.innerHTML = comments.length ? comments.map((x) => `<p>${x}</p>`).join('') : '<p>暂无评论，来发布第一条吧。</p>';
}

function loadVideoWithFallback(player, sourceEl, videoId) {
  const list = videoSourceCandidates[videoId] || [sourceEl.src];
  let idx = 0;
  let resolved = false;
  let probeTimer = null;
  const clearProbe = () => {
    if (probeTimer) {
      window.clearTimeout(probeTimer);
      probeTimer = null;
    }
  };
  const advance = () => {
    if (resolved) return;
    if (idx < list.length - 1) {
      idx += 1;
      tryLoad();
    }
  };
  const tryLoad = () => {
    clearProbe();
    sourceEl.src = list[idx];
    player.load();
    probeTimer = window.setTimeout(() => {
      if (!resolved && player.readyState < 2) advance();
    }, 2600);
  };
  player.onerror = advance;
  player.onloadeddata = () => {
    resolved = true;
    clearProbe();
  };
  tryLoad();
}

function openVideoDetail(videoId) {
  const videosSection = document.getElementById('videos');
  const detail = document.getElementById('videoDetailCard');
  const title = document.getElementById('videoDetailTitle');
  const source = document.getElementById('rehabVideoSource');
  const player = document.getElementById('rehabVideo');
  if (!detail || !title || !source || !player) return;
  const target = videoItems.find((x) => x.id === videoId) || videoItems[0];
  const view = target.id === 'v2' ? { ...target, ...video2Override } : target;
  activeVideoId = target.id;
  title.textContent = view.title;
  loadVideoWithFallback(player, source, view.id);
  followPromptShown = false;
  detail.classList.remove('hidden');
  videosSection?.classList.add('video-detail-mode');
  detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  renderVideoComments();
}

function closeVideoDetail() {
  const videosSection = document.getElementById('videos');
  const detail = document.getElementById('videoDetailCard');
  if (!videosSection || !detail) return;
  detail.classList.add('hidden');
  videosSection.classList.remove('video-detail-mode');
}

function formatClock(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function stopCameraStream() {
  detectionRunning = false;
  detectionBackend = '';
  if (detectRafId) {
    window.cancelAnimationFrame(detectRafId);
    detectRafId = null;
  }
  if (poseLandmarker?.close) {
    poseLandmarker.close();
    poseLandmarker = null;
  }
  if (legacyPose?.close) {
    legacyPose.close();
    legacyPose = null;
  }
  legacyLandmarks = null;
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  const cam = document.getElementById('postureCamera');
  if (cam) cam.srcObject = null;
  const canvas = document.getElementById('poseCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function calcAngle(a, b, c) {
  if (!a || !b || !c) return 180;
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const mag1 = Math.hypot(abx, aby);
  const mag2 = Math.hypot(cbx, cby);
  if (!mag1 || !mag2) return 180;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function detectWallSquatCorrections(landmarks) {
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lHip = landmarks[23];
  const rHip = landmarks[24];
  const lKnee = landmarks[25];
  const rKnee = landmarks[26];
  const lAnkle = landmarks[27];
  const rAnkle = landmarks[28];
  if (!lShoulder || !rShoulder || !lHip || !rHip || !lKnee || !rKnee || !lAnkle || !rAnkle) {
    return ['识别到的人体关键点不足，请完整进入画面。'];
  }

  const shoulder = { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 };
  const hip = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 };
  const knee = { x: (lKnee.x + rKnee.x) / 2, y: (lKnee.y + rKnee.y) / 2 };
  const ankle = { x: (lAnkle.x + rAnkle.x) / 2, y: (lAnkle.y + rAnkle.y) / 2 };

  const hints = [];
  const trunkOffset = Math.abs(shoulder.x - hip.x);
  if (trunkOffset > 0.065) hints.push('身体前倾过多：背部不能离墙太远，请肩背和下背同时贴墙。');

  const hipKneeDelta = Math.abs(hip.y - knee.y);
  if (hipKneeDelta > 0.085) hints.push('蹲得不够低：请继续下蹲至大腿接近水平。');

  const leftKneeAngle = calcAngle(lHip, lKnee, lAnkle);
  const rightKneeAngle = calcAngle(rHip, rKnee, rAnkle);
  if (leftKneeAngle < 80 || leftKneeAngle > 110 || rightKneeAngle < 80 || rightKneeAngle > 110) hints.push('膝角不合适：建议维持在约 90° 附近。');

  const pelvisTilt = hip.x - knee.x;
  if (Math.abs(pelvisTilt) > 0.055) hints.push('髋部控制不足：尾骨微微内卷，保持骨盆中立。');

  const leftRightKneeDelta = Math.abs(lKnee.y - rKnee.y);
  const leftRightHipDelta = Math.abs(lHip.y - rHip.y);
  if (leftRightKneeDelta > 0.035 || leftRightHipDelta > 0.035) hints.push('左右高低不一致：请保持双侧髋膝同高，均匀受力。');

  const thighHorizontalGood = hipKneeDelta <= 0.085;
  const trunkVerticalGood = trunkOffset <= 0.065;
  const symmetryGood = leftRightKneeDelta <= 0.035 && leftRightHipDelta <= 0.035;
  const kneeAngleGood = leftKneeAngle >= 80 && leftKneeAngle <= 110 && rightKneeAngle >= 80 && rightKneeAngle <= 110;
  const standard = thighHorizontalGood && trunkVerticalGood && symmetryGood && kneeAngleGood && Math.abs(pelvisTilt) <= 0.055;
  return {
    hints,
    standard,
  };
}

function pointDist(a, b) {
  return Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0));
}

function smoothMetric(prev, next, alpha = 0.35) {
  if (typeof prev !== 'number') return next;
  return prev * (1 - alpha) + next * alpha;
}

function analyzeJumpingJack(landmarks) {
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lHip = landmarks[23];
  const rHip = landmarks[24];
  const lKnee = landmarks[25];
  const rKnee = landmarks[26];
  const lAnkle = landmarks[27];
  const rAnkle = landmarks[28];
  const lWrist = landmarks[15];
  const rWrist = landmarks[16];
  if (!lShoulder || !rShoulder || !lHip || !rHip || !lKnee || !rKnee || !lAnkle || !rAnkle || !lWrist || !rWrist) {
    return null;
  }

  const shoulderWidth = Math.max(0.06, pointDist(lShoulder, rShoulder));
  const ankleNormRaw = pointDist(lAnkle, rAnkle) / shoulderWidth;
  const leftRaiseRaw = (lShoulder.y - lWrist.y) / shoulderWidth;
  const rightRaiseRaw = (rShoulder.y - rWrist.y) / shoulderWidth;
  const armSyncRaw = Math.abs(leftRaiseRaw - rightRaiseRaw);
  const kneeSyncRaw = Math.abs(lKnee.y - rKnee.y) / shoulderWidth;
  const hipSyncRaw = Math.abs(lHip.y - rHip.y) / shoulderWidth;
  const torsoTiltRaw = Math.abs(((lShoulder.x + rShoulder.x) / 2) - ((lHip.x + rHip.x) / 2)) / shoulderWidth;

  jumpJackSmooth = jumpJackSmooth || {};
  // 开合跳计数需要比静蹲更灵敏，这里提高平滑更新速度，减少“动作到了却不计数”的滞后。
  const jumpAlpha = 0.52;
  jumpJackSmooth.ankleNorm = smoothMetric(jumpJackSmooth.ankleNorm, ankleNormRaw, jumpAlpha);
  jumpJackSmooth.leftRaise = smoothMetric(jumpJackSmooth.leftRaise, leftRaiseRaw, jumpAlpha);
  jumpJackSmooth.rightRaise = smoothMetric(jumpJackSmooth.rightRaise, rightRaiseRaw, jumpAlpha);
  jumpJackSmooth.armSync = smoothMetric(jumpJackSmooth.armSync, armSyncRaw, jumpAlpha);
  jumpJackSmooth.kneeSync = smoothMetric(jumpJackSmooth.kneeSync, kneeSyncRaw, jumpAlpha);
  jumpJackSmooth.hipSync = smoothMetric(jumpJackSmooth.hipSync, hipSyncRaw, jumpAlpha);
  jumpJackSmooth.torsoTilt = smoothMetric(jumpJackSmooth.torsoTilt, torsoTiltRaw, jumpAlpha);

  const metrics = jumpJackSmooth;
  // 略微放宽阈值：保持“完整开合”要求，同时提升计数灵敏度。
  const openCond = metrics.ankleNorm > 1.7 && metrics.leftRaise > 0.22 && metrics.rightRaise > 0.22 && metrics.armSync < 0.34 && metrics.torsoTilt < 0.3;
  const closeCond = metrics.ankleNorm < 1.48 && metrics.leftRaise < 0.02 && metrics.rightRaise < 0.02 && metrics.torsoTilt < 0.3;
  const synced = metrics.armSync < 0.34 && metrics.kneeSync < 0.38 && metrics.hipSync < 0.3;

  return { metrics, openCond, closeCond, synced };
}

async function initPoseLandmarker() {
  if (!window.vision?.PoseLandmarker || !window.vision?.FilesetResolver) return false;
  if (!visionFileset) {
    visionFileset = await window.vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
  }
  poseLandmarker = await window.vision.PoseLandmarker.createFromOptions(visionFileset, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.55,
    minTrackingConfidence: 0.55,
  });
  return true;
}

async function initLegacyPose() {
  if (!window.Pose) return false;
  legacyPose = new window.Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  });
  legacyPose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  legacyPose.onResults((results) => {
    legacyLandmarks = results.poseLandmarks || null;
  });
  return true;
}

async function openFollowTrainingPage() {
  const item = videoItems.find((x) => x.id === activeVideoId) || videoItems[0];
  const followItem = item.id === 'v2' ? { ...item, ...video2Override } : item;
  const exerciseMode = item.id === 'v2' ? 'jumpingJack' : 'wallSquat';
  const followTitle = document.getElementById('followTrainingTitle');
  const followSource = document.getElementById('followTrainingSource');
  const followVideo = document.getElementById('followTrainingVideo');
  const postureCamera = document.getElementById('postureCamera');
  const poseEngineStatus = document.getElementById('poseEngineStatus');
  const correctionList = document.getElementById('correctionList');
  const currentPoseState = document.getElementById('currentPoseState');
  const startDetectBtn = document.getElementById('startDetectBtn');
  const resetCountBtn = document.getElementById('resetCountBtn');
  const humanDetectedText = document.getElementById('humanDetectedText');
  const actionHint = document.getElementById('actionHint');
  const squatTimerText = document.getElementById('squatTimerText');
  const poseCanvas = document.getElementById('poseCanvas');
  if (!followTitle || !followSource || !followVideo || !postureCamera || !poseEngineStatus || !correctionList || !currentPoseState || !startDetectBtn || !resetCountBtn || !humanDetectedText || !actionHint || !squatTimerText || !poseCanvas) return;

  followTitle.textContent = `${followItem.title}（跟练模式）`;
  loadVideoWithFallback(followVideo, followSource, followItem.id);
  switchTab('followTraining');

  correctionList.innerHTML = '<li>动作建议：点击“开始检测”后将开启摄像头并进行骨架识别。</li>';
  humanDetectedText.textContent = '人体识别：未检测到';
  currentPoseState.textContent = '当前动作状态：未开始检测';
  actionHint.textContent = exerciseMode === 'jumpingJack'
    ? '动作提示：开合跳检测将随视频播放立即开始'
    : '动作提示：等待视频进入“靠墙静蹲”阶段…';
  squatTimerText.textContent = exerciseMode === 'jumpingJack' ? '开合跳计数：0 次' : '靠墙静蹲计时：00:00';
  poseEngineStatus.textContent = '识别状态：待启动摄像头';
  accumulatedHoldMs = 0;
  squatStartAt = null;
  jumpJackCount = 0;
  jumpJackState = 'ready';
  jumpJackSmooth = null;
  jumpOpenStableFrames = 0;
  jumpCloseStableFrames = 0;
  jumpStateFrameAge = 0;
  followVideo.currentTime = 0;
  followVideo.play().catch(() => {});
  resetCountBtn.onclick = () => {
    jumpJackCount = 0;
    jumpJackState = 'ready';
    jumpOpenStableFrames = 0;
    jumpCloseStableFrames = 0;
    jumpStateFrameAge = 0;
    squatTimerText.textContent = exerciseMode === 'jumpingJack' ? '开合跳计数：0 次' : '靠墙静蹲计时：00:00';
    correctionList.innerHTML = '<li>计数已重置，请先回到合拢状态再开始动作。</li>';
  };
  startDetectBtn.onclick = async () => {
    if (detectionRunning) return;
    poseEngineStatus.textContent = '识别状态：正在开启摄像头与 Pose Landmarker...';
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      postureCamera.srcObject = cameraStream;
      await postureCamera.play();
      const landmarkerReady = await initPoseLandmarker();
      if (landmarkerReady) {
        detectionBackend = 'landmarker';
      } else {
        const legacyReady = await initLegacyPose();
        if (!legacyReady) throw new Error('no-pose-engine');
        detectionBackend = 'legacy';
      }
      detectionRunning = true;
      poseEngineStatus.textContent = detectionBackend === 'landmarker'
        ? '识别状态：Pose Landmarker 运行中'
        : '识别状态：已切换到 MediaPipe Pose 兼容模式';
      currentPoseState.textContent = exerciseMode === 'jumpingJack'
        ? '当前动作状态：检测中（开合跳）'
        : '当前动作状态：检测中（等待标准靠墙下蹲）';
    } catch (err) {
      const reason = err?.name === 'NotAllowedError'
        ? '摄像头权限被拒绝'
        : err?.name === 'NotFoundError'
          ? '未找到可用摄像头'
          : '模型加载失败或网络受限';
      poseEngineStatus.textContent = `识别状态：启动失败（${reason}）`;
      correctionList.innerHTML = '<li>无法启动动作检测：请允许摄像头权限，并通过 https 或 localhost 打开页面后重试。</li>';
      return;
    }

    const ctx = poseCanvas.getContext('2d');
    const drawLoop = async () => {
      if (!detectionRunning || !cameraStream || !ctx) return;
      const vw = postureCamera.videoWidth || 640;
      const vh = postureCamera.videoHeight || 480;
      poseCanvas.width = vw;
      poseCanvas.height = vh;
      let landmarks = null;
      if (detectionBackend === 'landmarker' && poseLandmarker) {
        const nowMs = performance.now();
        const result = poseLandmarker.detectForVideo(postureCamera, nowMs);
        landmarks = result?.landmarks?.[0] || null;
      } else if (detectionBackend === 'legacy' && legacyPose) {
        await legacyPose.send({ image: postureCamera });
        landmarks = legacyLandmarks;
      }
      ctx.clearRect(0, 0, vw, vh);
      const t = followVideo.currentTime || 0;
      let hints = [];

      if (landmarks) {
        humanDetectedText.textContent = '人体识别：已检测到';
        const lm = landmarks;
        const conns = window.vision?.PoseLandmarker?.POSE_CONNECTIONS || [
          { start: 11, end: 13 }, { start: 13, end: 15 }, { start: 12, end: 14 }, { start: 14, end: 16 },
          { start: 11, end: 12 }, { start: 11, end: 23 }, { start: 12, end: 24 }, { start: 23, end: 24 },
          { start: 23, end: 25 }, { start: 24, end: 26 }, { start: 25, end: 27 }, { start: 26, end: 28 },
        ];
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        conns.forEach((c) => {
          const a = lm[c.start];
          const b = lm[c.end];
          if (!a || !b) return;
          ctx.beginPath();
          ctx.moveTo(a.x * vw, a.y * vh);
          ctx.lineTo(b.x * vw, b.y * vh);
          ctx.stroke();
        });
        ctx.fillStyle = '#ffca28';
        lm.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x * vw, p.y * vh, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        if (exerciseMode === 'jumpingJack') {
          const ana = analyzeJumpingJack(lm);
          actionHint.textContent = '动作提示：开合跳（合拢 → 张开 → 合拢 为 1 次）';
          if (!ana) {
            hints = ['请完整进入画面以进行开合跳检测。'];
          } else {
            const { metrics, openCond, closeCond, synced } = ana;
            jumpStateFrameAge += 1;
            jumpOpenStableFrames = openCond ? jumpOpenStableFrames + 1 : 0;
            jumpCloseStableFrames = closeCond ? jumpCloseStableFrames + 1 : 0;

            if (jumpJackState === 'ready') {
              currentPoseState.textContent = '当前动作状态：准备阶段（先回到合拢）';
              if (jumpCloseStableFrames >= 3) {
                jumpJackState = 'closed_ready';
                jumpStateFrameAge = 0;
              } else {
                hints.push('先回到合拢姿势：双脚并拢、双手自然下垂。');
              }
            } else if (jumpJackState === 'closed_ready') {
              currentPoseState.textContent = '当前动作状态：合拢姿态';
              if (jumpOpenStableFrames >= 2) {
                jumpJackState = 'opened';
                jumpStateFrameAge = 0;
              }
            } else if (jumpJackState === 'opened') {
              currentPoseState.textContent = '当前动作状态：张开姿态';
              if (jumpCloseStableFrames >= 2) {
                jumpJackCount += 1;
                jumpJackState = 'closed_ready';
                jumpStateFrameAge = 0;
                hints.push('动作正确，请保持。');
              } else if (jumpStateFrameAge > 120) {
                hints.push('动作做完整：请从张开回到合拢再计数。');
              }
            }

            if (metrics.leftRaise < 0.22 || metrics.rightRaise < 0.22) hints.push('手臂抬高一点。');
            if (metrics.ankleNorm < 1.7 && jumpJackState !== 'ready') hints.push('双脚再打开一点。');
            if (!synced) hints.push('注意左右同步。');
            if (metrics.torsoTilt > 0.3) hints.push('保持身体稳定。');
            if (!hints.length && jumpJackState !== 'ready') hints.push('动作正确，请保持。');

            squatTimerText.textContent = `开合跳计数：${jumpJackCount} 次`;
          }
        } else if (t >= 20) {
          actionHint.textContent = '动作提示：靠墙静蹲（背贴墙、膝约90°、大腿接近水平）';
          const analysis = detectWallSquatCorrections(lm);
          if (analysis.standard) {
            hints = ['动作正确，请保持。'];
            currentPoseState.textContent = '当前动作状态：标准靠墙静蹲';
            if (!squatStartAt) squatStartAt = Date.now();
            const ms = accumulatedHoldMs + (Date.now() - squatStartAt);
            squatTimerText.textContent = `靠墙静蹲计时：${formatClock(ms)}`;
          } else {
            hints = analysis.hints;
            currentPoseState.textContent = '当前动作状态：姿势待调整';
            if (squatStartAt) {
              accumulatedHoldMs += Date.now() - squatStartAt;
              squatStartAt = null;
            }
            squatTimerText.textContent = `靠墙静蹲计时：${formatClock(accumulatedHoldMs)}`;
          }
        } else {
          actionHint.textContent = '动作提示：准备阶段，20 秒后开始靠墙静蹲检测';
          currentPoseState.textContent = '当前动作状态：准备中';
          hints = ['请先背靠墙站好，双脚与肩同宽，准备下蹲。'];
          if (squatStartAt) {
            accumulatedHoldMs += Date.now() - squatStartAt;
            squatStartAt = null;
          }
          squatTimerText.textContent = `靠墙静蹲计时：${formatClock(accumulatedHoldMs)}`;
        }
      } else {
        humanDetectedText.textContent = '人体识别：未检测到';
        hints = ['未检测到完整人体关键点，请完整进入镜头并保持光线充足。'];
      }

      correctionList.innerHTML = hints.map((h) => `<li>${h}</li>`).join('');
      detectRafId = window.requestAnimationFrame(() => { drawLoop(); });
    };

    detectRafId = window.requestAnimationFrame(() => { drawLoop(); });
  };
}

async function askAndOpenFollowTraining() {
  const join = window.confirm('是否开启摄像头进行视频跟练?\n开启后会进入跟练页面：左侧播放教学视频，右侧通过动作捕捉实时提示你调整姿势');
  if (!join) return false;
  await openFollowTrainingPage();
  return true;
}

function renderPosts() {
  const list = document.getElementById('postList');
  const posts = userBucket().posts;
  if (!posts.length) {
    list.innerHTML = '<p>还没有帖子，来发布第一条鼓励吧！</p>';
    return;
  }
  list.innerHTML = posts
    .map((p, i) => `<div class="post-item"><h4>${p.author}</h4><div>${p.content}</div><div class="post-meta"><span>👍 ${p.likes}</span><span>💬 ${p.comments.length}</span></div><div class="post-actions"><button onclick="likePost(${i})">点赞</button><button onclick="favPost(${i})">收藏</button></div><div>${p.comments.map((c) => `<p>— ${c}</p>`).join('')}</div><div class="comment-row"><input id="comment-${i}" placeholder="写下评论..."/><button class="pill-btn" onclick="addComment(${i})">评论</button></div></div>`)
    .join('');
}

function getFollowingIds(uid) {
  return state.followGraph[uid] || [];
}

function followersCount(uid) {
  return Object.values(state.followGraph).filter((arr) => arr.includes(uid)).length;
}

function pairKey(a, b) {
  return [a, b].sort().join('__');
}

function renderProfileData() {
  const me = currentUser();
  const avatar = document.getElementById('profileAvatar');
  const name = document.getElementById('profileName');
  const idText = document.getElementById('profileIdText');
  const bioInput = document.getElementById('profileBioInput');
  const followingCount = document.getElementById('followingCount');
  const followers = document.getElementById('followersCount');
  const favList = document.getElementById('favList');
  const historyList = document.getElementById('historyList');
  const publishedList = document.getElementById('publishedList');
  const dmTarget = document.getElementById('dmTarget');

  if (!me) {
    avatar.src = 'https://i.pravatar.cc/120?u=guest';
    name.textContent = '访客用户';
    idText.textContent = 'ID: --';
    if (bioInput) bioInput.value = '登录后可查看完整个人中心功能。';
    followingCount.textContent = '0';
    followers.textContent = '0';
    favList.innerHTML = '<p>请登录后查看收藏内容</p>';
    historyList.innerHTML = '<p>请登录后查看历史记录</p>';
    publishedList.innerHTML = '<p>请登录后查看我的发布</p>';
    dmTarget.innerHTML = '<option value="">请先登录</option>';
    document.getElementById('dmThread').innerHTML = '<p>暂无私信</p>';
    syncProfileAuthVisibility();
    return;
  }

  const profile = state.profiles[me.id] || { bio: '', avatar: '' };
  avatar.src = profile.avatar || `https://i.pravatar.cc/120?u=${me.id}`;
  name.textContent = me.username;
  idText.textContent = `ID: ${me.id}`;
  if (bioInput) bioInput.value = profile.bio || '这个人很神秘，什么都没有留下。';

  const following = getFollowingIds(me.id);
  followingCount.textContent = String(following.length);
  followers.textContent = String(followersCount(me.id));

  const box = userBucket();
  favList.innerHTML = box.favorites.length
    ? box.favorites.map((f) => `<p>${f.time} · [${f.category}] ${f.item}</p>`).join('')
    : '<p>暂无收藏内容</p>';

  historyList.innerHTML = box.history.length
    ? box.history.map((h) => `<p>${h}</p>`).join('')
    : '<p>暂无历史记录</p>';

  const myPosts = box.posts.filter((p) => p.author === me.username).map((p) => `社区帖子：${p.content}`);
  const myVideos = box.history.filter((h) => h.includes('观看附近视频')).map((h) => `视频记录：${h}`);
  const published = [...myPosts, ...myVideos];
  publishedList.innerHTML = published.length
    ? published.map((x) => `<div class="published-item">${x}</div>`).join('')
    : '<p>暂未发布内容</p>';

  const options = following
    .map((fid) => state.users.find((u) => u.id === fid))
    .filter(Boolean)
    .map((u) => `<option value="${u.id}">${u.username}（${u.id}）</option>`)
    .join('');
  dmTarget.innerHTML = options || '<option value="">暂无已关注用户</option>';
  renderDmThread();
  syncProfileAuthVisibility();
}

function renderFriendResults(keyword = '') {
  const list = document.getElementById('friendResultList');
  const me = currentUser();
  if (!me) {
    list.innerHTML = '<p>请先登录后添加好友。</p>';
    return;
  }
  const kw = keyword.trim().toLowerCase();
  const candidates = state.users.filter((u) => u.id !== me.id && (!kw || u.id.toLowerCase().includes(kw) || u.username.toLowerCase().includes(kw)));
  if (!candidates.length) {
    list.innerHTML = '<p>未找到匹配用户。</p>';
    return;
  }
  const following = new Set(getFollowingIds(me.id));
  list.innerHTML = candidates.map((u) => {
    const p = state.profiles[u.id] || {};
    const isFollow = following.has(u.id);
    return `<div class="friend-row"><img src="${p.avatar || `https://i.pravatar.cc/120?u=${u.id}`}" alt="avatar"/><div><strong>${u.username}</strong><p class="muted">ID: ${u.id}</p><p>${p.bio || '暂无简介'}</p></div><div class="friend-actions"><button class="pill-btn follow-btn" data-uid="${u.id}">${isFollow ? '已关注' : '关注'}</button><button class="pill-btn ghost dm-open-btn" data-uid="${u.id}">私信</button></div></div>`;
  }).join('');
}

function toggleFollow(targetId) {
  const me = currentUser();
  if (!me) return;
  const following = new Set(getFollowingIds(me.id));
  if (following.has(targetId)) following.delete(targetId);
  else following.add(targetId);
  state.followGraph[me.id] = [...following];
  save('rehabFollowGraph', state.followGraph);
  renderProfileData();
  renderFriendResults(document.getElementById('friendKeyword').value);
}

function openDmWith(uid) {
  const me = currentUser();
  if (!me) return;
  const following = new Set(getFollowingIds(me.id));
  if (!following.has(uid)) {
    toggleFollow(uid);
  }
  renderProfileData();
  document.getElementById('dmTarget').value = uid;
  renderDmThread();
}

function renderDmThread() {
  const me = currentUser();
  const target = document.getElementById('dmTarget').value;
  const box = document.getElementById('dmThread');
  if (!me || !target) {
    box.innerHTML = '<p>选择一个已关注用户开始私信。</p>';
    return;
  }
  const key = pairKey(me.id, target);
  const msgs = state.dmThreads[key] || [];
  box.innerHTML = msgs.length
    ? msgs.map((m) => `<div class="dm-item ${m.from === me.id ? 'me' : ''}"><p>${m.from === me.id ? '我' : m.fromName}：${m.text}</p><small>${m.time}</small></div>`).join('')
    : '<p>还没有私信消息，发一条问候吧。</p>';
}


function initTherapyFilters() {
  const province = document.getElementById('provinceSelect');
  const city = document.getElementById('citySelect');
  if (!province || !city) return;
  const provinces = Object.keys(therapyMap);
  province.innerHTML = provinces.map((p) => `<option value="${p}">${p}</option>`).join('');
  function syncCities() {
    const p = province.value;
    const cities = Object.keys(therapyMap[p] || {});
    city.innerHTML = cities.map((c) => `<option value="${c}">${c}</option>`).join('');
  }
  province.addEventListener('change', syncCities);
  syncCities();
}

function renderTherapistsByRegion() {
  const province = document.getElementById('provinceSelect')?.value;
  const city = document.getElementById('citySelect')?.value;
  const list = document.getElementById('therapistList');
  if (!list || !province || !city) return;
  const data = therapyMap[province]?.[city] || [];
  if (!data.length) {
    list.innerHTML = '<p>当前地区暂无可预约理疗师。</p>';
    return;
  }
  list.innerHTML = data.map((t) => `<div class="therapist-item"><img src="https://i.pravatar.cc/90?u=${t.name}" alt="avatar"/><div><h4>${t.name}</h4><p>${t.title}</p><p>${province}·${city}｜${t.mode}</p></div><div><p class="price">${t.price}</p><button class="pill-btn">预约对接</button></div></div>`).join('');
}

function renderShop(category = '全部') {
  const wrap = document.getElementById('shopWaterfall');
  const chips = document.getElementById('shopCategory');
  if (!wrap || !chips) return;
  const categories = ['全部', ...new Set(shopItems.map((i) => i.category))];
  chips.innerHTML = categories.map((c) => `<button class="shop-chip ${c === category ? 'active' : ''}" data-category="${c}">${c}</button>`).join('');
  const list = category === '全部' ? shopItems : shopItems.filter((i) => i.category === category);
  wrap.innerHTML = list.map((i) => `<article class="shop-card"><img src="${i.img}" alt="${i.name}"/><div class="meta"><h4>${i.name}</h4><p>${i.category}</p><p class="price">${i.price}</p></div></article>`).join('');
}

function renderCareText() {
  const hour = new Date().getHours();
  let text = '愿你今天也被温柔以待。';
  if (hour < 10) text = '早安，先喝温水再训练，今天也请慢慢变强。';
  else if (hour < 18) text = '午间提醒：训练后补充蛋白质，记得适度拉伸。';
  else text = '晚上好，建议做10分钟舒缓训练帮助睡眠。';
  if (careText) careText.textContent = text;
  document.getElementById('greetingText').textContent = text;
}

window.likePost = (i) => {
  const posts = userBucket().posts;
  if (!posts[i]) return;
  posts[i].likes += 1;
  saveUserBucket();
  renderPosts();
};
window.favPost = (i) => { const posts = userBucket().posts; if (!posts[i]) return; addFavorite(posts[i].content, '社区话题'); };
window.addComment = (i) => {
  const input = document.getElementById(`comment-${i}`);
  if (!input.value.trim()) return;
  const posts = userBucket().posts;
  if (!posts[i]) return;
  posts[i].comments.push(input.value.trim());
  saveUserBucket();
  renderPosts();
};

tabs.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.getElementById('searchBtn').addEventListener('click', () => {
  const keyword = document.getElementById('search').value.trim();
  addHistory(`搜索：${keyword || '（空）'}`);
});

checkinBtn.addEventListener('click', () => {
  const minutes = Number(checkinMinutes.value.trim());
  const type = checkinType.value.trim();
  if (!minutes || !type) {
    checkinMsg.textContent = '请填写训练时长和训练类型后再打卡。';
    return;
  }
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const box = userBucket();
  box.checkins = box.checkins.filter((c) => c.date !== date);
  box.checkins.push({ date, minutes, type, user: currentUser()?.username || '访客' });
  const factor = Number(fatigueLevel?.value || 1);
  const exerciseScore = Math.min(40, minutes * factor);
  const metrics = todayMetrics();
  metrics.exercise = exerciseScore;
  saveUserBucket();
  checkinMsg.textContent = `打卡成功：${type}，${minutes} 分钟，运动分 ${exerciseScore.toFixed(1)}。`;
  renderCalendar();
  renderHealthScore();
});



document.getElementById('videoCardGrid')?.addEventListener('click', (e) => {
  const card = e.target.closest('.video-tile');
  if (!card) return;
  openVideoDetail(card.dataset.videoId);
});

document.getElementById('videoFavBtn')?.addEventListener('click', () => {
  const target = videoItems.find((x) => x.id === activeVideoId);
  if (!target) return;
  addFavorite(target.title, '视频专区');
});

document.getElementById('videoBackBtn')?.addEventListener('click', closeVideoDetail);

document.getElementById('startFollowTrainingBtn')?.addEventListener('click', async () => {
  const detailPlayer = document.getElementById('rehabVideo');
  detailPlayer?.pause();
  followPromptShown = true;
  await askAndOpenFollowTraining();
});

document.getElementById('rehabVideo')?.addEventListener('play', async (e) => {
  if (followPromptShown) return;
  followPromptShown = true;
  const player = e.currentTarget;
  const joined = await askAndOpenFollowTraining();
  if (!joined) return;
  player.pause();
});

document.getElementById('followTrainingBackBtn')?.addEventListener('click', () => {
  const followVideo = document.getElementById('followTrainingVideo');
  if (followVideo) {
    followVideo.pause();
    followVideo.currentTime = 0;
  }
  stopCameraStream();
  switchTab('videos');
});

document.getElementById('followTrainingVideo')?.addEventListener('ended', () => {
  document.getElementById('actionHint').textContent = '动作提示：本次跟练结束，建议放松股四头肌与臀部。';
});

document.getElementById('videoCommentBtn')?.addEventListener('click', () => {
  const input = document.getElementById('videoCommentInput');
  if (!input) return;
  const content = input.value.trim();
  if (!content) return;
  const store = videoCommentsStore();
  store[activeVideoId] = store[activeVideoId] || [];
  store[activeVideoId].unshift(`${new Date().toLocaleTimeString('zh-CN')} · ${content}`);
  store[activeVideoId] = store[activeVideoId].slice(0, 30);
  saveVideoComments(store);
  input.value = '';
  renderVideoComments();
});

document.getElementById('generatePlanBtn')?.addEventListener('click', () => {
  aiPlan.innerHTML = '<p>已生成计划：每周5次轻中度训练 + 2次恢复拉伸；重点关注核心稳定、关节活动度与呼吸耐力。</p>';
});

document.getElementById('aiAsk')?.addEventListener('click', () => {
  const q = document.getElementById('aiInput').value.trim();
  document.getElementById('aiResponse').textContent = q
    ? `针对“${q}”，建议从RPE 3-4起步，每次20-30分钟，记录心率/疼痛/睡眠，7天后复盘微调。`
    : '请告诉我你的障碍情况、训练目标和可用时段，我会给你个性化建议。';
});

document.getElementById('postBtn').addEventListener('click', () => {
  const input = document.getElementById('postInput');
  const content = input.value.trim();
  if (!content) return;
  const box = userBucket();
  box.posts.unshift({ author: currentUser()?.username || '匿名朋友', content, likes: 0, comments: [] });
  input.value = '';
  saveUserBucket();
  renderPosts();
  renderProfileData();
  renderCalendar();
});

const registerBtn = document.getElementById('registerBtn');
if (registerBtn) registerBtn.addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const msg = document.getElementById('authMessage') || { textContent: '' };
  if (!username || !password) return (msg.textContent = '请输入手机号/用户名和密码');
  if (state.users.find((u) => u.username === username)) return (msg.textContent = '用户已存在');
  const id = `U${Math.floor(1000 + Math.random() * 9000)}`;
  state.users.push({ id, username, password });
  state.profiles[id] = { bio: '这个人很神秘，什么都没有留下。', avatar: `https://i.pravatar.cc/120?u=${id}` };
  save('rehabUsers', state.users);
  save('rehabProfiles', state.profiles);
  msg.textContent = `注册成功，你的用户ID是 ${id}`;
});

const loginBtn = document.getElementById('loginBtn');
if (loginBtn) loginBtn.addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const msg = document.getElementById('authMessage') || { textContent: '' };
  const user = state.users.find((u) => u.username === username && u.password === password);
  if (!user) return (msg.textContent = '登录失败，请检查账号或密码');
  state.user = { id: user.id, username: user.username };
  save('rehabUser', state.user);
  msg.textContent = `登录成功，欢迎 ${username}`;
  syncUserUI();
  renderProfileData();
  renderPosts();
  renderCalendar();
  renderHealthScore();
  switchTab('profile');
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', () => {
  state.user = null;
  localStorage.removeItem('rehabUser');
  const msg = document.getElementById('authMessage');
  if (msg) msg.textContent = '已退出登录';
  syncUserUI();
  renderProfileData();
  renderPosts();
  renderCalendar();
  renderHealthScore();
});


const logoutBtn2 = document.getElementById('logoutBtn2');
if (logoutBtn2) logoutBtn2.addEventListener('click', () => {
  state.user = null;
  localStorage.removeItem('rehabUser');
  const msg = document.getElementById('authMessage');
  if (msg) msg.textContent = '已退出登录';
  syncUserUI();
  renderProfileData();
  renderPosts();
  renderCalendar();
  renderHealthScore();
});

document.body.addEventListener('click', (e) => {
  if (e.target.classList.contains('collect-btn')) addFavorite(e.target.dataset.item, e.target.dataset.category);
  if (e.target.classList.contains('read-btn')) {
    const readId = e.target.dataset.readId;
    e.target.textContent = '阅读计时中...';
    e.target.disabled = true;
    setTimeout(() => {
      const metrics = todayMetrics();
      if (!metrics.articleReads.includes(readId)) {
        metrics.articleReads.push(readId);
        saveUserBucket();
      }
      e.target.textContent = '已计分';
      renderHealthScore();
    }, 60000);
  }
  if (e.target.classList.contains('follow-btn')) toggleFollow(e.target.dataset.uid);
  if (e.target.classList.contains('dm-open-btn')) openDmWith(e.target.dataset.uid);
});

const openFriendSearchBtn = document.getElementById('openFriendSearch');
if (openFriendSearchBtn) openFriendSearchBtn.addEventListener('click', () => {
  document.getElementById('friendSearchBox').classList.toggle('hidden');
});

const friendSearchBtn = document.getElementById('friendSearchBtn');
if (friendSearchBtn) friendSearchBtn.addEventListener('click', () => {
  renderFriendResults(document.getElementById('friendKeyword').value);
});

const saveAvatarBtn = document.getElementById('saveAvatarBtn');
if (saveAvatarBtn) saveAvatarBtn.addEventListener('click', () => {
  const me = currentUser();
  if (!me) return;
  const url = document.getElementById('avatarUrlInput').value.trim();
  if (!url) return;
  state.profiles[me.id] = { ...(state.profiles[me.id] || {}), avatar: url };
  save('rehabProfiles', state.profiles);
  renderProfileData();
});

const dmTargetEl = document.getElementById('dmTarget');
if (dmTargetEl) dmTargetEl.addEventListener('change', renderDmThread);

const saveBioBtn = document.getElementById('saveBioBtn');
if (saveBioBtn) saveBioBtn.addEventListener('click', () => {
  const me = currentUser();
  if (!me) return;
  const bio = document.getElementById('profileBioInput').value.trim();
  state.profiles[me.id] = { ...(state.profiles[me.id] || {}), bio: bio || '这个人很神秘，什么都没有留下。' };
  save('rehabProfiles', state.profiles);
  renderProfileData();
});

const dmSendBtn = document.getElementById('dmSendBtn');
if (dmSendBtn) dmSendBtn.addEventListener('click', () => {
  const me = currentUser();
  const targetId = document.getElementById('dmTarget').value;
  const text = document.getElementById('dmInput').value.trim();
  if (!me || !targetId || !text) return;
  const key = pairKey(me.id, targetId);
  const target = state.users.find((u) => u.id === targetId);
  state.dmThreads[key] = state.dmThreads[key] || [];
  state.dmThreads[key].push({ from: me.id, to: targetId, fromName: me.username, toName: target?.username || targetId, text, time: new Date().toLocaleString('zh-CN') });
  save('rehabDmThreads', state.dmThreads);
  document.getElementById('dmInput').value = '';
  renderDmThread();
});

const noDisturbEl = document.getElementById('noDisturb');
const limitMinutesEl = document.getElementById('limitMinutes');
if (noDisturbEl && limitMinutesEl) {
  const syncLimitEditable = () => { limitMinutesEl.disabled = !noDisturbEl.checked; };
  noDisturbEl.addEventListener('change', syncLimitEditable);
  syncLimitEditable();
}

document.getElementById('closeRestModal').addEventListener('click', () => restModal.classList.add('hidden'));

const video = document.getElementById('rehabVideo');
let watchedSeconds = 0;
let currentVideoScored = false;
setInterval(() => {
  if (!video.paused && !video.ended) {
    watchedSeconds += 1;
    if (!currentVideoScored && watchedSeconds >= 60) {
      const metrics = todayMetrics();
      const videoKey = video.currentSrc || '主视频';
      if (!metrics.videoReads.includes(videoKey)) {
        metrics.videoReads.push(videoKey);
        saveUserBucket();
        renderHealthScore();
      }
      currentVideoScored = true;
    }
  } else {
    watchedSeconds = 0;
    currentVideoScored = false;
  }
}, 1000);

const appShell = document.querySelector('.app-shell');
const aiFloatBtn = document.getElementById('aiFloatBtn');
const islandOverlay = document.getElementById('islandOverlay');
const islandLoadingScreen = document.getElementById('islandLoadingScreen');
const islandSceneScreen = document.getElementById('islandSceneScreen');
const islandLoadingBar = document.getElementById('islandLoadingBar');
const islandLoadingText = document.getElementById('islandLoadingText');
const islandWelcomeDialog = document.getElementById('islandWelcomeDialog');
const islandReadyBtn = document.getElementById('islandReadyBtn');
const islandExitBtn = document.getElementById('islandExitBtn');
const ISLAND_FADE_MS = 420;
let islandCloseTimer = null;

function createFallbackIslandEngine() {
  let wrap = null;
  let girl = null;
  let running = false;
  let exploring = false;
  let rafId = 0;
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  const pos = { x: 0, y: 0, angle: 0 };
  const onDown = (e) => { if (e.key in keys) keys[e.key] = true; };
  const onUp = (e) => { if (e.key in keys) keys[e.key] = false; };

  const loop = () => {
    if (!running || !girl) return;
    if (exploring) {
      if (keys.ArrowLeft) pos.angle -= 2.6;
      if (keys.ArrowRight) pos.angle += 2.6;
      const rad = (pos.angle * Math.PI) / 180;
      if (keys.ArrowUp) {
        pos.x += Math.sin(rad) * 1.8;
        pos.y -= Math.cos(rad) * 1.8;
      }
      if (keys.ArrowDown) {
        pos.x -= Math.sin(rad) * 1.2;
        pos.y += Math.cos(rad) * 1.2;
      }
      pos.x = Math.max(-220, Math.min(220, pos.x));
      pos.y = Math.max(-140, Math.min(140, pos.y));
    }
    girl.style.transform = `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) rotate(${pos.angle}deg)`;
    rafId = window.requestAnimationFrame(loop);
  };

  return {
    async start({ containerId, onProgress }) {
      const container = document.getElementById(containerId);
      if (!container) return false;
      container.innerHTML = '';
      wrap = document.createElement('div');
      wrap.style.position = 'absolute';
      wrap.style.inset = '0';
      wrap.style.background = 'radial-gradient(circle at 50% 35%, #d8f3ff 0%, #9fcbe4 55%, #8ab19f 100%)';
      container.appendChild(wrap);
      girl = document.createElement('img');
      girl.src = 'girl.png';
      girl.alt = '角色';
      girl.style.position = 'absolute';
      girl.style.left = '50%';
      girl.style.top = '54%';
      girl.style.width = '96px';
      girl.style.height = 'auto';
      girl.style.transform = 'translate(-50%, -50%)';
      girl.style.transition = 'transform 0.12s linear';
      wrap.appendChild(girl);
      onProgress?.(35);
      await new Promise((resolve) => window.setTimeout(resolve, 260));
      onProgress?.(72);
      await new Promise((resolve) => window.setTimeout(resolve, 280));
      onProgress?.(100);
      running = true;
      exploring = false;
      pos.x = 0;
      pos.y = 0;
      pos.angle = 0;
      window.addEventListener('keydown', onDown);
      window.addEventListener('keyup', onUp);
      if (rafId) window.cancelAnimationFrame(rafId);
      loop();
      return true;
    },
    enterExploreMode() {
      exploring = true;
    },
    stop() {
      running = false;
      exploring = false;
      Object.keys(keys).forEach((k) => { keys[k] = false; });
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      if (wrap?.parentNode) wrap.parentNode.removeChild(wrap);
      wrap = null;
      girl = null;
    },
  };
}

async function ensureIslandEngine() {
  if (window.Island3D?.start) return true;
  window.Island3D = createFallbackIslandEngine();
  return true;
}

function enterIslandOverlay() {
  if (!islandOverlay || !islandLoadingScreen || !islandSceneScreen) return;
  if (islandCloseTimer) {
    window.clearTimeout(islandCloseTimer);
    islandCloseTimer = null;
  }
  aiFloatBtn?.classList.add('is-hidden');
  appShell?.classList.add('journey-fade-out');
  islandOverlay.classList.remove('hidden');
  islandOverlay.setAttribute('aria-hidden', 'false');
  islandLoadingScreen.classList.remove('hidden');
  islandSceneScreen.classList.add('hidden');
  islandWelcomeDialog?.classList.add('hidden');
  islandLoadingBar.style.width = '0%';
  islandLoadingText.textContent = '0%';
  void islandOverlay.offsetWidth;
  islandOverlay.classList.add('visible');
}

function exitIslandOverlay() {
  window.Island3D?.stop();
  aiFloatBtn?.classList.remove('is-hidden');
  appShell?.classList.remove('journey-fade-out');
  islandOverlay?.classList.remove('visible');
  if (!islandOverlay) return;
  islandOverlay.setAttribute('aria-hidden', 'true');
  islandCloseTimer = window.setTimeout(() => {
    islandOverlay.classList.add('hidden');
    islandLoadingScreen?.classList.remove('hidden');
    islandSceneScreen?.classList.add('hidden');
    islandWelcomeDialog?.classList.add('hidden');
    islandCloseTimer = null;
  }, ISLAND_FADE_MS);
}

async function openIslandExperience() {
  if (!islandOverlay || !islandLoadingScreen || !islandSceneScreen) return;
  enterIslandOverlay();
  await ensureIslandEngine();
  const islandApi = window.Island3D;
  if (!islandApi?.start) {
    islandLoadingText.textContent = '加载失败：3D引擎未就绪';
    return;
  }
  const ok = await islandApi.start({
    containerId: 'island3DViewport',
    worldModelPath: './3dground.glb',
    characterModelPath: './new_girl.glb',
    onProgress: (progress) => {
      const val = Math.max(0, Math.min(100, Math.round(progress)));
      islandLoadingBar.style.width = `${val}%`;
      islandLoadingText.textContent = `${val}%`;
    },
  });
  if (!ok) {
    islandLoadingText.textContent = '加载失败：请确认 3dground.glb / new_girl.glb 已放在项目根目录';
    return;
  }
  islandLoadingScreen.classList.add('hidden');
  islandSceneScreen.classList.remove('hidden');
  islandWelcomeDialog?.classList.remove('hidden');
}

['click', 'pointerup', 'touchend'].forEach((eventName) => {
  aiFloatBtn?.addEventListener(eventName, (event) => {
    event.preventDefault();
    openIslandExperience();
  });
});

islandExitBtn?.addEventListener('click', exitIslandOverlay);
islandReadyBtn?.addEventListener('click', () => {
  islandWelcomeDialog?.classList.add('hidden');
  window.Island3D?.enterExploreMode();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && islandOverlay && !islandOverlay.classList.contains('hidden')) {
    exitIslandOverlay();
  }
});

function init() {
  ensureUserModel();
  todayDate.textContent = new Date().toLocaleDateString('zh-CN');
  renderPlans();
  renderCalendar();
  renderCareText();
  renderList('knowledgeList', knowledgeData, '健康知识');
  renderList('sportsList', sportsData, '体育资讯');
  renderVideoCards();
  closeVideoDetail();
  initTherapyFilters();
  renderTherapistsByRegion();
  renderShop('全部');
  document.getElementById('searchTherapistBtn')?.addEventListener('click', renderTherapistsByRegion);
  document.getElementById('citySelect')?.addEventListener('change', renderTherapistsByRegion);
  document.getElementById('shopCategory')?.addEventListener('click', (e) => {
    if (!e.target.classList.contains('shop-chip')) return;
    renderShop(e.target.dataset.category);
  });
  renderPosts();
  syncUserUI();
  renderHealthScore();
  renderFriendResults();
  renderProfileData();
  syncProfileAuthVisibility();
}

init();
