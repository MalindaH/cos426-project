import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import * as THREE from 'three';

const floory = -1;
const gridsize = 2;
const charStartX = 10;

const boxWidth = gridsize+2;
const boxHeight = 1.5;
const boxDepth = gridsize-1;
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
const material = new THREE.MeshPhongMaterial(0xff9e00);
const box = new THREE.Mesh(geometry, material);

class Psafe extends Group {
    constructor(parent, x, z, side) {
        // Call parent Group() constructor
        super();

        // Init state
        this.state = {
            speed: 17,
            hitBox: null,
            charObject: null,
            // model: null,
            side: side,
        };

        // Load object
        const loader = new GLTFLoader();

        loader.load('./src/gltf/police/policecar.gltf', (gltf) => {
            gltf.scene.scale.set(0.8, 0.8, 0.8); 
            gltf.scene.position.y += 0.1;
            gltf.scene.position.x -= 0.2;
            this.add(gltf.scene);
            gltf.scene.traverse( function( node ) {
                if ( node.isMesh ) { node.castShadow = true; }
            } );
            if(side==0) {
                gltf.scene.rotation.y = -Math.PI/2;
            } else { // side==1
                gltf.scene.rotation.y = Math.PI/2;
            }

        });

        box.position.x = x;
        box.position.y = floory+1+boxHeight/2;
        box.position.z = z;
        this.state.charObject = box;
        box.visible = false;

        this.position.x = x;
        this.position.z = z;
        this.position.y = (floory+gridsize) / 2;

        // Create hitBox from box and attach to character
        var hitBox = new THREE.Box3().setFromObject(this.state.charObject);
        // hitBox.expandByVector(new THREE.Vector3(0, 0.1, 0));
        this.state.hitBox = hitBox;

        // Add self to parent's update list
        // parent.addToUpdateList(this);
    }

    // update(timeStamp) {
    // }
}

export default Psafe;
