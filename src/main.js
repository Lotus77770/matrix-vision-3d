import * as THREE from 'three';
import './style.css';

/* ============================================================
   全局配置
   ============================================================ */
const CONFIG = {
  axisHalfLength: 4, // 坐标轴半长，轴范围 -4 ~ 4
  gridRadius: 3, // 三维立方格阵范围 ±3
  gridStep: 1, // 网格间距（每 1 单位一条线）
  tickLength: 0.2, // 整数刻度线（垂直于轴）的长度
  tickThickness: 0.0075, // 整数刻度圆柱半径（比坐标轴细，但比一根像素线明显）
  axisThickness: 0.012, // 坐标轴圆柱半径
  axisLabelOffset: 0.5, // 轴端标签相对轴端点的外移距离
  axisLabelScale: 0.9, // 轴端标签精灵的边长（世界单位）
  vectorShaftRadius: 0.045, // 基向量杆半径（粗大醒目）
  vectorHeadRadius: 0.095, // 基向量箭头底部半径
  vectorHeadHeight: 0.22, // 基向量箭头高度
  vectorLength: 1, // 基向量长度恒为 1
  matrixMin: -3, // 矩阵元素取值范围下限
  matrixMax: 3, // 矩阵元素取值范围上限
  matrixStep: 0.1, // 矩阵元素步进
  color: {
    background: 0x000000,
    axis: 0xffffff, // 坐标轴：白色
    tick: 0xffffff, // 整数刻度：白色
    grid: 0x3a3a3a, // 网格：暗灰，作为背景参考
  },
};

/* ============================================================
   渲染器 / 场景 / 相机
   注意：画布放在 #viewport 里，#viewport 始终位于全屏 #stage 中，
   控制台只是浮在场景之上的面板，故始终只有一个画布、一台相机。
   ============================================================ */
const viewport = document.querySelector('#viewport');
const stage = document.querySelector('#stage');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.color.background);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);

/* 灯光：让基向量的实体几何体有明暗立体感 */
scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(6, 10, 8);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
fillLight.position.set(-8, -6, -7);
scene.add(fillLight);

/* ============================================================
   坐标轴 + 整数刻度 + 轴端标签
   ============================================================ */
/* 用 Canvas 画文字生成 Sprite 标签，使其始终正对相机、便于阅读 */
function makeAxisLabelSprite(text) {
  const px = 128;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 84px -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, px / 2, px / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  );
  sprite.scale.set(CONFIG.axisLabelScale, CONFIG.axisLabelScale, 1);
  sprite.userData.labelText = text;
  return sprite;
}

function createAxes() {
  const group = new THREE.Group();
  const half = CONFIG.axisHalfLength;
  const material = new THREE.MeshBasicMaterial({ color: CONFIG.color.axis });

  // 三条轴的朝向：圆柱体默认沿 +Y，需要旋转到 x / y / z 方向
  const axes = [
    { rotation: new THREE.Euler(0, 0, -Math.PI / 2) }, // x 轴
    { rotation: new THREE.Euler(0, 0, 0) }, // y 轴
    { rotation: new THREE.Euler(Math.PI / 2, 0, 0) }, // z 轴
  ];

  for (const { rotation } of axes) {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(
        CONFIG.axisThickness,
        CONFIG.axisThickness,
        half * 2,
        12
      ),
      material
    );
    shaft.rotation.copy(rotation);
    group.add(shaft);
  }

  // 整数刻度：在整数位置画一段垂直于该轴的白色短线（不显示任何数字）
  // 用细圆柱而不是 Line，因为 WebGL 的线宽被锁定为 1 像素、无法加粗
  const tickMaterial = new THREE.MeshBasicMaterial({ color: CONFIG.color.tick });
  const tickGeoAlongY = new THREE.CylinderGeometry(
    CONFIG.tickThickness,
    CONFIG.tickThickness,
    CONFIG.tickLength,
    8
  );
  const tickGeoAlongX = tickGeoAlongY.clone();
  tickGeoAlongX.rotateZ(-Math.PI / 2);

  for (let i = -half; i <= half; i++) {
    if (i === 0) continue; // 原点处三条轴的刻度会重叠，跳过

    const tickY = new THREE.Mesh(tickGeoAlongX, tickMaterial); // y 轴刻度，沿 x 方向展开
    tickY.position.set(0, i, 0);
    group.add(tickY);

    const tickX = new THREE.Mesh(tickGeoAlongY, tickMaterial); // x 轴刻度，沿 y 方向展开
    tickX.position.set(i, 0, 0);
    group.add(tickX);

    const tickZ = new THREE.Mesh(tickGeoAlongX, tickMaterial); // z 轴刻度，沿 x 方向展开
    tickZ.position.set(0, 0, i);
    group.add(tickZ);
  }

  // 轴端标签：在三条白色数轴各自的尽头标注 +X / -X / +Y / -Y / +Z / -Z
  const end = half + CONFIG.axisLabelOffset;
  const ends = [
    { text: '+X', pos: [end, 0, 0] },
    { text: '-X', pos: [-end, 0, 0] },
    { text: '+Y', pos: [0, end, 0] },
    { text: '-Y', pos: [0, -end, 0] },
    { text: '+Z', pos: [0, 0, end] },
    { text: '-Z', pos: [0, 0, -end] },
  ];
  for (const { text, pos } of ends) {
    const sprite = makeAxisLabelSprite(text);
    sprite.position.set(pos[0], pos[1], pos[2]);
    group.add(sprite);
  }

  return group;
}

