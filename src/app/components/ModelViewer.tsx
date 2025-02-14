"use client";

import { Suspense } from "react";
import { useModel } from "../context/ModelContext";
import ThreeScene from "./ThreeScene";
import Loader from "./Loader";

const ModelViewer = () => {
  const { model, isLoading } = useModel();

  return (
    <div className="h-full w-full bg-neutral-100 relative">
      <Suspense fallback={<Loader />}>
        <ThreeScene model={model} />
        {isLoading && <Loader />}
      </Suspense>
    </div>
  );
};

export default ModelViewer;
