import './style.css';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import {CSS2DRenderer, CSS2DObject} from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as dat from 'dat.gui';
import {io} from 'socket.io-client';
import {throttle} from 'throttle-debounce';
import short from 'shortid';
import {MathUtils} from 'three';

MathUtils.seededRandom(Date.now);

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', init);

if (!localStorage.getItem('yourId')) {
  localStorage.setItem('yourId', short());
}
const yourId = localStorage.getItem('yourId');
const yourColor = randomColorName();

if (localStorage.getItem('yourName')) {
  document.getElementsByName('name')[0].value = localStorage.getItem('yourName');
}

const traceRateInMillis = 50;

const logTrace = throttle(1000, false, console.log);

let stats;
let canvas;
let renderer;
let labelRenderer;
let scene;
let camera;
let sunLight;
let otherPlayers = {};
let otherPlayersMeshes = {};
let playerMaterial;

let ground;
let sendYourPosition;

function init() {
  const inputNameValue = document.getElementsByName('name')[0].value;
  if (inputNameValue.length) {
    localStorage.setItem('yourName', inputNameValue);
  }
  const yourName = localStorage.getItem('yourName');
  console.log(`You are ${yourName} (${yourId}) with color ${yourColor}`);

  const socket = io();
  socket.on('allPlayers', (otherPlayersFromServer) => {
    delete otherPlayersFromServer[yourId];
    for (const [key, value] of Object.entries(otherPlayersFromServer)) {
      otherPlayers[key] = value;
    }
  });

  const overlay = document.getElementById('overlay');
  overlay.remove();

  // Debug
  const gui = new dat.GUI();
  const params = {sunLightIntensity: 4, camera: {x: 0, y: 200, z: 100, inclination: 60}, offset: 0};

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

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  document.body.appendChild(labelRenderer.domElement);

  // Camera
  camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 1, 1000);
  camera.position.set(0, 350, 260);
  scene.add(camera);

  // Lights
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

    labelRenderer.setSize(window.innerWidth, window.innerHeight);
  });

  // GUI
  gui.width = 300;
  const offsetFolder = gui.addFolder('Offset');
  offsetFolder.add(params, 'offset', -200, 200, 1);
  const lightingFolder = gui.addFolder('Lighting');
  lightingFolder.add(params, 'sunLightIntensity', 3, 8, 0.1);
  const cameraFolder = gui.addFolder('Camera');
  cameraFolder.add(params.camera, 'x', -500, 500, 1);
  cameraFolder.add(params.camera, 'y', -500, 500, 1);
  cameraFolder.add(params.camera, 'z', -500, 500, 1);
  cameraFolder.add(params.camera, 'inclination', 0, 90, 1);
  gui.open();

  (async function () {
    const playerGeometry = new THREE.SphereGeometry(12, 24, 24);
    playerMaterial = new THREE.MeshStandardMaterial({color: yourColor});
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial.clone());

    socket.on('player.new', ({id, name}) => {
      if (id !== yourId) {
        console.log(`New Player ${name} (${id})`);
        otherPlayersMeshes[id] = makePlayerMesh(playerMesh, scene, name);
      }
    });

    socket.on('player.delete', (id) => {
      console.log(`Delete Player ${id}`);
      otherPlayersMeshes[id].children
        .filter((e) => e instanceof CSS2DObject)
        .forEach((o) => {
          o.element.remove();
          console.log(scene.remove(o));
        }),
        scene.remove(otherPlayersMeshes[id]);
      delete otherPlayersMeshes[id];
    });

    socket.io.on('error', () => {
      Object.keys(otherPlayersMeshes).forEach((id) => scene.remove(otherPlayersMeshes[id]));
      Object.keys(otherPlayers).forEach((id) => delete otherPlayers[id]);
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

    const mesh = playerMesh.clone();
    mesh.position.x = randomPosition();
    mesh.position.z = randomPosition();
    mesh.position.y = 10;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    sendYourPosition = throttle(traceRateInMillis, false, () => {
      const {x, z} = mesh.position;
      const trace = {
        id: yourId,
        name: yourName,
        x: x.toFixed(1),
        z: z.toFixed(1),
        color: yourColor,
        name: yourName,
      };
      socket.emit('player.trace', trace);
    });

    renderer.setAnimationLoop(render);

    function render() {
      animateYourPlayer(mesh);

      animateOtherPlayers(otherPlayersMeshes);

      // Update params
      sunLight.intensity = params.sunLightIntensity;
      camera.rotation.x = MathUtils.degToRad(-params.camera.inclination);

      // traces
      sendYourPosition();

      camera.position.copy(mesh.position);
      camera.position.add(new THREE.Vector3(params.camera.x, params.camera.y, params.camera.z));

      // Update Stats
      stats.update();

      // Render
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    }
  })();
}

function makePlayerMesh(playerMesh, scene, name) {
  const group = new THREE.Group();

  const mesh = playerMesh.clone();
  mesh.material = playerMaterial.clone();
  mesh.position.y = 10;
  mesh.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  const nameDiv = document.createElement('div');
  nameDiv.className = 'label';
  nameDiv.textContent = name;
  nameDiv.style.marginTop = '-1em';
  const nameLabel = new CSS2DObject(nameDiv);
  nameLabel.position.set(0, 12, 0);
  nameLabel.layers.set(0);

  group.add(mesh);
  group.add(nameLabel);
  scene.add(group);

  return group;
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

function animateOtherPlayers(playerMeshes) {
  Object.keys(playerMeshes).forEach((id) => {
    if (otherPlayers[id]) {
      const group = playerMeshes[id];
      const ballMesh = group.children[0];
      ballMesh.material.color = new THREE.Color(otherPlayers[id].color);
      group.position.x = otherPlayers[id].x;
      group.position.z = otherPlayers[id].z;
    }
  });
}

addEventListener('keydown', (e) => {
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

function randomColorName() {
  const colors = Object.keys(THREE.Color.NAMES);
  return colors[MathUtils.randInt(0, colors.length - 1)];
}

function randomPosition() {
  return Math.random() * 500 - 250;
}
