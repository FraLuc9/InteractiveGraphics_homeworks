import THREE from './libs/three.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { initTable } from './scene/table.js';
import { initBalls } from './scene/balls.js';
import { EXRLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/EXRLoader.js';
import { PMREMGenerator } from './libs/three.js';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.2/index.js';

// const and var initializations
let scene, camera, renderer, controls;
let gameState = 'idle';
let balls = [];
let cueStick;
let cuePower = 0;
let aiming = false;
let cueScratched = false;
let repositioning = false;
let charging = false;
let powerDirection = 1;
let lastShotTime = 0;
const powerGaugeContainer = document.getElementById('powerGauge');
const powerGaugeBar = document.getElementById('powerBar');
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const floorHeight = 48.7811;
const radius = 2;
const friction = 0.98;
const restitution = 0.98;

let predictionPoints;
const predictionDotCount = 60;

let ballArrows = [];
let arrowBounceTime = 0;

let currentPlayer = 1;
let scores = {
  1: 0, 
  2: 0
};

let lastGameState = '';
let lastTurn = '';

let lastTime = performance.now();
const fixedTimeStep = 1000 / 60;

let scored = false;
let anyHit = false;

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let soundBuffers = {};

function loadSound(url, name) {
  return fetch(url)
    .then(res => res.arrayBuffer())
    .then(data => audioCtx.decodeAudioData(data))
    .then(buffer => {
      soundBuffers[name] = buffer;
    });
}

Promise.all([
  loadSound('./assets/sounds/ballHit.mp3', 'ballHit'),
  loadSound('./assets/sounds/pocketDrop.mp3', 'pocketDrop'),
  loadSound('./assets/sounds/railHit.wav', 'railHit')
]).then(() => {
  console.log('Sounds loaded and ready');
});

const topDownView = {
  position: new THREE.Vector3(0, 150, 0),
  lookAt: new THREE.Vector3(0, floorHeight, 0)
};

const sideView = {
  position: new THREE.Vector3(0, 100, 100),
  lookAt: new THREE.Vector3(0, floorHeight, 0)
};



function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
  camera.updateProjectionMatrix();
  // camera.position.set(0, 150, 200);
  // camera.lookAt(0, floorHeight, 0);
  
  const placementZone = new THREE.Mesh(
    new THREE.PlaneGeometry(167-2*radius, 79-2*radius),
    new THREE.MeshBasicMaterial({visible: false})
  );
  placementZone.name = 'placementZone';
  placementZone.rotation.x = -Math.PI / 2;
  placementZone.position.y = floorHeight;
  scene.add(placementZone);

  const placementGuide = new THREE.Mesh(
    new THREE.PlaneGeometry(167-radius, 79-radius),
    new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    })
  );
  placementGuide.rotation.x = -Math.PI / 2;
  placementGuide.position.y = floorHeight + 0.2;
  placementGuide.visible = false;
  placementGuide.castShadow = false;
  placementGuide.receiveShadow = false;
  scene.add(placementGuide);
  scene.userData.placementGuide = placementGuide;

  scene.userData.guidePlanes = scene.userData.guidePlanes || [];
  
  //NW boundary
  const normal = new THREE.Vector3(0, 0, 1);
  const p1 = new THREE.Vector3(-7.8843, 5.0616, -3.9666).multiplyScalar(10);
  const p2 = new THREE.Vector3(-0.3414, 5.0611, -3.964).multiplyScalar(10);
  const plane1 = createBoundary(p1,p2,5);
  scene.add(plane1);
  scene.userData.guidePlanes.push({
    normal: normal.clone().applyQuaternion(plane1.quaternion).normalize(), 
    point: plane1.position.clone()
  });

  //SW boundary
  const p3 = new THREE.Vector3(-0.34422, 5.0611, 3.9638).multiplyScalar(10);
  const p4 = new THREE.Vector3(-7.887, 5.0616, 3.9611).multiplyScalar(10);
  const plane2 = createBoundary(p3,p4,5);
  scene.add(plane2);
  scene.userData.guidePlanes.push({
    normal: normal.clone().applyQuaternion(plane2.quaternion).normalize(), 
    point: plane2.position.clone()
  });

  //E boundary
  const p5 = new THREE.Vector3(8.3027, 5.0616, -3.5435).multiplyScalar(10);
  const p6 = new THREE.Vector3(8.3051, 5.0616, 3.5377).multiplyScalar(10);
  const plane3 = createBoundary(p5,p6,5);
  scene.add(plane3);
  scene.userData.guidePlanes.push({
    normal: normal.clone().applyQuaternion(plane3.quaternion).normalize(), 
    point: plane3.position.clone()
  });
  
  //W boundary
  const p8 = new THREE.Vector3(-8.3066, 5.0616, -3.5377).multiplyScalar(10);
  const p7 = new THREE.Vector3(-8.3041, 5.0616, 3.5435).multiplyScalar(10);
  const plane4 = createBoundary(p7,p8,5);
  scene.add(plane4);
  scene.userData.guidePlanes.push({
    normal: normal.clone().applyQuaternion(plane4.quaternion).normalize(), 
    point: plane4.position.clone()
  });

  //NE boundary
  const p9 = new THREE.Vector3(0.34145, 5.0611, -3.964).multiplyScalar(10);
  const p10 = new THREE.Vector3(7.8843, 5.0616, -3.9666).multiplyScalar(10);
  const plane5 = createBoundary(p9,p10,5);
  scene.add(plane5);
  scene.userData.guidePlanes.push({
    normal: normal.clone().applyQuaternion(plane5.quaternion).normalize(), 
    point: plane5.position.clone()
  });

  //SE boundary
  const p11 = new THREE.Vector3(7.887, 5.0616, 3.9611).multiplyScalar(10);
  const p12 = new THREE.Vector3(0.34422, 5.0611, 3.9638).multiplyScalar(10);
  const plane6 = createBoundary(p11,p12,5);
  scene.add(plane6);
  scene.userData.guidePlanes.push({
    normal: normal.clone().applyQuaternion(plane6.quaternion).normalize(), 
    point: plane6.position.clone()
  });

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('billiardCanvas'),
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const exrLoader = new EXRLoader();
  const pmremGenerator = new PMREMGenerator(renderer);
  exrLoader.load('./assets/environment/wooden_lounge_4k.exr', function(texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    scene.background = envMap;
    
    texture.dispose();
    pmremGenerator.dispose();
  });
  // scene.background = new THREE.Color(0x222222);
  // scene.environment = null;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 200;
  controls.maxPolarAngle = Math.PI / 2.4;
  
  
  // const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  // scene.add(ambient);

  const light = new THREE.DirectionalLight(0xffffff, 10);
  
  light.position.set(80, 200, 150);
  light.castShadow = true;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.near = 1;
  light.shadow.camera.far = 500;
  light.shadow.camera.left = -200;
  light.shadow.camera.right = 200;
  light.shadow.camera.top = 200;
  light.shadow.camera.bottom = -200;
  light.shadow.camera.updateProjectionMatrix();
  // scene.add(light);
  // const cameraHelper1 = new THREE.CameraHelper(light.shadow.camera);
  // scene.add(cameraHelper1);
  // light.target.position.set(0, floorHeight, 0);
  // scene.add(light.target);
  // light.target.updateMatrixWorld();
  
  const light2 = new THREE.DirectionalLight(0xffffff, 10);
  
  light2.position.set(-80, 200, 150);
  light2.castShadow = true;
  light2.shadow.mapSize.width = 2048;
  light2.shadow.mapSize.height = 2048;
  light2.shadow.camera.near = 1;
  light2.shadow.camera.far = 500;
  light2.shadow.camera.left = -200;
  light2.shadow.camera.right = 200;
  light2.shadow.camera.top = 200;
  light2.shadow.camera.bottom = -200;
  light2.shadow.camera.updateProjectionMatrix();
  scene.add(light2);
  // const cameraHelper1 = new THREE.CameraHelper(light.shadow.camera);
  // scene.add(cameraHelper1);
  light2.target.position.set(0, floorHeight, 0);
  scene.add(light2.target);
  light2.target.updateMatrixWorld();
  
  initTable(scene, renderer);
  balls = initBalls(scene);
  initCueStick();

  // Create arrows for cue + all other balls
  for (const ball of balls) {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(),
      5,
      ball.isCue ? 0xffff00 : 0x00ffff,
      2,
      1
    );
    arrow.visible = false;
    scene.add(arrow);
    ballArrows.push({ arrow, ball });
  }


  const groundSphereMaterial = new THREE.MeshStandardMaterial({
    color: 0xc4a77a,
    metalness: 0.9,
    roughness: 0.05,
    envMap: scene.environment,
    envMapIntensity: 1.0
  });

  const groundSphere = new THREE.Mesh(
    new THREE.SphereGeometry(10000, 32, 32),
    groundSphereMaterial
  );
  
  groundSphere.position.set(0, -9996, 0);
  groundSphere.receiveShadow = true;
  scene.add(groundSphere);

  const dotPositions = new Float32Array(predictionDotCount * 3);
  const predictionGeometry = new THREE.BufferGeometry();
  predictionGeometry.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));

  const predictionMaterial = new THREE.PointsMaterial({
    color: 0xffff00,
    size: 1.2,
    transparent: true,
    opacity: 0.5,
    depthTest: false,
    depthWrite: false
  });

  predictionPoints = new THREE.Points(predictionGeometry, predictionMaterial);
  scene.add(predictionPoints);
  predictionPoints.frustumCulled = false;
  predictionPoints.renderOrder = 9999;
  predictionPoints.material.depthTest = false;
  predictionPoints.material.depthWrite = false;
  document.getElementById('turnIndicator').textContent = `Player ${currentPlayer}'s Turn`;
  
  updateScore();
  moveCameraTo(sideView);
  requestAnimationFrame(animate);
}

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = now - lastTime;

  if (delta >= fixedTimeStep) {
    updatePhysics();

    if (gameState === 'aiming' && aiming && charging) {
      cuePower += 0.015 * powerDirection;

      if (cuePower >= 1) {
        cuePower = 1;
        powerDirection = -1;
      } else if (cuePower <= 0) {
        cuePower = 0;
        powerDirection = 1;
      }

      powerGaugeContainer.style.display = 'block';
      powerGaugeBar.style.width = `${Math.floor(cuePower * 100)}%`;
    } else {
      powerGaugeContainer.style.display = 'none';
    }
    lastTime = now - (delta % fixedTimeStep); // to avoid drift
  }

  controls.update();
  updateCueStick();
  updatePredictionPath();
  updateBallArrows();
  
  if (lastGameState !== gameState) {
    document.getElementById('gameStateDisplay').textContent = `State: ${gameState}`;
    lastGameState = gameState;
  }
  
  renderer.render(scene, camera);
}




