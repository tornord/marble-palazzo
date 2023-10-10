// import * as dat from "lil-gui";
import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import styled from "@emotion/styled";

const StyledApp = styled.div(
  () => `
    .webgl
    {
        position: fixed;
        top: 0;
        left: 0;
        outline: none;

        // background: #11e8bb; /* Old browsers */
        background: linear-gradient(to bottom, #e3e9ec 0%, #a099a4 100%);
    }
  `
);

// const colorMaterial = (color) =>
//   new THREE.MeshStandardMaterial({
//     depthTest: true,
//     depthWrite: true,
//     side: THREE.DoubleSide,
//     color,
//   });

function calcSuperEllips(r, h, e, n) {
  const f = 0.5 ** (1 / e);
  const cs = [...Array(n)]
    .map((d, i) => i / (n - 1))
    .map((d) => f * d)
    .map((d) => [d, Math.pow(1 - Math.pow(d, e), 1 / e)]);
  const c1 = cs.slice(1);
  const r1 = cs.slice(0, n - 1).reverse();
  const p1 = cs.map((d) => [d[1], d[0]]);
  const p2 = r1.slice();
  const p3 = c1.map((d) => [-d[0], d[1]]);
  const p4 = r1.map((d) => [-d[1], d[0]]);
  const p5 = c1.map((d) => [-d[1], -d[0]]);
  const p6 = r1.map((d) => [-d[0], -d[1]]);
  const p7 = c1.map((d) => [d[0], -d[1]]);
  const p8 = r1.slice(0, n - 2).map((d) => [d[1], -d[0]]);
  const ps = [p1, p2, p3, p4, p5, p6, p7, p8].flat();
  // const ds = ps.map((d, i, a) => Math.hypot(a[(i+1)%a.length][0] - d[0], a[(i+1)%a.length][1] - d[1]));
  // console.log("ds", ds);
  return ps.map((d) => new THREE.Vector3(r * d[0], h, -r * d[1]));
}

