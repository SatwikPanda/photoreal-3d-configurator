"use client";

import { useState } from "react";
import * as THREE from "three";
import SidebarIcons from "./sidebar/SidebarIcons";
import { useModel } from "../context/ModelContext";
import { FiX } from "react-icons/fi";

const Sidebar = () => {
  const {
    nodes,
    selectedNode,
    setSelectedNode,
    hdriIntensity,
    setHdriIntensity,
    loadHdri,
    updateNodeTexture,
    removeNodeTexture,
    renderSettings,
    updateRenderSettings,
    selectedOption,
    setSelectedOption,
  } = useModel();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: string }>(
    {}
  );
  const [materialFiles, setMaterialFiles] = useState<{
    [nodeId: string]: { [key: string]: string };
  }>({});

  const handleHdriUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadHdri(file);
    }
  };

  const handleTextureUpload =
    (type: "map" | "normalMap" | "roughnessMap" | "metalnessMap" | "aoMap") =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !selectedNode) return;

      await updateNodeTexture(type, file);

      // Store the file name under the node's ID
      setMaterialFiles((prev) => ({
        ...prev,
        [selectedNode.uuid]: {
          ...(prev[selectedNode.uuid] || {}),
          [type]: file.name,
        },
      }));
    };

  const MaterialInput = ({
    label,
    type,
    hasValue,
  }: {
    label: string;
    type: "map" | "normalMap" | "roughnessMap" | "metalnessMap" | "aoMap";
    hasValue: boolean;
  }) => (
    <div className="relative">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <label
            className="block w-[10rem] text-sm text-gray-500 cursor-pointer
            py-2 px-4 rounded-full border truncate
            hover:bg-blue-50"
          >
            {selectedNode?.uuid
              ? materialFiles[selectedNode.uuid]?.[type] || "Choose file"
              : "Choose file"}
            <input
              type="file"
              accept="image/*"
              onChange={handleTextureUpload(type)}
              className="hidden"
            />
          </label>
        </div>
        {hasValue && (
          <button
            onClick={() => {
              removeNodeTexture(type);
              // Remove the file name from storage
              if (selectedNode) {
                setMaterialFiles((prev) => {
                  const nodeFiles = { ...prev[selectedNode.uuid] };
                  delete nodeFiles[type];
                  return { ...prev, [selectedNode.uuid]: nodeFiles };
                });
              }
            }}
            className="p-1 hover:bg-red-100 rounded-full"
            title="Remove texture"
          >
            <FiX className="text-red-500" size={20} />
          </button>
        )}
      </div>
    </div>
  );

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
                  className="w-full "
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
            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-2 bg-gray-100 rounded-md mb-4">
                  <p className="text-sm font-medium text-gray-600">
                    Selected Node:
                  </p>
                  <p className="text-base text-gray-900">
                    {selectedNode.name || "Unnamed Mesh"}
                  </p>
                </div>

                {/* Only show texture inputs if the node has a material */}
                {(selectedNode as THREE.Mesh).material && (
                  <>
                    <MaterialInput
                      label="Albedo Map"
                      type="map"
                      hasValue={
                        !!(
                          (selectedNode as THREE.Mesh)
                            .material as THREE.MeshStandardMaterial
                        ).map
                      }
                    />
                    <MaterialInput
                      label="Normal Map"
                      type="normalMap"
                      hasValue={
                        !!(
                          (selectedNode as THREE.Mesh)
                            .material as THREE.MeshStandardMaterial
                        ).normalMap
                      }
                    />
                    <MaterialInput
                      label="Roughness Map"
                      type="roughnessMap"
                      hasValue={
                        !!(
                          (selectedNode as THREE.Mesh)
                            .material as THREE.MeshStandardMaterial
                        ).roughnessMap
                      }
                    />
                    <MaterialInput
                      label="Metalness Map"
                      type="metalnessMap"
                      hasValue={
                        !!(
                          (selectedNode as THREE.Mesh)
                            .material as THREE.MeshStandardMaterial
                        ).metalnessMap
                      }
                    />
                    <MaterialInput
                      label="Ambient Occlusion Map"
                      type="aoMap"
                      hasValue={
                        !!(
                          (selectedNode as THREE.Mesh)
                            .material as THREE.MeshStandardMaterial
                        ).aoMap
                      }
                    />
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-500">
                Select a node to edit its material
              </p>
            )}
          </div>
        );
      case "render":
        return (
          <div className="p-4">
            <h3 className={`text-lg tracking-tighter border-y p-2 font-semibold mb-4`}>Render Settings</h3>
            <div className="space-y-6">
              {/* Realism Settings */}
              <div className="space-y-4">
                <h4 className="text-lg border-y p-2 font-medium tracking-tighter">
                  Realism
                </h4>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Enable PBR</label>
                  <input
                    type="checkbox"
                    checked={renderSettings.realism.enabled}
                    onChange={(e) =>
                      updateRenderSettings({
                        realism: {
                          ...renderSettings.realism,
                          enabled: e.target.checked,
                        },
                      })
                    }
                  />
                </div>

                {renderSettings.realism.enabled && (
                  <div className="space-y-4">
                    {/* Environment Settings */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Environment Intensity
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={renderSettings.realism.environment.intensity}
                        onChange={(e) =>
                          updateRenderSettings({
                            realism: {
                              ...renderSettings.realism,
                              environment: {
                                ...renderSettings.realism.environment,
                                intensity: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Shadow Settings */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Shadows</label>
                        <input
                          type="checkbox"
                          checked={renderSettings.realism.shadows.enabled}
                          onChange={(e) =>
                            updateRenderSettings({
                              realism: {
                                ...renderSettings.realism,
                                shadows: {
                                  ...renderSettings.realism.shadows,
                                  enabled: e.target.checked,
                                },
                              },
                            })
                          }
                        />
                      </div>

                      {renderSettings.realism.shadows.enabled && (
                        <div className="pl-4 space-y-2">
                          <div>
                            <label className="block text-sm">Softness</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={renderSettings.realism.shadows.softness}
                              onChange={(e) =>
                                updateRenderSettings({
                                  realism: {
                                    ...renderSettings.realism,
                                    shadows: {
                                      ...renderSettings.realism.shadows,
                                      softness: Number(e.target.value),
                                    },
                                  },
                                })
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Default Material Settings */}
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Default Material</h5>
                      <div>
                        <label className="block text-sm">Roughness</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={renderSettings.realism.material.roughness}
                          onChange={(e) =>
                            updateRenderSettings({
                              realism: {
                                ...renderSettings.realism,
                                material: {
                                  ...renderSettings.realism.material,
                                  roughness: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm">Metalness</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={renderSettings.realism.material.metalness}
                          onChange={(e) =>
                            updateRenderSettings({
                              realism: {
                                ...renderSettings.realism,
                                material: {
                                  ...renderSettings.realism.material,
                                  metalness: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tone Mapping
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={renderSettings.toneMapping}
                  onChange={(e) =>
                    updateRenderSettings({
                      toneMapping: Number(e.target.value) as THREE.ToneMapping,
                    })
                  }
                >
                  <option value={THREE.NoToneMapping}>No Tone Mapping</option>
                  <option value={THREE.LinearToneMapping}>Linear</option>
                  <option value={THREE.ReinhardToneMapping}>Reinhard</option>
                  <option value={THREE.CineonToneMapping}>Cineon</option>
                  <option value={THREE.ACESFilmicToneMapping}>
                    ACES Filmic
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Exposure
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={renderSettings.exposure}
                  onChange={(e) =>
                    updateRenderSettings({ exposure: Number(e.target.value) })
                  }
                  className="w-full bg-black"
                />
                <div className="text-sm text-gray-500">
                  {renderSettings.exposure.toFixed(1)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Ambient Occlusion Intensity
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={renderSettings.aoIntensity}
                  onChange={(e) =>
                    updateRenderSettings({
                      aoIntensity: Number(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="text-sm text-gray-500">
                  {renderSettings.aoIntensity.toFixed(1)}
                </div>
              </div>

              {/* Post Processing Settings */}
              <div className="space-y-4">
                <h4 className="text-lg border-y p-2 font-medium tracking-tighter">Post Processing</h4>

                {/* Bloom Settings */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Bloom</label>
                    <input
                      type="checkbox"
                      checked={renderSettings.postProcessing.bloom.enabled}
                      onChange={(e) =>
                        updateRenderSettings({
                          postProcessing: {
                            ...renderSettings.postProcessing,
                            bloom: {
                              ...renderSettings.postProcessing.bloom,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  {renderSettings.postProcessing.bloom.enabled && (
                    <div className="space-y-2 pl-4">
                      <div>
                        <label className="block text-sm">Intensity</label>
                        <input
                          type="range"
                          min="0"
                          max="3"
                          step="0.1"
                          value={renderSettings.postProcessing.bloom.intensity}
                          onChange={(e) =>
                            updateRenderSettings({
                              postProcessing: {
                                ...renderSettings.postProcessing,
                                bloom: {
                                  ...renderSettings.postProcessing.bloom,
                                  intensity: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm">Threshold</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={renderSettings.postProcessing.bloom.threshold}
                          onChange={(e) =>
                            updateRenderSettings({
                              postProcessing: {
                                ...renderSettings.postProcessing,
                                bloom: {
                                  ...renderSettings.postProcessing.bloom,
                                  threshold: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm">Radius</label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={renderSettings.postProcessing.bloom.radius}
                          onChange={(e) =>
                            updateRenderSettings({
                              postProcessing: {
                                ...renderSettings.postProcessing,
                                bloom: {
                                  ...renderSettings.postProcessing.bloom,
                                  radius: Number(e.target.value),
                                },
                              },
                            })
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Other Effects */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Vignette</label>
                    <input
                      type="checkbox"
                      checked={renderSettings.postProcessing.vignette}
                      onChange={(e) =>
                        updateRenderSettings({
                          postProcessing: {
                            ...renderSettings.postProcessing,
                            vignette: e.target.checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Chromatic Aberration
                    </label>
                    <input
                      type="checkbox"
                      checked={
                        renderSettings.postProcessing.chromaticAberration
                      }
                      onChange={(e) =>
                        updateRenderSettings({
                          postProcessing: {
                            ...renderSettings.postProcessing,
                            chromaticAberration: e.target.checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const nodeSelector = () => {
    return (
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Node Selector</h2>
        <div className="max-h-32 overflow-y-auto mt-2 scrollbar-hide">
          <ul className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {nodes.map((node, i) => (
              <li
                key={node.uuid}
                className={`py-2 border-b px-2 
                  ${i % 2 === 1 ? "bg-gray-100" : ""} 
                  ${
                    node === selectedNode
                      ? "bg-blue-100 hover:bg-blue-200"
                      : "hover:bg-gray-200"
                  } 
                  cursor-pointer`}
                onClick={() => setSelectedNode(node)}
              >
                {node.name || `Mesh ${i + 1}`}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full md:w-[300px] border-t md:border-t-0 md:border-l h-[300px] md:h-full bg-white flex flex-col md:flex-row">
      <SidebarIcons
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/*nodeSelector()*/}
        <div className="flex-1 overflow-y-auto">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