scene.add(createAxes());

/* ============================================================
   三维立方格阵（±3，每 1 单位一条线，共 3 × 7 × 7 = 147 条长线）
   按方向拆成三组（分别平行于 x / y / z 轴），便于在控制台分别开关。
   ============================================================ */
function createGridFamily(axis) {
  const r = CONFIG.gridRadius;
  const s = CONFIG.gridStep;
  const pts = [];
  for (let a = -r; a <= r; a += s) {
    for (let b = -r; b <= r; b += s) {
      if (axis === 'x') pts.push(-r, a, b, r, a, b); // 平行于 x 轴的长线
      else if (axis === 'y') pts.push(a, -r, b, a, r, b); // 平行于 y 轴的长线
      else pts.push(a, b, -r, a, b, r); // 平行于 z 轴的长线
    }
  }

  // 记录原始顶点，矩阵变换时按 M·v 逐点计算
  const basePositions = new Float32Array(pts);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(basePositions.slice(), 3));

  const lines = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color: CONFIG.color.grid })
  );
  return { lines, basePositions };
}

// 三组网格线：分别平行于 x / y / z 轴，可独立控制显隐
const gridFamilies = {
  x: createGridFamily('x'),
  y: createGridFamily('y'),
  z: createGridFamily('z'),
};
for (const family of Object.values(gridFamilies)) scene.add(family.lines);

/* ============================================================
   向量列表：默认包含三个基向量 e₁ / e₂ / e₃
   列表中每个向量都会经过矩阵变换：渲染为从原点指向 M·v 的箭头。
   支持添加 / 删除 / 修改坐标 / 设置颜色。
   ============================================================ */
// 通用箭头：本体沿 +Y 建模，外层 group 预留矩阵变换（matrixAutoUpdate = false）
function createVectorArrow(color) {
  const group = new THREE.Group();
  group.matrixAutoUpdate = false; // 由矩阵驱动（默认单位矩阵）

  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.45,
    roughness: 0.45,
    metalness: 0,
  });

  const shaftLength = CONFIG.vectorLength - CONFIG.vectorHeadHeight;

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(
      CONFIG.vectorShaftRadius,
      CONFIG.vectorShaftRadius,
      shaftLength,
      24
    ),
    material
  );
  shaft.position.y = shaftLength / 2;

  const head = new THREE.Mesh(
    new THREE.ConeGeometry(CONFIG.vectorHeadRadius, CONFIG.vectorHeadHeight, 28),
    material
  );
  head.position.y = shaftLength + CONFIG.vectorHeadHeight / 2;

  group.add(shaft, head);
  group.userData.material = material; // 供改色时复用同一材质
  return group;
}

