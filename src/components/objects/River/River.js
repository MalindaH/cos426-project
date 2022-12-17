import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import * as THREE from 'three';
import LogBoat from '../LogBoat/LogBoat';

import watertexture from '../../../textures/water.png';

const floory = -1;
const jumpTimeTotal = 15;
const gridsize = 2;
let playable = 27;
let playablewidth = playable * gridsize;
// let totalWidth = 27 * gridsize;
const charStartX = 10;


class River extends Group {
    constructor(parent, idx) {
        // Call parent Group() constructor
        super();

        // Init state
        this.state = {
            gui: parent.state.gui,
            speed : 0.005,
            direction: false,
            boats: null,
            prevTimeStamp: 0,
            hitBox: null,
            // visualHitBoxes: [],
        };

        const texture = new THREE.TextureLoader().load( watertexture );
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(10, 1);
        const material = new THREE.MeshPhongMaterial( { map: texture} );

        // const textureEdge = new THREE.TextureLoader().load( './src/textures/water2.png' );
        // const textureEdge = texture;
        // textureEdge.wrapS = THREE.RepeatWrapping;
        // texture.wrapT = THREE.RepeatWrapping;
        // texture.repeat.set(10, 1);
        // const materialEdge = new THREE.MeshPhongMaterial( { map: textureEdge} );

        const boxWidth = playablewidth;
        const boxHeight = gridsize;
        const boxDepth = gridsize - 0.3;
        const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
        // geometry.computeBoundingBox();
        // this.state.hitBox = geometry.boundingBox;
        

        const Playable = () => new THREE.Mesh(
            geometry, 
            material
        );
        // const Nonelayable = () => new THREE.Mesh(
        //     geometry, 
        //     materialEdge
        // );
        const river = Playable()
        river.receiveShadow = true;
        this.add(river);

        // const edgeL = Nonelayable();
        // edgeL.position.x = -playablewidth;
        // this.add(edgeL);

        // const edgeR = Nonelayable();
        // edgeR.position.x = playablewidth;
        // this.add(edgeR);

        this.position.x = charStartX;
        this.position.y = floory;
        this.rotation.x = -Math.PI/2;
        this.position.z = gridsize * idx
        this.receiveShadow = true;

        var hitBox = new THREE.Box3().setFromObject(river);
        this.state.hitBox = hitBox;
        this.state.hitBox.translate(new THREE.Vector3(0,0,idx*gridsize));

        // River

        // Adding boats

        let flag = Math.random()
        
        if  (flag > 0.5) {
            this.state.direction = true
        } else {
            this.state.direction = false
        }
            
        const taken = new Set();
        this.state.boats = [1,1,1].map(() => {
            const boat = new LogBoat(parent, idx);
            //boat.state.hitBox.translate(new THREE.Vector3(gridsize * 10,gridsize * 10,0))
            let spot = Math.floor(Math.random()*playable/2)
            while(taken.has(spot)) {
                spot = Math.floor(Math.random()*playable/2)
            }
            taken.add(spot);
            boat.position.x = (spot*gridsize*2+gridsize/2)-playable/2;
            if(!this.state.direction) {
                boat.state.log.rotation.z = Math.PI;
            }
            
            this.add( boat );
            return boat;
        })

        //this.speed = laneSpeeds[Math.floor(Math.random()*laneSpeeds.length)];
        parent.addToUpdateList(this);

    }
    

    update(timeStamp) {
        // this.state.visualHitBoxes.forEach(visual=> {
        //     this.remove(visual);
        // });
        // this.state.boats.forEach(boat=>{
        //     var visualBox = new THREE.Box3Helper(boat.state.hitBox, 0xff0000);
        //     this.add(visualBox);
        // });


        let subt = 0
        if (this.state.prevTimeStamp == 0){
            this.state.prevTimeStamp = timeStamp
        }
        subt = timeStamp - this.state.prevTimeStamp
        this.state.prevTimeStamp = timeStamp
        const edgeL = -playablewidth/2 - gridsize;
        const edgeR = playablewidth/2 + gridsize;
        this.state.boats.forEach(boat => {
            if(this.state.direction) {
                var prev = boat.position.clone()
                if (boat.position.x < edgeL) {
                    boat.position.x = edgeR
                    boat.state.log.x = edgeR
                } else {
                    boat.position.x -= this.state.speed*subt;
                    boat.state.log.x -= this.state.speed*subt;
                }
                var posOff = boat.position.clone().sub(prev);
                posOff.setX = Math.round(posOff.x);
                posOff.setZ = Math.round(posOff.z);
                boat.state.hitBox.translate(posOff);
                
                
                
            }else{
                var prev = boat.position.clone()
                if (boat.position.x > edgeR) {
                    boat.position.x = edgeL
                    boat.state.log.x = edgeL
                } else {
                    boat.position.x += this.state.speed*subt;
                    boat.state.log.x += this.state.speed*subt;
                }
                var posOff = boat.position.clone().sub(prev);
                posOff.setX = Math.round(posOff.x);
                posOff.setZ = Math.round(posOff.z);
                boat.state.hitBox.translate(posOff);
            }
        });
        
    }

}

export default River;
