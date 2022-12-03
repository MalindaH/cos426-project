import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Flower, Land, Character } from 'objects';
import { BasicLights, OrthoCamera } from 'lights';
// import { OrthoCamera } from 'cameras';
import * as THREE from 'three';

const floory = -1;
const gridsize = 2;
const cameraForwardSpeed = 0.01*gridsize;

class SeedScene extends Scene {
    constructor(camera) {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            updateList: [],
            character: null,
            camera: camera,
            cameraOrigX: camera.position.x,
            cameraOrigY: camera.position.y,
            cameraOrigZ: camera.position.z,
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

        const cameraHelper = new THREE.CameraHelper(lights.state.dir.shadow.camera);
        this.add(cameraHelper);
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { updateList } = this.state;

        this.cameraMovement();
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
        var curx = -20;
        var curz = 0;
        for (var i = 0; i<10; i++) {
            this.makeCube(0x44aa88, curx, curz);
            for(var j=0; j<20; j++) {
                curx += gridsize;
                this.makeCube(0x44aa88, curx, curz);
            }
            curz += gridsize;
            curx=-20;
        }
    }

    makeCube(color, x, z) {
        const boxWidth = gridsize-0.3;
        const boxHeight = 1;
        const boxDepth = gridsize-0.3;
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
            character.addToJumpQueue(1);
            // character.jump(0, gridsize);
            // this.moveCamera(0, gridsize);
        } else if (e.which == 65) { // a 
            character.addToJumpQueue(2);
            // character.jump(gridsize, 0);
            // this.moveCamera(gridsize, 0);
        } else if (e.which == 83) { // s
            character.addToJumpQueue(3);
            // character.jump(0, -gridsize);
            // this.moveCamera(0, -gridsize);
        }  else if (e.which == 68) { // d
            character.addToJumpQueue(4);
            // character.jump(-gridsize, 0);
            // this.moveCamera(-gridsize, 0);
        }
    }

    cameraMovement() {
        const {camera, character, cameraOrigX, cameraOrigY, cameraOrigZ} = this.state;
        // constantly move forward
        camera.position.z += cameraForwardSpeed;
        this.moveLight(0, cameraForwardSpeed);

        // follow character: character only allowed to reach -6 to +6 grids (jump 5 times from center)
        const distX = camera.position.x - cameraOrigX - character.position.x;
        const distZ = camera.position.z - cameraOrigZ - character.position.z;
        // distance between them --> speed
        const speedX = -distX/100;
        const speedZ = Math.max(0,-distZ/100); // camera doesn't move backwards
        camera.position.x += speedX;
        camera.position.z += speedZ;
        this.moveLight(speedX, speedZ);
    }

    // moveCamera(movex, movez) {
    //     const {camera} = this.state;
    //     camera.position.x += movex;
    //     camera.position.z += movez;
    //     console.log(camera.position);
    //     this.moveLight(movex, movez);
    // }

    moveLight(movex, movez) {
        const {lights} = this.state;
        lights.state.dir.position.x += movex;
        lights.state.dir.position.z += movez;
        lights.state.dir.target.position.x += movex;
        lights.state.dir.target.position.z += movez;
    }
}

export default SeedScene;
