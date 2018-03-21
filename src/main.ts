import {vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Particle from './Particle';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 5,
  'Load Scene': loadScene, // A function pointer, essentially
};

let square: Square;
let time: number = 0.0;
let particles: Particle[];
let n: number = 20.0;
let t: Date;
let deltaTime: number;

function loadScene() {
  square = new Square();
  square.create();
  particles = [];
  t = new Date();

  // Setting up particles
  for(let i = 0; i < n; i++) {
    for(let j = 0; j < n; j++) {
      // particles.push(new Particle(vec3.fromValues(i,j,0),
      //     vec3.fromValues(0,1,0), vec3.fromValues(0,0,0)));

          particles.push(new Particle(vec3.fromValues(i,j,0),
          vec3.create(), vec3.create()));    
      }
  }
}

function computeParticles() {
  let offsetsArray = [];
  let colorsArray = [];
  for (let i = 0; i < particles.length; i++) {
    particles[i].updateForces(deltaTime);
    let pos = particles[i].pos;
    offsetsArray.push(pos[0]);
    offsetsArray.push(pos[1]);
    offsetsArray.push(pos[2]);

    colorsArray.push(pos[0] / n);
    colorsArray.push(pos[1] / n);
    colorsArray.push(1.0);
    colorsArray.push(1.0); // Alpha channel
  }
  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  square.setInstanceVBOs(offsets, colors);
  square.setNumInstances(particles.length); // 10x10 grid of "particles"
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

  const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));

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
    let newTime = new Date();
    deltaTime = (newTime.getTime() - t.getTime()) / 100;
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

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  window.addEventListener('mousedown', function(event) {
    // computeParticles();
    let x = event.clientX;
    let y = event.clientY;

    let sx = 2 * x / screen.width - 1;
    let sy = 1  - (2 * y / screen.height);

    // console.log("sx: ", sx);
    // console.log("sy: ", sy);

    let look: vec3 = camera.target;
    vec3.subtract(look, look, camera.position);
    let len = vec3.length(look);
    let tana = Math.tan(camera.fovy / 2);

    let V = vec3.create();
    vec3.scale(V, camera.up, len * tana);
    
    let H = vec3.create();
    vec3.scale(H, camera.right, len * camera.aspectRatio * tana);

    let p = vec3.create();
    vec3.scale(H, H, sx);
    vec3.scale(V, V, sy);
    vec3.add(p, camera.target, H);
    vec3.add(p, p, V);
    console.log("hello: ", p);
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
