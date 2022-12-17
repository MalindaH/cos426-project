import { Group, SpotLight, AmbientLight, HemisphereLight } from 'three';
import * as THREE from 'three';

class BasicLights extends Group {
    constructor(...args) {
        // Invoke parent Group() constructor with our args
        super(...args);
        this.state = {
            dir: null,
            // dir2: null,
        };

        const dir = new THREE.DirectionalLight(0xffffff, 1);
        const ambi = new AmbientLight(0x404040, 1.32);
        const hemi = new HemisphereLight(0xffffbb, 0x080820, 0.3);

        dir.position.set(15, 20, 0);
        dir.target.position.set(0, 0, 0);
        dir.shadow.camera.right = 30;
        dir.shadow.camera.left = -25;
        dir.shadow.camera.top = 15;
        dir.shadow.camera.bottom = -30;
        dir.shadow.mapSize.width = 1024;
        dir.shadow.mapSize.height = 1024;
        dir.castShadow = true;

        const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
        dir2.position.set(10, 10, -20);
        dir2.target.position.set(10, 10, 0);
        // const helper = new THREE.DirectionalLightHelper( dir2);
        // this.add( helper );

        this.state.dir = dir;
        // this.state.dir2 = dir2;

        this.add(ambi, hemi, dir, dir2);
    }
}

export default BasicLights;
