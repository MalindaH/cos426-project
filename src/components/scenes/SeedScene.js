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
            cameraOrigY: camera.position.y,
            cameraOrigZ: camera.position.z,
            lights: null,
            floorType: [],
            visualCharHitBox: null,
            cars: [],
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

        // Character and hit box
        const character = new Character(this);
        this.state.character = character;

        const floor = this.makeFloor();
        this.add(lights, character, floor);

        // Add oscillating "car"
        this.spawnCar(5, 2);

        //const cameraHelper = new THREE.CameraHelper(lights.state.dir.shadow.camera);
        //this.add(cameraHelper);
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
        
        this.checkFloor();
        
        this.updateCars(timeStamp);

        this.checkCollisions();
        //this.collisions();
        
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

                // Floor does not need hit box
                /*
                // Floor cube hitBox
                var hitBox = new THREE.Box3().setFromObject(cube);

                // HITBOX VISUAL
                var visualBox = new THREE.Box3Helper(hitBox);
                this.add(visualBox);
                */
                
                // Add row of hitboxes and type of floor (maybe "floor" for non-game ending stuff like grass and
                // roads, then "water", "lava", etc.)
                hitBoxArray.push(type);
            }
            this.state.floorType.push(hitBoxArray);
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
        //camera.position.z += cameraForwardSpeed;
        //this.moveLight(0, cameraForwardSpeed);

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

    checkFloor() {
        var landed = false;
        var isJumping = this.state.character.state.jumping;

        if(isJumping) {
            landed = false;
        }
        
        if(!isJumping && !landed){
            landed = true;
            var x = Math.round(this.state.character.position.x / gridsize);
            var z = Math.round(this.state.character.position.z / gridsize);
            if(x < 0 || z < 0 || x > this.state.floorType.length || z > this.state.floorType[0].length) {
                debugger;
            }
            var floorType = this.state.floorType[x][z];
            var charHitBox = this.state.character.state.hitBox;
            if(floorType == undefined) {
                debugger;
            }
            // Change character hitbox;
            var visualBox
            // White outline for grass, blue for water
            // Demonstrates detection of where character landed so under water, can be game over instead of red hitbox
            if(floorType === "grass") {
                visualBox = new THREE.Box3Helper(charHitBox, 0xffffff);
            }
            else if(floorType === "water"){ 
                // Add character state to check if character is on log
                visualBox = new THREE.Box3Helper(charHitBox, 0x001bff);
            }

            this.remove(this.state.visualCharHitBox);
            this.state.visualCharHitBox = visualBox;
            this.add(visualBox);
        }
    }

    makeCar(color, x, z) {
        const boxWidth = gridsize-0.2;
        const boxHeight = 0.5;
        const boxDepth = gridsize-1;
        const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
        const material = new THREE.MeshPhongMaterial({color});
       
        const car = new THREE.Mesh(geometry, material);
        this.add(car);
       
        car.position.x = x;
        car.position.y = (floory+gridsize) / 2;
        car.position.z = z;
        car.castShadow = true;
        car.receiveShadow = true;

        return car;
    }

    spawnCar(x, z) {
        var car = this.makeCar(0xff9e00, x * gridsize, z * gridsize);
        var hitBox = new THREE.Box3().setFromObject(car);
        var visual = new THREE.Box3Helper(hitBox, 0xffffff);
        this.add(visual);
        this.state.cars.push({car: car, hitBox: hitBox});
    }

    updateCars(timeStamp) {
        var cars = this.state.cars;
        for(var i = 0; i < cars.length; i++) {
            var prevPosX = cars[i].car.position.x;
            var dirOff = (4.5 * gridsize) + (4.5 * gridsize) * Math.sin(timeStamp / 700);
            cars[i].car.position.x = dirOff;
            cars[i].hitBox.translate(new THREE.Vector3(dirOff - prevPosX, 0, 0));
        }
    }

    checkCollisions() {
        var cars = this.state.cars;
        for(var i = 0; i < cars.length; i++) {
            var posZ = cars[i].car.position.z;
            var char = this.state.character;
            if(posZ != Math.round(char.position.z)) {
                continue;
            }
            var hitBox = cars[i].hitBox;
            if(char.state.hitBox.intersectsBox(hitBox)) {
                var visualBox = new THREE.Box3Helper(char.state.hitBox, 0xff0000);
                this.remove(this.state.visualCharHitBox);
                this.state.visualCharHitBox = visualBox;
                this.add(visualBox);
            }
        }
    }

    /*
    collisions() {
        var isColliding = false;
        var isJumping = this.state.character.state.jumping;
        // Reset visual of character hitbox
        // Check for collision
        if(!isJumping){
            var x = Math.max(0, Math.ceil(Math.floor(this.state.character.position.x) / gridsize));//this.state.character.state.xPos;
            var z = Math.max(0, Math.ceil(Math.floor(this.state.character.position.z) / gridsize));//this.state.character.state.zPos;
            console.log('x:', x);
            console.log('z:', z);
            if(x < 0 || z < 0 || x > 9 || z > 9) {
                debugger;
            }
            var floorType = this.state.floorType[x][z];
            var charHitBox = this.state.character.state.hitBox;
            if(floorType == undefined) {
                debugger;
            }
            var isInterecting = charHitBox.intersectsBox(floorType.hitBox);
            console.log('intersecting?:', isInterecting);
            console.log('hitbox center:', charHitBox.getCenter(new THREE.Vector3()));
            if(isInterecting){
                isColliding = true;
                var visualBox
                // White outline for grass, red for water
                if(floorType.type === "grass") {
                    visualBox = new THREE.Box3Helper(charHitBox);
                }
                else if(floorType.type === "water"){ 
                    visualBox = new THREE.Box3Helper(charHitBox, 0xff0000);
                }

                this.remove(this.state.visualCharHitBox);
                this.state.visualCharHitBox = visualBox;
                console.log('visual box center', visualBox.box.getCenter(new THREE.Vector3()));
                this.add(visualBox);
            }
            console.log('floorTypeCenter:', floorType.hitBox.getCenter(new THREE.Vector3()));
        }
        console.log('sphere center:', this.state.character.position);
    }
    */
}

export default SeedScene;
