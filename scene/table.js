import THREE from '../libs/three.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';


export function initTable(scene, renderer) {
  const loader = new GLTFLoader();
  loader.load('./assets/models/table.glb', (gltf) => {
    const table = gltf.scene;

    table.scale.set(1, 1, 1);
    table.position.set(0, 0, 0);
    scene.add(table);
    table.updateMatrixWorld(true);
    console.log('Table model loaded!');

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const texLoader = new THREE.TextureLoader();

    const fabricColor = texLoader.load(`${'./assets/textures/table/fabric/'}fabric_color.jpg`);
    fabricColor.colorSpace = THREE.SRGBColorSpace;
    const fabricNormal = texLoader.load(`${'./assets/textures/table/fabric/'}fabric_normal.png`);
    const fabricRough = texLoader.load(`${'./assets/textures/table/fabric/'}fabric_roughness.jpg`);
    const fabricAo = texLoader.load(`${'./assets/textures/table/fabric/'}fabric_ao.jpg`);
    [fabricColor, fabricNormal, fabricRough, fabricAo].forEach(tex => {
      tex.generateMipmaps = true;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = maxAnisotropy;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.repeat.set(2, 2);
    });

    const woodColor = texLoader.load(`${'./assets/textures/table/wood/'}wood_color.jpg`);
    woodColor.colorSpace = THREE.SRGBColorSpace;
    const woodNormal = texLoader.load(`${'./assets/textures/table/wood/'}wood_normal.png`);
    const woodRough = texLoader.load(`${'./assets/textures/table/wood/'}wood_roughness.png`);
    [woodColor, woodNormal, woodRough].forEach(tex => {
      tex.generateMipmaps = true;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = maxAnisotropy;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.repeat.set(2, 2);
    });

    const metalColor = texLoader.load(`${'./assets/textures/table/metal_1/'}metal_color.jpg`);
    metalColor.colorSpace = THREE.SRGBColorSpace;
    const metalNormal = texLoader.load(`${'./assets/textures/table/metal_1/'}metal_normal.png`);
    const metalRough = texLoader.load(`${'./assets/textures/table/metal_1/'}metal_roughness.jpg`);
    const metalAo = texLoader.load(`${'./assets/textures/table/metal_1/'}metal_ao.jpg`);
    const metalMetal = texLoader.load(`${'./assets/textures/table/metal_1/'}metal_metalness.jpg`);
    [metalColor, metalNormal, metalRough, metalAo, metalMetal].forEach(tex => {
      tex.generateMipmaps = true;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = maxAnisotropy;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.repeat.set(2, 2);
    });

    const mguideColor = texLoader.load(`${'./assets/textures/table/metal_2/'}metal_color.jpg`);
    mguideColor.colorSpace = THREE.SRGBColorSpace;
    const mguideNormal = texLoader.load(`${'./assets/textures/table/metal_2/'}metal_normal.png`);
    const mguideRough = texLoader.load(`${'./assets/textures/table/metal_2/'}metal_roughness.jpg`);
    const mguideAo = texLoader.load(`${'./assets/textures/table/metal_2/'}metal_ao.jpg`);
    const mguideMetal = texLoader.load(`${'./assets/textures/table/metal_2/'}metal_metalness.jpg`);
    [mguideColor, mguideNormal, mguideRough, mguideAo, mguideMetal].forEach(tex => {
      tex.generateMipmaps = true;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = maxAnisotropy;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.repeat.set(2, 2);
    });
 
    const pocketPositions = [];
    table.traverse(child => {
      if (child.isMesh) {

        if (child.name.toLowerCase().startsWith('pocket')) {
          child.geometry.scale(-1, -1, 1);
          child.geometry.computeVertexNormals();
          child.geometry.computeBoundingBox();
          const localCenter = new THREE.Vector3();
          child.geometry.boundingBox.getCenter(localCenter);
          child.material = new THREE.MeshStandardMaterial({
            metalness: 0.1,
            roughness: 0.9,
            side: THREE.DoubleSide
          });
          child.receiveShadow = true;
          child.castShadow = true;
          child.updateWorldMatrix(true, false);
          const worldCenter = localCenter.clone().applyMatrix4(child.matrixWorld);
          pocketPositions.push(worldCenter);
        }

        if (child.name.toLowerCase().includes("floor")) {
        child.geometry.scale(-1, -1, 1);
        child.geometry.computeVertexNormals();
        if (!child.geometry.attributes.uv2 && child.geometry.attributes.uv) {
          child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
        }
        child.material = new THREE.MeshStandardMaterial({
          map: fabricColor,
          normalMap: fabricNormal,
          roughnessMap: fabricRough,
          aoMap: fabricAo,
          roughness: 0.8,
          metalness: 0.1,
          side: THREE.DoubleSide,
        });
        child.receiveShadow = true;
        child.castShadow = true;
      }

      if (child.name.toLowerCase().startsWith('guide')) {
        child.geometry.scale(-1, -1, 1);
        child.geometry.computeVertexNormals();
        if (!child.geometry.attributes.uv2 && child.geometry.attributes.uv) {
          child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
        }
        child.material = new THREE.MeshStandardMaterial({
          map: fabricColor,
          normalMap: fabricNormal,
          roughnessMap: fabricRough,
          aoMap: fabricAo,
          roughness: 0.8,
          metalness: 0.1,
          side: THREE.DoubleSide
        });
        child.receiveShadow = true;
        child.castShadow = true;
      }

      if (child.name.toLowerCase().startsWith('wooden')) {
        child.geometry.scale(-1, -1, 1);
        child.geometry.computeVertexNormals();
        child.material = new THREE.MeshStandardMaterial({
          map: woodColor,
          normalMap: woodNormal,
          roughnessMap: woodRough,
          roughness: 0.8,
          metalness: 0.1
        });
        child.receiveShadow = true;
        child.castShadow = true;    
      }

      if (child.name.toLowerCase().startsWith('corner') || child.name.toLowerCase().startsWith('pocketend')) {
        child.geometry.scale(-1, -1, 1);
        child.geometry.computeVertexNormals();
        if (!child.geometry.attributes.uv2 && child.geometry.attributes.uv) {
          child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
        }
        child.material = new THREE.MeshStandardMaterial({
          map: metalColor,
          normalMap: metalNormal,
          roughnessMap: metalRough,
          metalnessMap: metalMetal,
          aoMap: metalAo,
          roughness: 0.6,
          metalness: 1.0
        });
        child.receiveShadow = true;
        child.castShadow = true;
      }

      if (child.name.toLowerCase().startsWith('ballguide')) {
        child.geometry.scale(-1, -1, 1);
        child.geometry.computeVertexNormals();
        if (!child.geometry.attributes.uv2 && child.geometry.attributes.uv) {
          child.geometry.setAttribute('uv2', child.geometry.attributes.uv);
        }
        child.material = new THREE.MeshStandardMaterial({
          map: mguideColor,
          normalMap: mguideNormal,
          roughnessMap: mguideRough,
          metalnessMap: mguideMetal,
          aoMap: mguideAo,
          roughness: 0.1,
          metalness: 1.0
        });
        child.receiveShadow = true;
        child.castShadow = true;
      }
    }
  });
  scene.userData.pocketPositions = pocketPositions;

 
  },
  undefined,
  (error) => {
    console.error('Failed to load table model:', error);
  });
}