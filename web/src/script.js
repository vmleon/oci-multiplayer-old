import "./style.css";
import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { throttle } from "throttle-debounce";
import short from "shortid";
import { MathUtils } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

MathUtils.seededRandom(Date.now);

const traceRateInMillis = 50;

// const logTrace = throttle(1000, false, console.log);

let otherPlayers = {};
let otherPlayersMeshes = {};
let sendYourPosition;

if (!localStorage.getItem("yourId")) {
  localStorage.setItem("yourId", short());
}
const yourId = localStorage.getItem("yourId");

let renderer;
let canvas;
let player;
let playerName;
let timerId;
// Declare objectIntervalId in the global scope
let objectIntervalId;
let gameOverFlag = false;

var console = window.console;

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", init);

function init() {
  const inputNameValue = document.getElementsByName("name")[0].value;
  if (inputNameValue.length) {
    localStorage.setItem("yourName", inputNameValue);
  }
  const overlay = document.getElementById("overlay");
  overlay.remove();
  playerName = localStorage.getItem("yourName") || "Player";
  // Set up the timer
  var timer = 180; // 3 minutes in seconds

  // Create an array to store the objects in the scene
  const objects = [];

  // Comms
  const hostname = window.location.hostname;
  const isDevelopment = hostname === "localhost";
  const wsURL = isDevelopment ? "ws://localhost:3000" : "ws://";

  const worker = new Worker(new URL("./commsWorker.js", import.meta.url));
  worker.postMessage({ type: "start", body: wsURL });

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
        console.log(body);
        break;
      case "allPlayers":
        // FIXME this delete can and should happen on the web worker
        delete body[yourId];
        for (const [key, value] of Object.entries(body)) {
          otherPlayers[key] = value;
        }
        console.log(otherPlayers);
        break;
      case "player.new":
        const { id, name } = body;
        if (id !== yourId) {
          console.log(`New Player ${name} (${id})`);
          otherPlayersMeshes[id] = makePlayerMesh(player, scene, name);
        }
        break;
      case "player.delete":
        console.log(`Delete Player ${body}`);
        if (body !== yourId) {
          otherPlayersMeshes[body].children
            .filter((e) => e instanceof CSS2DObject)
            .forEach((o) => {
              o.element.remove();
              scene.remove(o);
            }),
            scene.remove(otherPlayersMeshes[body]);
          delete otherPlayersMeshes[body];
        }
        break;
      default:
        break;
    }
  };

  // Setup the scene
  var scene = new THREE.Scene();
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

  // Add event listener to resize renderer when the window is resized
  window.addEventListener("resize", function () {
    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });

  // const planeGeometry = new THREE.PlaneGeometry(89, 23);
  // const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x00008b });
  // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  // plane.position.set(0, 0, -0.3);
  // scene.add(plane);

  const sandGeometry = new THREE.PlaneGeometry(90, 24);
  const sandMaterial = new THREE.MeshPhongMaterial({ color: 0xf4a460 });
  const sand = new THREE.Mesh(sandGeometry, sandMaterial);
  sand.position.set(0, 0, -0.2);
  scene.add(sand);

  const grassGeometry = new THREE.PlaneGeometry(113, 55);
  const grassMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
  const grass = new THREE.Mesh(grassGeometry, grassMaterial);
  grass.position.set(0, 0, -0.3);
  scene.add(grass);

  const waterGeometry = new THREE.PlaneGeometry(89, 23);

  // Define the shader uniforms
  const uniforms = {
    time: { value: 0 }, // Time uniform for animation
  };

  // Define the vertex shader
  const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

  // Define the fragment shader
  const fragmentShader = `
  uniform float time;
  varying vec2 vUv;
  float PI = 3.141592653589793238;
  void main() {
    vec2 uv = vUv;
    // Scale the UV coordinates to create ripples
    uv *= 10.0;
    // Create a noise pattern based on the UV coordinates and the current time
    float noise = abs(sin(uv.x + uv.y + time));
    // Add the noise to the alpha channel to create a ripple effect
    gl_FragColor = vec4(0.0, 0.0, 1.0, noise * 0.1);
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
  const sun = new THREE.DirectionalLight(0xfafad2, 8);
  sun.position.set(-10, 10, 10);
  sun.castShadow = true;
  scene.add(sun);
  const SUN_ANIMATION_DURATION = 180; // in seconds
  const SUN_X_DISTANCE = 20; // in world units
  let startTime = null;

  sendYourPosition = throttle(traceRateInMillis, false, () => {
    const { x, y, z } = player.position;
    const { x: rotX, y: rotY, z: rotZ } = player.rotation;
    const trace = {
      id: yourId,
      name: playerName,
      x: x.toFixed(1),
      y: y.toFixed(1),
      z: z.toFixed(1),
      rotation: { x: rotX.toFixed(2), y: rotY.toFixed(2), z: rotZ.toFixed(2) },
      score,
      time: remainingTime,
      // objType: geometry.type,
      // objColor: material.color.getHexString(),
      // objPosition: object.position.toArray().join(", "),
      // objScale: object.scale.toArray().join(", "),
      // objObjectType: object.type
    };
    worker.postMessage({ type: "player.trace", body: trace });
    console.log('dataSent');
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

  // Create a new loader
  const loader = new GLTFLoader();

  // Load the GLTF model
  loader.load(
    "assets/boat.gltf", // URL of the model
    function (gltf) {
      const boat = gltf.scene.children[0];

      // Set the boat's position and scale
      boat.position.set(0, 0, 0);
      boat.scale.set(1, 1, 1);
      boat.rotation.set(0, 0, 0);

      // Enable shadows for the boat
      boat.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.side = THREE.DoubleSide;
        }
      });

      // Add the boat to the scene
      scene.add(boat);
      player = boat;
    },
    undefined, // onProgress callback function
    function (error) {
      console.error(error);
    }
  );

  // Load the GLTF model
  loader.load(
    "assets/turtle.gltf", // URL of the model
    function (gltf) {
      const turtle = gltf.scene.children[0];

      // Set the turtle's position and scale
      turtle.position.set(5, 0, 0);
      turtle.scale.set(1, 1, 1);
      turtle.rotation.set(0, 0, 0);

      // Add the turtle to the scene
      scene.add(turtle);
      turtle.type = "wildlife";
      objects.push(turtle);
    },
    undefined, // onProgress callback function
    function (error) {
      console.error(error);
    }
  );

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
  console.log(timer);

  // Create a function to update the timer
  function updateTimer() {
    remainingTime--;

    if (remainingTime <= 0) {
      console.log("Time's up!");

      gameOver();
      return;
    }

    timerDiv.innerHTML = "Time: " + remainingTime;

    // Update the object creation function to only create objects if the game is not over
    if (remainingTime % 10 === 0 && !gameOverFlag) {
      createRandomObject();
    }

    setTimeout(updateTimer, 1000);
  }

  // Start the timer
  updateTimer();

  function restart() {
    // Hide the restart button
    restartBtn.style.display = "none";

    // Remove all objects from the scene
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];
      scene.remove(object);
    }
    objects.length = 0;

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

  // Create a function to stop creating objects
  function stopObjectCreation() {
    clearInterval(objectIntervalId);
    objectIntervalId = undefined;
  }

  function makePlayerMesh(playerMesh, scene, name) {
    const group = new THREE.Group();

    const mesh = playerMesh.clone();
    // mesh.material = playerMaterial.clone();
    mesh.position.y = 10;
    mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });


    const nameDiv = document.createElement("div");
    nameDiv.className = "label";
    nameDiv.textContent = name;
    nameDiv.style.marginTop = "-1em";
    const nameLabel = new CSS2DObject(nameDiv);
    nameLabel.position.set(0, 12, 0);
    nameLabel.layers.set(0);

    group.add(mesh);
    group.add(nameLabel);
    scene.add(group);

    return group;
  }

  function gameOver() {
    console.log("Game over!");

    gameOverFlag = true; // Set the game over flag to true

    // Stop creating objects by clearing the interval
    if (objectIntervalId) {
      stopObjectCreation();
    }

    // Disable keyboard controls
    keyboard = {};

    // Remove all objects from the scene
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];
      scene.remove(object);
    }
    objects.length = 0;

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
    stopObjectCreation();
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
  var score = 0;

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
  console.log(score);

  const materials = [
    new THREE.MeshPhongMaterial({ color: 0x00ff00 }), // Green material for wildlife
    new THREE.MeshPhongMaterial({ color: 0xff0000 }), // Red material for trash
  ];

  const geometries = [
    new THREE.SphereGeometry(),
    new THREE.BoxGeometry(),
    new THREE.BufferGeometry(),
  ];

  // Create a random trash or wildlife object
  function createRandomObject() {
    // Check if the game is over
    if (remainingTime <= 0 || gameOverFlag) {
      return;
    }

    const isWildlife = Math.random() < 0.5; // 50% chance of being wildlife
    const geometry = isWildlife ? geometries[0] : geometries[1]; // Use sphere geometry for wildlife, cube geometry for trash
    const material = isWildlife ? materials[0] : materials[1];
    const object = new THREE.Mesh(geometry, material);
    object.position.set(
      Math.random() * 88 - 44, // set random position within the plane width
      Math.random() * 22 - 11, // set random position within the plane height
      0
    );
    const scale = Math.random() * 1; // Random scale value between 1 and 15
    object.scale.set(scale, scale, scale);
    object.type = isWildlife ? "wildlife" : "trash";
    object.outOfBounds = false;

    // check if object is within the bounds of the plane
    const waterBoundaries = waterGeometry.parameters;
    const objectBoundaries = new THREE.Box3().setFromObject(object);
    if (
      objectBoundaries.min.x > waterBoundaries.width / 2 ||
      objectBoundaries.max.x < -waterBoundaries.width / 2 ||
      objectBoundaries.min.y > waterBoundaries.height / 2 ||
      objectBoundaries.max.y < -waterBoundaries.height / 2
    ) {
      // if the object is outside the plane, mark it as out of bounds and return
      object.outOfBounds = true;
      return;
    }

    scene.add(object);
    objects.push(object);
    console.table({
      Type: geometry.type,
      Color: material.color.getHexString(),
      Position: object.position.toArray().join(", "),
      Scale: object.scale.toArray().join(", "),
      ObjectType: object.type,
    });
  }

  const floatAmplitude = 0.1;

  function animateObjects() {
    const time = performance.now() * 0.001; // Get current time in seconds
    objects.forEach((object) => {
      if (!object.outOfBounds) {
        const sinValue = Math.sin(
          time * 2 + object.position.x * 0.5 + object.position.y * 0.3
        );
        object.position.z = sinValue * floatAmplitude;
      }
    });
  }

  // Check for collisions between the player and each object in the scene
  function checkCollisions() {
    // Create a bounding box for the player
    const playerBox = new THREE.Box3().setFromObject(player);

    // Loop through each object in the scene
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];

      // Check if the object is out of bounds
      if (object.outOfBounds) {
        continue;
      }

      // Create a bounding box for the object
      const objectBox = new THREE.Box3().setFromObject(object);

      // Check if the player's bounding box intersects with the object's bounding box
      if (playerBox.intersectsBox(objectBox)) {
        // Remove the object from the scene and the objects array
        scene.remove(object);
        objects.splice(i, 1);

        // Add or deduct points based on the object type
        if (object.type === "trash") {
          score++;
          console.log("Score:", score);
        } else if (object.type === "wildlife") {
          score--;
          console.log("Score:", score);
        }

        // Update the score element on the page
        scoreElement.innerHTML = "Score: " + score;
      }
    }
  }

  function createObject() {
    createRandomObject();
    const timeInterval = Math.floor(Math.random() * 9000) + 1000; // Random time interval between 1 and 10 seconds
    setTimeout(createObject, timeInterval);
  }

  // Call createObject to start creating objects
  createObject();

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
    }

    // Update the camera position to follow the player
    camera.position.x = player.position.x;
    camera.position.y = player.position.y;
    camera.position.z = player.position.z + 5;

    checkCollisions();
  }

  console.log(playerName);

  // Check if an object is within the camera range
  function isObjectWithinCameraRange(object) {
    const distance = camera.position.distanceTo(object.position);
    return distance < 10;
  }

  // Render the scene
  function animate() {
    requestAnimationFrame(animate);
    updatePlayerPosition();
    renderer.render(scene, camera);
    checkCollisions();
    stopObjectCreation();
    uniforms.time.value += 0.1;
    renderer.render(scene, camera);
    animateObjects();
    // traces
    sendYourPosition();
  }
  animate();

  var light = new THREE.PointLight(0xffffff, 1, 1);
  light.position.set(0, 1, 0);
  player.add(light);
}