// 让箭头指向世界向量 w：方向取单位向量、长度取模长，横截面不变（不被剪切/压扁）
const ARROW_BASE = new THREE.Vector3(0, 1, 0);
function updateArrow(group, w) {
  const len = w.length();
  if (len < 1e-6) {
    group.visible = false; // 退化为零向量：箭头收起（不可见）
    return;
  }
  group.visible = true;

  const quat = new THREE.Quaternion().setFromUnitVectors(ARROW_BASE, w.clone().normalize());
  const scale = new THREE.Matrix4().makeScale(1, len, 1);
  group.matrix.makeRotationFromQuaternion(quat).multiply(scale);
  group.updateMatrixWorld(true);
}

// 默认向量即三个基向量
const DEFAULT_VECTORS = [
  { coord: [1, 0, 0], color: '#ff4d4d' },
  { coord: [0, 1, 0], color: '#4dff88' },
  { coord: [0, 0, 1], color: '#4d9dff' },
];

// 每项：{ id, coord: [x, y, z], color, arrow, world }
const vectorList = [];
let vectorIdSeq = 0;

// 新建一个向量（此处不做变换，交由 applyMatrix 统一处理）
function addVector(coord, color) {
  const entry = { id: ++vectorIdSeq, coord: coord.slice(), color, world: new THREE.Vector3() };
  const arrow = createVectorArrow(color);
  arrow.userData.entry = entry; // 供悬停拾取识别所属向量
  entry.arrow = arrow;
  scene.add(arrow);
  vectorList.push(entry);
  return entry;
}

DEFAULT_VECTORS.forEach((def) => addVector(def.coord, def.color));

/* ============================================================
   统一的“应用矩阵”入口
   - 向量列表：每个向量 v 都渲染为指向 M·v 的箭头，保持箭头模型本身不被剪切/压扁
   - 网格：所有顶点按 M·v 变换（整体拉伸/剪切）
   ============================================================ */
const identityMatrix = new THREE.Matrix3();

function applyMatrix(m3) {
  const e = m3.elements; // 列主序

  // 向量列表：目标端点是 M·v。方向取其单位向量，长度取其模长。
  // 通过「先沿自身轴拉伸、再旋转到目标方向」实现，横截面不变，故箭头不会被剪切/压扁。
  for (const entry of vectorList) {
    const [x, y, z] = entry.coord;
    const w = entry.world.set(
      e[0] * x + e[3] * y + e[6] * z,
      e[1] * x + e[4] * y + e[7] * z,
      e[2] * x + e[5] * y + e[8] * z
    );
    updateArrow(entry.arrow, w);
  }

  // 网格：三组网格线的每个顶点位置都左乘矩阵
  for (const family of Object.values(gridFamilies)) {
    const attr = family.lines.geometry.getAttribute('position');
    const base = family.basePositions;
    for (let i = 0; i < base.length; i += 3) {
      const x = base[i];
      const y = base[i + 1];
      const z = base[i + 2];
      attr.array[i] = e[0] * x + e[3] * y + e[6] * z;
      attr.array[i + 1] = e[1] * x + e[4] * y + e[7] * z;
      attr.array[i + 2] = e[2] * x + e[5] * y + e[8] * z;
    }
    attr.needsUpdate = true;
  }
}

applyMatrix(identityMatrix);

/* ============================================================
   视角控制器
   Alt + 鼠标拖拽 = 旋转
   Alt + 滚轮     = 缩放
   W / A / S / D  = 前后左右移动
   ============================================================ */
// 初始视角参数：构造与「重置视角」共用同一份基准
const DEFAULT_VIEW = {
  target: new THREE.Vector3(0, 0, 0), // 环绕中心
  radius: 9.5, // 与中心的距离
  theta: Math.PI / 4, // 方位角
  phi: 1.15, // 极角（自 +Y 起算）
};

