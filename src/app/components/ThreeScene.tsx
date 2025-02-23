"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";
import { useModel } from "../context/ModelContext"; // Fixed import path
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader";

interface ThreeSceneProps {
  model: GLTF | null;
  onNodeSelected?: () => void; // Add new prop
}

const ThreeScene = ({ model, onNodeSelected }: ThreeSceneProps) => {
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
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const vignettePassRef = useRef<ShaderPass | null>(null);
  const chromaticAberrationPassRef = useRef<ShaderPass | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      5000
    );
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Improved lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 20;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);

    // Enhanced controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Setup post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.enabled = renderSettings.postProcessing.bloom.enabled;
    composer.addPass(bloomPass);
    bloomPassRef.current = bloomPass;

    // Vignette
    const vignettePass = new ShaderPass(VignetteShader);
    vignettePass.enabled = renderSettings.postProcessing.vignette;
    composer.addPass(vignettePass);
    vignettePassRef.current = vignettePass;

    // Chromatic Aberration
    const chromaticAberrationPass = new ShaderPass(RGBShiftShader);
    chromaticAberrationPass.enabled =
      renderSettings.postProcessing.chromaticAberration;
    composer.addPass(chromaticAberrationPass);
    chromaticAberrationPassRef.current = chromaticAberrationPass;

    composerRef.current = composer;

    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (composerRef.current) {
        composerRef.current.render();
      }
    };
    animate();

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height, false);
    };

    const handleClick = (event: MouseEvent) => {
      if (!sceneRef.current || !cameraRef.current) return;

      const rect = container.getBoundingClientRect();
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
        onNodeSelected?.(); // Call the callback when a node is selected
      }
    };

    window.addEventListener("resize", handleResize);
    container.addEventListener("click", handleClick);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("click", handleClick);
      if (rendererRef.current) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Updated model handling
  useEffect(() => {
    if (!sceneRef.current || !model) return;

    setIsLoading(true);
    try {
      const existingModel = sceneRef.current.getObjectByName("importedModel");
      if (existingModel) {
        sceneRef.current.remove(existingModel);
      }

      model.scene.name = "importedModel";

      // Enhanced material and mesh handling
      model.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;

          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((mat) => {
                mat.side = THREE.DoubleSide;
                mat.shadowSide = THREE.DoubleSide;
                mat.needsUpdate = true;
              });
            } else {
              object.material.side = THREE.DoubleSide;
              object.material.shadowSide = THREE.DoubleSide;
              object.material.needsUpdate = true;
              object.material.depthWrite = true;
              object.material.depthTest = true;
            }
          }
        }
      });

      sceneRef.current.add(model.scene);

      // Better model positioning
      const box = new THREE.Box3().setFromObject(model.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3 / maxDim;
      model.scene.scale.setScalar(scale);
      model.scene.position.sub(center.multiplyScalar(scale));

      // Position camera to better view the model
      if (cameraRef.current && controlsRef.current) {
        const distance = maxDim * 2;
        cameraRef.current.position.set(distance, distance, distance);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    } finally {
      setIsLoading(false);
    }
  }, [model, setIsLoading]);

  // Handle HDRI updates with intensity
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
          renderer.toneMappingExposure = hdriIntensity;
          currentHdri.dispose();
        } else {
          const exrLoader = new EXRLoader();
          const texture = await exrLoader.loadAsync("/hdris/studio.exr");
          const envMap = pmremGenerator.fromEquirectangular(texture);
          scene.environment = envMap.texture;
          scene.background = envMap.texture;
          renderer.toneMappingExposure = hdriIntensity;
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
  }, [currentHdri, hdriIntensity, setIsLoading]);

  // Update HDRI intensity
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.toneMappingExposure = hdriIntensity;
  }, [hdriIntensity]);

  // Split renderer settings update into separate effects
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.toneMapping = renderSettings.toneMapping;
  }, [renderSettings.toneMapping]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.toneMappingExposure = renderSettings.exposure;
  }, [renderSettings.exposure]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.outputColorSpace = renderSettings.outputColorSpace;
  }, [renderSettings.outputColorSpace]);

  // Handle post-processing updates
  useEffect(() => {
    if (!bloomPassRef.current) return;
    const bloom = renderSettings.postProcessing.bloom;
    bloomPassRef.current.enabled = bloom.enabled;
    bloomPassRef.current.strength = bloom.intensity;
    bloomPassRef.current.threshold = bloom.threshold;
    bloomPassRef.current.radius = bloom.radius;
  }, [renderSettings.postProcessing.bloom]);

  useEffect(() => {
    if (!vignettePassRef.current) return;
    vignettePassRef.current.enabled = renderSettings.postProcessing.vignette;
  }, [renderSettings.postProcessing.vignette]);

  useEffect(() => {
    if (!chromaticAberrationPassRef.current) return;
    chromaticAberrationPassRef.current.enabled =
      renderSettings.postProcessing.chromaticAberration;
  }, [renderSettings.postProcessing.chromaticAberration]);

  // Add realism settings effect
  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current) return;

    const renderer = rendererRef.current;
    const scene = sceneRef.current;

    if (renderSettings.realism.enabled) {
      // Update lights instead of using physicallyCorrectLights
      scene.traverse((object) => {
        if (object instanceof THREE.Light) {
          object.intensity = renderSettings.realism.environment.intensity;
          if (object instanceof THREE.DirectionalLight) {
            object.shadow.bias = renderSettings.realism.shadows.bias;
            object.shadow.radius = renderSettings.realism.shadows.softness * 2;
          }
        }
        if (object instanceof THREE.Mesh) {
          if (object.material) {
            const material = object.material as THREE.MeshStandardMaterial;
            material.envMapIntensity =
              renderSettings.realism.environment.intensity;
            material.roughness = renderSettings.realism.material.roughness;
            material.metalness = renderSettings.realism.material.metalness;
            material.needsUpdate = true;
          }
        }
      });
    }
  }, [renderSettings.realism]);

  // Update shadow settings
  useEffect(() => {
    if (!rendererRef.current) return;
    const renderer = rendererRef.current;

    renderer.shadowMap.enabled = renderSettings.realism.shadows.enabled;
    if (renderSettings.realism.shadows.enabled) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }, [renderSettings.realism.shadows]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default ThreeScene;
