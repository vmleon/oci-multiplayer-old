import './style.css';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'dat.gui';
import {io} from 'socket.io-client';
import {throttle} from 'throttle-debounce';
import short from 'short-uuid';

if (!localStorage.getItem('yourPlaneId')) {
  localStorage.setItem('yourPlaneId', short.generate());
}
const yourPlaneId = localStorage.getItem('yourPlaneId');
console.log(`Own plane ${yourPlaneId}`);

const socket = io('ws://localhost:3000');

const planeTraceRateInMillis = 1000;

let stats;
let canvas;
let renderer;
let scene;
let camera;
let sunLight;
let moonLight;
let controls;
let clock;
let otherPlanesData = {};
let otherPlanes = {};

let earth;
let sendPlanePosition;

socket.on('planes', (planesFromServer) => {
  delete planesFromServer[yourPlaneId];
  otherPlanesData = planesFromServer;
});

init();

function init() {
  // Debug
  const gui = new dat.GUI();
  const params = {
    earthBumpScale: 0.7,
    sunLightIntensity: 3.5,
    moonLightIntensity: 0.6,
  };

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
  scene.background = new THREE.Color(0x000000);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  // renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Camera
  camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
  camera.position.set(200, 80, 80);
  scene.add(camera);

  // Lights
  sunLight = new THREE.DirectionalLight(new THREE.Color('#ffffff'), params.sunLightIntensity);
  sunLight.position.set(100, 20, 10);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 100;
  sunLight.shadow.camera.left = -90;
  sunLight.shadow.camera.bottom = -90;
  sunLight.shadow.camera.top = 90;
  sunLight.shadow.camera.right = 90;
  scene.add(sunLight);

  moonLight = new THREE.DirectionalLight(
    new THREE.Color('#a2d8fa').convertSRGBToLinear(),
    params.moonLightIntensity,
  );
  moonLight.position.set(-10, -5, -10);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 1024;
  moonLight.shadow.mapSize.height = 1024;
  moonLight.shadow.camera.near = 0.5;
  moonLight.shadow.camera.far = 100;
  moonLight.shadow.camera.left = -80;
  moonLight.shadow.camera.bottom = -80;
  moonLight.shadow.camera.top = 80;
  moonLight.shadow.camera.right = 80;
  scene.add(moonLight);

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
  const guiEarthFolder = gui.addFolder('Earth');
  guiEarthFolder.add(params, 'earthBumpScale', 0, 1, 0.01);
  const guiLightFolder = gui.addFolder('Lights');
  guiLightFolder.add(params, 'sunLightIntensity', 2, 6, 0.2);
  guiLightFolder.add(params, 'moonLightIntensity', 0.1, 3, 0.1);
  gui.open();

  // Controls
  controls = new OrbitControls(camera, canvas);
  // controls.target.set(0, 0, 0);
  controls.dampingFactor = 0.05;
  controls.enableDamping = true;

  (async function () {
    let pmrem = new THREE.PMREMGenerator(renderer);
    let envmapTexture = await new RGBELoader()
      .setDataType(THREE.FloatType)
      .loadAsync('assets/night_2k.hdr');
    let envMap = pmrem.fromEquirectangular(envmapTexture).texture;

    let textures = {
      // thanks to https://free3d.com/user/ali_alkendi
      earthBump: await new THREE.TextureLoader().loadAsync('assets/earthbump.jpeg'),
      earthMap: await new THREE.TextureLoader().loadAsync('assets/earthmap.jpeg'),
      earthSpec: await new THREE.TextureLoader().loadAsync('assets/earthspec.jpeg'),
      planeTrailMask: await new THREE.TextureLoader().loadAsync('assets/mask.png'),
    };

    const earthGeometry = new THREE.SphereGeometry(80, 64, 32);

    const earthMaterial = new THREE.MeshPhysicalMaterial({
      map: textures.earthMap,
      roughnessMap: textures.earthSpec,
      bumpMap: textures.earthBump,
      bumpScale: params.earthBumpScale,
      envMap: envMap,
      envMapIntensity: 0.4,
      // FIXME sheen doesn't work
      // sheen: 1,
      // sheenRoughness: 0.75,
      // sheenColor: new THREE.Color('#ff8a00').convertSRGBToLinear(),
      // clearcoat: 0.5,
    });

    socket.on('plane.new', (id) => {
      if (id !== yourPlaneId) {
        console.log(`New Plane ${id}`, otherPlanesData[id]);
        otherPlanes[id] = makePlane(
          planeMesh,
          otherPlanesData[id],
          textures.planeTrailMask,
          envMap,
          scene,
        );
      }
    });

    socket.on('plane.delete', (id) => {
      console.log(`Delete Plane ${id}`, otherPlanes[id]);
      scene.remove(otherPlanes[id].group);
      delete otherPlanes[id];
    });

    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.receiveShadow = true;
    earth.castShadow = true; // FIXME no shadow on planes from Earth
    scene.add(earth);

    const planeMesh = (await new GLTFLoader().loadAsync('assets/plane/scene.glb')).scene
      .children[0];
    const yourPlane = makePlane(planeMesh, null, textures.planeTrailMask, envMap, scene);

    sendPlanePosition = throttle(planeTraceRateInMillis, false, () => {
      const {x, y, z} = yourPlane.group.position;
      const trace = {
        id: yourPlaneId,
        x: x.toFixed(4),
        y: y.toFixed(4),
        z: z.toFixed(4),
        heading: yourPlane.rot.toFixed(4),
      };
      socket.emit('plane.trace', trace);
    });

    clock = new THREE.Clock();

    renderer.setAnimationLoop(render);

    function render() {
      const elapsedTime = clock.getElapsedTime();

      animatePlane(yourPlane, elapsedTime);
      Object.keys(otherPlanes).forEach((id) => animatePlane(otherPlanes[id], elapsedTime));

      // Update params
      earth.material.bumpScale = params.earthBumpScale;
      sunLight.intensity = params.sunLightIntensity;
      moonLight.intensity = params.moonLightIntensity;

      // traces
      sendPlanePosition();

      // Update Orbital Controls
      controls.update();

      // Update Stats
      stats.update();

      // Render
      renderer.render(scene, camera);
    }
  })();
}

