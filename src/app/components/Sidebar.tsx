"use client";

import { useState } from "react";
import SidebarIcons from "./sidebar/SidebarIcons";
import { useModel } from "../context/ModelContext";

const Sidebar = () => {
  const [selectedOption, setSelectedOption] = useState("lighting");
  const { nodes, setSelectedNode, hdriIntensity, setHdriIntensity, loadHdri } =
    useModel();

  const handleHdriUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadHdri(file);
    }
  };

  const renderContent = () => {
    switch (selectedOption) {
      case "lighting":
        return (
          <div className="p-4">
            <h3 className={`text-lg font-semibold mb-4`}>Lighting Options</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  HDRI Intensity
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={hdriIntensity}
                  onChange={(e) => setHdriIntensity(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-500">
                  {hdriIntensity.toFixed(1)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Load Custom HDRI
                </label>
                <input
                  type="file"
                  accept=".exr,.hdr"
                  onChange={handleHdriUpload}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>
        );
      case "material":
        return (
          <div className="p-4">
            <h3 className={`text-lg font-semibold mb-4`}>Material Options</h3>
            {/* Add material controls */}
          </div>
        );
      case "render":
        return (
          <div className="p-4">
            <h3 className={`text-lg font-semibold mb-4`}>Render Options</h3>
            {/* Add render controls */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-1/4 border-l h-full bg-white flex flex-row">
      <SidebarIcons
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}
      />
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <h2 className={`text-lg font-semibold`}>Node Selector</h2>
          <div className="max-h-32 overflow-y-auto mt-2 scrollbar-hide">
            <ul className="max-h-32 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {nodes.map((node, i) => (
                <li
                  key={node.uuid}
                  className={`py-2 border-b px-2 ${
                    i % 2 === 1 ? "bg-gray-100 px-2" : ""
                  } hover:bg-gray-200 cursor-pointer`}
                  onClick={() => setSelectedNode(node)}
                >
                  {node.name || `Mesh ${i + 1}`}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-1">{renderContent()}</div>
      </div>
    </div>
  );
};

export default Sidebar;
