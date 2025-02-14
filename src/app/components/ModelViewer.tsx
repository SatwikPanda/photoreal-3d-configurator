"use client";

import { Suspense } from "react";
import { useModel } from "../context/ModelContext";
import ThreeScene from "./ThreeScene";
import Loader from "./Loader";

const ModelViewer = () => {
  const { model, isLoading, setSelectedOption } = useModel(); // Add setSelectedOption

  const handleNodeSelected = () => {
    setSelectedOption("material");
  };

  return (
    <div className="h-[calc(100vh-380px)] md:h-full w-full bg-neutral-100 relative">
      <Suspense fallback={<Loader />}>
        <ThreeScene model={model} onNodeSelected={handleNodeSelected} />
        {isLoading && <Loader />}
      </Suspense>
    </div>
  );
};

export default ModelViewer;
