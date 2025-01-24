import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

const app = document.querySelector('#app');
const dim = Math.min(window.innerWidth,window.innerHeight)*0.9;
app.style.width = `${dim}px`;
app.style.height = `${dim}px`;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75,app.clientWidth/app.clientHeight,0.1,1000);
const cameraRadius = 2;
let theta = 0;
let phi = 0;
const setCamera = () => {
  camera.position.z = cameraRadius*Math.cos(theta)*Math.cos(phi);
  camera.position.x = cameraRadius*Math.sin(theta)*Math.cos(phi);
  camera.position.y = cameraRadius*Math.sin(phi);
  camera.lookAt(0,0,0);
}

const renderer = new THREE.WebGLRenderer();
renderer.setSize(app.clientWidth,app.clientHeight);
app.appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff,0.6);
const directional = new THREE.DirectionalLight(0xffffff);
directional.position.x = 1;
directional.position.z = 1;
scene.add(ambient,directional);

setCamera();

const loader = new GLTFLoader();

let globe;
let countries;

loader.load(
  '/globeAsset.glb',
  function (gltf) {
    scene.add(gltf.scene);
    globe = gltf.scene.children[0];
    countries = gltf.scene.children.slice(1);
  },
  undefined,
  err=>console.log(err)
);

function animate() {
  renderer.render(scene,camera);
}

renderer.setAnimationLoop(animate);

document.addEventListener('keydown',(event)=>{
  event.preventDefault();
  switch (event.key) {
    case 'ArrowRight':
      theta += 0.02;
      break;
    
    case 'ArrowLeft':
      theta -= 0.02;
      break;

    case 'ArrowUp':
      phi = Math.min(phi + 0.02,Math.PI/2);
      break;

    case 'ArrowDown':
      phi = Math.max(phi - 0.02,-Math.PI/2);
      break;
    
    default:
      break;
  }

  setCamera();
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

app.addEventListener('click',event=>{
  pointer.x = (event.offsetX / app.offsetWidth)*2 - 1;
  pointer.y = -(event.offsetY / app.offsetHeight)*2 + 1;
  raycaster.setFromCamera(pointer,camera);
  if (globe) {
    const intersection = raycaster.intersectObject(globe)[0];
    if (intersection) {
      const point = intersection.point;
      const [min,closest] = countries.reduce((prev,curr)=>{
        const distance = Math.sqrt((point.x-curr.position.x)**2+(point.y-curr.position.y)**2+(point.z-curr.position.z)**2);
        if (distance < prev[0]) {return [distance,curr]}
        return prev;
      },[2,null]);
      console.log(closest.name);
    }
  }
});