"use client";

import { createContext, useContext, useState } from "react";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";
import { loadHDRI } from "../utils/hdriLoader";
import { TextureLoader } from "three";

interface RenderSettings {
  toneMapping: THREE.ToneMapping;
  exposure: number;
  outputColorSpace: THREE.ColorSpace;
  aoIntensity: number;
}

interface ModelContextType {
  model: GLTF | null;
  setModel: (model: GLTF | null) => void;
  nodes: THREE.Object3D[];
  setNodes: (nodes: THREE.Object3D[]) => void;
  selectedNode: THREE.Object3D | null;
  setSelectedNode: (node: THREE.Object3D | null) => void;
  hdriIntensity: number;
  setHdriIntensity: (intensity: number) => void;
  loadHdri: (file: File) => Promise<void>;
  currentHdri: THREE.Texture | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  updateNodeTexture: (
    textureType:
      | "map"
      | "normalMap"
      | "roughnessMap"
      | "metalnessMap"
      | "alphaMap"
      | "aoMap",
    file: File
  ) => Promise<void>;
  removeNodeTexture: (
    textureType:
      | "map"
      | "normalMap"
      | "roughnessMap"
      | "metalnessMap"
      | "alphaMap"
      | "aoMap"
  ) => void;
  renderSettings: RenderSettings;
  updateRenderSettings: (settings: Partial<RenderSettings>) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState<GLTF | null>(null);
  const [nodes, setNodes] = useState<THREE.Object3D[]>([]);
  const [selectedNode, setSelectedNode] = useState<THREE.Object3D | null>(null);
  const [hdriIntensity, setHdriIntensity] = useState(1);
  const [currentHdri, setCurrentHdri] = useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [renderSettings, setRenderSettings] = useState<RenderSettings>({
    toneMapping: THREE.ACESFilmicToneMapping,
    exposure: 1.0,
    outputColorSpace: THREE.SRGBColorSpace,
    aoIntensity: 1.0,
  });

  const loadHdri = async (file: File) => {
    setIsLoading(true);
    try {
      const texture = await loadHDRI(file);
      setCurrentHdri(texture);
    } catch (error) {
      console.error("Error loading HDRI:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateNodeTexture = async (
    textureType:
      | "map"
      | "normalMap"
      | "roughnessMap"
      | "metalnessMap"
      | "alphaMap"
      | "aoMap",
    file: File
  ) => {
    setIsLoading(true);
    try {
      if (!selectedNode || !(selectedNode as THREE.Mesh).material) return;

      const url = URL.createObjectURL(file);
      const loader = new TextureLoader();
      const texture = await loader.loadAsync(url);

      const material = (selectedNode as THREE.Mesh)
        .material as THREE.MeshStandardMaterial;
      material[textureType] = texture;
      material.needsUpdate = true;
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error loading texture:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeNodeTexture = (
    textureType:
      | "map"
      | "normalMap"
      | "roughnessMap"
      | "metalnessMap"
      | "alphaMap"
      | "aoMap"
  ) => {
    if (!selectedNode || !(selectedNode as THREE.Mesh).material) return;

    const material = (selectedNode as THREE.Mesh)
      .material as THREE.MeshStandardMaterial;
    if (material[textureType]) {
      material[textureType].dispose();
      material[textureType] = null;
      material.needsUpdate = true;
    }
  };

  const updateRenderSettings = (settings: Partial<RenderSettings>) => {
    setRenderSettings((prev) => ({ ...prev, ...settings }));
  };

  return (
    <ModelContext.Provider
      value={{
        model,
        setModel,
        nodes,
        setNodes,
        selectedNode,
        setSelectedNode,
        hdriIntensity,
        setHdriIntensity,
        loadHdri,
        currentHdri,
        isLoading,
        setIsLoading,
        updateNodeTexture,
        removeNodeTexture,
        renderSettings,
        updateRenderSettings,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
}
