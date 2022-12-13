import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Flower, Land, Character, GolfCart, Psafe, TigerTransit, Tree } from 'objects';
import { BasicLights } from 'lights';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

const EPS = 0.001;
const floory = -1;
const gridsize = 2;
const gridMinX = -8;
const gridMaxX = 18;
const charMinX = 0;
const charMaxX = 10; // grid coordinate

const charStartX = 10; // coordinate
const cameraForwardSpeed = 0.01*gridsize;
const camerasFollowTime = [100, 50];

const possibleFloorTypes = ["grass", "water", "road"];
const maxTreePercentage = 0.25;

const loader = new GLTFLoader();

var pressed = {}; // to ignore long key presses

class SeedScene extends Scene {
    constructor(camera1, camera2) {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            updateList: [],
            character: null,
            cameras: [camera1, camera2],
            camerasOrigX: [camera1.position.x, camera2.position.x],
            camerasOrigZ: [camera1.position.z, camera2.position.z],
            lights: null,
            floorType: [], // floorType[z][x], correspond to the part of grid that character is allowed to reach x=[charMinX, charMaxX], z=[0,...)
            visualCharHitBox: null,
            cars: [],
            numFloorRowsCreated: 0,
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

        this.updatePopulateScene();

        // Check floor under player
        this.checkFloor();
        
        // Update movement of car and remove cars out of certain range
        this.updateCars(timeStamp);

        // Check for collisions between cars
        this.checkCollisions();

        // Check for game over 
        
    }

    updatePopulateScene() {
        if(this.state.character.position.z*2+13+EPS > this.state.numFloorRowsCreated) {
            const type = Math.floor(Math.random()*possibleFloorTypes.length);
            this.makeFloorRow(type, this.state.numFloorRowsCreated * gridsize);
        }
        // Spawn single car in row 3 from right to left
        if(this.state.cars.length <= 1) { // car type 1 (golfcart), 2 (psafe), or 3 (tiger transit bus)
            this.spawnCar(1, 2, 0);
            this.spawnCar(2, 3, 1);
            this.spawnCar(3, 4, 0);
        }
    }

    makeFloor() {
        const width = 900;
        const height = 900;
        var geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshPhongMaterial({color: "#353D3C"});
        const plane = new THREE.Mesh( geometry, material );
        plane.position.y = floory;
        plane.rotation.x = -Math.PI/2;
        plane.receiveShadow = true;
        return plane;
    }

    populateScene() {
        // TODO: add logs / cars / ...
        var type, typeArray;
        for(var j = 0; j < 13; j++) {
            this.makeFloorRow(j % 3, j * gridsize);
            // var hitBoxArray = [];
            // for (var i = gridMinX; i <= gridMaxX; i++) {
            //     // Alternate between grass and water
            //     var cube, type;
            //     if(j % 3 == 0){
            //         cube = this.makeCube(0x2300ff, i * gridsize, j * gridsize);
            //         type = "grass";
            //     } else if(j % 3 == 1){
            //         // cube = this.makeCube(0x44aa88, i * gridsize, j * gridsize);
            //         type = "water";
            //         cube = this.makeFloorCube(type, i * gridsize, j * gridsize);
            //     } else {
            //         cube = this.makeCube(0x696362 , i * gridsize, j * gridsize);
            //         type = "road";
            //     }

            //     // Floor does not need hit box
            //     /*
            //     // Floor cube hitBox
            //     var hitBox = new THREE.Box3().setFromObject(cube);

            //     // HITBOX VISUAL
            //     var visualBox = new THREE.Box3Helper(hitBox);
            //     this.add(visualBox);
            //     */
                
            //     // Add row of hitboxes and type of floor (maybe "floor" for non-game ending stuff like grass and
            //     // roads, then "water", "lava", etc.)
            //     hitBoxArray.push(type);
            // }
            // this.state.floorType.push(hitBoxArray);
        }
    }

