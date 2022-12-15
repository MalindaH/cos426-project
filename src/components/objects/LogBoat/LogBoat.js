import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import * as THREE from 'three';
// import MODEL from './mallard/scene.gltf';

const floory = -1;
const jumpTimeTotal = 15;
const gridsize = 2;
let playable = 16
let playablewidth = playable * gridsize
let totalWidth = 21 * gridsize



class LogBoat extends Group {
    constructor(parent, idx) {
        // Call parent Group() constructor
        super();

        this.state = {
            log : null,
            hitBox : null,
            prev: new THREE.Vector3(0,0,0)
        };

        let log = this.makeBoat(0x966F33, 0, 0);
        // log.geometry.computeBoundingBox()
        this.state.log = log;
        // this.state.hitBox = log.geometry.boundingBox;
        var hitBox = new THREE.Box3().setFromObject(log);
        hitBox.expandByVector(new THREE.Vector3(0, 0.1, 0));
        this.state.hitBox = hitBox;

        // this.state.hitBox.translate(log.position)
        this.state.hitBox.translate(new THREE.Vector3(10,0,idx*gridsize));


        this.castShadow = true;
        this.receiveShadow = true;
        parent.addToUpdateList(this);
    }

    makeBoat(color, x, z) {
        
        const boxWidth = (2*gridsize)-0.3;
        const boxHeight = gridsize-0.5;
        const boxDepth = gridsize;
        const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
        const material = new THREE.MeshPhongMaterial({color});
       
        const cube = new THREE.Mesh(geometry, material);
        this.add(cube);
       
        cube.position.x = x;
        cube.position.y = (floory+boxHeight/2)+0.25;
        cube.position.z = z;
        cube.castShadow = true;
        cube.receiveShadow = true;

        return cube;
    }

    update(timeStamp) {
        var posOff = this.position.clone().sub(this.state.prev);
        posOff.setX = Math.round(posOff.x);
        posOff.setZ = Math.round(posOff.z);
        this.state.hitBox.translate(posOff);
        this.state.prev = this.position;
    }

}

export default LogBoat;