function updatePhysics() {
  
  if (gameState != 'moving') return;
  
  
  const pocketPositions = scene.userData.pocketPositions || [];
  const guidePlanes = scene.userData.guidePlanes || [];
  const pocketRadiusSq = 4.5 * 4.5;
  const minDist = radius * 2;
  const minSpeed = 0.2;
  const maxSpeed = 5;

  for (let i = balls.length - 1; i >= 0; i--) {
    const ballA = balls[i];
    const posA = ballA.mesh.position;

    posA.add(ballA.velocity);
    ballA.velocity.multiplyScalar(friction);
    const velocity = ballA.velocity.length();

    if (velocity > 0.0001) {
      const axis = new THREE.Vector3(ballA.velocity.z, 0, -ballA.velocity.x).normalize();
      const angle = velocity / radius;
      ballA.mesh.rotateOnWorldAxis(axis, angle);
    }

    if (ballA.velocity.lengthSq() < 1e-5) {
      ballA.velocity.set(0, 0, 0);
    }

    for (const pocket of pocketPositions) {
      const dx = posA.x - pocket.x;
      const dz = posA.z - pocket.z;
      const xzDistSq = dx * dx + dz * dz;
      
      if (xzDistSq < pocketRadiusSq) {
        if (!ballA.isFalling) {
          playSound('pocketDrop', 0.7);

          ballA.isFalling = true;
          ballA.fallTarget = pocket.clone();
        }
        break;
      }
    }
    if (ballA.isFalling) {
      ballA.velocity.set(0, 0, 0);
      ballA.angularVelocity.set(0, 0, 0);
      ballA.mesh.position.y -= 0.5;
      ballA.mesh.rotation.x += 1;
      ballA.mesh.rotation.z += 1;

      if (ballA.fallTarget) {
        const toCenter = ballA.fallTarget.clone().sub(ballA.mesh.position).setY(0).normalize();
        ballA.mesh.position.add(toCenter.multiplyScalar(0.2));
      }
      if (ballA.mesh.position.y < 45) {
        
        if (ballA.isCue) {
          ballA.mesh.position.set(0, -50, 0);
          ballA.velocity.set(0, 0, 0);
          ballA.angularVelocity.set(0, 0, 0);
          ballA.isFalling = false;
          ballA.fallTarget = null;
          
        } else {
          scene.remove(ballA.mesh);
          ballA.mesh.geometry.dispose();
          ballA.mesh.material.dispose();
          balls.splice(i, 1);
          const type = ballA.type;
          if (type === 'eight') {
            if (scores[currentPlayer] === 7) {
              document.getElementById('scoreNotice').textContent = `Player ${currentPlayer} WINS!`;
              document.getElementById('scoreNotice').style.display = 'block';

              setTimeout(() => {
                document.getElementById('scoreNotice').style.display = 'none';
                resetGame();
              }, 3000);
            } else {
              const loser = currentPlayer;
              const winner = currentPlayer === 1 ? 2 : 1;
              document.getElementById('scoreNotice').textContent = `Player ${loser} pocketed the 8 ball early! Player ${winner} WINS!`;
              document.getElementById('scoreNotice').style.display = 'block';

              setTimeout(() => {
                document.getElementById('scoreNotice').style.display = 'none';
                resetGame();
              }, 3000);
            }
          }
          
          if (type === 'solid') {
            scores[1]++;
            if (currentPlayer === 1) {
              scored = true;
            }
          } else if (type === 'striped') {
            scores[2]++;
            if (currentPlayer === 2) {
              scored = true;
            }
          }
          updateScore();
        }
      }
      continue;
    }

    for (const { normal, point } of guidePlanes) {
      const distance = posA.clone().sub(point).dot(normal);

      if (distance < radius) {
        const penetration = radius - distance;
        if (penetration > 0) {
          posA.addScaledVector(normal, penetration);
        }
        const vDotN = ballA.velocity.dot(normal);
        if (vDotN < 0) {
          const impactSpeed = Math.abs(ballA.velocity.dot(normal));
          const speedClamped = Math.min(Math.max(impactSpeed, minSpeed), maxSpeed);

          const volume = 0.1 + 0.5 * ((speedClamped - minSpeed) / (maxSpeed - minSpeed));
          const pitch = 0.5 + 0.2 * Math.random();

          playSound('railHit', volume, pitch);
          const reflection = normal.clone().multiplyScalar(2 * vDotN);
          reflection.y = 0;
          ballA.velocity.sub(reflection);
        }
      }
    }

    for (let j = i - 1; j >= 0; j--) {
      const ballB = balls[j];

      const posB = ballB.mesh.position.clone();

      const distVec = posB.clone().sub(posA);
      const dist = distVec.length();

      
      if (dist < minDist) {
        
        if (!anyHit) anyHit = true;
        const normal = distVec.clone().normalize();
        const tangent = new THREE.Vector3(-normal.z, 0, normal.x);
        const vA = ballA.velocity.clone();
        const vB = ballB.velocity.clone();
        const impactSpeed = vA.clone().sub(vB).length();
        
        const speedClamped = Math.min(Math.max(impactSpeed, minSpeed), maxSpeed);

        const volume = 0.25 + 0.75 * ((speedClamped - minSpeed) / (maxSpeed - minSpeed));
        const pitch = 0.6 * (0.5 + 0.5 * volume) + 0.4 * Math.random();
        playSound('ballHit', volume, pitch);

        const vA_n = normal.clone().multiplyScalar(vA.dot(normal));
        const vA_t = tangent.clone().multiplyScalar(vA.dot(tangent));

        const vB_n = normal.clone().multiplyScalar(vB.dot(normal));
        const vB_t = tangent.clone().multiplyScalar(vB.dot(tangent));

        ballA.velocity.copy( vB_n.add(vA_t).multiplyScalar(restitution) );
        ballB.velocity.copy( vA_n.add(vB_t).multiplyScalar(restitution) );


        const overlap = minDist - dist;
        const correction = normal.clone().multiplyScalar(overlap / 2);
        ballA.mesh.position.add(correction.clone().negate());
        ballB.mesh.position.add(correction);
      }
    }
  }

  const moving = balls.some(ball => ball.velocity.lengthSq() > 1e-5 || ball.isFalling);
  if (!moving && gameState === 'moving' && performance.now() - lastShotTime > 100) {
    controls.enabled = true;
    moveCameraTo(topDownView);
    controls.update();
    const notice = document.getElementById('scoreNotice');
    const cueBall = balls.find(b => b.isCue);
    if (cueBall && cueBall.mesh.position.y < 45) {
      cueScratched = true;
      notice.textContent = `Player ${currentPlayer} scratched! `; 
    }
    if (!anyHit || cueScratched) {
      scored = false;
      notice.textContent += `Player ${currentPlayer} Foul! Player ${currentPlayer === 1 ? 2 : 1} repositions...!`;
      notice.style.display = 'block';
        setTimeout(() => {
            notice.style.display = 'none';
            notice.textContent = '';
          }, 2000);
      triggerReposition();
    } else {
      anyHit = false;
      gameState = 'idle';
      if (scored) {
        scored = false;
        const notice = document.getElementById('scoreNotice');
        notice.textContent = `Player ${currentPlayer} scored!`;
        notice.style.display = 'block';
        setTimeout(() => {
          notice.style.display = 'none';
        }, 2000);
      } else {
        switchTurn();
      }
    }
  }
}