    makeFloorRow(type, z) {
        var typeArray = [];
        if(type === 0) { // grass
            for (var i = gridMinX; i <= gridMaxX; i++) {
                this.makeCube("#008013", i * gridsize, z);
                if(i<charMinX || i>charMaxX) {
                    var tree = new Tree(this, i * gridsize, z, 0.2+Math.random()*0.2, Math.floor(Math.random()*2));
                    this.add(tree);
                } else {
                    if (Math.random() <= maxTreePercentage) {
                        var tree = new Tree(this, i * gridsize, z, 0.2+Math.random()*0.2, Math.floor(Math.random()*2));
                        this.add(tree);
                        typeArray.push(0); // has tree
                    } else {
                        typeArray.push(0.5); // no tree
                    }
                }
            }
            // const boxWidth = (gridMaxX-gridMinX)*gridsize;
            // const boxHeight = 1;
            // const boxDepth = gridsize;
            // const x = (gridMinX+gridMaxX)*gridsize/2;
            // const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
            // const material = new THREE.MeshPhongMaterial({color:"#008013"});

            // const cube = new THREE.Mesh(geometry, material);
            // this.add(cube);
            // cube.position.x = x;
            // cube.position.y = floory+boxHeight/2;
            // cube.position.z = z;
            // cube.castShadow = true;
            // cube.receiveShadow = true;
            // typeArray = Array((gridMaxX-gridMinX+1)*gridsize).fill(type);
        }
        else if(type === 1) { // water
            typeArray = Array((charMaxX-charMinX+1)*gridsize).fill(type);
            const boxWidth = (gridMaxX-gridMinX)*gridsize;
            const boxHeight = 1;
            const boxDepth = gridsize;
            const x = (gridMinX+gridMaxX)*gridsize/2;
            const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
            const texture = new THREE.TextureLoader().load( './src/textures/water.png' );
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(10,1);
            const material = new THREE.MeshPhongMaterial( { map: texture} );

            const cube = new THREE.Mesh(geometry, material);
            this.add(cube);
            cube.position.x = x;
            cube.position.y = floory+boxHeight/2-0.3;
            cube.position.z = z;
            cube.castShadow = true;
            cube.receiveShadow = true;
        }
        else if (type === 2){ // road
            typeArray = Array((charMaxX-charMinX+1)*gridsize).fill(type);
            const boxWidth = (gridMaxX-gridMinX)*gridsize;
            const boxHeight = 0.9;
            const boxDepth = gridsize;
            const x = (gridMinX+gridMaxX)*gridsize/2;
            const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
            const material = new THREE.MeshPhongMaterial({color:0x696362});

            const cube = new THREE.Mesh(geometry, material);
            this.add(cube);
            cube.position.x = x;
            cube.position.y = floory+boxHeight/2;
            cube.position.z = z;
            cube.castShadow = true;
            cube.receiveShadow = true;
        }

        this.state.floorType.push(typeArray);
        this.state.numFloorRowsCreated++;
        return typeArray;
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
        if ( pressed[e.which] ) return;
        pressed[e.which] = true;

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

    onDocumentKeyUp(e) {
        if ( !pressed[e.which] ) return;
        pressed[e.which] = false;
    };

    cameraMovement() {
        const {cameras, character, camerasOrigX, camerasOrigZ} = this.state;
        for(let ii=0; ii<cameras.length; ii++) {
            const camera = cameras[ii];
            // constantly move forward
            // camera.position.z += cameraForwardSpeed;
            // this.moveLight(0, cameraForwardSpeed);

            // follow character
            const distX = camera.position.x - camerasOrigX[ii] - character.position.x + charStartX;
            const distZ = camera.position.z - camerasOrigZ[ii] - character.position.z;
            // distance between them to get speed
            const speedX = -distX/camerasFollowTime[ii];
            const speedZ = Math.max(0,-distZ/camerasFollowTime[ii]); // camera doesn't move backwards
            camera.position.x += speedX;
            camera.position.z += speedZ;
            if(ii==0) {
                this.moveLight(speedX, speedZ);
            }
        }
        
    }

    moveLight(movex, movez) {
        const {lights} = this.state;
        // lights.state.dir.position.x += movex;
        lights.state.dir.position.z += movez;
        // lights.state.dir.target.position.x += movex;
        lights.state.dir.target.position.z += movez;
    }

    checkFloor() {
        // landed flag to stop checking if already checked
        var landed = false;
        var isJumping = this.state.character.state.jumping;

        if(isJumping) {
            landed = false;
        }
        
        if(!isJumping && !landed){
            landed = true;
            // Quantize player position
            var x = Math.round(this.state.character.position.x / gridsize);
            var z = Math.round(this.state.character.position.z / gridsize);

            // Check if position is not in range of floor grid
            if(x < 0 || z < 0 || x > this.state.floorType[0].length || z > this.state.floorType.length) {
                debugger;
            }

            // Check if floor is undefined
            if(this.state.floorType[z] == undefined || this.state.floorType[z][x] == undefined) {
                debugger;
            }

            var floorType = this.state.floorType[z][x];
            var charHitBox = this.state.character.state.hitBox;

            // Change character hitbox;
            var visualBox;

            // White outline for grass, blue for water
            // Demonstrates detection of where character landed so under water, can be game over instead of red hitbox
            if(floorType==0 || floorType==0.5) { // grass
                visualBox = new THREE.Box3Helper(charHitBox, 0xffffff);
            }
            else if(floorType === 1){ // water
                // Add character state to check if character is on log
                visualBox = new THREE.Box3Helper(charHitBox, 0x001bff);
            }
            else if(floorType === 2) { // road
                visualBox = new THREE.Box3Helper(charHitBox, 0x000000);
            }

            // Update hitBox color
            this.remove(this.state.visualCharHitBox);
            this.state.visualCharHitBox = visualBox;
            this.add(visualBox);
        }
    }

    // makeCar(color, x, z) {
    //     const boxWidth = gridsize-0.2;
    //     const boxHeight = 0.5;
    //     const boxDepth = gridsize-1;
    //     const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    //     const material = new THREE.MeshPhongMaterial({color});
       
    //     const car = new THREE.Mesh(geometry, material);
    //     this.add(car);
       
    //     car.position.x = x;
    //     car.position.y = (floory+gridsize) / 2;
    //     car.position.z = z;
    //     car.castShadow = true;
    //     car.receiveShadow = true;

    //     return car;
    // }

    makeCarGltf(type, x, z, side) {
        if(type==1) {
            var golfcart = new GolfCart(this, x, z, side);
            this.add(golfcart);
            return golfcart;
        } else if(type==2) {
            var psafe = new Psafe(this, x, z, side);
            this.add(psafe);
            return psafe;
        } else { // type==3
            var tigertransit = new TigerTransit(this, x, z, side);
            this.add(tigertransit);
            return tigertransit;
        }
        
    }

    // Spawn car with type 1 (golfcart), 2 (psafe), or 3 (tiger transit bus), z position 
    // along the grid to start, and starting side (0 for left, 1 for right)
    spawnCar(type, z, side) {
        var x ,car;
        if(side == 0) {
            // Change number to leftmost position
            x = gridMaxX * gridsize;
        }
        else if(side == 1) {
            // Change number to rightmost position
            x = gridMinX * gridsize;
        }

        // Add if statements with types to change car model
        // var car = this.makeCar(0xff9e00, x, z * gridsize);
        var car = this.makeCarGltf(type, x, z * gridsize, side);
        var hitBox = car.state.hitBox;

        // Add hitBox
        // var hitBox = new THREE.Box3().setFromObject(car);
        var visual = new THREE.Box3Helper(hitBox, 0xffffff);
        this.add(visual);

        // Push cars into array of cars currently in scene
        this.state.cars.push({car: car, type: type, side: side, hitBox: hitBox, visual: visual});
    }

    updateCars(timeStamp) {
        var cars = this.state.cars;
        for(var i = 0; i < cars.length; i++) {
            // Previous car position
            var prevPosX = cars[i].car.position.x;

            // Remove car if out of "view"
            if(prevPosX < gridMinX * gridsize || prevPosX > gridMaxX * gridsize) {
                cars[i].hitBox = null;
                this.remove(cars[i].car);
                this.remove(cars[i].visual);
                cars.splice(i, 1);
                break;
            }

            // Set speed of car depending on type
            var speed;
            if(cars[i].type == 1) {
                speed = 7;
            }
            else if(cars[i].type == 2) {
                speed = 17;
            }
            else if(cars[i].type == 3) {
                speed = 12;
            }
            
            // Flip speed if going from left to right (-x direction)
            if(cars[i].side == 0) {
                speed *= -1;
            }

            // Direction offset
            var dirOff = speed * 0.01;
            cars[i].car.position.x += dirOff;
            cars[i].hitBox.translate(new THREE.Vector3(dirOff, 0, 0));
        }
    }

    checkCollisions() {
        const {cars} = this.state;
        // var cars = this.state.cars;
        for(var i = 0; i < cars.length; i++) {
            var posZ = cars[i].car.position.z;
            var char = this.state.character;

            // If car is not in the same lane as character, then dont check for collisions
            if(posZ != Math.round(char.position.z)) {
                continue;
            }

            // Check if car intersects character
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
