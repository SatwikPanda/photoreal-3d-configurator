"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { useModel } from "../context/ModelContext"; // Fixed import path
import Loader from "./Loader";

interface ThreeSceneProps {
  model: GLTF | null;
}

const ThreeScene = ({ model }: ThreeSceneProps) => {
  const { hdriIntensity, currentHdri, setIsLoading } = useModel();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const envMapRef = useRef<THREE.Texture | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup with container dimensions
    const container = containerRef.current;
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5); // Adjusted camera position
    cameraRef.current = camera;

    // Renderer setup with HDR
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      toneMapping: THREE.ACESFilmicToneMapping,
      outputColorSpace: THREE.SRGBColorSpace,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Load HDRI
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new EXRLoader().load("/hdris/studio.exr", (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture);
      scene.environment = envMap.texture;
      scene.background = envMap.texture;
      texture.dispose();
      pmremGenerator.dispose();
    });

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Add smooth damping
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    // const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    // scene.add(ambientLight);

    // const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // directionalLight.position.set(5, 5, 5);
    // scene.add(directionalLight);

    // Updated animation loop with damping
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

    // Updated resize handler
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
    handleResize(); // Initial size setup

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Updated model handling
  useEffect(() => {
    if (!sceneRef.current || !model) return;

    setIsLoading(true);
    try {
      // Remove existing model
      const existingModel = sceneRef.current.getObjectByName("importedModel");
      if (existingModel) {
        sceneRef.current.remove(existingModel);
      }

      // Add new model
      model.scene.name = "importedModel";
      sceneRef.current.add(model.scene);

      // Center and scale model
      const box = new THREE.Box3().setFromObject(model.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3 / maxDim; // Increased scale factor
      model.scene.scale.setScalar(scale);

      // Center the model
      model.scene.position.sub(center.multiplyScalar(scale));

      // Reset camera and controls to focus on model
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
          // Set initial intensity
          if (envMap.texture) {
            envMap.texture.intensity = hdriIntensity;
          }
          currentHdri.dispose();
        } else {
          try {
            const exrLoader = new EXRLoader();
            const texture = await exrLoader.loadAsync("/hdris/studio.exr");
            const envMap = pmremGenerator.fromEquirectangular(texture);
            scene.environment = envMap.texture;
            scene.background = envMap.texture;
            // Set initial intensity
            if (envMap.texture) {
              envMap.texture.intensity = hdriIntensity;
            }
            texture.dispose();
          } catch (error) {
            console.log("Falling back to HDR format");
            const hdrLoader = new RGBELoader();
            const texture = await hdrLoader.loadAsync("/hdris/studio.hdr");
            const envMap = pmremGenerator.fromEquirectangular(texture);
            scene.environment = envMap.texture;
            scene.background = envMap.texture;
            // Set initial intensity
            if (envMap.texture) {
              envMap.texture.intensity = hdriIntensity;
            }
            texture.dispose();
          }
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

  // Update intensity whenever it changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (scene.environment) {
      // Set intensity directly on the environment map
      scene.environment.intensity = hdriIntensity;
    }
    if (scene.background && scene.background instanceof THREE.Texture) {
      // Also update background intensity if it's a texture
      scene.background.intensity = hdriIntensity;
    }
  }, [hdriIntensity]);

  // Handle intensity updates
  useEffect(() => {
    if (envMapRef.current) {
      envMapRef.current.intensity = hdriIntensity;
    }
  }, [hdriIntensity]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default ThreeScene;
