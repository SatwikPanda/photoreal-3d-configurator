"use client";

import { useState } from "react";
import { FiUpload, FiChevronDown } from "react-icons/fi";
import { useModel } from "../context/ModelContext";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const Navbar = () => {
  const [showCompressionMenu, setShowCompressionMenu] = useState(false);
  const [compression, setCompression] = useState("None");
  const { setModel, setNodes } = useModel();

  const compressionOptions = ["None", "Low", "Medium", "High", "Very-high"];

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loader = new GLTFLoader();
    const url = URL.createObjectURL(file);

    try {
      const gltf = await loader.loadAsync(url);
      setModel(gltf);

      // Collect all meshes
      const nodes: THREE.Object3D[] = [];
      gltf.scene.traverse((object) => {
        if (object.isMesh) {
          nodes.push(object);
        }
      });
      setNodes(nodes);
    } catch (error) {
      console.error("Error loading model:", error);
    }
  };

  return (
    <nav className="border border-b w-full px-4 py-2 md:px-8">
      <ul className="flex items-center justify-center md:justify-start gap-2 w-full">
        <li>
          <button className="flex items-center relative gap-2 border text-black py-1 px-3 rounded-md hover:bg-gray-100">
            <FiUpload size={16} />
            Import
            <input
              type="file"
              accept=".glb,.gltf"
              onChange={handleFileInput}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </button>
        </li>
        <li className="relative">
          <button
            className="items-center gap-2 hidden border text-black py-1 px-3 rounded-md hover:bg-gray-100"
            onClick={() => setShowCompressionMenu(!showCompressionMenu)}
          >
            Compression: {compression}
            <FiChevronDown size={16} />
          </button>
          {showCompressionMenu && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-md">
              {compressionOptions.map((option) => (
                <button
                  key={option}
                  className="block w-full text-left px-4 py-2 border border-b hover:bg-gray-100"
                  onClick={() => {
                    setCompression(option);
                    setShowCompressionMenu(false);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
