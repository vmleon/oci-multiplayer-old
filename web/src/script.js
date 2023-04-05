import short from "shortid";
import * as THREE from "three";
import { MathUtils } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { throttle } from "throttle-debounce";
import "./style.css";
import * as lobby from "./lobby";

MathUtils.seededRandom(Date.now);

const traceRateInMillis = 1;

const logTrace = throttle(1000, false, console.log);

// FIXME merge other players info and meshes?
let otherPlayers = {};
let otherPlayersMeshes = {};

let items = {};
let itemMeshes = {};

let sendYourPosition;

if (!localStorage.getItem("yourId")) {
  localStorage.setItem("yourId", short());
}
const yourId = localStorage.getItem("yourId");

let renderer;
let canvas;
let player;
let playerModel;
let playerName;
let timerId;
let gameOverFlag = false;

// const startButton = document.getElementById("startButton");
// startButton.addEventListener("click", init);

const createGameButton = document.getElementById("create-game-button");
createGameButton.addEventListener("click", init);

async function init() {
  // Create a new loader
  const loader = new GLTFLoader();
  const boatGltf = await loader.loadAsync("assets/boat.gltf");
  const turtleGltf = await loader.loadAsync("assets/turtle.gltf");

  const overlay = document.getElementById("overlay");
  overlay.remove();

  playerName = localStorage.getItem("yourName") || "Player";

  // Set up the timer
  var timer = 180; // 3 minutes in seconds

  var scene = new THREE.Scene();

  // Load the GLTF model
  const boat = boatGltf.scene.children[0];
  const playerMaterial = new THREE.MeshStandardMaterial({
    color: 0xa52a2a,
    roughness: 0.9,
    metalness: 0.1,
  });
  // Set the boat's position and scale
  boat.position.set(0, 0, 0);
  boat.scale.set(1, 1, 1);
  boat.rotation.set(0, 0, 0);

  // Enable shadows for the boat
  boat.traverse(function (child) {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = playerMaterial;
      child.material.side = THREE.DoubleSide;
    }
  });
  // Add the boat to the scene
  scene.add(boat);
  playerModel = boat;
  player = boat;

  // Setup the scene
  var camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Add fog to the scene
  scene.fog = new THREE.FogExp2(0xffffff, 0.01);

  // Add event listener to resize renderer when the window is resized
  window.addEventListener("resize", function () {
    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });

  const sandGeometry = new THREE.PlaneGeometry(90, 24);
  const sandMaterial = new THREE.MeshPhongMaterial({ color: 0xf4a460 });
  const sand = new THREE.Mesh(sandGeometry, sandMaterial);
  sand.position.set(0, 0, -0.2);
  scene.add(sand);

  const grassGeometry = new THREE.PlaneGeometry(113, 55);
  const grassTexture = new THREE.CanvasTexture(createGrassTexture());
  const grassMaterial = new THREE.MeshPhongMaterial({ map: grassTexture });
  const grass = new THREE.Mesh(grassGeometry, grassMaterial);
  grass.position.set(0, 0, -0.3);
  scene.add(grass);

  function createGrassTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 1, 16, 32);
    gradient.addColorStop(0, "darkgreen");
    gradient.addColorStop(0.5, "green");
    gradient.addColorStop(1, "darkgreen");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    return canvas;
  }

  const waterGeometry = new THREE.PlaneGeometry(89, 23);

  // Define the shader uniforms
  const uniforms = {
    time: { value: 0 }, // Time uniform for animation
    waterColor: { value: new THREE.Color(0x0099ff) }, // Water color
    lightColor: { value: new THREE.Color(0xfafad2) }, // Light color
    cameraPosition: { value: new THREE.Vector3() }, // Camera position
  };

  // Define the vertex shader
  const vertexShader = `
  uniform float time;
  varying vec2 vUv;

  float wave(vec2 uv, float frequency, float amplitude, float speed) {
    float waveValue = sin(uv.y * frequency + time * speed) * amplitude;
    return waveValue;
  }

  void main() {
    vUv = uv;

    vec3 newPosition = position;

    // Add waves to the water surface
    newPosition.z += wave(vUv, 2.0, 0.2, 1.0);
    newPosition.z += wave(vUv, 4.0, 0.1, 1.5);
    newPosition.z += wave(vUv, 8.0, 0.05, 2.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

  // Define the fragment shader
  const fragmentShader = `
  uniform float time;
  uniform vec3 waterColor;
  uniform vec3 lightColor;
  varying vec2 vUv;

  // Simple noise function
  float snoise(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;

    // Calculate the distance from the center of the plane
    float dist = length(uv - vec2(0.5));

    // Scale the UV coordinates to create ripples
    uv *= 10.0;

    // Create a combined noise pattern based on the UV coordinates and the current time
    float noise1 = snoise(uv * 0.5 + time * 0.1);
    float noise2 = snoise(uv * 2.0 + time * 0.2);
    float noise3 = snoise(uv * 4.0 + time * 0.4);

    // Calculate the ripple intensity based on the distance from the center
    float ripple = smoothstep(0.3, 0.52, dist) * 0.6;

    // Add the ripple intensity to the noise to create the final ripple effect
    float alpha = (noise1 * noise2 * noise3) * ripple * 0.1;

    // Calculate the gradient color based on the distance from the center
    vec3 color = mix(waterColor, lightColor, 1.0 - dist);

    // Combine the color and alpha values to create the final fragment color
    gl_FragColor = vec4(color, alpha);
  }