class ViewController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.dom = domElement;

    this.target = DEFAULT_VIEW.target.clone(); // 环绕中心
    this.radius = DEFAULT_VIEW.radius; // 与中心的距离
    this.theta = DEFAULT_VIEW.theta; // 方位角
    this.phi = DEFAULT_VIEW.phi; // 极角（自 +Y 起算）

    this.minRadius = 1.5;
    this.maxRadius = 60;
    this.rotateSpeed = 0.006;
    this.zoomSpeed = 0.0015;
    this.moveSpeed = 3.5; // 单位 / 秒

    this.enabled = true;
    this.pressedKeys = new Set();
    this.isDragging = false;
    this.lastPointer = { x: 0, y: 0 };

    this.bindEvents();
    this.update(0);
  }

  // 恢复为初始视角（环绕中心、距离、方位角、极角）
  resetView() {
    this.target.copy(DEFAULT_VIEW.target);
    this.radius = DEFAULT_VIEW.radius;
    this.theta = DEFAULT_VIEW.theta;
    this.phi = DEFAULT_VIEW.phi;
    this.pressedKeys.clear();
    this.update(0);
  }

  bindEvents() {
    this.dom.addEventListener('mousedown', (e) => {
      if (!this.enabled || !e.altKey || e.button !== 0) return;
      e.preventDefault();
      this.isDragging = true;
      this.lastPointer.x = e.clientX;
      this.lastPointer.y = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.enabled || !this.isDragging) return;
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      this.lastPointer.x = e.clientX;
      this.lastPointer.y = e.clientY;

      this.theta -= dx * this.rotateSpeed;
      this.phi = THREE.MathUtils.clamp(
        this.phi - dy * this.rotateSpeed,
        0.05,
        Math.PI - 0.05
      );
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.dom.addEventListener(
      'wheel',
      (e) => {
        if (!this.enabled || !e.altKey) return;
        e.preventDefault();
        this.radius = THREE.MathUtils.clamp(
          this.radius * (1 + e.deltaY * this.zoomSpeed),
          this.minRadius,
          this.maxRadius
        );
      },
      { passive: false }
    );

    window.addEventListener('keydown', (e) => {
      if (!this.enabled || isTypingTarget(e.target)) return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        this.pressedKeys.add(key);
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.pressedKeys.delete(e.key.toLowerCase());
    });

    // 页面失焦时清空按键，避免“卡住一直移动”
    window.addEventListener('blur', () => this.pressedKeys.clear());
  }

  update(delta) {
    const forward = new THREE.Vector3()
      .subVectors(this.target, this.camera.position)
      .normalize();
    const right = new THREE.Vector3()
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .normalize();

    const move = new THREE.Vector3();
    if (this.pressedKeys.has('w')) move.add(forward);
    if (this.pressedKeys.has('s')) move.sub(forward);
    if (this.pressedKeys.has('d')) move.add(right);
    if (this.pressedKeys.has('a')) move.sub(right);
    if (move.lengthSq() > 0) {
      this.target.addScaledVector(move.normalize(), this.moveSpeed * delta);
    }

    const sinPhi = Math.sin(this.phi);
    this.camera.position.set(
      this.target.x + this.radius * sinPhi * Math.sin(this.theta),
      this.target.y + this.radius * Math.cos(this.phi),
      this.target.z + this.radius * sinPhi * Math.cos(this.theta)
    );
    this.camera.lookAt(this.target);
  }
}

function isTypingTarget(el) {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  );
}

const controller = new ViewController(camera, renderer.domElement);

/* ============================================================
   3×3 矩阵控制台
   矩阵按数学行主序存储：matrixValues[行][列]，默认单位矩阵。
   任一元素变化 → 立即重建矩阵并调用 applyMatrix（实时联动）。
   ============================================================ */
const identity = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];
const matrixValues = identity.map((row) => row.slice());

const matrixRoot = document.querySelector('#matrix');
const resetBtn = document.querySelector('#reset-btn');
const matrixCells = []; // 按行主序存放 { num, rng }

function clampMatrix(value) {
  return Math.max(CONFIG.matrixMin, Math.min(CONFIG.matrixMax, value));
}

function syncMatrix() {
  const m = new THREE.Matrix3().set(
    matrixValues[0][0],
    matrixValues[0][1],
    matrixValues[0][2],
    matrixValues[1][0],
    matrixValues[1][1],
    matrixValues[1][2],
    matrixValues[2][0],
    matrixValues[2][1],
    matrixValues[2][2]
  );
  applyMatrix(m);
}