init();
requestAnimationFrame(animate);



// EVENT LISTENERS

// cue ball repositioning listener
window.addEventListener('mousemove', (e) => {
  if (!repositioning) return;
  
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(scene.getObjectByName('placementZone'));
  if (intersects.length > 0) {
    const point = intersects[0].point;

    const cueBall = balls.find(b => b.isCue);
    if (cueBall) {
      const candidatePosition = new THREE.Vector3(point.x, floorHeight + radius, point.z);

      const overlaps = balls.some(b => {
        if (b === cueBall || b.isFalling) return false;
        return b.mesh.position.distanceTo(candidatePosition) < 2 * radius;
      });

      if (!overlaps) {
        cueBall.mesh.position.copy(candidatePosition);
      }
    }
  }
});


// cue ball repositioning confirmation listener
window.addEventListener('click', () => {
  if (repositioning) {
    repositioning = false;
    if (gameState === 'repositioning') {
      gameState = 'idle';
    }
    scene.userData.placementGuide.visible = false;
    console.log('Cue ball repositioned.');
  }
});


// shoot button listener
document.getElementById('shootButton').addEventListener('click', () => {
  if (gameState !== 'aiming' || !aiming) return;

  if (!charging && aiming) {
    charging = true;
    cuePower = 0;
    powerDirection = 1;
  } else {
    charging = false;
    aiming = false;
    stickAnimation();
  }
});


