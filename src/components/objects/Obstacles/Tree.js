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

        this.position.x = x;
        this.position.z = z;
        this.position.y = (floory+gridsize)/2-0.7;

        // Add self to parent's update list
        parent.addToUpdateList(this);
    }

    update(timeStamp) {
    }
}

export default Tree;
