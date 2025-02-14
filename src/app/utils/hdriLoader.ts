import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { Texture } from "three";

export const loadHDRI = async (file: File): Promise<Texture> => {
  const url = URL.createObjectURL(file);
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  try {
    if (fileExtension === "exr") {
      const loader = new EXRLoader();
      return await loader.loadAsync(url);
    } else if (fileExtension === "hdr") {
      const loader = new RGBELoader();
      return await loader.loadAsync(url);
    } else {
      throw new Error(
        "Unsupported file format. Please use .exr or .hdr files."
      );
    }
  } finally {
    URL.revokeObjectURL(url);
  }
};