// camera repositioning listener 1
document.getElementById('topDownView').addEventListener('click', () => {
  moveCameraTo(topDownView);
});

// camera repositioning listener 2
document.getElementById('sideView').addEventListener('click', () => {
  moveCameraTo(sideView);
});

// camera repositioning listener 3
document.getElementById('cueView').addEventListener('click', () => {
  moveCameraTo(getCueBallView());
});


// shooting stance listener
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !aiming && gameState === 'idle') {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    aiming = true;
    gameState = 'aiming';
    cueStick.visible = true;

    moveCameraTo(getCueBallView());
    document.getElementById('shootButton').style.display = 'block';
  }
});

// game reset listener
document.getElementById('resetButton').addEventListener('click', () => {
  resetGame();
  moveCameraTo(sideView);
});


// HELPER FUNCTIONS

function moveCameraTo(view, duration = 1.5) {
  if (!view || !view.position || !view.lookAt) return;

  controls.enabled = false;

  const offset = new THREE.Vector3().subVectors(view.position, view.lookAt);

  const spherical = new THREE.Spherical().setFromVector3(offset);
  const currentOffset = new THREE.Vector3().subVectors(camera.position, controls.target);
  const currentSpherical = new THREE.Spherical().setFromVector3(currentOffset);

  const start = {
    radius: currentSpherical.radius,
    phi: currentSpherical.phi,
    theta: currentSpherical.theta,
    tx: controls.target.x,
    ty: controls.target.y,
    tz: controls.target.z
  };

  const end = {
    radius: spherical.radius,
    phi: spherical.phi,
    theta: spherical.theta,
    tx: view.lookAt.x,
    ty: view.lookAt.y,
    tz: view.lookAt.z
  };

  gsap.to(start, {
    radius: end.radius,
    phi: end.phi,
    theta: end.theta,
    tx: end.tx,
    ty: end.ty,
    tz: end.tz,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      const newOffset = new THREE.Vector3().setFromSphericalCoords(start.radius, start.phi, start.theta);
      camera.position.copy(newOffset).add(new THREE.Vector3(start.tx, start.ty, start.tz));
      controls.target.set(start.tx, start.ty, start.tz);
      controls.update();
    },
    onComplete: () => {
      controls.enabled = true;
    }
  });
}


