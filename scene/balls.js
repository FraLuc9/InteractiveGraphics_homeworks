import THREE from '../libs/three.js';

const BALL_RADIUS = 2;
const BALL_TEXTURE_PATH = './assets/textures/balls/';

export function initBalls(scene) {
  const balls = [];
  const floor_height = 48.7811;
  const cueMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.4
  });
  const cueBall = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 32, 32), cueMaterial);
  cueBall.castShadow = true;
  cueBall.receiveShadow = false;
  cueBall.position.set(40, floor_height+BALL_RADIUS, 0);
  scene.add(cueBall);
  balls.push({
    mesh: cueBall,
    velocity: new THREE.Vector3(0, 0, 0),
    angularVelocity: new THREE.Vector3(0, 0, 0),
    isCue: true,
    isFalling: false,
    fallTarget: null
  });


  const loader = new THREE.TextureLoader();

  const spacing = BALL_RADIUS * 2 + 0.01;
  const startX = -40;
  const startZ = 0;

  let indexes = [1, 4, 10, 14, 8, 6, 13, 15, 5, 11, 9, 3, 7, 12, 2];
  let i=0;
  let ballIndex = indexes[i];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      if (i > 14) break;

      const x = startX;
      const z = startZ + (col - row / 2) * spacing;
      const y = floor_height+BALL_RADIUS;

      const texture = loader.load(`${BALL_TEXTURE_PATH}poolballs${ballIndex}.png`);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.2,
        metalness: 0.4 
      });
      const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 32, 32), material);
      ballMesh.castShadow = true;
      ballMesh.receiveShadow = false;
      ballMesh.position.set(x - row * spacing * 0.866, y, z);
      scene.add(ballMesh);

      balls.push({
        mesh: ballMesh,
        velocity: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0),
        isCue: false,
        number: ballIndex,
        type: (ballIndex === 8) ? 'eight' : (ballIndex < 8) ? 'solid' : 'striped',
        isFalling: false,
        fallTarget: null
      });

      ballIndex = indexes[++i];
    }
  }

  return balls;
}


