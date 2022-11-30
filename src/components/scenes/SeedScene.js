import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Flower, Land, Character } from 'objects';
import { BasicLights } from 'lights';
import * as THREE from 'three';

const floory = -1;
const gridsize = 2;

class SeedScene extends Scene {
    constructor(camera, controls) {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            updateList: [],
            character: null,
            camera: camera,
            controls: controls,
            lights: null,
        };

        // Set background to a nice color
        this.background = new Color("#ababab");

        // Add meshes to scene
        const lights = new BasicLights();
        this.state.lights = lights;
        this.add(lights.state.dir.target);

        // Populate GUI
        // this.state.gui.add(this.state, 'rotationSpeed', -5, 5);

        this.populateScene();

        const character = new Character(this);
        this.state.character = character;
        const floor = this.makeFloor();
        this.add(lights, character, floor);

        // const cameraHelper = new THREE.CameraHelper(lights.state.dir.shadow.camera);
        // this.add(cameraHelper);
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { updateList } = this.state;

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
        // TODO: add logs / cars / ...

        // placeholder cubes
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
            this.moveCamera(0, gridsize);
        } else if (e.which == 65) { // a 
            character.jump(gridsize, 0);
            this.moveCamera(gridsize, 0);
        } else if (e.which == 83) { // s
            character.jump(0, -gridsize);
            this.moveCamera(0, -gridsize);
        }  else if (e.which == 68) { // d
            character.jump(-gridsize, 0);
            this.moveCamera(-gridsize, 0);
        }
    }

    moveCamera(movex, movez) {
        const {camera} = this.state;
        camera.position.x += movex;
        camera.position.z += movez;

        this.moveLight(movex, movez);
    }

    moveLight(movex, movez) {
        const {lights} = this.state;
        lights.state.dir.position.x += movex;
        lights.state.dir.position.z += movez;
        lights.state.dir.target.position.x += movex;
        lights.state.dir.target.position.z += movez;
    }
}

export default SeedScene;
