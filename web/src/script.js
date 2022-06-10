import './style.css';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as dat from 'dat.gui';
import {io} from 'socket.io-client';
import {throttle} from 'throttle-debounce';
import short from 'shortid';
import {MathUtils} from 'three';
import {Text} from 'troika-three-text';

MathUtils.seededRandom(Date.now);

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', init);

if (!localStorage.getItem('yourId')) {
  localStorage.setItem('yourId', short());
}
const yourId = localStorage.getItem('yourId');
const yourColor = randomColorName();
console.log(`Your id: ${yourId} with color ${yourColor}`);

if (localStorage.getItem('yourName')) {
  document.getElementsByName('name')[0].value = localStorage.getItem('yourName');
}

const traceRateInMillis = 50;

let stats;
let canvas;
let renderer;
let scene;
let camera;
let sunLight;
let hemiLight;
let audio;
let clock;
let otherPlayers = {};
let otherPlayersMeshes = {};
let playerMaterial;

let ground;
let sendYourPosition;

const textOffset = new THREE.Vector3(0, 0, 14);

function init() {
  const inputNameValue = document.getElementsByName('name')[0].value;
  if (inputNameValue.length) {
    localStorage.setItem('yourName', inputNameValue);
  }
  const yourName = localStorage.getItem('yourName');
  const socket = io();
  socket.on('allPlayers', (otherPlayersFromServer) => {
    delete otherPlayersFromServer[yourId];
    // IMPROVE ES6 forEach
    for (const [key, value] of Object.entries(otherPlayersFromServer)) {
      otherPlayers[key] = value;
    }
  });
  const overlay = document.getElementById('overlay');
  overlay.remove();

  // Debug
  const gui = new dat.GUI();
  const params = {sunLightIntensity: 4, camera: {x: 0, y: 180, z: 90, inclination: 70}};

  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  stats = new Stats();

  // Canvas
  canvas = document.querySelector('canvas.webgl');
  document.body.appendChild(stats.dom);

  // Scene
  scene = new THREE.Scene();

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Camera
  camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 1000);
  camera.position.set(0, 350, 260);
  scene.add(camera);

  // Lights
  hemiLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.2);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xcccccc, 0.6);
  scene.add(ambientLight);

  sunLight = new THREE.DirectionalLight(new THREE.Color('#ffffff'), params.sunLightIntensity);
  sunLight.position.set(250, 150, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1;
  sunLight.shadow.camera.far = 600;
  sunLight.shadow.camera.left = -300;
  sunLight.shadow.camera.bottom = -300;
  sunLight.shadow.camera.top = 300;
  sunLight.shadow.camera.right = 300;
  scene.add(sunLight);

  const audioLoader = new THREE.AudioLoader();
  const listener = new THREE.AudioListener();
  camera.add(listener);

  window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // GUI
  gui.width = 300;
  const lightingFolder = gui.addFolder('Lighting');
  lightingFolder.add(params, 'sunLightIntensity', 3, 8, 0.1);
  const cameraFolder = gui.addFolder('Camera');
  cameraFolder.add(params.camera, 'x', -500, 500, 1);
  cameraFolder.add(params.camera, 'y', -500, 500, 1);
  cameraFolder.add(params.camera, 'z', -500, 500, 1);
  cameraFolder.add(params.camera, 'inclination', 0, 90, 1);
  gui.open();

  // Controls
  // controls = new OrbitControls(camera, canvas);
  // controls.dampingFactor = 0.05;
  // controls.enableDamping = true;

  (async function () {
    socket.on('player.new', (id) => {
      if (id !== yourId) {
        console.log(`New Player ${id}`);
        otherPlayersMeshes[id] = makePlayerMesh(playerMesh, scene);
      }
    });

    socket.on('player.delete', (id) => {
      console.log(`Delete Player ${id}`);
      scene.remove(otherPlayersMeshes[id]);
      delete otherPlayersMeshes[id];
    });

    let textures = {
      floorTextureDiffuse: await new THREE.TextureLoader().loadAsync(
        'assets/hardwood2_diffuse.jpeg',
      ),
      floorTextureBump: await new THREE.TextureLoader().loadAsync('assets/hardwood2_bump.jpeg'),
      floorTextureRoughness: await new THREE.TextureLoader().loadAsync(
        'assets/hardwood2_roughness.jpeg',
      ),
    };

    let sounds = {
      rolling: await audioLoader.loadAsync('assets/rolling.wav'),
    };
    audio = new THREE.PositionalAudio(listener);
    audio.setLoop(true);
    audio.setVolume(1);
    audio.setBuffer(sounds.rolling);

    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      color: 0xffffff,
      metalness: 0.2,
      bumpScale: 0.02,
      map: textures.floorTextureDiffuse,
      bumpMap: textures.floorTextureBump,
      roughnessMap: textures.floorTextureRoughness,
    });
    groundMaterial.map.wrapS = THREE.RepeatWrapping;
    groundMaterial.map.wrapT = THREE.RepeatWrapping;
    groundMaterial.map.anisotropy = 4;
    groundMaterial.map.repeat.set(2, 4);
    groundMaterial.bumpMap.wrapS = THREE.RepeatWrapping;
    groundMaterial.bumpMap.wrapT = THREE.RepeatWrapping;
    groundMaterial.bumpMap.anisotropy = 4;
    groundMaterial.bumpMap.repeat.set(2, 4);
    groundMaterial.roughnessMap.wrapS = THREE.RepeatWrapping;
    groundMaterial.roughnessMap.wrapT = THREE.RepeatWrapping;
    groundMaterial.roughnessMap.anisotropy = 4;
    groundMaterial.roughnessMap.repeat.set(2, 4);
    groundMaterial.needsUpdate = true;
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI * 0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const playerGeometry = new THREE.SphereGeometry(12, 24, 24);
    playerMaterial = new THREE.MeshStandardMaterial({color: yourColor});
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial.clone());

    const mesh = playerMesh.clone();
    mesh.position.x = randomPosition();
    mesh.position.z = randomPosition();
    mesh.position.y = 10;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const nameTextMesh = new Text();
    nameTextMesh.text = yourName;
    nameTextMesh.fontSize = 5;
    nameTextMesh.textAlign = 'center';
    nameTextMesh.position.y = 0.01;
    nameTextMesh.rotation.x = -Math.PI * 0.5;
    scene.add(nameTextMesh);

    sendYourPosition = throttle(traceRateInMillis, false, () => {
      const {x, z} = mesh.position;
      const trace = {
        id: yourId,
        name: yourName,
        x: x.toFixed(1),
        z: z.toFixed(1),
        color: yourColor,
      };
      socket.emit('player.trace', trace);
    });

    clock = new THREE.Clock();

    renderer.setAnimationLoop(render);

    function render() {
      const elapsedTime = clock.getElapsedTime();

      animateYourPlayer(mesh);
      Object.keys(otherPlayersMeshes).forEach((id) => {
        if (otherPlayers[id]) {
          otherPlayersMeshes[id].material.color = new THREE.Color(otherPlayers[id].color);
          otherPlayersMeshes[id].position.x = otherPlayers[id].x;
          otherPlayersMeshes[id].position.z = otherPlayers[id].z;
        }
      });

      // Update params
      sunLight.intensity = params.sunLightIntensity;

      // traces
      sendYourPosition();

      // Update Orbital Controls
      // controls.update();
      nameTextMesh.position.copy(mesh.position);
      nameTextMesh.position.add(textOffset);
      camera.position.copy(mesh.position);
      camera.position.add(new THREE.Vector3(params.camera.x, params.camera.y, params.camera.z));
      camera.rotation.x = MathUtils.degToRad(-params.camera.inclination);

      // Update Stats
      stats.update();

      // Render
      renderer.render(scene, camera);
    }
  })();
}

