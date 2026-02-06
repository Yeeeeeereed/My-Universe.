// ================== SETUP BÁSICO ==================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05000a);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 120, 300);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("c"),
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

// Controles
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.mouseButtons = {
  LEFT: null,              // Desactiva mover con click izquierdo
  MIDDLE: THREE.MOUSE.DOLLY, // Scroll / botón medio = zoom
  RIGHT: THREE.MOUSE.ROTATE  // Click derecho = rotar cámara
};
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 40;
controls.maxDistance = 2500;
controls.enablePan = false;

// Luz
scene.add(new THREE.AmbientLight(0xffffff, 1));

// ================== POLVO ESTELAR ==================
const dustCount = 12000;
const dustGeo = new THREE.BufferGeometry();
const dustPos = [];

for (let i = 0; i < dustCount; i++) {
  dustPos.push((Math.random() - 0.5) * 3000);
  dustPos.push((Math.random() - 0.5) * 800);
  dustPos.push((Math.random() - 0.5) * 3000);
}
dustGeo.setAttribute("position", new THREE.Float32BufferAttribute(dustPos, 3));

const dustMat = new THREE.PointsMaterial({
  color: 0xc084ff,
  size: 2,
  transparent: true,
  opacity: 0.8
});

const dust = new THREE.Points(dustGeo, dustMat);
scene.add(dust);

// ================== AGUJERO NEGRO ==================
const hole = new THREE.Mesh(
  new THREE.SphereGeometry(30, 64, 64),
  new THREE.MeshBasicMaterial({ color: 0x000000 })
);
scene.add(hole);

// Anillo (disco de acreción)
const ringGeo = new THREE.RingGeometry(34, 55, 128);
const ringMat = new THREE.MeshBasicMaterial({
  color: 0xb266ff,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.7
});
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI / 2;
scene.add(ring);

// ================== TEXTO COMO SPRITE ==================
function makeTextSprite(text, size = 64, color = "#ffffff") {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  ctx.font = `bold ${size}px Arial`;
  const w = ctx.measureText(text).width;

  canvas.width = w + 100;
  canvas.height = size + 100;

  ctx.font = `bold ${size}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(255,180,255,1)";
  ctx.shadowBlur = 25;
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);

  const scale = 0.12;
  sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);
  return sprite;
}

// Texto central
const centro = makeTextSprite("TE AMO PRINCESA", 80, "#ffc0dd");
centro.position.set(0, 80, 0);
centro.material.opacity = 0.5;
scene.add(centro);

// ================== MUCHÍSIMOS SOBRENOMBRES ==================
const baseNombres = [
  "Mi Amor","Mi Vida","Mi Princesa","Mi Reina","Mi Cielo","Mi Universo","Mi Estrella","Mi Luz","Mi Todo",
  "Mi Tesoro","Mi Sueño","Mi Eternidad","Mi Corazón","Mi Razón","Mi Destino","Mi Milagro","Mi Paz","Mi Hogar",
  "Mi Alegría","Mi Inspiración","Mi Magia","Mi Ángel","Mi Diosa","Mi Niña","Mi Bonita","Mi Hermosa","Mi Preciosa",
  "Mi Casualidad Favorita","Mi Pensamiento Favorito","Mi Lugar Seguro","Mi Infinito","Mi Siempre","Mi Para Siempre",
  "Mi Sol","Mi Luna","Mi Galaxia","Mi Refugio","Mi Esperanza","Mi Promesa","Mi Cielito","Mi Amorcito",
  "Mi Estrellita","Mi Mundo","Mi Destello","Mi Poema","Mi Canción","Mi Suspiro","Mi Ternura","Mi Dulzura",
  "Mi Bendición","Mi Sueño Bonito","Mi Amor Eterno","Mi Casualidad Perfecta"
];

// Generar MUCHOS más combinando
const nombres = [];
for (let i = 0; i < 6; i++) {
  baseNombres.forEach(n => {
    nombres.push(n + " ✨");
    nombres.push("Siempre " + n);
    nombres.push(n + " Infinita");
  });
}

// Crear sprites
const textos = [];
nombres.forEach(name => {
  const t = makeTextSprite(name, 64, "#ffffff");
  t.position.set(
    (Math.random() - 0.5) * 2000,
    (Math.random() - 0.5) * 400,
    (Math.random() - 0.5) * 2000
  );
  t.userData = {
    originalPos: t.position.clone(),
    originalScale: t.scale.clone()
  };
  scene.add(t);
  textos.push(t);
});

// ================== SELECCIÓN Y NAVEGACIÓN ==================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let seleccionado = null;
let indexSeleccionado = -1;

// Enfocar suavemente la cámara
const targetPos = new THREE.Vector3();
let focusing = false;

function focusOn(obj) {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);

  targetPos.copy(obj.position).add(dir.multiplyScalar(120));
  focusing = true;
}

// Reset anterior
function resetSeleccion() {
  if (seleccionado) {
    seleccionado.scale.copy(seleccionado.userData.originalScale);
    seleccionado.material.opacity = 1;
  }
}

// Seleccionar uno
function seleccionar(obj) {
  resetSeleccion();
  seleccionado = obj;
  indexSeleccionado = textos.indexOf(obj);

  obj.scale.multiplyScalar(1.4);
  obj.material.opacity = 1;

  focusOn(obj);
}

// Click con mouse
function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(textos);

  if (hits.length > 0) {
    seleccionar(hits[0].object);
  }
}
window.addEventListener("click", onClick);

// Flechas del teclado para navegar
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    indexSeleccionado = (indexSeleccionado + 1) % textos.length;
    seleccionar(textos[indexSeleccionado]);
  }
  if (e.key === "ArrowLeft") {
    indexSeleccionado = (indexSeleccionado - 1 + textos.length) % textos.length;
    seleccionar(textos[indexSeleccionado]);
  }
});

// ================== ANIMACIÓN ==================
function animate() {
  requestAnimationFrame(animate);

  // Polvo gira lento
  dust.rotation.y += 0.0003;

  // Anillo con energía (gira + pulsa)
  ring.rotation.z += 0.003;
  const pulse = 1 + Math.sin(Date.now() * 0.003) * 0.05;
  ring.scale.set(pulse, pulse, pulse);

  // Los textos siempre miran a la cámara
  textos.forEach(t => t.lookAt(camera.position));

  // Movimiento suave de cámara al enfocar
  if (focusing && seleccionado) {
    camera.position.lerp(targetPos, 0.05);
    controls.target.lerp(seleccionado.position, 0.05);
    if (camera.position.distanceTo(targetPos) < 0.5) {
      focusing = false;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});