import { DoubleSide, Group, Scene } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import * as THREE from 'three';
// import MODEL from './flower.gltf';

const floory = -1;
const jumpTimeTotal = 15;
const gridsize = 2;

class Character extends Group {
    constructor(parent) {
        // Call parent Group() constructor
        super();

        // Init state
        this.state = {
            gui: parent.state.gui,
            jumping: false,
            jumpQueue: [],
            jumpMovex: 0,
            jumpMovez: 0,
            jumpTimeTotal: 0,
            jumpTimeElapsed: 0,
            jumpSpeed: 0.2,
            xPos: 0,
            zPos: 0,
            hitBox: null,
            visualBox: null,
            charObject: null,
        };

        // // Load object
        // const loader = new GLTFLoader();

        // this.name = 'flower';
        // loader.load(MODEL, (gltf) => {
        //     this.add(gltf.scene);
        // });

        // Create Sphere
        var sphere = this.makeSphere(0xaa33aa, 0, 0);
        this.state.charObject = sphere;
        this.add(sphere);

        // Create hitBox from sphere and attach to character
        var hitBox = new THREE.Box3().setFromObject(sphere);
        hitBox.expandByVector(new THREE.Vector3(0, 0.6, 0));
        this.state.hitBox = hitBox;

        // HITBOX VISUAL
        var visualBox = new THREE.Box3Helper(hitBox);
        this.state.visualBox = visualBox;
        this.add(visualBox);

        // Add self to parent's update list
        parent.addToUpdateList(this);

        // // Populate GUI
        // this.state.gui.add(this.state, 'bob');
        // this.state.gui.add(this.state, 'spin');
    }

    makeSphere(color, x, z) {
        const radius = 0.7;  // ui: radius
        const widthSegments = 12;  // ui: widthSegments
        const heightSegments = 8;  // ui: heightSegments
        const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        const material = new THREE.MeshPhongMaterial({color});

        const sphere = new THREE.Mesh(geometry, material);

        sphere.position.x = x;
        sphere.position.y = floory+radius+1;
        sphere.position.z = z;
        sphere.castShadow = true;
        sphere.receiveShadow = true;
       
        return sphere;
    }

    addToJumpQueue(direction) {
        if(this.state.jumpQueue.length<3) {
            this.state.jumpQueue.push(direction);
        }
    }

    jump(movex, movez) {
        // character only allowed to reach -6 to +6 grids (jump 5 times from center)
        if(this.position.x + movex >= -1*gridsize && this.position.x + movex <= 9*gridsize && this.position.z + movez >= 0) {
            this.state.jumpMovex = movex;
            this.state.jumpMovez = movez;
        }
    }

    update(timeStamp) {

        // add jump from queue
        if(!this.state.jumping && this.state.jumpQueue.length>0) {
            switch(this.state.jumpQueue.shift()) { // deletes first element from array
                case 1: //"forward"
                    this.jump(0, gridsize);
                    break;
                case 2: //"left"
                    this.jump(gridsize, 0);
                    break;
                case 3: //"backward"
                    this.jump(0, -gridsize);
                    break;
                case 4: //"right"
                    this.jump(-gridsize, 0);
                    break;
            }
        }

        // Previous position
        var prevPos = this.position.clone();

        // execute jump animation
        const EPS = 0.001;
        if(!this.state.jumping && (this.state.jumpMovex>EPS || this.state.jumpMovex<-EPS || this.state.jumpMovez>EPS || this.state.jumpMovez<-EPS)) {
            this.state.jumping = true;
            if(this.state.jumpMovex>EPS || this.state.jumpMovex<-EPS) {
                this.state.jumpSpeed = this.state.jumpMovex/jumpTimeTotal;
                this.position.x += this.state.jumpSpeed;
                this.state.jumpMovex -= this.state.jumpSpeed;
            }
            if(this.state.jumpMovez>EPS || this.state.jumpMovez<-EPS) {
                this.state.jumpSpeed = this.state.jumpMovez/jumpTimeTotal;
                this.position.z += this.state.jumpSpeed;
                this.state.jumpMovez -= this.state.jumpSpeed;
            }
            this.state.jumpTimeElapsed += 1;
            this.position.y = Math.abs(Math.sin(Math.min(1,this.state.jumpTimeElapsed/jumpTimeTotal)*Math.PI)) * 2;
        }
        else if(this.state.jumping) {
            if(this.state.jumpMovex<=EPS && this.state.jumpMovex>=-EPS && this.state.jumpMovez<=EPS && this.state.jumpMovez>=-EPS) {
                this.state.jumping = false;
                this.state.jumpTime = 0;
                this.state.jumpTimeElapsed = 0;
                this.state.jumpMovex = 0;
                this.state.jumpMovez = 0;
                this.state.cubeIndex++;
                this.checkLand();
            } else {
                this.state.jumpTimeElapsed += 1;
                this.position.y = Math.abs(Math.sin(Math.min(1,this.state.jumpTimeElapsed/jumpTimeTotal)*Math.PI)) * 2;
                if(this.state.jumpMovex>EPS || this.state.jumpMovex<-EPS) {
                    this.position.x += this.state.jumpSpeed;
                    this.state.jumpMovex -= this.state.jumpSpeed;
                }
                if(this.state.jumpMovez>EPS || this.state.jumpMovez<-EPS) {
                    this.position.z += this.state.jumpSpeed;
                    this.state.jumpMovez -= this.state.jumpSpeed;
                }
            }
        }
        
        // Position offset
        var posOff = this.position.clone().sub(prevPos);
        
        //Round x and z coords
        posOff.setX = Math.round(posOff.x);
        posOff.setZ = Math.round(posOff.z);
        this.state.hitBox.translate(posOff);
        // Advance tween animations, if any exist
        // TWEEN.update();
    }

    checkLand() {
        // const {cubes, cubeIndex} = this.state; // box is 2x2
        // // console.log(cubes[cubeIndex]);
        // if(this.position.x>=cubes[cubeIndex][0]-1 && this.position.x<=cubes[cubeIndex][0]+1 
        //     && this.position.z>=cubes[cubeIndex][1]-1 && this.position.z<=cubes[cubeIndex][1]+1) {
        //         console.log("landed");
        //     } else {
        //         console.log("game over");
        //     }
    }
}

export default Character;