function initCueStick() {
  if (cueStick) {
    scene.remove(cueStick);
    cueStick.geometry.dispose();
    cueStick.material.dispose();
  }
  const geometry = new THREE.CylinderGeometry(0.6, 0.25, 60, 160);
  const material = new THREE.MeshStandardMaterial({ color: 0x996633 });
  cueStick = new THREE.Mesh(geometry, material);
  cueStick.castShadow = true;
  cueStick.rotation.z = Math.PI / 2.1;
  cueStick.visible = false;
  scene.add(cueStick);
}

function updateCueStick() {
  
  if (!cueStick || !balls.length) return;

  if (gameState !== 'aiming') {
    cueStick.visible = false;
    return;
  }

  const cueBall = balls.find(b => b.isCue);
  if (!cueBall) return;

  if (aiming) {
    const cueBall = balls.find(b => b.isCue);
    if (!cueBall) return;

    const dx = cueBall.mesh.position.x - camera.position.x;
    const dz = cueBall.mesh.position.z - camera.position.z;

    const angle = Math.atan2(dz, dx);
    cueStick.rotation.y = -angle;

    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const offset = direction.clone().multiplyScalar(35 + 5 * cuePower);
    cueStick.position.copy(cueBall.mesh.position.clone().sub(offset));
    cueStick.position.y = cueBall.mesh.position.y + 3;
  }

}