function nr() {
  return Math.random() * 2 - 1;
}

function makePlane(planeMesh, planeData, trailTexture, envMap, scene) {
  console.log('makePlane', planeData);
  let plane = planeMesh.clone();
  plane.scale.set(0.015, 0.015, 0.015);
  plane.position.set(0, 0, 0);
  plane.rotation.set(0, 0, 0);
  plane.updateMatrixWorld();

  plane.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.material.envMap = envMap;
      object.sunEnvIntensity = 1;
      object.moonEnvIntensity = 0.3;
      object.castShadow = true;
      object.receiveShadow = true; // FIXME no shadow on planes from Earth
    }
  });

  let trail = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 25),
    new THREE.MeshPhysicalMaterial({
      envMap,
      envMapIntensity: 10,
      roughness: 0.4,
      metalness: 0,
      transmission: 0.9,

      transparent: true,
      opacity: 1,
      alphaMap: trailTexture,
    }),
  );
  // trail.sunEnvIntensity = 3;
  // trail.moonEnvIntensity = 0.7;
  trail.rotateX(Math.PI);
  trail.translateY(11);

  let group = new THREE.Group();
  group.add(plane);
  group.add(trail);

  scene.add(group);

  return {
    group,
    data: planeData,
    yOff: 85 + Math.random() * 1.0, // 85
    rot: Math.PI * 2, // just to set a random starting point
    rad: Math.random() * Math.PI * 0.45 + Math.PI * 0.05,
    randomAxis: new THREE.Vector3(nr(), nr(), nr()).normalize(),
    randomAxisRot: Math.random() * Math.PI * 2,
  };
}

function animatePlane(plane, elapsedTime) {
  plane.group.position.set(0, 0, 0);
  plane.group.rotation.set(0, 0, 0);
  plane.group.updateMatrixWorld();

  plane.rot = 0.1 * elapsedTime;
  plane.group.rotateOnAxis(plane.randomAxis, plane.randomAxisRot);
  plane.group.rotateOnAxis(new THREE.Vector3(0, 1, 0), plane.rot);
  plane.group.rotateOnAxis(new THREE.Vector3(0, 0, 1), plane.rad);
  plane.group.translateY(plane.yOff);
  plane.group.rotateOnAxis(new THREE.Vector3(1, 0, 0), +Math.PI * 0.5);
}