function buildMatrixUI() {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      const num = document.createElement('input');
      num.type = 'number';
      num.className = 'num';
      num.min = String(CONFIG.matrixMin);
      num.max = String(CONFIG.matrixMax);
      num.step = String(CONFIG.matrixStep);
      num.value = String(matrixValues[r][c]);

      const rng = document.createElement('input');
      rng.type = 'range';
      rng.className = 'rng';
      rng.min = String(CONFIG.matrixMin);
      rng.max = String(CONFIG.matrixMax);
      rng.step = String(CONFIG.matrixStep);
      rng.value = String(matrixValues[r][c]);

      // 把某个来源的新值同步到矩阵与另一个控件
      const apply = (value, source) => {
        const v = clampMatrix(value);
        matrixValues[r][c] = v;
        // 输入框来源：越界时回写为钳制后的值
        if (source !== 'number' || value !== v) num.value = String(v);
        // 滑块始终跟随数值
        if (source !== 'range') rng.value = String(v);
        syncMatrix();
      };

      num.addEventListener('input', () => {
        const parsed = parseFloat(num.value);
        if (Number.isNaN(parsed)) return; // 允许清空/输入中间态
        apply(parsed, 'number');
      });

      rng.addEventListener('input', () => {
        apply(parseFloat(rng.value), 'range');
      });

      cell.append(num, rng);
      matrixRoot.appendChild(cell);
      matrixCells.push({ num, rng });
    }
  }
}

function resetMatrix() {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      matrixValues[r][c] = identity[r][c];
      const cell = matrixCells[r * 3 + c];
      cell.num.value = String(identity[r][c]);
      cell.rng.value = String(identity[r][c]);
    }
  }
  syncMatrix();
  controller.resetView(); // 重置矩阵的同时，把视角也恢复为初始视角
}

buildMatrixUI();
resetBtn.addEventListener('click', resetMatrix);

/* ============================================================
   网格线显示开关
   三组网格线（平行于 x / y / z 轴）各自独立开关，仅影响显隐，
   不改变矩阵变换结果（隐藏的网格依旧跟随矩阵变换，重新显示即同步）。
   ============================================================ */
function setGridVisible(axis, visible) {
  const family = gridFamilies[axis];
  if (family) family.lines.visible = visible;
}

for (const input of document.querySelectorAll('input[data-grid-axis]')) {
  // 以 HTML 上的初始 checked 状态为准，保持两者一致
  setGridVisible(input.dataset.gridAxis, input.checked);
  input.addEventListener('change', () => {
    setGridVisible(input.dataset.gridAxis, input.checked);
  });
}

/* ============================================================
   控制台收缩：整个「线性变换控制台」可折叠为一个按钮
   ============================================================ */
const consoleEl = document.querySelector('#console');
const consoleToggle = document.querySelector('#console-toggle');

consoleToggle.addEventListener('click', () => {
  const collapsed = consoleEl.classList.toggle('collapsed');
  consoleToggle.setAttribute('aria-expanded', String(!collapsed));
});

/* 向量列表 / 网格线显示：各自独立的折叠小节，与控制台整体的折叠互不影响 */
for (const btn of document.querySelectorAll('.section-toggle')) {
  btn.addEventListener('click', () => {
    const section = btn.closest('.collapsible');
    const collapsed = section.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', String(!collapsed));
  });
}

/* ============================================================
   向量列表 UI：添加 / 删除 / 修改坐标 / 设置颜色
   每行 = 颜色选择器 + x/y/z 坐标输入 + 删除按钮
   ============================================================ */
const vectorListRoot = document.querySelector('#vector-list');
const addVectorBtn = document.querySelector('#add-vector-btn');
// 新增向量时依次取用的颜色，避免与原向量混淆
const VECTOR_PALETTE = ['#ff4d4d', '#4dff88', '#4d9dff', '#ffd54d', '#ff4dff', '#4dffff', '#ff9d4d'];

