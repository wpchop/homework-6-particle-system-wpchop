
### Particle System

### Wenli Zhao
### wenliz

[live demo](https://wpchop.github.io/homework-6-particle-system-wpchop/)

**Goal:** to make physics-based procedural animation of particles and to practice using OpenGL's instanced rendering system.

**Inspiration:** DMD and CGGT alumnus Nop Jiarathanakul's [Particle Dream application](http://www.iamnop.com/particles/).

## Particle collection 
I added a particle class that keeps track of position, velocity, acceleration and a target.

## Procedural coloration and shaping of particles
I made the particle center much smaller, so it looks like a dot rather than a large glowing sphere. The color is mapped to a gradient from purple to magenta to white and is based on the speed of the particles

## Interactive forces
When no mesh is selected, you can choose to either attract or repel the particles with mouse clicks.

## Mesh surface attraction
When a mesh is selected, the particles are attracted to random points on the mesh.
