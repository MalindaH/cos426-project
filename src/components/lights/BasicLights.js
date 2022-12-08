import { Group, SpotLight, AmbientLight, HemisphereLight } from 'three';
import * as THREE from 'three';

class BasicLights extends Group {
    constructor(...args) {
        // Invoke parent Group() constructor with our args
        super(...args);
        this.state = {
            dir: null,
        };

        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        const ambi = new AmbientLight(0x404040, 1.32);
        const hemi = new HemisphereLight(0xffffbb, 0x080820, 0.3);

        dir.position.set(5, 10, 0);
        dir.target.position.set(0, 0, 0);
        dir.shadow.camera.right = 10;
        dir.shadow.camera.left = -20;
        dir.shadow.camera.top = 20;
        dir.shadow.camera.bottom = -20;
        dir.shadow.mapSize.width = 1024;
        dir.shadow.mapSize.height = 1024;
        dir.castShadow = true;

        this.state.dir = dir;

        this.add(ambi, hemi, dir);
    }
}

export default BasicLights;
