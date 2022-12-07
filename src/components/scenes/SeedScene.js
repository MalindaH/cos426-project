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
    constructor(camera, controls) {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            updateList: [],
            character: null,
            camera: camera,
            cameraOrigX: camera.position.x,
            // cameraOrigY: camera.position.y,
            cameraOrigZ: camera.position.z,
            lights: null,
            floorHitBox:[],
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

        this.cameraMovement();
        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
        
        var isColliding = false;
        var isJumping = this.state.character.state.jumping;
        // Reset visual of character hitbox
        if(isColliding && isJumping) {
            isColliding = false;
            char = this.state.character.state;
            char.visualBox = new THREE.Box3Helper(char.hitBox);
            this.state.character.add(char.visualBox);
        }

        // Check for collision
        if(!isJumping){
            var x = Math.ceil(this.state.character.position.x);//this.state.character.state.xPos;
            var z = Math.ceil(this.state.character.position.z);//this.state.character.state.zPos;
            console.log('x:', x);
            console.log('z:', z);
            if(x < 0 || z < 0) {
                debugger;
            }
            var beneathHitBox = this.state.floorHitBox[0][0];
            var charHitBox = this.state.character.state.hitBox;
            var isInterecting = charHitBox.intersectsBox(beneathHitBox.hitBox);
            if(beneathHitBox == undefined) {
                debugger;
            }
            if(isInterecting){
                isColliding = true;
                var visualBox
                // White outline for grass, red for water
                if(beneathHitBox.type == "grass") {
                    visualBox = new THREE.Box3Helper(charHitBox, 0xffffff);
                }
                else if(beneathHitBox.type == "water"){ 
                    visualBox = new THREE.Box3Helper(charHitBox, 0xff0000);
                }
                this.state.character.state.visualBox = visualBox;
                this.state.character.add(visualBox);
            }
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
        for (var i = 0; i < 10; i++) {
            var hitBoxArray = [];
            for(var j = 0; j < 5; j++) {
                // Alternate between grass and water
                var cube, type;
                if(i % 2 == 0){
                    cube = this.makeCube(0x44aa88, i * gridsize, j * gridsize);
                    type = "grass";
                }
                else {
                    cube = this.makeCube(0x2300ff , i * gridsize, j * gridsize);
                    type = "water";
                }

                // Floor cube hitBox
                var hitBox = new THREE.Box3().setFromObject(cube);

                // HITBOX VISUAL
                var visualBox = new THREE.Box3Helper(hitBox/*, HEX COLOR TO CHANGE BOX COLOR*/);
                this.add(visualBox);

                // Add row of hitboxes and type of floor (maybe "floor" for non-game ending stuff like grass and
                // roads, then "water", "lava", etc.)
                hitBoxArray.push({hitBox: hitBox, type: type});
            }
            this.state.floorHitBox.push(hitBoxArray);
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
            character.addToJumpQueue(1);
        } else if (e.which == 65) { // a 
            character.addToJumpQueue(2);
        } else if (e.which == 83) { // s
            character.addToJumpQueue(3);
        }  else if (e.which == 68) { // d
            character.addToJumpQueue(4);
        }
    }

    cameraMovement() {
        const {camera, character, cameraOrigX, cameraOrigZ} = this.state;
        // constantly move forward
        camera.position.z += cameraForwardSpeed;
        this.moveLight(0, cameraForwardSpeed);

        // follow character: character only allowed to reach -6 to +6 grids (jump 5 times from center)
        const distX = camera.position.x - cameraOrigX - character.position.x;
        const distZ = camera.position.z - cameraOrigZ - character.position.z;
        // distance between them -> speed
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
