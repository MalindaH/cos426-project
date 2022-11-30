import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Flower, Land, Character } from 'objects';
import { BasicLights } from 'lights';
import * as THREE from 'three';

const floory = -1;
const gridsize = 2;

class SeedScene extends Scene {
    constructor() {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            rotationSpeed: 1,
            updateList: [],
            character: null,
        };

        // Set background to a nice color
        this.background = new Color("#ababab");

        // Add meshes to scene
        const lights = new BasicLights();

        // Populate GUI
        this.state.gui.add(this.state, 'rotationSpeed', -5, 5);

        this.populateScene();

        const character = new Character(this);
        this.state.character = character;
        const floor = this.makeFloor();
        this.add(lights, character, floor);
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { updateList } = this.state;
        // this.rotation.y = (rotationSpeed * timeStamp) / 10000;

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
    }

    makeFloor() {
        const width = 900;
        const height = 900;
        var geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshPhongMaterial({color: "#36abff", side: THREE.DoubleSide});
        const plane = new THREE.Mesh( geometry, material );
        plane.position.y = floory;
        plane.rotation.x = Math.PI/2;
        plane.receiveShadow = true;
        return plane;
    }

    populateScene() {
        // add logs / cars / ...

        this.makeCube(0x44aa88, 0, 0);
        var curx = 0;
        var curz = 0;
        for (var i = 0; i<10; i++) {
            curz += gridsize;
            this.makeCube(0x44aa88, curx, curz);
        }
    }

    makeCube(color, x, z) {
        const boxWidth = gridsize-0.1;
        const boxHeight = 1;
        const boxDepth = gridsize-0.1;
        const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
        const material = new THREE.MeshPhongMaterial({color});
       
        const cube = new THREE.Mesh(geometry, material);
        this.add(cube);
       
        cube.position.x = x;
        cube.position.y = floory+boxHeight/2;
        cube.position.z = z;
        cube.castShadow = true;
        cube.receiveShadow = true;

        return cube;
    }

    onDocumentKeyDown(e) {
        const {character} = this.state;
        if (e.which == 87) { // w
            character.jump(0, gridsize);
            // this.moveCamera(adjx, duration*ySpeed);
            // this.moveLight(adjx, duration*ySpeed);
        } else if (e.which == 65) { // a 
            character.jump(gridsize, 0);
            // const adjz = sphere.jump(duration*xSpeed, 0);
            // this.moveCamera(duration*xSpeed, adjz);
            // this.moveLight(duration*xSpeed, adjz);
        } else if (e.which == 83) { // s
            character.jump(0, -gridsize);
            // sphere.position.z -= duration*ySpeed;
        }  else if (e.which == 68) { // d
            character.jump(-gridsize, 0);
            // sphere.position.x -= duration*xSpeed;
        }
    };
}

export default SeedScene;
