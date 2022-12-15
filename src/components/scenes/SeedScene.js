import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { Character, GolfCart, Psafe, TigerTransit, Tree, River } from 'objects';
import { BasicLights } from 'lights';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

// import watertexture from '../../textures/water.png';

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
const possibleCarTypes = ["GolfCart", "Psafe", "TigerTransit"];
const carTypeWidths = [2.7, 4.5, 5];
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
            objsByZ: [], // objsByZ[z]: all objects on grid's (z-6)-th row
            prototypeTree: null,
            isGameOver: false,
            prevTimeStamp: 0,
        };
        
        this.state.prototypeTree = new Tree(this, charStartX, 0, 0.4, 0);
        // this.add(this.state.prototypeTree);

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

        this.updatePopulateScene();

        // Update movement of car and remove cars out of certain range
        this.updateCars(timeStamp);

        if(!this.state.isGameOver) {
            // Check floor under player
            this.checkFloor(timeStamp);

            // Check for collisions between cars
            this.checkCollisions();
        }

        this.deleteUnseenObjects();
    }

    updatePopulateScene() {
        if(this.state.character.position.z/2+13+EPS > this.state.numFloorRowsCreated) {
            const type = Math.floor(Math.random()*possibleFloorTypes.length);
            this.makeFloorRow(type, this.state.numFloorRowsCreated * gridsize);
        }
        // // TODO: placeholder for spawning cars
        // // Spawn single car in row 3 from right to left
        // if(this.state.cars.length <= 1) { // car type 0 (golfcart), 1 (psafe), or 2 (tiger transit bus)
        //     this.spawnCar(1, 2*gridsize, 0);
        //     this.spawnCar(2, 3*gridsize, 1);
        //     this.spawnCar(0, 4*gridsize, 0);
        // }
    }

    deleteUnseenObjects() {
        const {objsByZ, cameras, cars} = this.state;
        const camera = cameras[0];
        const ZtoDelete = Math.floor((camera.position.z-14)/2)+6;
        if(ZtoDelete>=0 && objsByZ[ZtoDelete]!=undefined && objsByZ[ZtoDelete].length>0) {
            objsByZ[ZtoDelete].forEach(element => {
                this.remove(element);
            });
            objsByZ[ZtoDelete] = [];
            for(var i = 0; i < cars.length; i++) {
                if(cars[i].car.position.z / gridsize <= ZtoDelete) {
                    cars[i].hitBox = null;
                    this.remove(cars[i].car);
                    this.remove(cars[i].visual);
                    cars.splice(i, 1);
                    break;
                }
            }
        }

        var frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
        for (var i=0; i<objsByZ.length; i++) {
            for( var j=0; j<objsByZ[i].length; j++) {
                var visible = false;
                if(objsByZ[i][j].state==undefined) {
                    visible = frustum.intersectsObject(objsByZ[i][j]);
                } else {
                    visible = frustum.intersectsBox(objsByZ[i][j].state.hitBox);
                }
                objsByZ[i][j].visible = visible;
            }
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
        this.makeGrassRowAtStart(); // grass with extra trees at -z values
        for(var j = 0; j < 2; j++) {
            this.makeFloorRow(0, j * gridsize); // grass
        }
        for(var j = 2; j < 13; j++) {
            this.makeFloorRow(Math.floor(Math.random()*3), j * gridsize);
        }
    }

    makeGrassRowAtStart() { // grass with extra trees, for negative z values that character can't jump to
        for(var j = -6; j < -4; j++) {
            var objects = [];
            for (var i = -2; i <= 12; i++) {
                var cube = this.makeCube("#008013", i * gridsize, j*gridsize);
                objects.push(cube);
                var tree = new Tree(this, i * gridsize, j*gridsize, 0.2+Math.random()*0.2, Math.floor(Math.random()*2));
                // var visualBox = new THREE.Box3Helper(tree.state.hitBox, 0x001bff);
                // this.add(visualBox);
                this.add(tree);
                objects.push(tree);
            }
            this.state.objsByZ.push(objects);
        }
        for(var j = -4; j < 0; j++) {
            var objects = [];
            for (var i = -2; i <= 12; i++) {
                var cube = this.makeCube("#008013", i * gridsize, j*gridsize);
                objects.push(cube);
                if(i<charMinX || i>charMaxX) {
                    var tree = new Tree(this, i * gridsize, j*gridsize, 0.2+Math.random()*0.2, Math.floor(Math.random()*2));
                    this.add(tree);
                    objects.push(tree);
                }
            }
            this.state.objsByZ.push(objects);
        }
    }

    makeFloorRow(type, z) {
        var typeArray = [];
        var objects = [];
        if(type === 0) { // grass
            for (var i = gridMinX; i <= gridMaxX; i++) {
                var cube = this.makeCube("#008013", i * gridsize, z);
                objects.push(cube);
                if(i<charMinX || i>charMaxX) {
                    var tree = new Tree(this, i * gridsize, z, 0.2+Math.random()*0.2, Math.floor(Math.random()*2));
                    // var tree = this.state.prototypeTree.clone();
                    // tree.position.x = i * gridsize;
                    // tree.position.z = z;
                    // const s = 0.5+Math.random()*0.5
                    // tree.scale.set(s,s,s);
                    this.add(tree);
                    objects.push(tree);
                } else {
                    if (!(z<=2 && i*gridsize==charStartX) && Math.random() <= maxTreePercentage) {
                        var tree = new Tree(this, i * gridsize, z, 0.2+Math.random()*0.2, Math.floor(Math.random()*2));
                        this.add(tree);
                        objects.push(tree);
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
            const river = new River(this, z/gridsize);
            this.add(river);
            objects.push(river);

            // const boxWidth = (gridMaxX-gridMinX)*gridsize;
            // const boxHeight = 1;
            // const boxDepth = gridsize;
            // const x = (gridMinX+gridMaxX)*gridsize/2;
            // const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
            // const texture = new THREE.TextureLoader().load( watertexture );
            // // const texture = new THREE.TextureLoader().load( './public/textures/water.png' );
            // texture.wrapS = THREE.RepeatWrapping;
            // texture.wrapT = THREE.RepeatWrapping;
            // texture.minFilter = THREE.LinearFilter;
            // texture.repeat.set(10,1);
            // const material = new THREE.MeshPhongMaterial( { map: texture} );

            // const cube = new THREE.Mesh(geometry, material);
            // this.add(cube);
            // objects.push(cube);
            // cube.position.x = x;
            // cube.position.y = floory+boxHeight/2-0.3;
            // cube.position.z = z;
            // cube.castShadow = true;
            // cube.receiveShadow = true;
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
            objects.push(cube);
            cube.position.x = x;
            cube.position.y = floory+boxHeight/2;
            cube.position.z = z;
            cube.castShadow = true;
            cube.receiveShadow = true;

            // spawn cars
            const side = Math.floor(Math.random()*2);
            const cartype = Math.floor(Math.random()*3);
            var carWidth = carTypeWidths[cartype];
            var xx;
            if(side == 0) {
                // leftmost position
                // xx = ((gridMaxX - (gridMaxX+charMaxX)/3)*Math.random() + (gridMaxX+charMaxX)/3) *gridsize;
                xx = gridMaxX * gridsize;
            }
            else if(side == 1) {
                // rightmost position
                xx = gridMinX * gridsize;
            }
            for(var i=0; i<3+Math.random()*2; i++) {
                // this.spawnCar(Math.floor(Math.random()*3), z/gridsize, Math.floor(Math.random()*2));
                this.spawnCarXZ(cartype, xx, z, side);
                if(side == 0) {
                    xx -= 1.8*carWidth+Math.random()*6;
                } else {
                    xx += carWidth+Math.random()*6+4;
                }
            }
        }

        this.state.floorType.push(typeArray);
        this.state.numFloorRowsCreated++;
        this.state.objsByZ.push(objects);
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
        if(this.state.isGameOver) return;
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

    // moveCamera(movex, movez) {
    //     const {camera} = this.state;
    //     camera.position.x += movex;
    //     camera.position.z += movez;
    //     console.log(camera.position);
    //     this.moveLight(movex, movez);
    // }

    moveLight(movex, movez) {
        const {lights} = this.state;
        // lights.state.dir.position.x += movex;
        lights.state.dir.position.z += movez;
        // lights.state.dir.target.position.x += movex;
        lights.state.dir.target.position.z += movez;
    }

    checkFloor(timeStamp) {
        if (this.state.prevTimeStamp == 0){
            this.state.prevTimeStamp = timeStamp;
        }
        const subt = timeStamp - this.state.prevTimeStamp;
        this.state.prevTimeStamp = timeStamp;

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
                //visualBox = new THREE.Box3Helper(charHitBox, 0xffffff);
            }
            else if(floorType === 1){ // water
                // check if character is on log
                const {objsByZ, character} = this.state;
                const zLane = z+6;
                visualBox = new THREE.Box3Helper(charHitBox, 0x001bff);
                if(objsByZ[zLane]!=undefined && objsByZ[zLane].length>0) {
                    const river = objsByZ[zLane][0];
                    river.state.boats.forEach( b => {
                        if(character.state.hitBox.intersectsBox(b.state.hitBox)) {
                            var translateX = river.state.speed*subt;
                            if(river.state.direction) {
                                translateX = -translateX;  
                            }
                            if(character.position.x+translateX<0) { //charMinX*gridsize
                                this.state.isGameOver = true;
                                character.dieWater();
                                return;
                                // translateX = -character.position.x;
                            } else if(character.position.x+translateX>charMaxX*gridsize) {
                                // translateX = charMaxX*gridsize-character.position.x;
                                this.state.isGameOver = true;
                                character.dieWater();
                                return;
                            }
                            character.state.isOnLog = true;
                            character.position.x += translateX;
                            const posOff = new THREE.Vector3(translateX, 0, 0);
                            character.state.hitBox.translate(posOff);

                            visualBox = new THREE.Box3Helper(charHitBox, 0xffa500);
                        }
                    });
                }
                if(!character.state.isOnLog) {
                    this.state.isGameOver = true;
                    character.dieWater();
                }
                // visualBox = new THREE.Box3Helper(charHitBox, 0x001bff);
            }
            else if(floorType === 2) { // road
                //visualBox = new THREE.Box3Helper(charHitBox, 0x000000);
            }

            // Update hitBox color
            /*
            this.remove(this.state.visualCharHitBox);
            this.state.visualCharHitBox = visualBox;
            this.add(visualBox);
            */
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
        if(type==0) {
            var golfcart = new GolfCart(this, x, z, side);
            this.add(golfcart);
            return golfcart;
        } else if(type==1) {
            var psafe = new Psafe(this, x, z, side);
            this.add(psafe);
            return psafe;
        } else { // type==2
            var tigertransit = new TigerTransit(this, x, z, side);
            this.add(tigertransit);
            return tigertransit;
        }
    }

    // Spawn car with type 1 (golfcart), 2 (psafe), or 3 (tiger transit bus), z position 
    // along the grid to start, and starting side (0 for left, 1 for right)
    spawnCar(type, z, side) {
        var x, car;
        if(side == 0) {
            // Change number to leftmost position
            // x = ((gridMaxX - (gridMaxX+charMaxX)/3)*Math.random() + (gridMaxX+charMaxX)/3) *gridsize;
            // console.log(x);
            x = gridMaxX * gridsize;
        }
        else if(side == 1) {
            // Change number to rightmost position
            x = gridMinX * gridsize;
        }

        // Add if statements with types to change car model
        // var car = this.makeCar(0xff9e00, x, z * gridsize);
        var car = this.makeCarGltf(type, x, z, side);
        var hitBox = car.state.hitBox;

        // Add hitBox
        // var hitBox = new THREE.Box3().setFromObject(car);
        // var visual = new THREE.Box3Helper(hitBox, 0xffffff);
        //this.add(visual);

        // Push cars into array of cars currently in scene
        this.state.cars.push({car: car, type: type, side: side, hitBox: hitBox, visual: null});
    }

    spawnCarXZ(type, x, z, side) {
        var car;

        // Add if statements with types to change car model
        // var car = this.makeCar(0xff9e00, x, z * gridsize);
        var car = this.makeCarGltf(type, x, z, side);
        var hitBox = car.state.hitBox;

        // Add hitBox
        // var hitBox = new THREE.Box3().setFromObject(car);
        // var visual = new THREE.Box3Helper(hitBox, 0xffffff);
        // this.add(visual);

        // Push cars into array of cars currently in scene
        this.state.cars.push({car: car, type: type, side: side, hitBox: hitBox, visual: null});
    }

    updateCars(timeStamp) {
        var cars = this.state.cars;
        for(var i = 0; i < cars.length; i++) {
            // Previous car position
            var prevPosX = cars[i].car.position.x;

            // Remove car if out of "view"
            if(prevPosX < gridMinX * gridsize || prevPosX > gridMaxX * gridsize) {
                // add another car from the starting edge
                this.spawnCar(cars[i].type, cars[i].car.position.z, cars[i].side);

                // delete old car
                cars[i].hitBox = null;
                this.remove(cars[i].car);
                this.remove(cars[i].visual);
                cars.splice(i, 1);
                break;
            }

            // Set speed of car depending on type
            var speed = cars[i].car.state.speed;
            
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
        const {cars, character} = this.state;
        
        // check collisions with cars
        for(var i = 0; i < cars.length; i++) {
            var posZ = cars[i].car.position.z;

            // If car is not in the same lane as character, then dont check for collisions
            if(posZ != Math.round(character.position.z)) {
                continue;
            }

            // Check if car intersects character
            var hitBox = cars[i].hitBox;
            if(character.state.hitBox.intersectsBox(hitBox)) {
                // game over handling
                this.state.isGameOver = true;
                var xDist = 1;
                var zDist = 1;
                // if(character.state.hitBox.min.x-hitBox.max.x<=EPS || hitBox.min.x-character.state.hitBox.max.x<=EPS) {
                if(Math.max(character.state.hitBox.min.x-hitBox.max.x, hitBox.min.x-character.state.hitBox.max.x) <= EPS) {
                    xDist = Math.max(character.state.hitBox.min.x-hitBox.max.x, hitBox.min.x-character.state.hitBox.max.x);
                // } else if(character.state.hitBox.min.z-hitBox.max.z<=EPS || hitBox.min.z-character.state.hitBox.max.z<=EPS) {
                } 
                if (Math.max(character.state.hitBox.min.z-hitBox.max.z, hitBox.min.z-character.state.hitBox.max.z)<=EPS) {
                    zDist = Math.max(character.state.hitBox.min.z-hitBox.max.z, hitBox.min.z-character.state.hitBox.max.z);
                }
                character.die(xDist>zDist);

                //var visualBox = new THREE.Box3Helper(character.state.hitBox, 0xff0000);
                //this.remove(this.state.visualCharHitBox);
                //this.state.visualCharHitBox = visualBox;
                //this.add(visualBox);
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