export function App() {
  const ref = useRef(null);

  useEffect(() => {
    // const params = { backgroundColor: 0xb7bad7 };

    // Debug
    // const gui = new dat.GUI();

    // Canvas
    const canvas = ref.current;

    // Scene
    const scene = new THREE.Scene();

    // Scene background
    // scene.background = new THREE.Color(params.backgroundColor);
    // gui.addColor(params, "backgroundColor").onChange(() => {
    //   scene.background = new THREE.Color(params.backgroundColor);
    // });

    // GLTF loader
    const gltfLoader = new GLTFLoader();

    // Light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x404040, 0.8);
    hemiLight.position.set(0, 1, 0);
    scene.add(hemiLight);

    // Textures & material
    // const useColorMap = false;
    // const colorsMaterial = new THREE.MeshStandardMaterial({
    //   depthTest: true,
    //   depthWrite: true,
    //   side: THREE.DoubleSide,
    // });
    // if (useColorMap) {
    //   const colorMapTexture = textureLoader.load("colormap.jpg");
    //   colorMapTexture.flipY = false;
    //   colorMapTexture.colorSpace = THREE.SRGBColorSpace;
    //   colorsMaterial.map = colorMapTexture;
    // } else {
    //   colorsMaterial.color = new THREE.Color(0x00388eb9);
    // }

    const mixers = []; // Array of mixers in case of many models
    const meshes = {};
    const sceneObjects = [];
    let ball = null;
    const startYs = [];
    const addObject = (obj) => {
      sceneObjects.push(obj);
      startYs.push(obj.position.y);
    };

    // Model
    gltfLoader.load("model.glb", (gltf) => {
      const model = gltf.scene;
      const mixer = new THREE.AnimationMixer(model);
      mixers.push(mixer);

      // if (colorsMaterial) {
      model.traverse((child) => {
        if (child.isMesh) {
          if (child.name === "House") {
            child.receiveShadow = true;
          } else {
            child.castShadow = true;
          }
          meshes[child.name.toLowerCase()] = child;
        }
        // child.material = colorsMaterial;
      });
      // }

      // const actions = [];
      // for (let i = 0; i < gltf.animations.length; i++) {
      //   const clip = gltf.animations[i];
      //   // const n = clip.name.toLowerCase();
      //   const action = mixer.clipAction(clip);
      //   action.setLoop(THREE.LoopRepeat);
      //   action.clampWhenFinished = true;
      //   action.enable = true;
      //   action.play();
      //   actions.push(action);
      // }

      // House body
      for (let i = 0; i < 6; i++) {
        const c = meshes[`house00${i + 1}`].clone();
        c.position.set(0, -18 + 6 * i, 0);
        c.receiveShadow = true;
        addObject(c);
      }

      // Balcony
      for (let i = 0; i < 6; i++) {
        for (const n of ["balcony", "balconywall"]) {
          const c = meshes[n].clone();
          c.position.set(i % 2 === 0 ? 0 : 11, -9 + 6 * i, i % 2 === 0 ? -11 : 0);
          c.rotation.set(0, i % 2 === 0 ? -Math.PI / 2 : Math.PI / 2, 0);
          addObject(c);
          if (!n.endsWith("wall")) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        }
      }

      // Turret
      for (let i = 0; i < 6; i++) {
        for (const n of ["turretapplied", "turretwall"]) {
          // "plane014", "plane014_1", "plane014_2"
          const c = meshes[n].clone();
          c.position.set(i % 2 === 0 ? 0 : 11, -12 + 6 * i, i % 2 === 0 ? 0 : -11);
          if (i % 2 === 1) {
            c.rotation.set(0, Math.PI, 0);
          }
          addObject(c);
          if (!n.endsWith("wall")) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        }
      }

      // Cornerboard turret
      for (let i = 0; i < 6; i++) {
        const c = meshes.cornerboard.clone();
        c.position.set(i % 2 === 0 ? 0 : 11, -12 + 6 * i, i % 2 === 0 ? 0 : -11);
        if (i % 2 === 1) {
          c.rotation.set(0, Math.PI, 0);
        }
        addObject(c);
      }

      // Cornerboard balcony
      for (let i = 0; i < 6; i++) {
        const c = meshes.cornerboard.clone();
        c.position.set(i % 2 === 0 ? 0 : 11, -9 + 6 * i, i % 2 === 0 ? -11 : 0);
        c.rotation.set(0, i % 2 === 0 ? -Math.PI / 2 : Math.PI / 2, 0);
        addObject(c);
      }

      // Shelfs
      const g1 = ["window", "ivy", "windowwall"]; //"beziercurve001", "beziercurve001_1"];
      const g2 = ["shelf", "shelfwall", "bricks", "brickswall"]; // "cube001", "cube001_1"];
      const g3 = ["hatch", "hatchwall"]; //["cube052", "cube052_1"];
      const xs2 = [0, 7.5, 11, 3.5];
      const zs2 = [-7.5, -11, -3.5, 0];
      const xs1 = [0, 3.5, 11, 7.5];
      const zs1 = [-3.5, -11, -7.5, 0];
      for (let i = 0; i < 24; i++) {
        const pos = i % 2;
        const ip = (i - pos) / 2;
        const side = ip % 4;
        const height = (ip - side) / 4;
        const xs = pos === 0 ? xs1 : xs2;
        const zs = pos === 0 ? zs1 : zs2;
        const gs = [g1, g2, g3][i % 3];

        const x = xs[side];
        const y = -11 + pos + 3 * (4 * height + side);
        const z = zs[side];

        for (const n of gs) {
          const c = meshes[n].clone();
          c.position.set(x, y, z);
          c.rotation.set(0, Math.PI / 2 - (side * Math.PI) / 2, 0);
          if (!n.endsWith("wall")) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
          addObject(c);
        }
      }

      // // Window
      // for (let h = 0; h < 3; h++) {
      //    for (let s = 0; s < 4; s++) {
      //     const ns = ["window", "beziercurve001", "beziercurve001_1"];
      //     for (let k = 0; k < ns.length; k++) {
      //       const c = objects[ns[k]].clone();
      //       c.position.set(xs[s], -11 + 3 * (4 * h + s), zs[s]);
      //       c.rotation.set(0, Math.PI / 2 - (s * Math.PI) / 2, 0);
      //       addObject(c);
      //     }
      //   }
      // }

      const c = meshes.ball.clone();
      c.position.set(-0.5, 24, 0.5);
      c.castShadow = true;
      ball = c;

      scene.add(...sceneObjects, ball);

      // console.log("objects", sceneObjects.length, startYs.length);
    });

    // const dir = new THREE.Vector3(1, 0, 0);
    // const origin = new THREE.Vector3(0.5, 0, 0.5);
    // const length = 1;
    // const hex = 0xffffcc;
    // scene.add(new THREE.ArrowHelper(dir, origin, length, hex));

    // Window sizes
    const sizes = { width: window.innerWidth, height: window.innerHeight };

    // Base camera
    const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
    camera.position.x = -20;
    camera.position.y = 19;
    camera.position.z = 8;
    scene.add(camera);
    // gui.add(camera.position, "x", -20, 20, 0.01);

    const lightDist = 8;
    for (let i = 0; i < 4; i++) {
      const light = new THREE.DirectionalLight("hsl(216, 100%, 85%)", 0.6);
      light.position.set(
        5.5 + lightDist * (i % 2 === 0 ? (i === 0 ? 1 : -1) : 0),
        5,
        -5.5 + lightDist * (i % 2 === 1 ? (i === 1 ? 1 : -1) : 0)
      );
      light.target.position.set(5.5, -8, -5.5);
      light.castShadow = true;
      // light.shadowDarkness = 1;
      // light.shadow.radius = 4;
      // light.shadow.blurSamples = 25;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;
      light.shadow.normalBias = 0.1;
      // light.shadow.bias = 0.0001;
      light.shadow.camera.near = 0;
      light.shadow.camera.far = 10;
      light.shadow.camera.left = -7;
      light.shadow.camera.right = 7;
      light.shadow.camera.top = 5;
      light.shadow.camera.bottom = -3;

      scene.add(light);
      const lh = new THREE.DirectionalLightHelper(light, 1);
      // scene.add(new THREE.CameraHelper(light.shadow.camera));
    }

    const ballSettings = { jumpDuration: 2, minHeight: 0.06, maxHeight: 2.5 };

    const cameraSetting0 = {
      pathRadius: 50,
      pathHeight: 2,
      pathEllipsFactor: 2,
      moveAhead: 0,
      lookAhead: 0,
      lookAtHeight: 1.3,
    };

    const cameraSetting1 = {
      pathRadius: 12.5,
      pathHeight: 2,
      pathEllipsFactor: 2.5,
      moveAhead: 1.2,
      lookAhead: 0.25,
      lookAtHeight: 1.3,
    };

    const cameraSetting2 = {
      pathRadius: 6.45,
      pathHeight: 2,
      pathEllipsFactor: 17,
      moveAhead: 0.8,
      lookAhead: 0.1,
      lookAtHeight: 1.6,
    };

    const cameraSetting3 = {
      pathRadius: 16,
      pathHeight: -1.75,
      pathEllipsFactor: 2,
      moveAhead: -0.2,
      lookAhead: 0.2,
      lookAtHeight: 1.5,
    };

    const cameraSetting4 = {
      pathRadius: 6.4,
      pathHeight: 2.8,
      pathEllipsFactor: 18,
      moveAhead: -0.8,
      lookAhead: -0.1,
      lookAtHeight: 1.7,
    };

    // const cameraSettings = [cameraSetting0];
    const cameraSettings = [cameraSetting1, cameraSetting2, cameraSetting3, cameraSetting4];

    for (const s of cameraSettings) {
      const cs = calcSuperEllips(s.pathRadius, s.pathHeight, s.pathEllipsFactor, 5);
      for (const d of cs) {
        d.x += 5.5;
        d.z += -5.5;
      }
      const cameraPath = new THREE.CatmullRomCurve3(cs);
      cameraPath.closed = true;
      s.cameraPath = cameraPath;
    }

    // Controls
    // const controls = new OrbitControls(camera, canvas);
    // controls.enableDamping = true;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0.0);

    window.addEventListener("resize", () => {
      // Update sizes
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      // Update camera
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();

      // Update renderer
      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    const jd3 = 3 * ballSettings.jumpDuration;
    const phase = (t, dur) => t / dur - Math.floor(t / dur);
    const ballPosition = (t) => {
      const s = Math.floor(t / jd3) % 4;
      const f = t / jd3 - Math.floor(t / jd3);
      const c = phase(t, ballSettings.jumpDuration);
      const x0 = s === 0 || s === 3 ? 0 : 12;
      const z0 = s === 0 || s === 1 ? 0 : -12;
      const dx = s === 0 || s === 2 ? (s === 0 ? 1 : -1) : 0;
      const dz = s === 1 || s === 3 ? (s === 1 ? -1 : 1) : 0;
      const x = -0.5 + x0 + 12 * dx * f;
      const dh = ballSettings.maxHeight - ballSettings.minHeight;
      const y = ballSettings.minHeight + dh * (1 - ((c - 0.5) / 0.5) ** 2);
      const z = 0.5 + z0 + 12 * dz * f;
      return new THREE.Vector3(x, y, z);
    };
    const ballRotation = (t) => {
      const c = phase(t, ballSettings.jumpDuration);
      return Math.PI * (Math.cos(c * Math.PI) - 1);
    };
    const ballScale = (t) => {
      const c = phase(t, ballSettings.jumpDuration);
      const ballRadius = 0.4;
      const dh = ballSettings.maxHeight - ballSettings.minHeight;
      const t0 = 0.5 - Math.sqrt((ballSettings.maxHeight - ballRadius) * (0.5 ** 2 / dh));
      const scaleT = Math.max(t0 - Math.min(c, 1 - c), 0) / t0;

      const maxScaleY = 0.45;
      const maxScaleXZ = 1.2;
      const exponent = 0.8;

      const sy = 1 - (1 - maxScaleY) * (1 - (1 - scaleT) ** exponent);
      const sxz = 1 - (1 - maxScaleXZ) * (1 - (1 - scaleT) ** exponent);
      return new THREE.Vector3(sxz, sy, sxz);
    };

    // Animate
    const clock = new THREE.Clock();
    const tick = () => {
      const t = clock.getElapsedTime(); // eslint-disable-line

      const p = ballPosition(t);
      const side = Math.floor(t / jd3) % 4;
      if (ball) {
        ball.position.copy(p); // 24 - t / jumpDuration +
        ball.scale.copy(ballScale(t));
        const r = ballRotation(t);
        if (side === 0) {
          ball.rotation.set(0, 0, r);
        } else if (side === 1) {
          ball.rotation.set(r, 0, 0);
        } else if (side === 2) {
          ball.rotation.set(0, 0, -r);
        } else if (side === 3) {
          ball.rotation.set(-r, 0, 0);
        }
        // ball.position.set(ballPosition(t));
      }
      for (let i = 0; i < sceneObjects.length; i++) {
        const obj = sceneObjects[i];
        let y = startYs[i] + t / ballSettings.jumpDuration;
        const y0 = 18;
        y = 36 * ((y + y0) / 36 - Math.floor((y + y0) / 36)) - y0;
        obj.position.y = y;
      }

      const cameraIndex = Math.floor(t / 7) % cameraSettings.length;
      const cameraSetting = cameraSettings[cameraIndex];

      camera.position.copy(
        cameraSetting.cameraPath.getPoint(
          phase(t + (7.5 + cameraSetting.moveAhead) * ballSettings.jumpDuration, 12 * ballSettings.jumpDuration)
        )
      );
      const bp = ballPosition(t + cameraSetting.lookAhead * ballSettings.jumpDuration);
      camera.lookAt(bp.setY(cameraSetting.lookAtHeight)); //curve.getPointAt(Math.max(t + 0.01, 1)));

      // Update controls
      // controls.update();

      // Update animation mixers
      // for (const mixer of mixers) {
      //   mixer.update(t);
      // }

      // Render
      renderer.render(scene, camera);

      // Call tick again on the next frame
      window.requestAnimationFrame(tick);
    };

    tick();
  }, []);

  return (
    <StyledApp>
      <canvas ref={ref} className="webgl"></canvas>
    </StyledApp>
  );
}