function stickAnimation() {
  const cueBall = balls.find(b => b.isCue);
  if (!cueBall) return;

  const angle = cueStick.rotation.y;
  const direction = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
  lastShotTime = performance.now();
  const hitDistance = 10;

  const forwardPos = cueStick.position.clone().add(direction.clone().multiplyScalar(hitDistance));

  gsap.to(cueStick.position, {
    duration: 0.12,
    x: forwardPos.x,
    y: forwardPos.y,
    z: forwardPos.z,
    ease: 'power2.in',
    onComplete: () => {
      shoot();
      cueStick.visible = false;
      gameState = 'moving';
    }
  });
}


function shoot() {
  if (gameState != 'aiming') return;
  const cueBall = balls.find(b => b.isCue);
  if (!cueBall) return;
  playSound('ballHit');
  const angle = cueStick.rotation.y;
  const force = cuePower * 6;
  cueBall.velocity.x = Math.cos(angle) * force;
  cueBall.velocity.z = -Math.sin(angle) * force;
  cuePower = 0;
  document.getElementById('shootButton').style.display = 'none';
}


function playSound(name, volume = 1, playbackRate = 1) {
  const buffer = soundBuffers[name];
  if (!buffer) return;

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = playbackRate;

  const gainNode = audioCtx.createGain();
  gainNode.gain.value = volume;

  source.connect(gainNode).connect(audioCtx.destination);
  source.start(0);
}


