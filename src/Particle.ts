import {vec3} from 'gl-matrix';

class Particle {

    pos: vec3;
    vel: vec3;
    acc: vec3;
    
    constructor(pos: vec3, vel: vec3, acc: vec3) {
        this.pos = pos;
        this.vel = vel;
        this.acc = acc;
    }
    
    updateForces(time: number) {
        let deltaPos = vec3.create();
        vec3.scale(deltaPos, this.vel, time);
        vec3.add(this.pos, this.pos, deltaPos);

        let deltaVel = vec3.create();
        vec3.scale(deltaVel, this.acc, time);
        vec3.add(this.vel, this.vel, deltaVel);
    }

} 

export default Particle;