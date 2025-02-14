"use client";

import { createContext, useContext, useState } from "react";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";
import { loadHDRI } from "../utils/hdriLoader";

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
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState<GLTF | null>(null);
  const [nodes, setNodes] = useState<THREE.Object3D[]>([]);
  const [selectedNode, setSelectedNode] = useState<THREE.Object3D | null>(null);
  const [hdriIntensity, setHdriIntensity] = useState(1);
  const [currentHdri, setCurrentHdri] = useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
