/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SeedScene } from 'scenes';

const fov = 60;
const aspect = 2;  // the canvas default
const near = 0.1;
const far = 100;

// Initialize core ThreeJS components
const scene = new SeedScene();
const camera = new PerspectiveCamera(fov, aspect, near, far);
const renderer = new WebGLRenderer({ antialias: true });

// Set up camera
camera.position.set(-3, 10, -10);
// camera.lookAt(new Vector3(0, 0, 0));

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

// Set up controls
const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 4;
controls.maxDistance = 16;
controls.maxPolarAngle = Math.PI/2; // don't allow camera to go below floor
controls.target = new Vector3(0, 0, 5);
controls.update();

// Render loop
const onAnimationFrameHandler = (timeStamp) => {
    controls.update();
    renderer.render(scene, camera);
    scene.update && scene.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);
};
window.requestAnimationFrame(onAnimationFrameHandler);

// Resize Handler
const windowResizeHandler = () => {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};
windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);

document.addEventListener("keydown", (event) => {
    scene.onDocumentKeyDown(event);
}, false);