function randomColorName() {
  const colors = Object.keys(THREE.Color.NAMES);
  return colors[MathUtils.randInt(0, colors.length - 1)];
}

function randomPosition() {
  return Math.random() * 500 - 250;
}

function makePlayerMesh(playerMesh, scene) {
  const mesh = playerMesh.clone();
  mesh.material = playerMaterial.clone();
  mesh.position.y = 10;

  mesh.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  scene.add(mesh);

  return mesh;
}
let dx = 0;
let dz = 0;

function animateYourPlayer(mesh) {
  const {x, z} = mesh.position;

  if ((x + dx < 250) & (x + dx > -250)) {
    mesh.position.x = x + dx;
  }
  if ((z + dz < 250) & (z + dz > -250)) {
    mesh.position.z = z + dz;
  }
}

addEventListener('keydown', (e) => {
  audio.play();
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
      dz = -1;
      break;
    case 'ArrowDown':
    case 's':
      dz = 1;
      break;
    case 'ArrowRight':
    case 'd':
      dx = 1;
      break;
    case 'ArrowLeft':
    case 'a':
      dx = -1;
      break;
  }
});

addEventListener('keyup', (e) => {
  audio.stop();
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
      dz = 0;
      break;
    case 'ArrowDown':
    case 's':
      dz = 0;
      break;
    case 'ArrowRight':
    case 'd':
      dx = 0;
      break;
    case 'ArrowLeft':
    case 'a':
      dx = 0;
      break;
  }
});

const trace = throttle(1000, false, console.log);
