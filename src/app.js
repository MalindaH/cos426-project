/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SeedScene } from 'scenes';
import * as THREE from 'three';
/*
import Stats from 'stats.js'

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)
*/

var gameStarted = false;
var text2Removed = false;
var text3Added = false;

const charStartX = 10;
const frustumSize = 1500;
const aspect = window.innerWidth / window.innerHeight;

// Initialize core ThreeJS components
const renderer = new WebGLRenderer({ antialias: true });

// implement multiple views
const views = [
    { 
        // third-person view
        cLeft: frustumSize * aspect / - 2,
        cRight: frustumSize * aspect / 2,
        cTop: frustumSize / 2,
        cBottom: frustumSize / - 2,
        cNear: -100,
        cFar: 3000,
        position: [-3+charStartX,7,-3],
        zoom: 80,
        left: 0,
        bottom: 0,
        width: 1.0,
        height: 1.0
    },
    {
        // first-person view
        cLeft: frustumSize * aspect / - 2,
        cRight: frustumSize * aspect / 2,
        cTop: frustumSize / 2,
        cBottom: frustumSize / - 2,
        cNear: -100,
        cFar: 500,
        position: [charStartX,3,0.05],
        zoom: 200,
        left: 0.7,
        bottom: 0,
        width: 0.3,
        height: 0.3
    },
];

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

for ( let ii = 0; ii < views.length; ++ ii ) {
    const view = views[ ii ];
    const camera = new THREE.OrthographicCamera(view.cLeft, view.cRight, view.cTop, view.cBottom, view.cNear, view.cFar);
    camera.position.fromArray( view.position );
    camera.zoom = view.zoom;
    view.camera = camera;
    if(ii==0) {
        // Set up controls
        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.enablePan = true;
        controls.maxPolarAngle = Math.PI/2; // don't allow camera to go below floor
        controls.target = new Vector3(charStartX, 0, 7);
        controls.update();
        controls.addEventListener('change', () => {renderer.render(scene, camera)});
    } else {
        camera.lookAt(charStartX,0,8);
    }
}

// const scene = new SeedScene(camera);
const scene = new SeedScene(views[0].camera, views[1].camera);

// game title TIGER ROAD
var text02 = document.createElement('div');
text02.style.position = 'absolute';
text02.style.textAlign = "center";
text02.style.top = "40%";
text02.style.left = "50%";
var text2 = document.createElement('div');
text2.innerHTML = "TIGER ROAD";
text2.style.fontSize = "15vw";
text2.style.fontFamily = "Impact,Charcoal,sans-serif";
text2.style.textShadow = "-0.3vw -0.3vw 0 #ff6600, 0.3vw -0.3vw 0 #ff6600, -0.3vw 0.3vw 0 #ff6600, 0.3vw 0.3vw 0 #ff6600"; // -5px -5px 0 #ff6600, 5px -5px 0 #ff6600, -5px 5px 0 #ff6600, 5px 5px 0 #ff6600
text2.style.width = 300;
text2.style.height = 300;
text2.style.transform = "translate(-50%,-50%)";
text2.style.whiteSpace = "nowrap";
var text22 = document.createElement("div");
text22.innerHTML = "W/A/S/D to move";
text22.style.fontSize = "5vw";
text22.style.fontFamily = "Impact,Charcoal,sans-serif";
text22.style.color = "#ff6600";
text22.style.textShadow = "0vw 0.2vw 0.5vw rgba(0,0,0,0.6)";
text22.style.transform = "translate(-50%,-150%)";
text22.style.whiteSpace = "nowrap";
text22.style.padding = 0;
text02.appendChild(text2);
text02.appendChild(text22);
document.body.appendChild(text02);

// score
var text1 = document.createElement('div');
text1.innerHTML = "1";
text1.style.fontSize = "6vw";
text1.style.fontFamily = "Impact,Charcoal,sans-serif";
text1.style.textShadow = "-0.2vw -0.2vw 0 #ff6600, 0.2vw -0.2vw 0 #ff6600, -0.2vw 0.2vw 0 #ff6600, 0.2vw 0.2vw 0 #ff6600";
text1.style.width = 300;
text1.style.height = 300;
text1.style.position = 'absolute';
text1.style.top = "0%";
text1.style.transform = "translate(50%)";
text1.style.whiteSpace = "nowrap";

