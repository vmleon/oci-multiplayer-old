import './style.css';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'dat.gui';
import {io} from 'socket.io-client';
import {throttle} from 'throttle-debounce';

const socket = io('ws://localhost:3000');

socket.on('hello', (arg) => {
  console.log(arg);
});

socket.emit('howdy', 'stranger');

let stats;
let canvas;
let renderer;
let scene;
let camera;
let sunLight;
let moonLight;
let controls;
let clock;

let earth;
let sendSphereRotation;

// Debug
const gui = new dat.GUI();
const params = {
  earthBumpScale: 0.6,
  sunLightIntensity: 3.5,
  moonLightIntensity: 0.6,
  cameraZoom: 200,
};

init();

function init() {
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
  camera.position.set(0, 0, params.cameraZoom);
  scene.add(camera);

  // Lights
  sunLight = new THREE.DirectionalLight(new THREE.Color('#ffffff'), params.sunLightIntensity);
  sunLight.position.set(100, 20, 10);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 512;
  sunLight.shadow.mapSize.height = 512;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 100;
  sunLight.shadow.camera.left = -10;
  sunLight.shadow.camera.bottom = -10;
  sunLight.shadow.camera.top = 10;
  sunLight.shadow.camera.right = 10;
  scene.add(sunLight);

  moonLight = new THREE.DirectionalLight(
    new THREE.Color('#a2d8fa').convertSRGBToLinear(),
    params.moonLightIntensity,
  );
  moonLight.position.set(-10, -5, -10);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.width = 512;
  moonLight.shadow.mapSize.height = 512;
  moonLight.shadow.camera.near = 0.5;
  moonLight.shadow.camera.far = 100;
  moonLight.shadow.camera.left = -10;
  moonLight.shadow.camera.bottom = -10;
  moonLight.shadow.camera.top = 10;
  moonLight.shadow.camera.right = 10;
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
  const guiCameraFolder = gui.addFolder('Camera');
  guiCameraFolder.add(params, 'cameraZoom', 100, 300, 10);
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

    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.receiveShadow = true;
    scene.add(earth);

    let plane = (await new GLTFLoader().loadAsync('assets/plane/scene.glb')).scene.children[0];
    let planesData = [
      makePlane(plane, textures.planeTrailMask, envMap, scene),
      makePlane(plane, textures.planeTrailMask, envMap, scene),
      makePlane(plane, textures.planeTrailMask, envMap, scene),
      makePlane(plane, textures.planeTrailMask, envMap, scene),
      makePlane(plane, textures.planeTrailMask, envMap, scene),
      makePlane(plane, textures.planeTrailMask, envMap, scene),
    ];

    sendSphereRotation = throttle(200, false, () => {
      const angule = ((earth.rotation.y * 180) / Math.PI) % 360;
      socket.emit('earth.rotation.y', Math.round(angule));
    });

    clock = new THREE.Clock();

    renderer.setAnimationLoop(render);

    function render() {
      const elapsedTime = clock.getElapsedTime();

      // Update earth
      earth.rotation.y = 0.1 * elapsedTime;

      // Update params
      earth.material.bumpScale = params.earthBumpScale;
      sunLight.intensity = params.sunLightIntensity;
      moonLight.intensity = params.moonLightIntensity;
      camera.position.z = params.cameraZoom;

      planesData.forEach((planeData) => {
        let plane = planeData.group;

        plane.position.set(0, 0, 0);
        plane.rotation.set(0, 0, 0);
        plane.updateMatrixWorld();
        /**
         * idea: first rotate like that:
         *
         *          y-axis
         *  airplane  ^
         *      \     |     /
         *       \    |    /
         *        \   |   /
         *         \  |  /
         *     angle ^
         *
         * then at the end apply a rotation on a random axis
         */
        planeData.rot = elapsedTime;
        plane.rotateOnAxis(planeData.randomAxis, planeData.randomAxisRot); // random axis
        plane.rotateOnAxis(new THREE.Vector3(0, 1, 0), planeData.rot); // y-axis rotation
        plane.rotateOnAxis(new THREE.Vector3(0, 0, 1), planeData.rad); // this decides the radius
        plane.translateY(planeData.yOff);
        plane.rotateOnAxis(new THREE.Vector3(1, 0, 0), +Math.PI * 0.5);
      });

      // traces
      sendSphereRotation();

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

function makePlane(planeMesh, trailTexture, envMap, scene) {
  let plane = planeMesh.clone();
  plane.scale.set(0.01, 0.01, 0.01);
  plane.position.set(0, 0, 0);
  plane.rotation.set(0, 0, 0);
  plane.updateMatrixWorld();

  plane.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.material.envMap = envMap;
      object.sunEnvIntensity = 1;
      object.moonEnvIntensity = 0.3;
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  let trail = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 2),
    new THREE.MeshPhysicalMaterial({
      envMap,
      envMapIntensity: 3,

      roughness: 0.4,
      metalness: 0,
      transmission: 1,

      transparent: true,
      opacity: 1,
      alphaMap: trailTexture,
    }),
  );
  trail.sunEnvIntensity = 3;
  trail.moonEnvIntensity = 0.7;
  trail.rotateX(Math.PI);
  trail.translateY(1.1);

  let group = new THREE.Group();
  group.add(plane);
  group.add(trail);

  scene.add(group);

  return {
    group,
    yOff: 90 + Math.random() * 1.0,
    rot: Math.PI * 2, // just to set a random starting point
    rad: Math.random() * Math.PI * 0.45 + Math.PI * 0.05,
    randomAxis: new THREE.Vector3(nr(), nr(), nr()).normalize(),
    randomAxisRot: Math.random() * Math.PI * 2,
  };
}
