import {vec3, vec4} from 'gl-matrix';
import {gl} from '../globals';
import * as Loader from 'webgl-obj-loader';

class Mesh {
  center: vec4;

  positionArray: vec3[];

  objString: string;

  constructor(objString: string, center: vec3) {
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    this.positionArray = [];
    this.objString = objString;
  }
  

  create() {  
    var loadedMesh = new Loader.Mesh(this.objString);

    for (let i = 0; i < loadedMesh.vertices.length; i+=3) {
      let x = loadedMesh.vertices[i] + this.center[0];
      let y = loadedMesh.vertices[i + 1] + this.center[1];
      let z = loadedMesh.vertices[i + 2] + this.center[2];
      let pos = vec3.fromValues(x, y, z);
      this.positionArray.push(pos);
    }

    console.log(`Created Mesh from OBJ`);
    this.objString = ""; // hacky clear
  }
};

export default Mesh;