// game over
var text3 = document.createElement('div');
text3.style.position = 'absolute';
text3.style.top = "37%";
text3.style.width = "100%";
text3.style.background = "#ff781f";
text3.style.fontFamily = "Impact,Charcoal,sans-serif";
text3.style.transform = "translateY(-50%)";
text3.style.textAlign = "center";
var text4 = document.createElement('div');
text4.innerHTML = "GAME OVER";
text4.style.fontSize = "7vw";
text4.style.textShadow = "0vw 0.2vw 0.5vw rgba(0,0,0,0.4)";
text3.appendChild(text4);

// Press any key to restart
var text5 = document.createElement('div');
text5.style.position = 'absolute';
text5.style.top = "52%";
text5.style.width = "100%";
text5.style.background = "#ff9d5c";
text5.style.fontFamily = "Impact,Charcoal,sans-serif";
text5.style.transform = "translateY(-50%)";
text5.style.textAlign = "center";
var text6 = document.createElement('div');
text6.innerHTML = "Press any key to restart";
text6.style.fontSize = "4vw";
text6.style.textShadow = "0vw 0.2vw 0.5vw rgba(0,0,0,0.4)";
text5.appendChild(text6);


function render() {
    for ( let ii = 0; ii < 1; ++ ii ) {
    // for ( let ii = 0; ii < views.length; ++ ii ) {
        const view = views[ ii ];
        const camera = view.camera;

        const left = Math.floor( window.innerWidth * view.left );
        const bottom = Math.floor( window.innerHeight * view.bottom );
        const width = Math.floor( window.innerWidth * view.width );
        const height = Math.floor( window.innerHeight * view.height );

        renderer.setViewport( left, bottom, width, height );
        renderer.setScissor( left, bottom, width, height );
        renderer.setScissorTest( true );
        renderer.setClearColor( view.background );

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.render( scene, camera );
        //stats.update();
    }
    if(!text2Removed && gameStarted) {
        var left = parseInt(text02.style.left.slice(0,-1));
        if(left>=140) {
            document.body.removeChild(text02);
            text2Removed = true;
        } else {
            text02.style.left = (left+4)+"%";
        }
    }
    if(gameStarted) {
        document.body.appendChild(text1);
    }
    if(scene.state.isGameOver) {
        if(!text3Added) {
            document.body.appendChild(text3);
            document.body.appendChild(text5);
            text3.style.left = "100%";
            text5.style.left = "100%";
            text3Added = true;
        }
        var left = parseInt(text3.style.left.slice(0,-1));
        if(left>=20) {
            text3.style.left = (left-20)+"%";
            text5.style.left = (left-20)+"%";
        }
    }
}

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    // controls.update();
    // renderer.render(scene, camera);
    
    render();
    scene.update && scene.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    // camera.aspect = innerWidth / innerHeight;
    // camera.updateProjectionMatrix();
    for(let ii=0; ii<views.length; ii++) {
        const camera = views[ii].camera;
        const aspect = window.innerWidth / window.innerHeight;
        camera.left = - frustumSize * aspect / 2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = - frustumSize / 2;
        camera.updateProjectionMatrix();
    }
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);


document.addEventListener("keydown", (event) => {
    if(scene.state.isGameOver) {
        location.reload();
    }
    if(!gameStarted && (event.which == 87 || event.which == 65 || event.which == 83 || event.which == 68) ) {
        gameStarted = true;
    }
    var numStepsForward = scene.state.character.state.numStepsForward;
    var score = parseInt(text1.innerHTML);
    text1.innerHTML = Math.max(score, numStepsForward);
    scene.onDocumentKeyDown(event);
}, false);

document.addEventListener("keyup", (event) => {
    scene.onDocumentKeyUp(event);
}, false);

