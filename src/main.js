import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

const app = document.querySelector('#app');
app.style.flexDirection = (window.innerWidth < window.innerHeight) ? 'column' : 'row';
const canvas = document.querySelector('.canvas');
let dim = Math.min(window.innerWidth,window.innerHeight)*0.9;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75,1,0.1,1000);

const renderer = new THREE.WebGLRenderer({alpha:true});
renderer.setSize(dim,dim);
canvas.appendChild(renderer.domElement);

window.onresize = () => {
  dim = Math.min(window.innerWidth,window.innerHeight)*0.9;
  renderer.setSize(dim,dim);
  app.style.flexDirection = (window.innerWidth < window.innerHeight) ? 'column' : 'row';
}

const ambient = new THREE.AmbientLight(0xffffff,0.8);
const directional = new THREE.DirectionalLight(0xffffff);
directional.position.x = 1;
directional.position.z = 1;
scene.add(ambient,directional);

camera.position.z = 2;

const loader = new GLTFLoader();

let globe;
let countries;

const mats = {
  unselected : new THREE.MeshBasicMaterial({color:0xffff00,transparent:true}),
  selected : new THREE.MeshBasicMaterial({color:0x0000ff,transparent:true}),
  correct : new THREE.MeshBasicMaterial({color:0x00ff00,transparent:true}),
  incorrect : new THREE.MeshBasicMaterial({color:0xff0000,transparent:true}),
}

loader.load(
  '/globeAsset.glb',
  function (gltf) {
    scene.add(gltf.scene);
    globe = gltf.scene.children[0];

    countries = gltf.scene.children.slice(1);
    countries.forEach(country=>{
      country.material = mats.unselected;
    });
  },
  undefined,
  err=>console.log(err)
);

const orbitControls = new OrbitControls(camera,renderer.domElement);

function animate() {
  renderer.render(scene,camera);
}

renderer.setAnimationLoop(animate);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const label = document.querySelector('label');
const input = document.querySelector('input');
const button = document.querySelector('button');
let answer;

let clickStart;
canvas.addEventListener('mousedown', ()=>{
  clickStart = Date.now();
});

canvas.addEventListener('mouseup',event=>{
  if (Date.now() - clickStart > 250) {return}
  else {clickStart = undefined}
  pointer.x = (event.offsetX / canvas.offsetHeight)*2 - 1;
  pointer.y = -(event.offsetY / canvas.offsetHeight)*2 + 1;
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
      if (answer) {answer.material = mats.unselected}
      answer = closest;
      answer.material = mats.selected;
      label.textContent = 'What is this country?';
      input.disabled = false;
      button.disabled = false;
      input.focus();
    }
  }
});

const altNames = {
  united_states_of_america:['usa','united_states','america'],
  democratic_republic_of_the_congo:['drc'],
  united_arab_emirates:['uae'],
  central_african_republic:['car'],
  united_kingdom:['uk']
};

function simplify(text) {
  const chars = [];
  for (let i = 0; i < text.length; i++) {
    const chr = text.charCodeAt(i);
    if (chr >= 97 && chr <= 122) {
      chars.push(text[i]);
    }
    if (chr >= 65 && chr <= 90) {
      chars.push(String.fromCharCode(chr+32));
    }
  }
  return chars.join('').toLowerCase();
}

function check(guess,answer) {
  const simpleGuess = simplify(guess);
  if (answer in altNames) {
    for (const name of altNames[answer]) {
      if (simplify(name) === simpleGuess) return true;
    }
  }
  return simpleGuess === simplify(answer);
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
  if (check(input.value,answer.name)) {
    message.textContent = 'correct!';
    message.classList.add('correct');
    answer.material = mats.correct;
    w += 1;
  } else {
    message.classList.remove('correct');
    message.textContent=`incorrect! Answer: ${answer.name}`;
    answer.material = mats.incorrect;
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
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(0,0,(w/(w+l+countries.length))*1000,100);
  ctx.fillStyle = '#ff0000';
  ctx.fillRect((w/(w+l+countries.length))*1000,0,(l/(w+l+countries.length))*1000,100);
});

let visible = true;

canvas.addEventListener('dblclick',()=>{
  if (visible) {
    for (const material in mats) {
      mats[material].opacity = 0;
    }
  } else {
    for (const material in mats) {
      mats[material].opacity = 1;
    }
  }

  visible = !visible;
});