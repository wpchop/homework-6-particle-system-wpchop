import {vec3} from 'gl-matrix';
import { isNull } from 'util';

class Particle {

    pos: vec3;
    vel: vec3;
    acc: vec3;

    speed: number;
    accMagnitude: number;

    target: vec3;
    repel: boolean;

    targets: vec3[];

    maxVel: number = 3;
    
    constructor(pos: vec3, vel: vec3, acc: vec3) {
        this.pos = pos;
        this.vel = vel;
        this.acc = acc;
        this.targets = [];
    }

    setTarget(target: vec3, repel: boolean) {
        this.target = target;
        this.repel = repel;
    }
    
    addTarget(target:vec3) {
        this.targets.push(target);
    }

    setMeshTarget(idx: number) {
        this.target = this.targets[idx];
    }
    
    updateForces(time: number) {
        if (this.target !== undefined) {
            let accDirection = vec3.create();
            vec3.subtract(accDirection, this.target, this.pos);
            vec3.scale(this.acc, this.acc, 0.1);
            this.acc = accDirection;
            if (this.repel) {
                vec3.negate(this.acc, this.acc);
            }
            let distToTarget =  vec3.distance(this.target, this.pos);
            if ( distToTarget < 1) {
                vec3.normalize(this.vel, this.vel);
                if (distToTarget < 0.2) {
                    vec3.scale(this.vel, this.vel, 0.5);
                }
            }
        }

        let deltaPos = vec3.create();

       if ( vec3.length(this.vel) > this.maxVel) {
        vec3.normalize(this.vel, this.vel);
        vec3.scale(this.vel, this.vel, this.maxVel);
       }

        vec3.scale(deltaPos, this.vel, time);
        vec3.add(this.pos, this.pos, deltaPos);

        let deltaVel = vec3.create();
        vec3.scale(deltaVel, this.acc, time);
        vec3.add(this.vel, this.vel, deltaVel);

    }

} 

export default Particle;