function createBoundary(pointA, pointB, height = 5, material = null) {
  const a = pointA.clone();
  const b = pointB.clone();

  const midpoint = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);

  const width = a.distanceTo(b);

  if (!material) {
    material = new THREE.MeshBasicMaterial({ color: 0xff0000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0 });
  }

  const geometry = new THREE.PlaneGeometry(width, height);
  const plane = new THREE.Mesh(geometry, material);
  plane.position.copy(midpoint);
  plane.visible = false;
  const direction = new THREE.Vector3().subVectors(b, a).normalize();
  const up = new THREE.Vector3(0, 1, 0);

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(direction.x, 0, direction.z).normalize()
  );

  plane.setRotationFromQuaternion(quaternion);

  return plane;
}


function updateBallArrows() {
  arrowBounceTime += 0.05;
  const bounceOffset = Math.sin(arrowBounceTime) * 0.5;

  for (const { arrow, ball } of ballArrows) {
    const isCue = ball.isCue;

    let shouldShow = false;

    if (isCue && gameState === 'idle') {
      shouldShow = true;
    } else if (
      gameState === 'aiming' &&
      !ball.isCue &&
      !ball.isFalling &&
      (
        (currentPlayer === 1 && ball.type === 'solid') ||
        (currentPlayer === 2 && ball.type === 'striped')
      )
    ) {
      shouldShow = true;
    }

    if (shouldShow) {
      arrow.visible = true;
      arrow.position.copy(ball.mesh.position.clone().add(new THREE.Vector3(0, 10 + bounceOffset, 0)));
    } else {
      arrow.visible = false;
    }
  }
}


function triggerReposition() {
  repositioning = true;
  cueScratched = false;
  anyHit = false;
  scene.userData.placementGuide.visible = true;
  const cueBall = balls.find(b => b.isCue);
  if (cueBall) {
    cueBall.mesh.position.set(40, floorHeight + radius, 0);
  }

  moveCameraTo(topDownView);
  controls.enabled = true;

  gameState = 'repositioning';
  switchTurn();
}


function getCueBallView(baseDistance = 120, baseHeight = 80, zoomFactor = 0.2) {
  const cueBall = balls.find(b => b.isCue && !b.isFalling);
  if (!cueBall) return null;

  const lookAt = cueBall.mesh.position.clone();

  const direction = lookAt.clone().sub(camera.position).normalize();

  const distance = baseDistance * zoomFactor;
  const height = baseHeight * zoomFactor;

  const offset = direction.clone().multiplyScalar(-distance);
  offset.y += height;

  const position = lookAt.clone().add(offset);
  return { position, lookAt };
}




