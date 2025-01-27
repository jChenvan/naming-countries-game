import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

const app = document.querySelector('#app');
const dim = Math.min(window.innerWidth,window.innerHeight)*0.9;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75,1,0.1,1000);
const cameraRadius = 2;
let theta = 0;
let phi = 0;
const setCamera = () => {
  camera.position.z = cameraRadius*Math.cos(theta)*Math.cos(phi);
  camera.position.x = cameraRadius*Math.sin(theta)*Math.cos(phi);
  camera.position.y = cameraRadius*Math.sin(phi);
  camera.lookAt(0,0,0);
}

const renderer = new THREE.WebGLRenderer({alpha:true});
renderer.setSize(dim,dim);
app.prepend(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff,0.8);
const directional = new THREE.DirectionalLight(0xffffff);
directional.position.x = 1;
directional.position.z = 1;
scene.add(ambient,directional);

setCamera();

const loader = new GLTFLoader();

let globe;
let countries;

const unselected = new THREE.MeshBasicMaterial({color:0xffff00});
const selected = new THREE.MeshBasicMaterial({color:0xffae00});
const correct = new THREE.MeshBasicMaterial({color:0x00ff00});
const incorrect = new THREE.MeshBasicMaterial({color:0xff0000});

loader.load(
  '/globeAsset.glb',
  function (gltf) {
    scene.add(gltf.scene);
    globe = gltf.scene.children[0];
    countries = gltf.scene.children.slice(1);
    countries.forEach(country=>{
      country.material = unselected;
    });
  },
  undefined,
  err=>console.log(err)
);

function animate() {
  renderer.render(scene,camera);
}

renderer.setAnimationLoop(animate);

document.addEventListener('keydown',(event)=>{
  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault();
      theta += 0.02;
      break;
    
    case 'ArrowLeft':
      event.preventDefault();
      theta -= 0.02;
      break;

    case 'ArrowUp':
      event.preventDefault();
      phi = Math.min(phi + 0.02,Math.PI/2);
      break;

    case 'ArrowDown':
      event.preventDefault();
      phi = Math.max(phi - 0.02,-Math.PI/2);
      break;
    
    default:
      break;
  }

  setCamera();
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const label = document.querySelector('label');
const input = document.querySelector('input');
const button = document.querySelector('button');
let answer;

app.addEventListener('click',event=>{
  pointer.x = (event.offsetX / app.offsetHeight)*2 - 1;
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
      if (answer) {answer.material = unselected}
      answer = closest;
      answer.material = selected;
      label.textContent = 'What is this country?';
      input.disabled = false;
      button.disabled = false;
      input.focus();
    }
  }
});

function simplify(text) {
  const specials = [' ','_','-'];
  const chars = [];
  for (let i = 0; i < text.length; i++) {
    if (!specials.includes(text[i])) {
      chars.push(text[i]);
    }
  }
  return chars.join('').toLowerCase();
}

const score = {
  correct: document.querySelector('.score .correct'),
  incorrect: document.querySelector('.score .incorrect'),
  remaining: document.querySelector('.score .remaining'),
};
const ctx = document.querySelector('.score canvas').getContext("2d");
ctx.fillStyle = '#ffff00';
ctx.fillRect(0,0,1000,100);

const message = document.querySelector('.message');
let w = 0;
let l = 0;

button.addEventListener('click',(e)=>{
  e.preventDefault();
  if (simplify(input.value) === simplify(answer.name)) {
    message.textContent = 'correct!';
    message.classList.add('correct');
    answer.material = correct;
    w += 1;
  } else {
    message.classList.remove('correct');
    message.textContent=`incorrect! Answer: ${answer.name}`;
    answer.material = incorrect;
    l += 1;
  }
  countries.forEach((val,index)=>{
    if (val.name === answer.name) {
      countries.splice(index,1);
    }
  });
  answer = undefined;
  input.value = '';
  input.disabled = true;
  button.disabled = true;
  score.correct.textContent = w;
  score.incorrect.textContent = l;
  score.remaining.textContent = countries.length;
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(0,0,1000,100);
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(0,0,(w/(w+l+countries.length))*1000,100);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect((w/(w+l+countries.length))*1000,0,(l/(w+l+countries.length))*1000,100);
});