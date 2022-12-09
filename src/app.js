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
// import { OrthoCamera } from 'lights';
import * as THREE from 'three';

const frustumSize = 1500;
const aspect = window.innerWidth / window.innerHeight;

// Initialize core ThreeJS components
// const scene = new SeedScene();
// const camera = new OrthoCamera(frustumSize, aspect).state.cam;
const renderer = new WebGLRenderer({ antialias: true });

// Set up camera
// const camera = new THREE.OrthographicCamera(frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -100, 3000);
// camera.position.set(-3,7,-5);
// camera.zoom = 80;

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
        position: [-3,7,-5],
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
        position: [0,3,0.05],
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
        controls.target = new Vector3(0, 0, 5);
        controls.update();
        controls.addEventListener('change', () => {renderer.render(scene, camera)});
    } else {
        camera.lookAt(0,0,8);
    }
}

// // Set up controls
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;
// controls.enablePan = true;
// // controls.minDistance = 4;
// // controls.maxDistance = 16;
// controls.maxPolarAngle = Math.PI/2; // don't allow camera to go below floor
// controls.target = new Vector3(0, 0, 5);
// controls.update();

// const scene = new SeedScene(camera);
const scene = new SeedScene(views[0].camera, views[1].camera);

function render() {
    for ( let ii = 0; ii < views.length; ++ ii ) {

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
    const camera = views[0].camera;
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;

    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);

document.addEventListener("keydown", (event) => {
    scene.onDocumentKeyDown(event);
}, false);