"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";
import { useModel } from "../context/ModelContext"; // Fixed import path

interface ThreeSceneProps {
  model: GLTF | null;
}

const ThreeScene = ({ model }: ThreeSceneProps) => {
  const {
    hdriIntensity,
    currentHdri,
    setIsLoading,
    setSelectedNode,
    renderSettings,
  } = useModel();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  const handleClick = (event: MouseEvent) => {
    if (!containerRef.current || !sceneRef.current || !cameraRef.current)
      return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(
      sceneRef.current.children,
      true
    );

    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;
      setSelectedNode(selectedObject);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const container = containerRef.current;
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      toneMapping: THREE.ACESFilmicToneMapping,
      outputColorSpace: THREE.SRGBColorSpace,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new EXRLoader().load("/hdris/studio.exr", (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture);
      scene.environment = envMap.texture;
      scene.background = envMap.texture;
      texture.dispose();
      pmremGenerator.dispose();
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current)
        return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height, false);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    containerRef.current.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      containerRef.current?.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !model) return;

    setIsLoading(true);
    try {
      const existingModel = sceneRef.current.getObjectByName("importedModel");
      if (existingModel) {
        sceneRef.current.remove(existingModel);
      }

      model.scene.name = "importedModel";
      sceneRef.current.add(model.scene);

      const box = new THREE.Box3().setFromObject(model.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3 / maxDim;
      model.scene.scale.setScalar(scale);
      model.scene.position.sub(center.multiplyScalar(scale));

      model.scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          object.material.side = THREE.DoubleSide;
        }
      });

      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(0, 2, 5);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    } finally {
      setIsLoading(false);
    }
  }, [model, setIsLoading]);

  // Handle HDRI updates
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;

    const scene = sceneRef.current;
    const renderer = rendererRef.current;

    setIsLoading(true);

    const loadHDRI = async () => {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();

      try {
        if (currentHdri) {
          const envMap = pmremGenerator.fromEquirectangular(currentHdri);
          scene.environment = envMap.texture;
          scene.background = envMap.texture;
          currentHdri.dispose();
        } else {
          const exrLoader = new EXRLoader();
          const texture = await exrLoader.loadAsync("/hdris/studio.exr");
          const envMap = pmremGenerator.fromEquirectangular(texture);
          scene.environment = envMap.texture;
          scene.background = envMap.texture;
          texture.dispose();
        }
      } catch (error) {
        console.error("Error loading HDRI:", error);
      } finally {
        pmremGenerator.dispose();
        setIsLoading(false);
      }
    };

    loadHDRI();
  }, [currentHdri, setIsLoading]);

  useEffect(() => {
    if (!rendererRef.current) return;

    rendererRef.current.toneMappingExposure = renderSettings.exposure;
    rendererRef.current.shadowMap.enabled = renderSettings.shadows;
  }, [renderSettings]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default ThreeScene;