function buildVectorRow(entry) {
  const row = document.createElement('div');
  row.className = 'vector-row';

  // 颜色选择器
  const color = document.createElement('input');
  color.type = 'color';
  color.className = 'vector-color';
  color.value = entry.color;
  color.title = `向量 #${entry.id} 颜色`;
  color.addEventListener('input', () => {
    entry.color = color.value;
    const material = entry.arrow.userData.material;
    material.color.set(color.value);
    material.emissive.set(color.value);
  });

  // 坐标 x / y / z
  const coords = document.createElement('div');
  coords.className = 'vector-coords';
  ['x', 'y', 'z'].forEach((axisName, i) => {
    const num = document.createElement('input');
    num.type = 'number';
    num.className = 'vector-coord';
    num.step = String(CONFIG.matrixStep);
    num.value = String(entry.coord[i]);
    num.placeholder = axisName;
    num.addEventListener('input', () => {
      const parsed = parseFloat(num.value);
      if (Number.isNaN(parsed)) return; // 允许清空/输入中间态
      entry.coord[i] = parsed;
      syncMatrix(); // 坐标变化 → 立即重算 M·v
    });
    coords.appendChild(num);
  });

  // 删除
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'vector-del';
  del.textContent = '×';
  del.title = '删除该向量';
  del.addEventListener('click', () => {
    scene.remove(entry.arrow);
    const idx = vectorList.indexOf(entry);
    if (idx >= 0) vectorList.splice(idx, 1);
    row.remove();
    // 余下向量的变换不受影响，无需重算
  });

  row.append(color, coords, del);
  vectorListRoot.appendChild(row);
}

// 为已存在的向量（默认三个基向量）生成列表行
vectorList.forEach(buildVectorRow);

addVectorBtn.addEventListener('click', () => {
  const color = VECTOR_PALETTE[vectorIdSeq % VECTOR_PALETTE.length];
  const entry = addVector([1, 1, 1], color); // 新向量给一个明显可见的默认坐标
  buildVectorRow(entry);
  syncMatrix(); // 立即按当前矩阵变换
});

/* ============================================================
   悬停提示：鼠标指向某个向量时，在鼠标旁显示它变换后的坐标 M·v
   ============================================================ */
const tooltipEl = document.querySelector('#vector-tooltip');
const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

// 从被射线击中的子网格往上找到所属的向量条目
function findEntry(object) {
  let o = object;
  while (o) {
    if (o.userData && o.userData.entry) return o.userData.entry;
    o = o.parent;
  }
  return null;
}

renderer.domElement.addEventListener('mousemove', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNDC, camera);

  let entry = null;
  const arrows = vectorList.map((it) => it.arrow);
  for (const hit of raycaster.intersectObjects(arrows, true)) {
    const found = findEntry(hit.object);
    if (found && found.arrow.visible) {
      entry = found;
      break;
    }
  }

  if (!entry) {
    tooltipEl.style.display = 'none';
    return;
  }

  const { x, y, z } = entry.world; // 变换后的坐标 M·v
  tooltipEl.textContent = `向量 #${entry.id}：(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`;
  tooltipEl.style.display = 'block';
  tooltipEl.style.left = `${e.clientX + 14}px`;
  tooltipEl.style.top = `${e.clientY + 14}px`;
});

renderer.domElement.addEventListener('mouseleave', () => {
  tooltipEl.style.display = 'none';
});

/* ============================================================
   尺寸自适应 + 渲染循环
   ============================================================ */
function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  if (width === 0 || height === 0) return;
  renderer.setSize(width, height, false); // false：由 CSS 控制显示尺寸
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

new ResizeObserver(resize).observe(viewport);

const clock = { last: performance.now() };

function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min((now - clock.last) / 1000, 0.1); // 上限 0.1s，避免切回标签页时跳变
  clock.last = now;
  controller.update(delta);
  renderer.render(scene, camera);
}

/* 场景常驻：把视口放进全屏场景，直接开始渲染 */
stage.appendChild(viewport);
resize();
requestAnimationFrame(animate);

/* 供后续阶段与控制台调试使用 */
window.__scene3d = {
  scene,
  camera,
  renderer,
  controller,
  vectorList,
  addVector,
  applyMatrix,
  gridFamilies,
  setGridVisible,
  getMatrix: () => matrixValues.map((row) => row.slice()),
};