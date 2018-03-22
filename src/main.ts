import {vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL, readTextFile} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Particle from './Particle';
import Mesh from './geometry/Mesh';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
  repel: false,
  mesh: 'none',
};

let square: Square;
let time: number = 0.0;
let particles: Particle[];
let t: Date;
let deltaTime: number;

let mesh: String;

let obj0: string;
let mesh0: Mesh;

let obj1: string;
let mesh1: Mesh;

let obj2: string;
let mesh2: Mesh;

const n: number = 60.0;

function loadOBJText() {
  obj0 = readTextFile('https://raw.githubusercontent.com/CIS-566-2018/homework-6-particle-system-wpchop/9d091d94195790ce9e426b551dd3024939d9a218/resources/obj/wahoo.obj');
  obj1 = readTextFile('https://raw.githubusercontent.com/wpchop/homework-6-particle-system-wpchop/master/resources/obj/bunny1.obj');
  obj2 = readTextFile('https://raw.githubusercontent.com/wpchop/homework-6-particle-system-wpchop/master/resources/obj/Toilet.obj');
}

function loadScene() {
  square = new Square();
  square.create();
  particles = [];
  t = new Date();

  // Setting up particles
  for(let i = 0; i < n; i++) {
    for(let j = 0; j < n; j++) {
          particles.push(new Particle(vec3.fromValues((i - n/2),(j - n/2),-10),
          vec3.create(), vec3.create()));    
      }
  }
  loadOBJText();
  mesh0 = new Mesh(obj0, vec3.fromValues(0, -8, -10));
  mesh0.create();

  mesh1 = new Mesh(obj1, vec3.fromValues(0,0,0));
  mesh1.create();

  mesh2 = new Mesh(obj2, vec3.fromValues(0,0,-50));
  mesh2.create();

  addMeshPoints(mesh0);
  addMeshPoints(mesh1);
  addMeshPoints(mesh2);
}

function addMeshPoints(mesh: Mesh) {
  let n = particles.length;
  let m = mesh.positionArray.length;
  let partIdx = 0;

  while (partIdx < n) {
    let i = Math.floor(Math.random() * m);
    particles[partIdx].addTarget( mesh.positionArray[i]);
    // particles[partIdx].pos = mesh.positionArray[i];
    partIdx++;
  }
}

// Update particles positions, velocities and resets instance VBOs
function computeParticles() {
  let offsetsArray = [];
  let colorsArray = [];
  for (let i = 0; i < particles.length; i++) {
    particles[i].updateForces(deltaTime);
    let pos = particles[i].pos;
    offsetsArray.push(pos[0]);
    offsetsArray.push(pos[1]);
    offsetsArray.push(pos[2]);
    
    let speed = vec3.length(particles[i].vel) / 4;
    colorsArray.push(speed * 0.75 + 0.25);
    colorsArray.push(speed *0.7);
    colorsArray.push(speed * 0.25 + 0.75);
    colorsArray.push(1.0); // Alpha channel
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  square.setInstanceVBOs(offsets, colors);
  square.setNumInstances(particles.length);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'repel');
  gui.add(controls, 'mesh', ['none', 'wahoo', 'bunny', 'toilet']);

  mesh = controls.mesh;

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, -100), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/particle-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    if (controls.mesh != mesh) {
      mesh = controls.mesh;
      if (mesh == "wahoo") {
        setTargetAsMesh(0);
      } else if (mesh == "bunny") {
        setTargetAsMesh(1);
      } else if (mesh == "toilet") {
        setTargetAsMesh(2);
      } else {

      }
    }

    let newTime = new Date();
    deltaTime = (newTime.getTime() - t.getTime()) / 500;
    t = newTime;

    computeParticles();

    camera.update();
    stats.begin();
    lambert.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, lambert, [
      square,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  // Sets all particles target to a position corresponding to
  // the mesh at index in their targets array
  function setTargetAsMesh(index: number) {
    for (let i = 0; i < particles.length; i++) {
      particles[i].setMeshTarget(index);
    }
  }

  // Sets all particles' targets to p
  function setParticleTargets(p: vec3, repel: boolean) {
    for (let i = 0; i < particles.length; i++) {
      particles[i].setTarget(p, repel);
    }
  }

  // Returns a world space point based on pixelspace x and y
  function rayCast(x: number, y: number) {
    let sx = 2 * x / screen.width - 1;
    let sy = 1  - (2 * y / screen.height);

    let look: vec3 = camera.target;
    vec3.subtract(look, look, camera.position);
    let len = vec3.length(look);
    let tana = Math.tan(camera.fovy / 2);

    let V = vec3.create();
    vec3.scale(V, camera.up, len * tana);
    
    let H = vec3.create();
    vec3.scale(H, camera.right, len * camera.aspectRatio * tana);

    // Point in world space
    let p = vec3.create();
    vec3.scale(H, H, sx);
    vec3.scale(V, V, sy);
    vec3.add(p, camera.target, H);
    vec3.add(p, p, V);
    return p;
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  window.addEventListener('mousedown', function(event) {
    if (mesh == "none") {
    let p = rayCast(event.clientX, event.clientY);
    setParticleTargets(p, controls.repel);
    }

  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