function updatePredictionPath() {
  if (!aiming || gameState !== 'aiming') {
    predictionPoints.visible = false;
    return;
  }

  predictionPoints.visible = true;

  const guidePlanes = scene.userData.guidePlanes;
  const cueBall = balls.find(b => b.isCue);
  if (!cueBall) return;

  const start = cueBall.mesh.position.clone();
  let direction = new THREE.Vector3(
    Math.cos(cueStick.rotation.y),
    0,
    -Math.sin(cueStick.rotation.y)
  ).normalize();

  const stepLength = 3;
  let currentPos = start.clone();
  currentPos.y -= 0.1;

  const positions = predictionPoints.geometry.attributes.position.array;
  let collisionDetected = false;
  let dotIndex = 0;

  for (let i = 0; i < predictionDotCount; i++) {
    if (collisionDetected) break;

    currentPos = currentPos.clone().add(direction.clone().multiplyScalar(stepLength));

    // ball-ball collisions stop the prediction
    for (const ball of balls) {
      // (radius + radius)^2
      if (!ball.isCue && currentPos.distanceToSquared(ball.mesh.position) < 16) {
        collisionDetected = true;
        break;
      }
    }
    // ball-guide collisions are predicted
    for (const { normal, point } of guidePlanes) {
      const toPoint = currentPos.clone().sub(point);
      const distToPlane = toPoint.dot(normal);
      if (distToPlane < 2) {
        const vDotN = direction.dot(normal);
        if (vDotN < 0) {
          const reflection = normal.clone().multiplyScalar(2 * vDotN);
          direction = direction.clone().sub(reflection).normalize();
        }
        break;
      }
    }

    
    positions[dotIndex * 3] = currentPos.x;
    positions[dotIndex * 3 + 1] = currentPos.y;
    positions[dotIndex * 3 + 2] = currentPos.z;
    dotIndex++;
  }

  // fills out the array when a ball-ball collision stops the prediction 
  for (let i = dotIndex; i < predictionDotCount; i++) {
    positions[i * 3] = 9999;
    positions[i * 3 + 1] = 9999;
    positions[i * 3 + 2] = 9999;
  }

  predictionPoints.geometry.attributes.position.needsUpdate = true;
}


function switchTurn() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  const newTurn = `Player ${currentPlayer}'s Turn`;
  if (lastTurn !== newTurn) {
    document.getElementById('turnIndicator').textContent = newTurn;
    lastTurn = newTurn;
  }
}

function updateScore() {
  document.getElementById('scoreDisplay').textContent =
    `Score - P1 : ${scores[1]} | P2 : ${scores[2]}`;
}



function resetGame() {
  balls.forEach(ball => {
    if (ball.mesh) {
      scene.remove(ball.mesh);


      if (ball.mesh.geometry) ball.mesh.geometry.dispose();
      if (ball.mesh.material) {
        if (Array.isArray(ball.mesh.material)) {
          ball.mesh.material.forEach(m => m.dispose());
        } else {
          ball.mesh.material.dispose();
        }
      }
    }
  });
  balls = [];

  if (cueStick) {
    scene.remove(cueStick);
    cueStick = null;
  }
  ballArrows.forEach(({ arrow }) => {
    scene.remove(arrow);
    arrow.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  });
  ballArrows = [];

  aiming = false;
  charging = false;
  cuePower = 0;
  powerDirection = 1;
  scored = false;
  anyHit = false;
  repositioning = false;
  gameState = 'idle';

  currentPlayer = 1;
  scores = { 1: 0, 2: 0 };
  updateScore();
  document.getElementById('turnIndicator').textContent = `Player ${currentPlayer}'s Turn`;
  document.getElementById('powerBar').style.width = '0%';
  document.getElementById('shootButton').style.display = 'none';

  balls = initBalls(scene);
  initCueStick();
  balls.forEach(ball => {
    if (ball.mesh && ball.mesh.material) {
      ball.mesh.material.envMap = scene.environment;
      ball.mesh.material.needsUpdate = true;
    }
  });
  for (const ball of balls) {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0), 
      new THREE.Vector3(),
      5,
      ball.isCue ? 0xffff00 : 0x00ffff,
      2,
      1
    );
    arrow.visible = false;
    scene.add(arrow);
    ballArrows.push({ arrow, ball });
  }

}