`;

  const waterMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
  });

  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.position.set(0, 0, 0);
  scene.add(water);

  // Add a directional light to simulate the sun
  const sun = new THREE.DirectionalLight(0xfafad2, 10);
  sun.position.set(-10, 10, 10);
  sun.castShadow = true;
  scene.add(sun);
  const SUN_ANIMATION_DURATION = 180; // in seconds
  const SUN_X_DISTANCE = 20; // in world units
  let startTime = null;

  // Comms
  const hostname = window.location.hostname;
  const isDevelopment = hostname === "localhost";
  const wsURL = isDevelopment ? "ws://localhost:3000" : "ws://";

  const worker = new Worker(new URL("./commsWorker.js", import.meta.url));
  worker.postMessage({
    type: "init",
    body: { wsURL, yourId, yourName: playerName },
  });

  worker.onmessage = ({ data }) => {
    const { type, body, error } = data;
    if (error) {
      console.error(error);
      Object.keys(otherPlayersMeshes).forEach((id) =>
        scene.remove(otherPlayersMeshes[id])
      );
      Object.keys(otherPlayers).forEach((id) => delete otherPlayers[id]);
    }
    switch (type) {
      case "connect":
        console.log("Web Socket connection");
        break;
      case "disconnect":
        console.log("Web Socket disconnection");
        break;
      case "log":
        break;
      case "items.all":
        Object.keys(body).forEach((key) => {
          if (!items[key]) {
            createItemMesh(
              key,
              body[key].type,
              body[key].position,
              body[key].size
            );
          }
          items[key] = body[key];
        });
        // FIXME create meshes
        break;
      case "item.new":
        const { id: itemIdToCreate, data: itemData } = body;
        createItemMesh(
          itemIdToCreate,
          itemData.type,
          itemData.position,
          itemData.size
        );
        items[itemIdToCreate] = itemData;
        break;
      case "item.destroy":
        const itemIdToDestroy = body;
        const item = items[itemIdToDestroy];
        const mesh = itemMeshes[itemIdToDestroy];
        if (item && mesh) {
          scene.remove(mesh);
          delete items[itemIdToDestroy];
          delete itemMeshes[itemIdToDestroy];
        }
        break;
      case "player.trace.all":
        for (const [key, traceData] of Object.entries(body)) {
          otherPlayers[key] = traceData;
          if (!otherPlayersMeshes[key]) {
            otherPlayersMeshes[key] = makePlayerMesh(playerModel, scene);
          }
        }
        break;
      case "player.info.joined":
        const { id: joinedId, name: joinedName } = body;
        if (joinedId !== yourId) {
          otherPlayersMeshes[joinedId] = makePlayerMesh(playerModel, scene);
        }
        break;
      case "player.info.left":
        const playerId = body;
        if (playerId !== yourId) {
          scene.remove(otherPlayersMeshes[playerId]);
          delete otherPlayersMeshes[playerId];
          delete otherPlayers[playerId];
        }
        break;
      case "player.score":
        const scoreFromBackend = body;
        score = scoreFromBackend;
        scoreElement.innerHTML = "Score: " + score;
        break;
      default:
        break;
    }
  };

  // ### Send Player
  sendYourPosition = throttle(traceRateInMillis, false, () => {
    const { x, y, z } = player.position;
    const { x: rotX, y: rotY, z: rotZ } = player.rotation;
    const trace = {
      id: yourId,
      name: playerName,
      x: x.toFixed(5),
      y: y.toFixed(5),
      rotZ: rotZ.toFixed(5), // add rotation Z value
    };
    worker.postMessage({ type: "player.trace.change", body: trace });
  });

  function animateSun(time) {
    if (!startTime) {
      startTime = time;
    }
    const elapsedTime = (time - startTime) / 1000; // convert to seconds
    const progress = elapsedTime / SUN_ANIMATION_DURATION;
    const x = -SUN_X_DISTANCE + progress * SUN_X_DISTANCE * 2;
    sun.position.setX(x);
    if (progress <= 1) {
      requestAnimationFrame(animateSun);
    }
  }
  requestAnimationFrame(animateSun);

  // Add ambient light to simulate scattered light
  const ambient = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambient);

  // Create the navmesh object
  const navmeshGeometry = new THREE.PlaneGeometry(89, 23);
  const navmeshMaterial = new THREE.MeshBasicMaterial({
    color: 0x0000ff,
    wireframe: false,
  });
  const navmesh = new THREE.Mesh(navmeshGeometry, navmeshMaterial);

  // Update the navmesh geometry and position when the water object changes
  water.addEventListener("change", () => {
    // Update the geometry of the navmesh to match the water object
    navmesh.geometry = water.geometry.clone();

    // Update the position of the navmesh to match the water object
    navmesh.position.copy(water.position);
  });

  // Add the navmesh to the scene
  scene.add(navmesh);

  // Add directional light to the scene
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
  directionalLight.position.set(0, 0, 100);
  scene.add(directionalLight);

  // Load the GLTF model
  const turtle = turtleGltf.scene.children[0];

  // Create a variable to store the remaining time
  let remainingTime = timer;
  var timerDiv = document.createElement("div");
  timerDiv.style.position = "absolute";
  timerDiv.style.top = "45px";
  timerDiv.style.left = "10px";
  timerDiv.style.color = "white";
  timerDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  timerDiv.innerHTML = "Time: " + timer;
  document.body.appendChild(timerDiv);

  // Create a function to update the timer
  function updateTimer() {
    remainingTime--;

    if (remainingTime <= 0) {
      console.log("Time's up!");

      gameOver();
      return;
    }

    timerDiv.innerHTML = "Time: " + remainingTime;

    setTimeout(updateTimer, 1000);
  }

  // Start the timer
  updateTimer();

  function restart() {
    // Hide the restart button
    restartBtn.style.display = "none";

    // Remove all item meshes from the scene
    for (const [key, mesh] of Object.entries(itemMeshes)) {
      scene.remove(mesh);
    }

    // Reset the player's position and score
    player.position.set(0, 0, 0);
    score = 0;
    playerName = [];

    // Display the player's score on the screen
    scoreElement.innerHTML = "Score: " + score;

    // Reset the remaining time and display it on the screen
    remainingTime = timer;
    timerDiv.innerHTML = "Time: " + remainingTime;

    // Restart the timer
    updateTimer();
  }

  function makePlayerMesh(playerMesh, scene) {
    const group = new THREE.Group();

    // Clone the player's mesh
    const mesh = playerMesh.clone();
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);

    // Set the material of the new mesh to white
    const playerMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
    });
    mesh.material = playerMaterial;

    // Traverse the new mesh and set the shadow properties
    mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    // Create a label for the player's name
    // const nameDiv = document.createElement("div");
    // nameDiv.className = "label";
    // nameDiv.textContent = name;
    // nameDiv.style.marginTop = "-1em";
    // const nameLabel = new CSS2DObject(nameDiv);
    // nameLabel.position.set(0, 0, 1);
    // nameLabel.layers.set(1);

    // Add the mesh and label to the group
    group.add(mesh);
    // group.add(nameLabel);

    // Add the group to the scene
    scene.add(group);

    return group;
  }

  function gameOver() {
    console.log("Game over!");

    gameOverFlag = true; // Set the game over flag to true

    // Disable keyboard controls
    keyboard = {};

    // Remove all item meshes from the scene
    for (const [key, mesh] of Object.entries(itemMeshes)) {
      scene.remove(mesh);
    }

    // Display the player's score and name as a CSS overlay
    const scoreOverlay = document.createElement("div");
    scoreOverlay.id = "score-overlay";
    scoreOverlay.innerHTML = "Game Over";
    scoreOverlay.innerHTML += "<br>Name: " + playerName;
    scoreOverlay.innerHTML += "<br>Score: " + score;
    document.body.appendChild(scoreOverlay);

    // Create a restart button
    const restartBtn = document.createElement("button");
    restartBtn.innerHTML = "Restart";
    restartBtn.style.position = "absolute";
    restartBtn.style.top = "100px";
    restartBtn.style.left = "10px";
    restartBtn.addEventListener("click", function () {
      // Reload the page to restart the game
      window.location.reload();
    });
    document.body.appendChild(restartBtn);

    // Save the player's name and score to a local JSON file
    const playerData = {
      id: yourId,
      name: playerName,
      score: score,
      date: new Date(),
    };
    const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
    leaderboard.push(playerData);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

    function viewLeaderboard() {
      const leaderboardData = localStorage.getItem("leaderboard");
      if (leaderboardData) {
        console.log(JSON.parse(leaderboardData));
      } else {
        console.log("No leaderboard data found");
      }
    }
    viewLeaderboard();

    clearTimeout(timerId);
  }

  // Create a function to start the timer
  function startTimer() {
    timerId = setTimeout(function () {
      // Display a message or trigger an event to indicate that time is up
      console.log("Time's up!");

      // Trigger game over event
      gameOver();
    }, timer * 1000);
  }

  // Start the timer
  startTimer();

  // Create a variable to keep track of the player's score
  let score = 0;

  // Display the player's score on the screen
  var scoreElement = document.createElement("div");
  scoreElement.style.position = "absolute";
  scoreElement.style.top = "10px";
  scoreElement.style.left = "10px";
  scoreElement.style.color = "white";
  scoreElement.style.fontSize = "24px";
  scoreElement.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  scoreElement.innerHTML = "Score: " + score;
  document.body.appendChild(scoreElement);

  const materials = [
    new THREE.MeshPhongMaterial({ color: 0x00ff00 }), // Green material for wildlife
    new THREE.MeshPhongMaterial({ color: 0xff0000 }), // Red material for trash
  ];

  const geometries = [
    new THREE.SphereGeometry(),
    new THREE.BoxGeometry(),
    new THREE.BufferGeometry(),
  ];

  function isMarineLife(type) {
    switch (type) {
      case "turtle":
        return true;
      case "trash":
        return false;
      default:
        return false;
    }
  }

  // Create a random trash or wildlife object
  function createItemMesh(itemId, itemType, position, size) {
    // FIXME use marine life models when isMarineLife() returns true
    const geometry = isMarineLife(itemType) ? geometries[0] : geometries[1]; // Use sphere geometry for wildlife, cube geometry for trash
    const material = isMarineLife(itemType) ? materials[0] : materials[1];
    const itemMesh = new THREE.Mesh(geometry, material);
    // Math.random() * 88 - 44, // set random position within the plane width
    // Math.random() * 22 - 11, // set random position within the plane height
    itemMesh.position.set(position.x, position.y, position.z);
    itemMesh.scale.set(size, size, size);
    itemMesh.itemId = itemId;
    itemMesh.itemType = itemType;
    itemMesh.outOfBounds = false;

    // check if object is within the bounds of the plane
    const waterBoundaries = waterGeometry.parameters;
    const objectBoundaries = new THREE.Box3().setFromObject(itemMesh);
    if (
      objectBoundaries.min.x > waterBoundaries.width / 2 ||
      objectBoundaries.max.x < -waterBoundaries.width / 2 ||
      objectBoundaries.min.y > waterBoundaries.height / 2 ||
      objectBoundaries.max.y < -waterBoundaries.height / 2
    ) {
      // if the object is outside the plane, mark it as out of bounds and return
      itemMesh.outOfBounds = true;
      return;
    }

    scene.add(itemMesh);
    itemMeshes[itemId] = itemMesh;
    return itemMesh;
  }

  const floatAmplitude = 0.1;

  function animateItems() {
    const time = performance.now() * 0.001; // Get current time in seconds
    for (const [key, mesh] of Object.entries(itemMeshes)) {
      if (!mesh.outOfBounds) {
        const sinValue = Math.sin(
          time * 2 + mesh.position.x * 0.5 + mesh.position.y * 0.3
        );
        mesh.position.z = sinValue * floatAmplitude;
      }
    }
  }

  // Add ambient light to the scene
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  // Listen for keyboard events
  var keyboard = {};
  document.addEventListener("keydown", function (event) {
    keyboard[event.code] = true;
  });
  document.addEventListener("keyup", function (event) {
    keyboard[event.code] = false;
  });

  let playerSpeed = 0;

  // Cache the navmesh bounding box for optimization
  const navmeshBoundingBox = new THREE.Box3().setFromObject(navmesh);

  function checkCollisions() {
    // Create a bounding box for the player
    const playerBox = new THREE.Box3().setFromObject(player);

    // Create a bounding box for the water
    const waterBox = new THREE.Box3().setFromObject(water);

    // Check if the player's bounding box intersects with the water's bounding box
    if (playerBox.intersectsBox(waterBox)) {
      // Spawn foam particles around the boat
      const foamParticles = spawnFoamParticles(player.position);
      setTimeout(() => {
        scene.remove(foamParticles);
      }, foamParticles.lifetime * 1000);
    }

    // Loop through each object in the scene
    for (const [key, mesh] of Object.entries(itemMeshes)) {
      // Check if the object is out of bounds
      if (mesh.outOfBounds) {
        continue;
      }

      // Create a bounding box for the mesh
      const itemMeshBox = new THREE.Box3().setFromObject(mesh);

      // Check if the player's bounding box intersects with the mesh's bounding box
      // FIXME use cannon.js or any physics engine
      const collision = playerBox.intersectsBox(itemMeshBox);
      if (collision) {
        // Remove the object from the scene and the itemMeshes
        const collisionData = {
          itemId: key,
          playerId: yourId,
          playerName: playerName,
        };
        worker.postMessage({
          type: "items.collision",
          body: collisionData,
        });

        scene.remove(mesh);
        // FIXME score has to be backend driven
        isMarineLife(mesh.itemType) ? score++ : score--;
        // Update the score element on the page
        scoreElement.innerHTML = "Score: " + score;

        delete itemMeshes[key];
      }
    }
  }

  function createOvalTexture() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Draw an oval
    ctx.beginPath();
    ctx.ellipse(size / 2, size / 2, size / 4, size / 2, 0, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  function spawnFoamParticles(position) {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    // Add an offset to the Y-axis of the spawn position
    const offsetY = -0.5;

    for (let i = 0; i < particleCount; i++) {
      vertices.push(position.x + Math.random() - 0.5);
      vertices.push(position.y + offsetY + Math.random() * 0.5);
      vertices.push(position.z + Math.random() - 0.5);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    const material = new THREE.PointsMaterial({
      size: 0.1,
      color: 0xffffff,
      transparent: true,
      opacity: 0.1,
      map: createOvalTexture(), // Use the oval texture
    });

    const particles = new THREE.Points(geometry, material);
    particles.lifetime = 0.2; // in seconds
    scene.add(particles);
    return particles;
  }

  function updatePlayerPosition() {
    if (!player || !water || gameOverFlag) {
      return;
    }

    const ACCELERATION = 0.005;
    const BRAKE = 0.1;
    const MAX_SPEED = 0.05;
    const TURN_SPEED = Math.PI / 180;

    // Update the player's position based on keyboard input
    let movement = new THREE.Vector3(0, 0, 0);
    if (keyboard["ArrowUp"]) {
      playerSpeed += ACCELERATION;
    } else if (keyboard["ArrowDown"]) {
      playerSpeed -= BRAKE;
    } else {
      playerSpeed *= 0.98; // Decelerate if no acceleration or braking input
    }
    playerSpeed = Math.max(Math.min(playerSpeed, MAX_SPEED), -MAX_SPEED); // Clamp the speed within the range of -MAX_SPEED to MAX_SPEED

    if (keyboard["ArrowLeft"]) {
      player.rotation.z += TURN_SPEED;
    }
    if (keyboard["ArrowRight"]) {
      player.rotation.z -= TURN_SPEED;
    }

    // Convert the player's rotation to a unit vector
    const direction = new THREE.Vector3(0, 1, 0).applyQuaternion(
      player.quaternion
    );

    // Calculate the player's movement vector based on the current speed and direction
    movement.copy(direction).multiplyScalar(playerSpeed);

    // Save the player's current position for backup
    const lastPosition = player.position.clone();

    // Update the player's position
    player.position.add(movement);

    // Check if the player's position intersects with the navmesh
    const playerBoundingBox = new THREE.Box3().setFromObject(player);
    if (!playerBoundingBox.intersectsBox(navmeshBoundingBox)) {
      // Move the player back to the last valid position
      player.position.copy(lastPosition);
    } else {
      // If the player is moving, spawn foam particles around the boat
      if (playerSpeed > 0.01 || playerSpeed < -0.01) {
        const foamParticles = spawnFoamParticles(player.position);
        setTimeout(() => {
          scene.remove(foamParticles);
        }, foamParticles.lifetime * 1000);
      }
    }

    // Update the camera position to follow the player
    camera.position.x = player.position.x;
    camera.position.y = player.position.y;
    camera.position.z = player.position.z + 5;

    // FIXME Don't think we need this check collisions here and in the animate function
    // checkCollisions();
  }

  //player meshes id
  function animateOtherPlayers(playerMeshes) {
    if (!playerMeshes) return;
    Object.keys(playerMeshes).forEach((id) => {
      if (otherPlayers[id]) {
        playerMeshes[id].position.x = otherPlayers[id].x;
        playerMeshes[id].position.y = otherPlayers[id].y;
        playerMeshes[id].rotation.z = otherPlayers[id].rotZ; // add rotation Z value
      }
    });
  }

  // Render the scene
  function animate() {
    requestAnimationFrame(animate);
    updatePlayerPosition();
    renderer.render(scene, camera);
    checkCollisions();
    uniforms.time.value += 0.1;
    renderer.render(scene, camera);
    animateItems();
    // traces
    sendYourPosition();
    // logTrace(
    //   `Player on (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(
    //     1
    //   )}) heading to ${player.rotation.z.toFixed(1)}`
    // );
    animateOtherPlayers(otherPlayersMeshes);
    waterMaterial.uniforms.cameraPosition.value.copy(camera.position);
  }
  animate();

  var light = new THREE.PointLight(0xffffff, 1, 1);
  light.position.set(0, 1, 0);
  player.add(light);
}
