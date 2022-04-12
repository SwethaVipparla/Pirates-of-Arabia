import "./style.css";

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let camera, scene, renderer;
let controls, water, sun;
let third = 1;
let birdsEye = 0;

let scoreText = 0, healthText = 0, destroyedText = 0, timeText = 0, treasureText; 
let destroyed = 0;
let treasureTaken = 0;
let timeNow = Date.now();
let score = 0;
let health = 50;

const loader = new GLTFLoader();

function random(min, max) 
{
  return Math.random() * (max - min) + min;
}
class Boat 
{
  constructor() 
  {
    loader.load("assets/boat/scene.gltf", (gltf) => 
    {
      scene.add(gltf.scene);
      gltf.scene.scale.set(0.5, 0.5, 0.5);

      gltf.scene.position.set(5, 0, 50)
      gltf.scene.rotation.y = Math.PI;

      this.boat = gltf.scene;

      this.speed = 
      {
        vel: 0,
        rot: 0,
      };
    });
  }

  stop() 
  {
    this.speed.vel = 0;
    this.speed.rot = 0;
  }

  shootCannon() 
  {
    const cannon = new THREE.Mesh
    (
      new THREE.SphereGeometry(2, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x11111 })
    );

    cannon.position.set(this.boat.position.x, 20, this.boat.position.z);
    cannon.rotation.y = this.boat.rotation.y;
    scene.add(cannon);
    const cannonSpeed = 10;

    const cannonInterval = setInterval(() => 
    {
      cannon.translateZ(cannonSpeed);
      for(let i = 0; i < countPirates; i++) 
      {
        if(pirates[i].pirate)
        {
          if(!pirates[i].isDestroyed && isColliding(cannon, pirates[i].pirate))
          {
            pirates[i].isDestroyed = true;
            pirates[i].die()
            scene.remove(cannon);
            clearInterval(cannonInterval);
          }
        }
      }

      if(cannon.position.x - boat.boat.position.x > 500)
      {
        scene.remove(cannon);
        clearInterval(cannonInterval);
      }
    }, 10);
}

  update() 
  {
    if(health == 0 || health < 0)
      this.remove();
    if (this.boat) 
    {
      this.boat.rotation.y += this.speed.rot;
      this.boat.translateZ(this.speed.vel);

      if (third)
        controls.target.set
        (
          boat.boat.position.x,
          boat.boat.position.y,
          boat.boat.position.z
        );
      else 
        controls.target.set(boat.boat.position.x, 500, boat.boat.position.z);

      controls.saveState();
      controls.update();

      if (!third)
        camera.lookAt
        (
          boat.boat.position.x - Math.cos(Math.PI - boat.boat.rotation.y) * 100,
          50,
          boat.boat.position.z - Math.sin(Math.PI - boat.boat.rotation.y) * 100
        );
    }
  }
}

const boat = new Boat();
class Pirate 
{
  constructor(_scene) 
  {
    scene.add(_scene);
    _scene.scale.set(0.04, 0.04, 0.04);

    if (Math.random() > 0.9) 
      _scene.position.set(random(-10000, -10000), 15, random(-10000, 10000));
     else 
      _scene.position.set(random(-5000, 5000), 15, random(-5000, 5000));

    this.pirate = _scene;

    this.speed = 
    {
      vel: 0,
      rot: 0,
    };

    this.isDestroyed = false;
  }

  stop() 
  {
    this.speed.vel = 0;
    this.speed.rot = 0;
  }

  update(boat)
  {
    let direction = new THREE.Vector3((boat.boat.position.x - this.pirate.position.x), (boat.boat.position.y - this.pirate.position.y), (boat.boat.position.z - this.pirate.position.z));

    direction.normalize();

    let x = Math.abs(this.pirate.position.x - boat.boat.position.x);
    let z = Math.abs(this.pirate.position.z - boat.boat.position.z);

    this.pirate.rotation.y = Math.atan2(direction.x, direction.z) + Math.PI;

    if(x < 200 && z < 200)
      return;

    this.pirate.position.x += direction.x * 0.9;
    this.pirate.position.z += direction.z * 0.9;
    this.pirate.position.y += direction.y * 0.9;

    if(random(0, 10000) < 30)
      this.shootCannon();
  }

  shootCannon() 
  {
    const cannon = new THREE.Mesh
    (
      new THREE.SphereGeometry(2, 6, 6),
      new THREE.MeshBasicMaterial({ color: "grey"})
    );

    cannon.position.set(this.pirate.position.x, 20, this.pirate.position.z);
    cannon.rotation.y = boat.boat.rotation.y;
    scene.add(cannon);
    const cannonSpeed = 10;

    const cannonInterval = setInterval(() => 
    {
      cannon.translateY(cannonSpeed * Math.sin(cannon.rotation.y));

      if(isColliding(cannon, boat.boat))
      {
        health -= 10;
        scene.remove(cannon);
        clearInterval(cannonInterval);
      }

      if(cannon.position.x - this.pirate.position.x > 700)
      {
        scene.remove(cannon);
        clearInterval(cannonInterval);
      }
  }, 10);
}

  die()
  {
    destroyed++;
    const interval = setInterval(() => {
      this.pirate.translateY(-0.5);
      if(this.pirate.position.y < -100)
      {
        this.remove();
        clearInterval(interval);
      }
  }, 10);
}

