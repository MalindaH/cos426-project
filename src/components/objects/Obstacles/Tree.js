import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import * as THREE from 'three';

const floory = -1;
const gridsize = 2;
const charStartX = 10;

class Tree extends Group {
    constructor(parent, x, z, scale, side) {
        // Call parent Group() constructor
        super();

        // Init state
        this.state = {
            hitBox: null,
        };

        // Load object
        const loader = new GLTFLoader();

        loader.load('./src/gltf/tree/tree1.gltf', (gltf) => {
            gltf.scene.scale.set(scale, scale, scale);
            this.add(gltf.scene);
            gltf.scene.traverse( function( node ) {
                if ( node.isMesh ) { 
                    node.castShadow = true;
                }
            } );
            if(side==0) {
                gltf.scene.rotation.y = Math.PI;
            }
        });

        const boxWidth = 1.5*gridsize;
        const boxHeight = 3.5;
        const boxDepth = gridsize;
        const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
        const material = new THREE.MeshPhongMaterial(0xff9e00);
        const box = new THREE.Mesh(geometry, material);
        box.position.x = x-1;
        box.position.y = floory+1+boxHeight/2;
        box.position.z = z;
        box.visible = false;
        // this.add(box);

        this.position.x = x;
        this.position.z = z;
        this.position.y = (floory+gridsize)/2-0.7;

        var hitBox = new THREE.Box3().setFromObject(box);
        this.state.hitBox = hitBox;   

        // Add self to parent's update list
        // parent.addToUpdateList(this);
    }

    update(timeStamp) {
    }
}

export default Tree;
