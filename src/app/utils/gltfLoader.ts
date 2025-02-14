import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export async function loadGLTFModel(files: FileList): Promise<GLTF | null> {
  const loader = new GLTFLoader();

  // Create object URLs for all files
  const fileMap = new Map<string, string>();

  try {
    // Process all files
    for (const file of files) {
      const url = URL.createObjectURL(file);
      fileMap.set(file.name, url);
    }

    // Find the main .gltf file
    const gltfFile = Array.from(files).find((file) =>
      file.name.endsWith(".gltf")
    );
    if (!gltfFile) {
      throw new Error("No .gltf file found");
    }

    // Set up path interceptor for the loader
    loader.setPath("");
    loader.manager.setURLModifier((url) => {
      // Handle relative paths in the GLTF file
      const fileName = url.split("/").pop();
      if (fileName && fileMap.has(fileName)) {
        return fileMap.get(fileName)!;
      }
      return url;
    });

    // Load the GLTF file
    const gltf = await loader.loadAsync(fileMap.get(gltfFile.name)!);
    return gltf;
  } catch (error) {
    console.error("Error loading GLTF model:", error);
    return null;
  } finally {
    // Clean up object URLs
    fileMap.forEach((url) => URL.revokeObjectURL(url));
  }
}