  remove()
  {
    scene.remove(this.pirate);
  }
}
class Treasure 
{
  constructor(_scene) 
  {
    scene.add(_scene);
    _scene.scale.set(0.5, 0.5, 0.5);

    if (Math.random() > 0.9) 
      _scene.position.set(random(-100, -100), -0.3, random(-100, 100));
    else 
      _scene.position.set(random(-500, 500), -0.3, random(-1000, 1000));
    
    this.treasure = _scene;
  }
}

async function loadModel(url) 
{
  return new Promise((resolve, reject) => 
  {
    loader.load(url, (gltf) => 
    {
      resolve(gltf.scene);
    });
  });
}

let boatModel = null;

async function createBoat() 
{
  if (!boatModel) 
    boatModel = await loadModel("assets/boat/scene.gltf");

  return new Boat(boatModel.clone());
}

let treasureModel = null;

async function createTreasure() 
{
  if (!treasureModel)
    treasureModel = await loadModel("assets/treasure/scene.gltf");

  return new Treasure(treasureModel.clone());
}

let pirateModel = null;

async function createPirate() 
{
  if (!pirateModel)
    pirateModel = await loadModel("assets/pirate/scene.gltf");

  return new Pirate(pirateModel.clone());
}

let HUD;
function updateHUD()
{
  if(boat.boat)
  {
    const zeroPad = (num, places) => String(num).padStart(places, "0");

    scoreText = "Score: " + score;
    healthText = "Health: " + health;
    destroyedText = "Destroyed: " + destroyed;
    timeText = "Time Elapsed: " + zeroPad(Math.floor(((Date.now() - timeNow) / 1000) / 60), 2) + ":" + zeroPad(Math.floor(((Date.now() - timeNow) / 1000) % 60), 2);
    treasureText = "Treasures Taken: " + treasureTaken;

    HUD.innerHTML = scoreText + " | "+ healthText + " | " + destroyedText + " | " + timeText + " | " + treasureText;
  } 
}

let treasures = [];
const countTreasure = 20;

let pirates = [];
const countPirates = 10;


init();
animate();

async function init() 
{
  HUD = document.createElement("div");
  HUD.id = "HUD";
  HUD.style.padding = "10px";
  HUD.style.position = "absolute";
  HUD.style.top = "0";
  HUD.style.left = "0";
  HUD.style.display = "block";
  HUD.style.color = "white";
  HUD.style.fontSize = "20px";
  document.body.appendChild(HUD);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera
  (
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  
  camera.position.set(400, 2, 20);

  sun = new THREE.Vector3();

  // Water

  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

  water = new Water
  (
    waterGeometry, 
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load
      (
        "assets/waternormals.jpg",
        function (texture) 
        {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: "blue",
      distortionScale: 3.7,
      fog: scene.fog !== undefined,
    }
  );

  water.rotation.x = -Math.PI / 2;

  scene.add(water);

  // Skybox

  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;

  skyUniforms["turbidity"].value = 10;
  skyUniforms["rayleigh"].value = 2;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;

  const parameters = 
  {
    elevation: 2,
    azimuth: 180,
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  function updateSun() 
  {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;
  }

  updateSun();

  for (let i = 0; i < countTreasure; i++) 
  {
    const treasure = await createTreasure();
    treasures.push(treasure);
  }


  for (let i = 0; i < countPirates; i++) 
  {
    const pirate = await createPirate();
    pirates.push(pirate);
  }


  window.addEventListener("resize", onWindowResize);

  let forwardSpeed = 0.4;
  let rotationSpeed = 0.03;

  window.addEventListener("keydown", (e) => 
  {
    if (e.key === "w" || e.key === "ArrowUp") 
      boat.speed.vel += forwardSpeed;
    
    if (e.key === "s" || e.key === "ArrowDown") 
      boat.speed.vel -= forwardSpeed;

    if (e.key === "a" || e.key === "ArrowLeft") 
      boat.speed.rot = rotationSpeed;

    if (e.key === "d" || e.key === "ArrowRight") 
      boat.speed.rot = -rotationSpeed;

    if (e.key === "c") 
    {
      if (third) 
        birdsEye = 1;
      else 
        birdsEye = 0;
      third = !third;
    }

    if(e.key === "t")
        boat.shootCannon();
  });

  window.addEventListener("keyup", (e) => 
  {
    boat.stop();
  });
}

controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI * 0.4;
controls.target.set(0, 10, 0);
controls.minDistance = 40.0;
controls.maxDistance = 100.0;
controls.update();

function onWindowResize() 
{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function isColliding(obj1, obj2) 
{
  return (
    Math.abs(obj1.position.x - obj2.position.x) < 15 &&
    Math.abs(obj1.position.z - obj2.position.z) < 15
  );
}

function checkCollisions() {
  if (boat.boat) 
  {
    treasures.forEach((treasure) => 
    {
      if (treasure.treasure) 
      {
        if (isColliding(boat.boat, treasure.treasure)) 
        {
          scene.remove(treasure.treasure);
          score += 10;
          treasureTaken++;
          treasure.treasure = null;
        }
      }
    });
  }
  pirates.forEach((pirate) => 
  {
    if(pirate.pirate)
    {
      if(isColliding(boat.boat, pirate.pirate))
      {
        pirate.isDestroyed = true;
        pirate.die();
        health -= 10;
      }
    }
  });
}

function animate() 
{
  requestAnimationFrame(animate);
  render();
  boat.update();
  for(let i = 0; i < countPirates; i++)
  {
    if(boat.boat)
      pirates[i].update(boat);
  }
  
  checkCollisions();
  updateHUD();
}

function render() 
{
  water.material.uniforms["time"].value += 1.0 / 60.0;
  renderer.render(scene, camera);
}
